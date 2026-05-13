/**
 * targeted-covers.js
 *
 * Smart cover sync: only walks the prefix directories on Gardners' covers FTP
 * that match the publisher prefixes we ACTUALLY have books for, ranked by
 * book count desc.
 *
 * The default sync-covers.js walks 20,000+ prefix dirs alphabetically, which
 * for academic catalogues like Avenue spends most of its time on early
 * obscure-publisher prefixes that have no overlap with the imported catalog.
 *
 * This targeted walker:
 *   1. Aggregates Book.recordReference into 8-digit publisher prefixes
 *   2. Sorts by book count descending (top publisher first)
 *   3. Walks only those FTP dirs (skipping ones that don't exist with 550)
 *   4. Downloads + links covers as it goes
 *
 * Run:
 *   node --env-file=.env.local src/scripts/targeted-covers.js                 # default top 20
 *   node --env-file=.env.local src/scripts/targeted-covers.js --top=50        # top 50
 *   node --env-file=.env.local src/scripts/targeted-covers.js --top=20 --no-link
 *
 * Same --no-link semantics as sync-covers — skip Mongo writes during a
 * concurrent sync-biblio run, and run link-covers afterwards.
 */

import 'dotenv/config';
import path             from 'path';
import fs               from 'fs';
import os               from 'os';
import mongoose         from 'mongoose';
import { connectDB }    from '../lib/db.js';
import Book             from '../models/Book.js';
import { connectCovers } from './ftp-client.js';

const COVERS_BASE_DIR  = '/EBooks/640s/Complete';
const COVERS_LOCAL_DIR = path.resolve(process.cwd(), 'public', 'covers');
const SCRATCH_DIR      = path.join(os.tmpdir(), 'avenue-targeted-covers');
const DB_BATCH_SIZE    = 200;

const FTP_OP_TIMEOUT_MS    = 15000;
const FTP_RATE_LIMIT_MS    = 250;
const FTP_RECONNECT_EVERY  = 100;

const args = process.argv.slice(2);
const topArg = args.find(a => a.startsWith('--top='));
const TOP_N = topArg ? parseInt(topArg.slice(6), 10) || 20 : 20;
const SKIP_DB_LINK = args.includes('--no-link');

// ---------------------------------------------------------------------------
async function makeResilientCoversConn() {
  let conn = await connectCovers();

  async function reconnect() {
    try { await conn.close(); } catch (_) {}
    await new Promise(r => setTimeout(r, 1500));
    conn = await connectCovers();
  }

  function isConnErr(err) {
    return /ECONNRESET|Client is closed|control socket|socket hang up|EPIPE|read.*ECONNREFUSED|timed out/i
      .test(err?.message || '');
  }

  function withTimeout(p, ms, label) {
    let timer;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    });
    return Promise.race([p, timeout]).finally(() => clearTimeout(timer));
  }

  async function withRetry(op, label, maxAttempts = 4) {
    let lastErr;
    for (let i = 1; i <= maxAttempts; i++) {
      try { return await withTimeout(op(conn.client), FTP_OP_TIMEOUT_MS, label); }
      catch (err) {
        lastErr = err;
        if (!isConnErr(err) || i === maxAttempts) throw err;
        console.warn(`[targeted-covers] FTP ${label} (attempt ${i}/${maxAttempts}): ${err.message} — reconnecting`);
        await reconnect();
      }
    }
    throw lastErr;
  }

  return {
    list:  (p)    => withRetry(c => c.list(p),   `list ${p}`),
    get:   (r, l) => withRetry(c => c.get(r, l), `get  ${r}`),
    reconnect,
    close: async () => { try { await conn.close(); } catch (_) {} },
  };
}

// ---------------------------------------------------------------------------
async function updateBookCovers(batch) {
  const ops = batch.map(({ isbn13, webPath }) => ({
    updateOne: {
      filter: { recordReference: isbn13 },           // unique-indexed
      update: { $set: { coverImage: webPath } },
      upsert: false,
    },
  }));
  try {
    const result = await Book.bulkWrite(ops, { ordered: false });
    return result.modifiedCount || 0;
  } catch (err) {
    console.error(`[targeted-covers] DB batch error: ${err.message}`);
    return 0;
  }
}

