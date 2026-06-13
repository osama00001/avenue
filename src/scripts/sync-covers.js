/**
 * sync-covers.js
 * Bulk download cover images from covers.gardners.com.
 *
 * IMPORTANT: Gardners explicitly prohibits fetching covers one-by-one per ISBN.
 * This script downloads the entire archive in bulk.
 *
 * Directory structure (confirmed 2026-04-25):
 *   /EBooks/640s/Complete/{isbn-prefix}/{isbn13}.jpg   ← ~20,257 prefix dirs
 *   /EBooks/640s/Update/{WeekNN}.zip                   ← weekly delta ZIPs
 *
 * Modes:
 *   node src/scripts/sync-covers.js             → full sync (all prefix dirs)
 *   node src/scripts/sync-covers.js --update    → weekly delta ZIPs
 *   node src/scripts/sync-covers.js --no-link   → download only, skip Mongo writes
 *
 * After download:
 *   - Files are saved to covers_storage/{ISBN13}.{ext}
 *   - Book.coverImage updated to "/covers/{ISBN13}.{ext}" UNLESS --no-link
 *
 * Concurrent runs: if sync-biblio (or any heavy Mongo writer) is running,
 * use --no-link here and run link-covers.js afterwards. Avoids Atlas write
 * contention which causes bulkWrite to hang waiting for connection-pool slots.
 *
 * Runs weekly (Sunday 03:00) via Plesk cron.
 */

import 'dotenv/config';
import path    from 'path';
import fs      from 'fs';
import os      from 'os';
import { createWriteStream } from 'fs';
import { connectDB }    from '../lib/db.js';
import Book             from '../models/Book.js';
import { connectCovers } from './ftp-client.js';

const COVERS_BASE_DIR   = '/EBooks/640s/Complete';   // confirmed
const COVERS_UPDATE_DIR = '/EBooks/640s/Update';     // weekly ZIPs
const COVERS_LOCAL_DIR  = path.resolve(process.cwd(),'covers_storage');
const SCRATCH_DIR       = path.join(os.tmpdir(), 'avenue-covers');
const DB_BATCH_SIZE     = 200;

const UPDATE_MODE  = process.argv.includes('--update');
// --no-link: skip Book.coverImage writes entirely. Use this when running
// sync-covers concurrently with sync-biblio (or any other heavy Mongo writer)
// to avoid Atlas write contention. Run link-covers.js separately afterwards
// to reconcile the DB against disk.
const SKIP_DB_LINK = process.argv.includes('--no-link');

// ---------------------------------------------------------------------------
// Connection-aware FTP wrapper for Gardners' Microsoft IIS FTPS server.
//
// Empirical findings (2026-04-30 verbose-FTP debugging):
//   • Server is Microsoft FTP Service over TLS 1.2/1.3
//   • Each LIST or RETR negotiates a fresh passive port + TLS data handshake
//   • IIS FTP rate-limits aggressive clients; control socket starts dropping
//     after a few hundred rapid commands per session
//   • basic-ftp can sometimes hang silently when the server drops the socket
//     mid-read, never surfacing an error
//
// Defences (in order of importance):
//   1. RATE LIMIT  — small pause between operations (be polite)
//   2. PREVENTIVE  — explicit reconnect every N dirs to stay below IIS limits
//   3. TIMEOUT     — every op wrapped in Promise.race so silent hangs surface
//   4. RETRY       — on conn errors, reconnect and retry up to 4×
//   5. TCP KEEPALIVE on the control socket so IIS doesn't see us as idle
// ---------------------------------------------------------------------------
const FTP_OP_TIMEOUT_MS    = 15000;
const FTP_RATE_LIMIT_MS    = 250;
const FTP_RECONNECT_EVERY  = 100;

async function makeResilientCoversConn() {
  let conn = await connectCovers();
  primeKeepAlive(conn);

  async function reconnect() {
    try { await conn.close(); } catch (_) {}
    await new Promise(r => setTimeout(r, 1500)); // give IIS room to reset state
    conn = await connectCovers();
    primeKeepAlive(conn);
  }

  function isConnErr(err) {
    return /ECONNRESET|Client is closed|control socket|socket hang up|EPIPE|read.*ECONNREFUSED|timed out/i
      .test(err?.message || '');
  }

  function withTimeout(promise, ms, label) {
    let timer;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
  }

  async function withRetry(op, label, maxAttempts = 4) {
    let lastErr;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await withTimeout(op(conn.client), FTP_OP_TIMEOUT_MS, label);
      } catch (err) {
        lastErr = err;
        if (!isConnErr(err) || attempt === maxAttempts) throw err;
        console.warn(`[sync-covers] FTP ${label} failed (attempt ${attempt}/${maxAttempts}): ${err.message} — reconnecting`);
        await reconnect();
      }
    }
    throw lastErr;
  }

  return {
    list:       (p)    => withRetry(c => c.list(p),   `list ${p}`),
    get:        (r, l) => withRetry(c => c.get(r, l), `get  ${r}`),
    reconnect,
    close:      async () => { try { await conn.close(); } catch (_) {} },
  };
}

