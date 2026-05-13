/**
 * seed-openlibrary-covers.js
 *
 * Backfill cover images from Open Library for catalogue books.
 *
 * Open Library hosts free, public, ISBN-keyed cover images at
 *   https://covers.openlibrary.org/b/isbn/{ISBN}-L.jpg?default=false
 * The `?default=false` query makes the endpoint return 404 when no cover
 * exists — letting us probe cheaply and only download real images.
 *
 * For each candidate book this script:
 *   1. HEADs Open Library with default=false
 *   2. If 200, GETs the actual JPG and saves to public/covers/{ISBN}.jpg
 *   3. Sets Book.coverImage = "/covers/{ISBN}.jpg"  (same format as Gardners)
 *   4. If 404, marks Book.meta.olChecked = new Date() so we don't reprobe
 *
 * Idempotent — re-running picks up where it left off because we filter on
 * (coverImage missing) AND (meta.olChecked missing).
 *
 * Run:
 *   node --env-file=.env.local src/scripts/seed-openlibrary-covers.js
 *   node --env-file=.env.local src/scripts/seed-openlibrary-covers.js --limit=10000
 *
 * Polite defaults: ~10 concurrent requests, ~80 ms inter-batch delay,
 * Open Library can comfortably handle 50–100 reqs/sec in our experience.
 */

import 'dotenv/config';
import path  from 'path';
import fs    from 'fs';
import { connectDB } from '../lib/db.js';
import Book          from '../models/Book.js';

const OL_BASE         = 'https://covers.openlibrary.org/b/isbn';
const COVERS_LOCAL_DIR = path.resolve(process.cwd(), 'public', 'covers');
const PARALLEL         = 10;
const BATCH_SIZE       = 500;
const INTERBATCH_MS    = 80;
const REQ_TIMEOUT_MS   = 8000;

const args = process.argv.slice(2);
const limitArg = args.find(a => a.startsWith('--limit='));
const HARD_LIMIT = limitArg ? parseInt(limitArg.slice(8), 10) || 0 : 0;

fs.mkdirSync(COVERS_LOCAL_DIR, { recursive: true });

// ---------------------------------------------------------------------------
function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timeout ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// Probe + download one cover. Returns { isbn, localPath | null, has404 }.
async function processOne(isbn) {
  const url = `${OL_BASE}/${isbn}-L.jpg?default=false`;
  const localPath = path.join(COVERS_LOCAL_DIR, `${isbn}.jpg`);

  // If the file already exists on disk, just return its path — link DB later.
  if (fs.existsSync(localPath) && fs.statSync(localPath).size > 1024) {
    return { isbn, localPath: `/covers/${isbn}.jpg`, has404: false };
  }

  try {
    // HEAD probe
    const head = await withTimeout(fetch(url, { method: 'HEAD' }), REQ_TIMEOUT_MS);
    if (head.status === 404) return { isbn, localPath: null, has404: true };
    if (head.status !== 200) return { isbn, localPath: null, has404: false };

    // Download
    const res = await withTimeout(fetch(url), REQ_TIMEOUT_MS);
    if (res.status !== 200) return { isbn, localPath: null, has404: res.status === 404 };

    const ab    = await res.arrayBuffer();
    const buf   = Buffer.from(ab);
    if (buf.length < 1024) {
      // Suspiciously small — likely a placeholder / blank
      return { isbn, localPath: null, has404: true };
    }
    fs.writeFileSync(localPath, buf);
    return { isbn, localPath: `/covers/${isbn}.jpg`, has404: false };
  } catch (err) {
    return { isbn, localPath: null, has404: false, error: err.message };
  }
}

async function processChunk(books) {
  return Promise.all(books.map(b => processOne(b.recordReference)));
}

// ---------------------------------------------------------------------------
async function run() {
  console.log('[seed-ol] Connecting to MongoDB...');
  await connectDB();

  console.log('[seed-ol] Looking for books needing covers...');
  const baseFilter = {
    isSellable:      true,
    recordReference: { $regex: '^978' },
    $or: [
      { coverImage: { $exists: false } },
      { coverImage: null },
      { coverImage: '' },
    ],
    'meta.olChecked': { $exists: false },
  };

  const totalCandidates = await Book.countDocuments(baseFilter);
  console.log(`[seed-ol] ${totalCandidates.toLocaleString()} candidate books`);

  let totalChecked = 0;
  let totalLinked  = 0;
  let total404     = 0;
  let totalErr     = 0;
  let stop         = false;

  while (!stop) {
    const batch = await Book.find(baseFilter, { recordReference: 1 })
      .limit(BATCH_SIZE)
      .lean();
    if (batch.length === 0) break;

    // Process in parallel chunks of PARALLEL
    const results = [];
    for (let i = 0; i < batch.length; i += PARALLEL) {
      const slice = batch.slice(i, i + PARALLEL);
      const out   = await processChunk(slice);
      results.push(...out);
      await new Promise(r => setTimeout(r, INTERBATCH_MS));
    }

    // Bulk-write the outcomes
    const ops = [];
    for (const r of results) {
      if (r.localPath) {
        ops.push({
          updateOne: {
            filter: { recordReference: r.isbn },
            update: { $set: { coverImage: r.localPath, 'meta.olChecked': new Date() } },
          },
        });
      } else {
        // Mark checked so we don't probe again. Errors are also marked
        // (so we don't retry a 5xx forever — if it was transient, drop the
        // meta.olChecked fields on the affected books and re-run later).
        ops.push({
          updateOne: {
            filter: { recordReference: r.isbn },
            update: { $set: { 'meta.olChecked': new Date() } },
          },
        });
        if (r.has404) total404++; else if (r.error) totalErr++;
      }
    }

    if (ops.length) {
      try { await Book.bulkWrite(ops, { ordered: false }); }
      catch (err) { console.error('[seed-ol] bulkWrite error:', err.message); }
    }

    totalChecked += batch.length;
    totalLinked  += ops.filter(o => 'coverImage' in o.updateOne.update.$set).length;

    console.log(
      `[seed-ol] +${batch.length} | checked ${totalChecked.toLocaleString()} | linked ${totalLinked.toLocaleString()} | 404 ${total404.toLocaleString()} | err ${totalErr}`
    );

    if (HARD_LIMIT > 0 && totalChecked >= HARD_LIMIT) {
      console.log(`[seed-ol] hit --limit=${HARD_LIMIT}, stopping`);
      stop = true;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('[seed-ol] DONE');
  console.log(`  Books checked : ${totalChecked.toLocaleString()}`);
  console.log(`  Covers linked : ${totalLinked.toLocaleString()}  (${((totalLinked/Math.max(1,totalChecked))*100).toFixed(1)}%)`);
  console.log(`  No OL cover   : ${total404.toLocaleString()}`);
  console.log(`  Errors        : ${totalErr}`);
  console.log('='.repeat(60));

  process.exit(0);
}

run().catch(err => {
  console.error('[seed-ol] FATAL:', err);
  process.exit(1);
});
