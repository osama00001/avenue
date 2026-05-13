/**
 * link-covers.js
 *
 * One-shot reconcile: walk public/covers/ and update Book.coverImage for
 * every JPG file whose filename matches a known ISBN-13 in the DB.
 *
 * Use this when:
 *   - You've moved to a new MongoDB cluster but cover JPGs were already on disk
 *   - sync-covers.js skipped existing files (which it does by design) and
 *     therefore never wrote the coverImage links to the new cluster
 *
 * Idempotent and fast: a single bulkWrite per BATCH_SIZE files. Run while
 * sync-covers is still going in another screen — they don't conflict.
 *
 * Run:
 *   node --env-file=.env.local src/scripts/link-covers.js
 */

import 'dotenv/config';
import path             from 'path';
import fs               from 'fs';
import { connectDB }    from '../lib/db.js';
import Book             from '../models/Book.js';

const COVERS_DIR = path.resolve(process.cwd(), 'public', 'covers');
const BATCH_SIZE = 500;

async function run() {
  console.log('[link-covers] Connecting to MongoDB...');
  await connectDB();
  console.log('[link-covers] Connected.');

  if (!fs.existsSync(COVERS_DIR)) {
    console.log(`[link-covers] No covers directory at ${COVERS_DIR} — nothing to do.`);
    process.exit(0);
  }

  const files = fs.readdirSync(COVERS_DIR);
  console.log(`[link-covers] Found ${files.length} files in ${COVERS_DIR}`);

  let batch = [];
  let updated = 0;
  let matched = 0;
  let scanned = 0;
  let skipped = 0;

  for (const file of files) {
    const ext     = path.extname(file).toLowerCase();
    const isbn13  = path.basename(file, ext);

    if (!/^\d{13}$/.test(isbn13)) { skipped++; continue; }
    if (!/^\.(jpg|jpeg|png|gif|webp)$/.test(ext)) { skipped++; continue; }

    // Filter on recordReference rather than productIdentifiers.value — both
    // hold the same ISBN13 in our data, but recordReference has a unique
    // index, so each updateOne becomes an O(log n) lookup instead of a
    // collection scan via the productIdentifiers array.
    batch.push({
      updateOne: {
        filter: { recordReference: isbn13 },
        update: { $set: { coverImage: `/covers/${file}` } },
        upsert: false,
      },
    });
    scanned++;

    if (batch.length >= BATCH_SIZE) {
      const result = await Book.bulkWrite(batch, { ordered: false });
      const m = result.modifiedCount || 0;
      const ma = result.matchedCount  || 0;
      updated += m;
      matched += ma;
      console.log(`[link-covers] Scanned ${scanned} | matched ${matched} | updated ${updated}`);
      batch = [];
    }
  }

  if (batch.length > 0) {
    const result = await Book.bulkWrite(batch, { ordered: false });
    updated += result.modifiedCount || 0;
    matched += result.matchedCount  || 0;
  }

  console.log('\n' + '='.repeat(60));
  console.log('[link-covers] DONE');
  console.log(`  Files scanned : ${scanned}`);
  console.log(`  Files skipped : ${skipped} (non-JPG / non-ISBN names)`);
  console.log(`  Matched in DB : ${matched}`);
  console.log(`  Updated in DB : ${updated}`);
  console.log('='.repeat(60));
  process.exit(0);
}

run().catch(err => {
  console.error('[link-covers] FATAL:', err.stack || err.message);
  process.exit(1);
});
