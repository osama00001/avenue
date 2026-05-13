/**
 * sync-biblio.js
 * Orchestrator: FTP /Biblio → unzip → ONIX/Panda parser → Category upsert → MongoDB bulk upsert.
 *
 * Gardners /Biblio directory structure (confirmed 2026-04-28):
 *   GARDBIB.zip       (294 MB) — full catalog dump
 *   GARDBIB.DONE      (0 B)   — marker: GARDBIB.zip is complete
 *   WeeklyExtract.zip (274 MB) — weekly ONIX delta
 *   WeeklyExtractMD.zip (22 MB) — weekly metadata-only delta
 *   Delta/            (dir)   — individual delta files
 *   ONIX/             (dir)   — additional ONIX files
 *
 * Strategy:
 *   --full         → downloads GARDBIB.zip (initial bulk import, ~50 min)
 *   default        → downloads WeeklyExtract.zip (weekly cron)
 *
 * Iteration helpers (avoid re-downloading the 294 MB zip):
 *   --skip-download  → reuse an existing zip in the scratch dir
 *   --skip-extract   → reuse an existing extract dir; skip download AND unzip
 *   --keep           → don't delete zip/extract dir at end (for debugging)
 *
 * Memory: full catalog can hold 1M+ records in RAM during parse. Run with:
 *   node --max-old-space-size=4096 src/scripts/sync-biblio.js --full
 *
 * Run weekly update:
 *   node src/scripts/sync-biblio.js
 *
 * Run initial full import:
 *   node --max-old-space-size=4096 src/scripts/sync-biblio.js --full
 */

import 'dotenv/config';
import path             from 'path';
import fs               from 'fs';
import os               from 'os';
import v8               from 'v8';
import { execSync }     from 'child_process';
import { connectDB }    from '../lib/db.js';
import Book             from '../models/Book.js';
import { connectPhysical, listDir } from './ftp-client.js';
import { parsePandaXML }      from './panda-xml-parser.js';
import { parsePandaFlat }     from './panda-flat-parser.js';
import { upsertCategories }   from './category-upsert.js';

const BIBLIO_DIR  = '/Biblio';
const BATCH_SIZE  = 250;

// Use /var/tmp (larger, persistent) or override with BIBLIO_SCRATCH_DIR env var.
// The full catalog uncompresses to ~1 GB — /tmp is often too small.
const SCRATCH_DIR = process.env.BIBLIO_SCRATCH_DIR || path.join('/var/tmp', 'avenue-biblio');

// Flags
const args           = process.argv.slice(2);
const FULL_MODE      = args.includes('--full');
const SKIP_DL        = args.includes('--skip-download') || args.includes('--skip-extract');
const SKIP_EXTRACT   = args.includes('--skip-extract');
const KEEP           = args.includes('--keep');
const SELLABLE_ONLY  = args.includes('--sellable-only');
const BOOKS_ONLY     = args.includes('--books-only');