// ---------------------------------------------------------------------------
async function run() {
  fs.mkdirSync(COVERS_LOCAL_DIR, { recursive: true });
  fs.mkdirSync(SCRATCH_DIR,      { recursive: true });

  console.log(`[targeted-covers] Top: ${TOP_N} | DB link: ${!SKIP_DB_LINK}`);
  console.log('[targeted-covers] Connecting to MongoDB...');
  await connectDB();
  const db = mongoose.connection.db;

  console.log('[targeted-covers] Computing prefix ranking from catalog...');
  const prefixes = await db.collection('books').aggregate([
    { $match:   { recordReference: { $regex: '^978' } } },
    { $project: { prefix: { $substr: ['$recordReference', 0, 8] } } },
    { $group:   { _id: '$prefix', count: { $sum: 1 } } },
    { $sort:    { count: -1 } },
    { $limit:   TOP_N },
  ]).toArray();

  console.log(`[targeted-covers] Walking ${prefixes.length} prefix dirs covering ${prefixes.reduce((s, p) => s + p.count, 0).toLocaleString()} catalog books:\n`);
  prefixes.forEach(p => console.log(`  ${p._id}  →  ${p.count.toLocaleString()} catalog books`));
  console.log('');

  console.log('[targeted-covers] Connecting to Gardners covers FTP...');
  const conn = await makeResilientCoversConn();

  const stats = { dirsDone: 0, dirsMissing: 0, downloaded: 0, skipped: 0, dbUpdated: 0, errors: 0 };
  let dbBatch = [];

  try {
    let processed = 0;
    for (const { _id: prefix, count } of prefixes) {
      const prefixPath = `${COVERS_BASE_DIR}/${prefix}`;

      if (processed > 0) await new Promise(r => setTimeout(r, FTP_RATE_LIMIT_MS));
      if (processed > 0 && processed % FTP_RECONNECT_EVERY === 0) {
        console.log(`[targeted-covers] Preventive reconnect at #${processed}`);
        try { await conn.reconnect(); } catch (e) { console.warn(`reconnect failed: ${e.message}`); }
      }

      let files;
      try {
        files = await conn.list(prefixPath);
      } catch (err) {
        if (/550|not found|cannot find/i.test(err.message)) {
          stats.dirsMissing++;
          console.log(`  [skip] ${prefix} — no such dir on FTP (${count} catalog books)`);
        } else {
          stats.errors++;
          console.warn(`  [error] ${prefix}: ${err.message}`);
        }
        processed++;
        continue;
      }

      const images = files.filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f.name));
      console.log(`  [walk] ${prefix} → ${images.length} covers (vs ${count} catalog books)`);

      for (const file of images) {
        const destPath  = path.join(COVERS_LOCAL_DIR, file.name);
        const isbn13    = path.basename(file.name, path.extname(file.name));
        const validIsbn = /^\d{13}$/.test(isbn13);

        if (fs.existsSync(destPath) && file.size) {
          const existing = fs.statSync(destPath);
          if (existing.size === file.size) {
            stats.skipped++;
            if (validIsbn && !SKIP_DB_LINK) {
              dbBatch.push({ isbn13, webPath: `/covers/${file.name}` });
              if (dbBatch.length >= DB_BATCH_SIZE) {
                stats.dbUpdated += await updateBookCovers(dbBatch);
                dbBatch = [];
              }
            }
            continue;
          }
        }

        try {
          const localPath = path.join(SCRATCH_DIR, file.name);
          await conn.get(`${prefixPath}/${file.name}`, localPath);
          fs.renameSync(localPath, destPath);
          stats.downloaded++;
          if (validIsbn && !SKIP_DB_LINK) {
            dbBatch.push({ isbn13, webPath: `/covers/${file.name}` });
            if (dbBatch.length >= DB_BATCH_SIZE) {
              stats.dbUpdated += await updateBookCovers(dbBatch);
              dbBatch = [];
            }
          }
        } catch (err) {
          console.warn(`  [fail] ${prefix}/${file.name}: ${err.message}`);
          stats.errors++;
        }
      }

      stats.dirsDone++;
      processed++;
      console.log(`  [stat] ${stats.dirsDone}/${prefixes.length} dirs | ${stats.downloaded} dl | ${stats.skipped} skip | ${stats.dbUpdated} linked | ${stats.errors} err`);
    }

    if (dbBatch.length > 0) {
      stats.dbUpdated += await updateBookCovers(dbBatch);
    }
  } finally {
    await conn.close();
  }

  console.log('\n' + '='.repeat(60));
  console.log('[targeted-covers] DONE');
  console.log(`  Dirs walked       : ${stats.dirsDone}`);
  console.log(`  Dirs not on FTP   : ${stats.dirsMissing}`);
  console.log(`  Covers downloaded : ${stats.downloaded.toLocaleString()}`);
  console.log(`  Already on disk   : ${stats.skipped.toLocaleString()}`);
  console.log(`  DB updated        : ${stats.dbUpdated.toLocaleString()}`);
  console.log(`  Errors            : ${stats.errors}`);
  console.log('='.repeat(60));
  process.exit(0);
}

run().catch(err => {
  console.error('[targeted-covers] FATAL:', err.stack || err.message);
  process.exit(1);
});