// Enable TCP keepalive on the underlying control socket of basic-ftp so the
// OS sends keepalive packets and IIS doesn't see us as idle.
function primeKeepAlive(conn) {
  try {
    // basic-ftp's FtpClient stores the underlying socket on .ftp.socket
    const sock = conn?.client?.ftp?.socket
              || conn?.client?._client?.ftp?.socket;
    if (sock && typeof sock.setKeepAlive === 'function') {
      sock.setKeepAlive(true, 5000);
    }
  } catch (_) { /* non-fatal */ }
}

// ---------------------------------------------------------------------------
async function run() {
  fs.mkdirSync(SCRATCH_DIR,      { recursive: true });
  fs.mkdirSync(COVERS_LOCAL_DIR, { recursive: true });

  console.log('[sync-covers] Connecting to MongoDB...');
  await connectDB();

  console.log('[sync-covers] Connecting to Gardners covers FTP (FTPS)...');

  if (UPDATE_MODE) {
    const { client, close } = await connectCovers();
    try { await runUpdate(client); }
    finally {
      await close();
      console.log('[sync-covers] FTP connection closed.');
      process.exit(0);
    }
  } else {
    const conn = await makeResilientCoversConn();
    try { await runFull(conn); }
    finally {
      await conn.close();
      console.log('[sync-covers] FTP connection closed.');
      process.exit(0);
    }
  }
}

// ---------------------------------------------------------------------------
// FULL SYNC — iterate all prefix subdirectories under /EBooks/640s/Complete/
// Uses the resilient wrapper so a dropped FTP control socket triggers a
// reconnect-and-retry rather than aborting the rest of the run.
// ---------------------------------------------------------------------------
async function runFull(conn) {
  console.log(`[sync-covers] FULL sync — listing prefix dirs in ${COVERS_BASE_DIR}...`);

  const prefixDirs = await conn.list(COVERS_BASE_DIR);
  const dirs = prefixDirs.filter(f => f.isDirectory || f.type === 2);

  console.log(`[sync-covers] Found ${dirs.length} prefix directories.\n`);

  let stats = { dirs: 0, downloaded: 0, skipped: 0, dbUpdated: 0, errors: 0 };
  let dbBatch = [];

  for (const dir of dirs) {
    const prefixPath = `${COVERS_BASE_DIR}/${dir.name}`;
    console.log(`[sync-covers] saving images from ${dir.name}.\n`);
    // Rate limit so Microsoft IIS FTP doesn't kill our control socket
    if (stats.dirs > 0) await new Promise(r => setTimeout(r, FTP_RATE_LIMIT_MS));

    // Preventive reconnect every N dirs — empirically Microsoft IIS FTP
    // starts dropping us after a few hundred ops on a single session
    if (stats.dirs > 0 && stats.dirs % FTP_RECONNECT_EVERY === 0) {
      console.log(`[sync-covers] Preventive reconnect at dir #${stats.dirs}`);
      try { await conn.reconnect(); } catch (e) { console.warn(`[sync-covers] reconnect failed: ${e.message}`); }
    }

    try {
      const files = await conn.list(prefixPath);
      const images = files.filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f.name));

      for (const file of images) {
        const destPath = path.join(COVERS_LOCAL_DIR, file.name);
        const isbn13   = path.basename(file.name, path.extname(file.name));
        const validIsbn = /^\d{13}$/.test(isbn13);

        // Skip download if already on disk with the right size — when
        // SKIP_DB_LINK is false, also queue the DB link for reconciliation.
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
          }

          if (dbBatch.length >= DB_BATCH_SIZE) {
            stats.dbUpdated += await updateBookCovers(dbBatch);
            dbBatch = [];
          }
        } catch (err) {
          console.warn(`[sync-covers] Failed: ${dir.name}/${file.name} — ${err.message}`);
          stats.errors++;
        }
      }

      stats.dirs++;
      if (stats.dirs % 50 === 0) {
        console.log(`[sync-covers] Progress: ${stats.dirs}/${dirs.length} dirs | ${stats.downloaded} downloaded | ${stats.skipped} skipped | ${stats.dbUpdated} linked | ${stats.errors} errors`);
      }

    } catch (err) {
      console.warn(`[sync-covers] Skipping dir ${dir.name}: ${err.message}`);
      stats.errors++;
    }
  }

  // Flush remaining DB batch
  if (dbBatch.length > 0) {
    stats.dbUpdated += await updateBookCovers(dbBatch);
  }

  printStats(stats);
}