// ---------------------------------------------------------------------------
async function run() {
  // ── Pre-flight diagnostics ────────────────────────────────────────────────
  console.log('[sync-biblio] === Pre-flight ===');
  console.log(`[sync-biblio] Node             : ${process.version}`);
  console.log(`[sync-biblio] Heap limit       : ${formatSize(getHeapLimit())}`);
  console.log(`[sync-biblio] Mode             : ${FULL_MODE ? 'FULL (GARDBIB.zip)' : 'WEEKLY (WeeklyExtract.zip)'}`);
  console.log(`[sync-biblio] Scratch dir      : ${SCRATCH_DIR}`);
  console.log(`[sync-biblio] Skip download    : ${SKIP_DL}`);
  console.log(`[sync-biblio] Skip extract     : ${SKIP_EXTRACT}`);
  console.log(`[sync-biblio] Keep on disk     : ${KEEP}`);
  console.log(`[sync-biblio] Sellable only    : ${SELLABLE_ONLY}`);
  console.log(`[sync-biblio] Books only       : ${BOOKS_ONLY}`);
  console.log(`[sync-biblio] MONGODB_URI set  : ${!!process.env.MONGODB_URI}`);
  console.log(`[sync-biblio] FTP creds set    : ${!!process.env.GARDNERS_PHYSICAL_FTP_USER}`);

  ensureScratchDir(SCRATCH_DIR);
  ensureUnzipAvailable();
  reportDiskSpace(SCRATCH_DIR);
  console.log('');

  console.log('[sync-biblio] Connecting to MongoDB...');
  await connectDB();
  console.log('[sync-biblio] MongoDB connected.\n');

  // SFTP only needed if we have to download
  let close = async () => {};
  let client = null;

  if (!SKIP_DL) {
    console.log('[sync-biblio] Connecting to Gardners physical FTP (SFTP)...');
    const conn = await connectPhysical();
    client = conn.client;
    close  = conn.close;
  } else {
    console.log('[sync-biblio] --skip-download / --skip-extract: not connecting to FTP.');
  }

  try {
    let targetZips;

    if (SKIP_DL) {
      // Reuse existing zip(s) in scratch dir
      const expectedName = FULL_MODE ? 'GARDBIB.zip' : 'WeeklyExtract.zip';
      const localZip = path.join(SCRATCH_DIR, expectedName);
      if (!SKIP_EXTRACT && !fs.existsSync(localZip)) {
        throw new Error(`--skip-download set but ${localZip} not found.`);
      }
      const fakeSize = fs.existsSync(localZip) ? fs.statSync(localZip).size : 0;
      targetZips = [{ name: expectedName, size: fakeSize, type: 1 }];
      console.log(`[sync-biblio] Using local file: ${expectedName} (${formatSize(fakeSize)})\n`);
    } else {
      const files = await listDir(client, BIBLIO_DIR);

      if (FULL_MODE) {
        const hasDone = files.some(f => f.name === 'GARDBIB.DONE');
        const gardbib = files.find(f => f.name === 'GARDBIB.zip');
        if (!gardbib) { console.log('[sync-biblio] GARDBIB.zip not found.'); return; }
        if (!hasDone) { console.log('[sync-biblio] GARDBIB.DONE not present — file may still be uploading.'); return; }
        targetZips = [gardbib];
        console.log(`[sync-biblio] FULL mode — using GARDBIB.zip (${formatSize(gardbib.size)})\n`);
      } else {
        targetZips = files.filter(f => f.type !== 2 && /^WeeklyExtract\.zip$/i.test(f.name));
        if (targetZips.length === 0) {
          console.log('[sync-biblio] No WeeklyExtract.zip found. Try --full for initial import.');
          return;
        }
        console.log(`[sync-biblio] WEEKLY mode — ${targetZips.length} file(s)\n`);
      }
    }

    let grandTotal = { created: 0, updated: 0, skipped: 0, errors: 0 };

    for (const file of targetZips) {
      const zipPath    = path.join(SCRATCH_DIR, file.name);
      const extractDir = path.join(SCRATCH_DIR, file.name.replace(/\.zip$/i, ''));

      // ── Download stage ────────────────────────────────────────────────────
      if (!SKIP_DL) {
        console.log(`[sync-biblio] Downloading ${file.name} (${formatSize(file.size)})...`);
        const t0 = Date.now();
        await client.get(`${BIBLIO_DIR}/${file.name}`, zipPath);
        console.log(`[sync-biblio] Downloaded in ${((Date.now() - t0) / 1000).toFixed(1)}s.`);
      } else {
        console.log(`[sync-biblio] Reusing existing zip at ${zipPath}`);
      }

      // ── Extract stage ─────────────────────────────────────────────────────
      if (!SKIP_EXTRACT) {
        if (fs.existsSync(extractDir)) {
          console.log(`[sync-biblio] Removing stale extract dir ${extractDir}`);
          fs.rmSync(extractDir, { recursive: true, force: true });
        }
        fs.mkdirSync(extractDir, { recursive: true });

        console.log(`[sync-biblio] Extracting ${zipPath} → ${extractDir} ...`);
        reportDiskSpace(SCRATCH_DIR);
        const tExtract = Date.now();
        try {
          // Inherit stdio so unzip's progress + any error appears in the log.
          execSync(`unzip -o "${zipPath}" -d "${extractDir}"`, { stdio: 'inherit' });
        } catch (e) {
          throw new Error(
            `unzip failed (exit=${e.status}, signal=${e.signal}): ` +
            (e.stderr?.toString().slice(0, 500) || e.message)
          );
        }
        console.log(`[sync-biblio] Extracted in ${((Date.now() - tExtract) / 1000).toFixed(1)}s.`);
        reportDiskSpace(SCRATCH_DIR);
      } else {
        console.log(`[sync-biblio] --skip-extract: assuming ${extractDir} is already populated.`);
      }

      // ── Walk + filter ─────────────────────────────────────────────────────
      const allFiles = walkDir(extractDir);
      console.log(`[sync-biblio] Files in extract dir (${allFiles.length} total):`);
      allFiles.slice(0, 20).forEach(f => {
        const sz = fs.statSync(f).size;
        console.log(`    ${path.relative(extractDir, f).padEnd(50)} ${formatSize(sz).padStart(10)}`);
      });
      if (allFiles.length > 20) console.log(`    ... and ${allFiles.length - 20} more`);

      const dataFiles = allFiles.filter(f => {
        const base = path.basename(f);
        // Skip dotfiles and obvious non-data
        if (base.startsWith('.') || base.startsWith('__MACOSX')) return false;
        const ext = path.extname(f).toLowerCase();
        return ext === '.xml' || ext === '.onix' || ext === '.txt' || ext === '.dat' || ext === '';
      });
      console.log(`[sync-biblio] Will parse ${dataFiles.length} data file(s).\n`);

      if (dataFiles.length === 0) {
        throw new Error(`No parseable data files found in ${extractDir}. Check the listing above.`);
      }

      // ── Parse + upsert ────────────────────────────────────────────────────
      for (const dataPath of dataFiles) {
        const label = path.basename(dataPath);
        const sz    = fs.statSync(dataPath).size;
        console.log(`[sync-biblio] Parsing ${label} (${formatSize(sz)}) ...`);
        const t0    = Date.now();
        const stats = await processFile(dataPath);
        const dur   = ((Date.now() - t0) / 1000).toFixed(1);

        grandTotal.created += stats.created;
        grandTotal.updated += stats.updated;
        grandTotal.skipped += stats.skipped;
        grandTotal.errors  += stats.errors;

        console.log(
          `[sync-biblio] ${label} done in ${dur}s → ` +
          `created: ${stats.created} | updated: ${stats.updated} | ` +
          `skipped: ${stats.skipped} | errors: ${stats.errors}`
        );
      }

      // ── Cleanup (unless --keep) ───────────────────────────────────────────
      if (!KEEP) {
        try { fs.unlinkSync(zipPath); } catch (_) {}
        fs.rmSync(extractDir, { recursive: true, force: true });
        console.log(`[sync-biblio] Cleaned up ${file.name} and ${path.basename(extractDir)}/`);
      } else {
        console.log(`[sync-biblio] --keep: leaving zip and extract dir on disk.`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('[sync-biblio] COMPLETE');
    console.log(`  Total created : ${grandTotal.created}`);
    console.log(`  Total updated : ${grandTotal.updated}`);
    console.log(`  Total skipped : ${grandTotal.skipped}`);
    console.log(`  Total errors  : ${grandTotal.errors}`);
    console.log('='.repeat(60));

  } finally {
    try { await close(); } catch (_) {}
    console.log('[sync-biblio] FTP connection closed.');
    // NOTE: do NOT call process.exit(0) here — it swallows thrown errors.
  }
}

// ---------------------------------------------------------------------------
async function processFile(localPath) {
  const stats = { created: 0, updated: 0, skipped: 0, errors: 0 };
  let batch = [];
  let dispatched = 0;

  const flushBatch = async () => {
    if (batch.length === 0) return;
    await upsertBatch(batch, stats);
    batch = [];
  };

  // Dispatch to the right parser based on extension.
  //   .xml / .onix   → compact ONIX-like XML  (WeeklyExtract*.xml)
  //   .txt / .dat    → Panda flat key-value   (GARDBIB.TXT)
  //   no extension   → sniff first byte: '<' = XML, '*' / letter = flat
  const ext = path.extname(localPath).toLowerCase();
  let parser;
  let parserName;

  const onBook = async (book) => {
    if (!book || !book.recordReference) { stats.skipped++; return; }

    // Optional filters — keep DB lean and fit smaller Atlas tiers
    if (SELLABLE_ONLY && !book.isSellable)                   { stats.skipped++; return; }
    if (BOOKS_ONLY    && book.descriptiveDetail.productForm === 'ZZ') { stats.skipped++; return; }

    const categoryIds = await upsertCategories(book.descriptiveDetail.subjects);
    batch.push({ book, categoryIds });
    if (batch.length >= BATCH_SIZE) await flushBatch();

    dispatched++;
    if (dispatched % 5000 === 0) {
      const mem = process.memoryUsage();
      console.log(
        `[sync-biblio]   …${dispatched.toLocaleString()} dispatched | ` +
        `heap ${formatSize(mem.heapUsed)} / ${formatSize(mem.heapTotal)} | ` +
        `created ${stats.created} updated ${stats.updated} errors ${stats.errors}`
      );
    }
  };

  const stream = fs.createReadStream(localPath, { encoding: 'utf8' });

  if (ext === '.xml' || ext === '.onix') {
    parser = parsePandaXML;
    parserName = 'panda-xml-parser';
  } else if (ext === '.txt' || ext === '.dat') {
    parser = parsePandaFlat;
    parserName = 'panda-flat-parser';
  } else {
    // No extension — sniff the first non-whitespace byte
    const firstByte = await sniffFirstByte(localPath);
    if (firstByte === '<') {
      parser = parsePandaXML;
      parserName = 'panda-xml-parser (sniffed)';
    } else {
      parser = parsePandaFlat;
      parserName = 'panda-flat-parser (sniffed)';
    }
  }

  console.log(`[sync-biblio] Using ${parserName}`);
  await parser(stream, onBook);

  await flushBatch();
  return stats;
}

async function sniffFirstByte(filePath) {
  const fd = await fs.promises.open(filePath, 'r');
  try {
    const buf = Buffer.alloc(16);
    await fd.read(buf, 0, 16, 0);
    const text = buf.toString('utf8').trim();
    return text.charAt(0) || '';
  } finally {
    await fd.close();
  }
}

// ---------------------------------------------------------------------------
async function upsertBatch(items, stats) {
  const ops = items.map(({ book, categoryIds }) => ({
    updateOne: {
      filter: { recordReference: book.recordReference },
      update: {
        $set:      { ...book, meta: { ...book.meta, importedAt: new Date() } },
        $addToSet: { categories: { $each: categoryIds } },
      },
      upsert: true,
    },
  }));

  try {
    const result = await Book.bulkWrite(ops, { ordered: false });
    stats.created += result.upsertedCount  || 0;
    stats.updated += result.modifiedCount  || 0;
  } catch (err) {
    console.error(`[sync-biblio] Batch error: ${err.message}`);
    stats.errors += items.length;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function walkDir(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    let entries;
    try { entries = fs.readdirSync(cur, { withFileTypes: true }); }
    catch (_) { continue; }
    for (const e of entries) {
      const full = path.join(cur, e.name);
      if (e.isDirectory())      stack.push(full);
      else if (e.isFile())      out.push(full);
    }
  }
  return out;
}

function formatSize(bytes) {
  if (bytes == null || isNaN(bytes)) return '?';
  if (bytes < 1024)              return `${bytes} B`;
  if (bytes < 1024 * 1024)       return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function ensureScratchDir(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true });
    // Verify writability — touch a probe file
    const probe = path.join(dir, `.write-probe-${process.pid}`);
    fs.writeFileSync(probe, '');
    fs.unlinkSync(probe);
  } catch (err) {
    throw new Error(
      `Scratch dir ${dir} is not writable by user '${os.userInfo().username}': ${err.message}\n` +
      `  Fix: rm -rf ${dir} && mkdir -p ${dir} && chown -R <user> ${dir}\n` +
      `  Or set BIBLIO_SCRATCH_DIR to a writable path.`
    );
  }
}

function ensureUnzipAvailable() {
  try {
    execSync('unzip -v', { stdio: 'pipe' });
  } catch (_) {
    throw new Error(`'unzip' binary not found in PATH. Install it: dnf install -y unzip (RHEL) or apt install unzip (Debian).`);
  }
}

function reportDiskSpace(dir) {
  try {
    const out = execSync(`df -h "${dir}"`, { stdio: 'pipe' }).toString();
    console.log('[sync-biblio] Disk space:');
    out.trim().split('\n').forEach(l => console.log(`    ${l}`));
  } catch (_) { /* non-fatal */ }
}

function getHeapLimit() {
  try { return v8.getHeapStatistics().heap_size_limit; }
  catch (_) { return 0; }
}

// ---------------------------------------------------------------------------
// Entry point — surfaces errors instead of swallowing them.
// ---------------------------------------------------------------------------
run()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('\n[sync-biblio] FATAL:', err.stack || err.message || err);
    process.exit(1);
  });