// ---------------------------------------------------------------------------
// UPDATE SYNC — download weekly ZIP(s) and extract
// ---------------------------------------------------------------------------
async function runUpdate(client) {
  const { execSync } = await import('child_process');

  console.log(`[sync-covers] UPDATE mode — listing ${COVERS_UPDATE_DIR}...`);
  await client.cd(COVERS_UPDATE_DIR);
  const files = await client.list();

  const zips = files.filter(f => /\.zip$/i.test(f.name));
  console.log(`[sync-covers] Found ${zips.length} ZIP file(s).\n`);

  let stats = { downloaded: 0, skipped: 0, dbUpdated: 0, errors: 0, dirs: 0 };
  let dbBatch = [];

  for (const zip of zips) {
    const localZip = path.join(SCRATCH_DIR, zip.name);
    const extractDir = path.join(SCRATCH_DIR, zip.name.replace(/\.zip$/i, ''));

    try {
      console.log(`[sync-covers] Downloading ${zip.name}...`);
      await client.downloadTo(localZip, zip.name);

      // Extract ZIP
      fs.mkdirSync(extractDir, { recursive: true });
      execSync(`unzip -o "${localZip}" -d "${extractDir}"`);

      // Walk extracted files
      const extracted = walkDir(extractDir);
      const images = extracted.filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));

      for (const imgPath of images) {
        const filename = path.basename(imgPath);
        const destPath = path.join(COVERS_LOCAL_DIR, filename);

        try {
          fs.copyFileSync(imgPath, destPath);
          stats.downloaded++;

          const isbn13 = path.basename(filename, path.extname(filename));
          if (/^\d{13}$/.test(isbn13)) {
            dbBatch.push({ isbn13, webPath: `/covers/${filename}` });
          }

          if (dbBatch.length >= DB_BATCH_SIZE) {
            stats.dbUpdated += await updateBookCovers(dbBatch);
            dbBatch = [];
          }
        } catch (err) {
          console.warn(`[sync-covers] Failed to copy ${filename}: ${err.message}`);
          stats.errors++;
        }
      }

      // Clean up
      fs.unlinkSync(localZip);
      fs.rmSync(extractDir, { recursive: true, force: true });

    } catch (err) {
      console.error(`[sync-covers] Failed to process ${zip.name}: ${err.message}`);
      stats.errors++;
    }
  }

  if (dbBatch.length > 0) {
    stats.dbUpdated += await updateBookCovers(dbBatch);
  }

  printStats(stats);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function walkDir(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) {
      results.push(...walkDir(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

async function updateBookCovers(batch) {
  // Filter on recordReference rather than productIdentifiers.value — both
  // hold the same ISBN13 in our data, but recordReference has a unique
  // index, so each updateOne is O(log n) instead of a collection scan.
  const ops = batch.map(({ isbn13, webPath }) => ({
    updateOne: {
      filter: { recordReference: isbn13 },
      update: { $set: { coverImage: webPath } },
      upsert: false,
    },
  }));

  try {
    const result = await Book.bulkWrite(ops, { ordered: false });
    return result.modifiedCount || 0;
  } catch (err) {
    console.error(`[sync-covers] DB batch error: ${err.message}`);
    return 0;
  }
}

function printStats(stats) {
  console.log('\n' + '='.repeat(60));
  console.log('[sync-covers] COMPLETE');
  if (stats.dirs) console.log(`  Prefix dirs : ${stats.dirs}`);
  console.log(`  Downloaded  : ${stats.downloaded}`);
  console.log(`  Skipped     : ${stats.skipped} (already up to date)`);
  console.log(`  DB updated  : ${stats.dbUpdated}`);
  console.log(`  Errors      : ${stats.errors}`);
  console.log('='.repeat(60));
}

// ---------------------------------------------------------------------------
run().catch(err => {
  console.error('[sync-covers] FATAL:', err);
  process.exit(1);
});
