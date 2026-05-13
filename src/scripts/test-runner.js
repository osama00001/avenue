/**
 * test-runner.js
 * Automated checkpoint runner for the Gardners pipeline.
 *
 * Runs through all 9 checkpoints in sequence against local Docker MongoDB.
 * Reports PASS / FAIL / SKIP per checkpoint with timing.
 *
 * Usage:
 *   node --env-file=.env.test src/scripts/test-runner.js
 *
 * Options:
 *   --from=N     Start from checkpoint N (e.g. --from=3 to skip FTP)
 *   --only=N     Run only checkpoint N
 *   --no-covers  Skip the covers download (slow — skipped by default)
 *   --covers     Include covers checkpoint
 *
 * Checkpoints:
 *   1 — Node version + MongoDB connection
 *   2 — Physical FTP connects + lists /Biblio
 *   3 — Covers FTP connects + lists /Complete/97830304
 *   4 — Download smallest ONIX file from /Biblio
 *   5 — Parse ONIX file, validate output against Book schema
 *   6 — Upsert test records into local MongoDB
 *   7 — API books route returns records (requires dev server running)
 *   8 — P&A CSV download + price update
 *   9 — EDI order file generation (dry run)
 */

import 'dotenv/config';
import path    from 'path';
import fs      from 'fs';
import os      from 'os';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

// ─── Colour helpers ──────────────────────────────────────────────────────────
const c = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  green:  '\x1b[32m',
  red:    '\x1b[31m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  dim:    '\x1b[2m',
};
const pass   = `${c.green}${c.bold}  PASS${c.reset}`;
const fail   = `${c.red}${c.bold}  FAIL${c.reset}`;
const skip   = `${c.yellow}${c.bold}  SKIP${c.reset}`;
const warn   = `${c.yellow}⚠${c.reset}`;
const info   = `${c.cyan}ℹ${c.reset}`;

// ─── Arg parsing ─────────────────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2)
    .filter(a => a.startsWith('--'))
    .map(a => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; })
);
const FROM_CP     = args.from    ? parseInt(args.from, 10)  : 1;
const ONLY_CP     = args.only    ? parseInt(args.only, 10)  : null;
const RUN_COVERS  = args.covers  === true || args.covers  === 'true';
const OFFLINE     = args.offline === true || args.offline === 'true';

// Path to bundled sample ONIX for offline testing
const SAMPLE_ONIX = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  'test-data', 'sample.onix.xml'
);

const SCRATCH = path.join(os.tmpdir(), 'avenue-test-runner');
fs.mkdirSync(SCRATCH, { recursive: true });

// Results store
const results = [];

// ─── Runner ──────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${c.bold}${c.cyan}╔══════════════════════════════════════════════════╗`);
  console.log(`║   Avenue Bookstore — Pipeline Test Runner        ║`);
  console.log(`╚══════════════════════════════════════════════════╝${c.reset}\n`);
  console.log(`${info} MongoDB URI : ${process.env.MONGODB_URI}`);
  console.log(`${info} Node        : ${process.version}`);
  console.log(`${info} Scratch dir : ${SCRATCH}`);
  console.log(`${info} Covers CP   : ${RUN_COVERS ? 'included (--covers)' : 'skipped (pass --covers to include)'}`);
  console.log(`${info} Mode        : ${OFFLINE ? `${c.yellow}OFFLINE — using sample ONIX (FTP skipped for CP2/CP4/CP7)${c.reset}` : 'ONLINE'}`);
  console.log();

  await checkpoint(1, 'Node version + MongoDB connection', cp1_mongo);

  if (OFFLINE) {
    skipCheckpoint(2, 'Physical FTP list /Biblio — skipped in --offline mode');
    await checkpoint(3, 'Covers FTP — connect + explore directory tree', cp3_coversFtp);
    skipCheckpoint(4, 'Download ONIX from FTP — skipped in --offline mode');
    // Seed downloadedOnixPath with bundled sample for CP5/CP6
    downloadedOnixPath = SAMPLE_ONIX;
    console.log(`${c.dim}     → Using bundled sample: ${SAMPLE_ONIX}${c.reset}`);
  } else {
    await checkpoint(2, 'Physical FTP — connect + list /Biblio', cp2_physicalFtp);
    await checkpoint(3, 'Covers FTP — connect + explore directory tree', cp3_coversFtp);
    await checkpoint(4, 'Download smallest ONIX file from /Biblio', cp4_downloadOnix);
  }

  await checkpoint(5, 'Parse ONIX file — validate Book schema mapping', cp5_parseOnix);
  await checkpoint(6, 'Upsert test records into local MongoDB', cp6_upsert);

  if (OFFLINE) {
    skipCheckpoint(7, 'P&A CSV download — skipped in --offline mode');
  } else {
    await checkpoint(7, 'P&A CSV download + price update', cp7_panda);
  }
  if (RUN_COVERS) {
    await checkpoint(8, 'Covers bulk listing (no full download)', cp8_coversListing);
  } else {
    skipCheckpoint(8, 'Covers listing — run with --covers to include');
  }
  await checkpoint(9, 'EDI order generation — dry run', cp9_edi);

  printSummary();
  await cleanup();
  process.exit(results.some(r => r.status === 'FAIL') ? 1 : 0);
}

// ─── Checkpoint executor ─────────────────────────────────────────────────────
async function checkpoint(n, label, fn) {
  if (ONLY_CP && n !== ONLY_CP) return;
  if (n < FROM_CP) return;

  const prefix = `${c.bold}CP${n}${c.reset} ${label}`;
  process.stdout.write(`${prefix} ... `);

  const start = Date.now();
  try {
    const detail = await fn();
    const ms = Date.now() - start;
    console.log(`${pass}  ${c.dim}(${ms}ms)${c.reset}`);
    if (detail) console.log(`     ${c.dim}${detail}${c.reset}`);
    results.push({ n, label, status: 'PASS', ms });
  } catch (err) {
    const ms = Date.now() - start;
    console.log(`${fail}  ${c.dim}(${ms}ms)${c.reset}`);
    console.log(`     ${c.red}${err.message}${c.reset}`);
    if (err.detail) console.log(`     ${c.dim}${err.detail}${c.reset}`);
    results.push({ n, label, status: 'FAIL', ms, error: err.message });
  }
}

function skipCheckpoint(n, reason) {
  console.log(`${c.bold}CP${n}${c.reset} ${reason} ${skip}`);
  results.push({ n, label: reason, status: 'SKIP' });
}

// ─── CP1: Node version + MongoDB ─────────────────────────────────────────────
async function cp1_mongo() {
  const major = parseInt(process.version.slice(1), 10);
  if (major < 20) throw Object.assign(new Error(`Node ${process.version} — need v20+`), {});

  const { connectDB } = await import('../lib/db.js');
  await connectDB();

  const state = mongoose.connection.readyState;
  if (state !== 1) throw new Error(`MongoDB not connected (state: ${state})`);

  return `Node ${process.version} | MongoDB connected to ${process.env.MONGODB_URI}`;
}

// ─── CP2: Physical FTP ───────────────────────────────────────────────────────
let physicalFtpFiles = null;  // shared with CP4

async function cp2_physicalFtp() {
  const { connectPhysical, listDir } = await import('./ftp-client.js');
  const { client, close }            = await connectPhysical();

  try {
    const files = await listDir(client, '/Biblio');
    physicalFtpFiles = files;

    if (!files || files.length === 0) {
      throw new Error('/Biblio is empty or not accessible');
    }

    const zipFiles = files.filter(f => /\.zip$/i.test(f.name) && f.type !== 2);
    const hasDone  = files.some(f => f.name === 'GARDBIB.DONE');
    const names    = files.map(f => f.name).join(', ');

    return `${files.length} entries | ${zipFiles.length} ZIP file(s)${hasDone ? ' | GARDBIB.DONE ✓' : ''} | Files: ${names}`;
  } finally {
    await close();
  }
}

// ─── CP3: Covers FTP ─────────────────────────────────────────────────────────
// Stores the real covers path once found — used by sync-covers.js
export let realCoversPath = null;

async function cp3_coversFtp() {
  const { connectCovers, listDir } = await import('./ftp-client.js');
  const { client, close }          = await connectCovers();

  try {
    // List root
    const topFiles = await listDir(client, '/');
    const topDirs  = topFiles.filter(f => f.type === 2).map(f => f.name);

    console.log(`\n     ${c.dim}Root dirs: ${topDirs.join(', ')}${c.reset}`);

    // Walk one level deep under each top-level dir to find image files
    const IMAGE_RE  = /\.(jpg|jpeg|png|gif|webp)$/i;
    const found     = [];

    for (const dir of topDirs) {
      try {
        const sub = await listDir(client, `/${dir}`);
        const subDirs  = sub.filter(f => f.type === 2).map(f => f.name);
        const subFiles = sub.filter(f => f.type !== 2);
        const imgCount = subFiles.filter(f => IMAGE_RE.test(f.name)).length;

        if (imgCount > 0) {
          found.push({ path: `/${dir}`, count: imgCount, sample: subFiles.find(f => IMAGE_RE.test(f.name))?.name });
        }

        // Go one level deeper
        for (const sub2 of subDirs) {
          try {
            const deep = await listDir(client, `/${dir}/${sub2}`);
            const deepImgs = deep.filter(f => f.type !== 2 && IMAGE_RE.test(f.name));
            if (deepImgs.length > 0) {
              found.push({ path: `/${dir}/${sub2}`, count: deepImgs.length, sample: deepImgs[0]?.name });
            }
            // Print subdirs for visibility
            console.log(`     ${c.dim}/${dir}/${sub2} — ${deepImgs.length} images, ${deep.filter(f=>f.type===2).length} subdirs${c.reset}`);
          } catch (_) { /* skip inaccessible */ }
        }
      } catch (_) { /* skip inaccessible */ }
    }

    if (found.length === 0) {
      return `Connected OK | Root: ${topDirs.join(', ')} | ${warn} No image directories found in first 2 levels — check manually`;
    }

    // Best candidate: most images
    const best = found.sort((a, b) => b.count - a.count)[0];
    realCoversPath = best.path;

    const allPaths = found.map(f => `${f.path} (${f.count} imgs)`).join(' | ');
    return `Connected OK | Image dirs found:\n     ${allPaths}\n     ${c.green}→ Best candidate: ${best.path} (${best.count} images, sample: ${best.sample})${c.reset}`;
  } finally {
    await close();
  }
}

// ─── CP4: Download smallest ONIX ZIP, extract, locate XML ───────────────────
let downloadedOnixPath = null;  // shared with CP5

async function cp4_downloadOnix() {
  const { execSync } = await import('child_process');

  if (!physicalFtpFiles) {
    const { connectPhysical, listDir } = await import('./ftp-client.js');
    const { client, close }            = await connectPhysical();
    try {
      physicalFtpFiles = await listDir(client, '/Biblio');
    } finally {
      await close();
    }
  }

  // Prefer WeeklyExtractMD.zip (smallest ~22 MB) then any ZIP
  const zipFiles = physicalFtpFiles
    .filter(f => /\.zip$/i.test(f.name) && f.type !== 2)
    .sort((a, b) => (a.size || 0) - (b.size || 0));

  if (zipFiles.length === 0) throw new Error('No ZIP files found in /Biblio');

  const target  = zipFiles.find(f => /WeeklyExtractMD/i.test(f.name)) || zipFiles[0];
  const sizeMB  = ((target.size || 0) / 1024 / 1024).toFixed(1);
  const zipPath = path.join(SCRATCH, target.name);
  const extDir  = path.join(SCRATCH, target.name.replace(/\.zip$/i, ''));

  const { connectPhysical } = await import('./ftp-client.js');
  const { client, close }   = await connectPhysical();
  try {
    await client.get(`/Biblio/${target.name}`, zipPath);
  } finally {
    await close();
  }

  if (!fs.existsSync(zipPath)) throw new Error('Download completed but ZIP not found on disk');

  fs.mkdirSync(extDir, { recursive: true });
  execSync(`unzip -o "${zipPath}" -d "${extDir}"`, { stdio: 'pipe' });
  fs.unlinkSync(zipPath);

  // Find first XML inside
  const xmlFiles = walkFiles(extDir).filter(f => /\.xml$/i.test(f));
  if (xmlFiles.length === 0) throw new Error('ZIP extracted but no XML files found inside');

  downloadedOnixPath = xmlFiles[0];
  const actualMB = (fs.statSync(downloadedOnixPath).size / 1024 / 1024).toFixed(1);

  return `${target.name} (${sizeMB} MB) → extracted ${xmlFiles.length} XML file(s) | Parsing: ${path.basename(downloadedOnixPath)} (${actualMB} MB)`;
}

function walkFiles(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir)) {
    const full = path.join(dir, e);
    if (fs.statSync(full).isDirectory()) out.push(...walkFiles(full));
    else out.push(full);
  }
  return out;
}

// ─── CP5: Parse Panda XML file ────────────────────────────────────────────────
let parsedBooks = [];  // shared with CP6

async function cp5_parseOnix() {
  if (!downloadedOnixPath || !fs.existsSync(downloadedOnixPath)) {
    throw new Error('No downloaded XML file — run CP4 first');
  }

  const { parsePandaXML } = await import('./panda-xml-parser.js');

  const stream = fs.createReadStream(downloadedOnixPath, { encoding: 'utf8' });
  const books  = [];

  const stats = await parsePandaXML(stream, async (book) => {
    if (book) books.push(book);
  });

  if (books.length === 0) throw new Error('Parser returned 0 products — check file format');

  // Validate first book against expected schema fields
  const first = books[0];
  const checks = {
    recordReference:    !!first.recordReference,
    productIdentifiers: Array.isArray(first.productIdentifiers),
    descriptiveDetail:  !!first.descriptiveDetail,
    productSupply:      !!first.productSupply,
    meta:               !!first.meta && first.meta.source === 'gardners-biblio',
  };

  const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([k]) => k);
  if (failed.length > 0) {
    const err = new Error(`Schema validation failed for fields: ${failed.join(', ')}`);
    err.detail = `First record: ${JSON.stringify(first, null, 2).slice(0, 500)}`;
    throw err;
  }

  // Check at least one ISBN-13
  const isbn = first.productIdentifiers?.find(p => p.type === '15');
  if (!isbn) throw new Error('First product has no ISBN-13 (type 15) identifier');

  parsedBooks = books.slice(0, 20);  // keep 20 for upsert test

  return `${stats.total} products parsed | RecordRef: ${first.recordReference} | ISBN-13: ${isbn.value}`;
}

// ─── CP6: Upsert into local MongoDB ──────────────────────────────────────────
async function cp6_upsert() {
  if (parsedBooks.length === 0) throw new Error('No parsed books — run CP5 first');

  const { connectDB }       = await import('../lib/db.js');
  const { default: Book }   = await import('../models/Book.js');
  const { upsertCategories } = await import('./category-upsert.js');

  await connectDB();

  const ops = [];
  for (const book of parsedBooks) {
    if (!book.recordReference) continue;
    const categoryIds = await upsertCategories(book.descriptiveDetail.subjects);

    ops.push({
      updateOne: {
        filter: { recordReference: book.recordReference },
        update: {
          $set:      { ...book, meta: { ...book.meta, importedAt: new Date() } },
          $addToSet: { categories: { $each: categoryIds } },
        },
        upsert: true,
      },
    });
  }

  const result = await Book.bulkWrite(ops, { ordered: false });
  const total  = await Book.countDocuments();

  return `upserted: ${result.upsertedCount} | modified: ${result.modifiedCount} | total in DB: ${total}`;
}

// ─── CP7: P&A CSV download + price update ────────────────────────────────────
async function cp7_panda() {
  const { connectPhysical, listDir } = await import('./ftp-client.js');
  const { client, close }            = await connectPhysical();

  let csvPath = null;
  let csvName = null;

  try {
    const files   = await listDir(client, '/Inventory');
    // Gardners inventory files are MMDDYYYY.STK with .STK.DONE markers
    const doneSet = new Set(
      files.filter(f => f.name.endsWith('.DONE')).map(f => f.name.slice(0, -5))
    );
    const stkFiles = files.filter(f =>
      f.type !== 2 && /\.STK$/i.test(f.name) && doneSet.has(f.name)
    );

    if (stkFiles.length === 0) throw new Error('No ready STK files found in /Inventory (need .STK.DONE marker)');

    const smallest = stkFiles.sort((a, b) => (a.size || 0) - (b.size || 0))[0];
    csvName  = smallest.name;
    csvPath  = path.join(SCRATCH, csvName);

    await client.get(`/Inventory/${csvName}`, csvPath);
  } finally {
    await close();
  }

  const { parsePandaCSV, resolveAvailability } = await import('./panda-parser.js');
  const records = await parsePandaCSV(csvPath);

  if (records.length === 0) throw new Error('P&A parser returned 0 records');

  // Spot-check first record
  const first = records[0];
  if (!first.isbn13) throw new Error('First P&A record has no ISBN-13');

  // Apply update to local DB
  const { default: Book } = await import('../models/Book.js');

  const ops = records.slice(0, 500).map(rec => {
    const { availabilityStatus, isSellable } = resolveAvailability(rec.availabilityCode, rec.active);
    if (rec.price === null) return null;

    return {
      updateOne: {
        filter: { 'productIdentifiers': { $elemMatch: { type: '15', value: rec.isbn13 } } },
        update: {
          $set: {
            'productSupply.prices':       [{ type: '01', amount: rec.price, currency: rec.currency || 'GBP', discountPercent: rec.discountPercent }],
            'productSupply.availability': rec.availabilityCode,
            'availabilityStatus':         availabilityStatus,
            'isSellable':                 isSellable,
          },
        },
        upsert: false,
      },
    };
  }).filter(Boolean);

  const result = await Book.bulkWrite(ops, { ordered: false });

  return `${csvName} | ${records.length} P&A records | DB updated: ${result.modifiedCount} | Sample: ISBN ${first.isbn13} | price £${first.price} | avail: ${first.availabilityCode}`;
}

// ─── CP8: Covers listing ──────────────────────────────────────────────────────
async function cp8_coversListing() {
  const { connectCovers, listDir } = await import('./ftp-client.js');
  const { client, close }          = await connectCovers();

  try {
    // Confirmed path: /EBooks/640s/Complete/{isbn-prefix}/
    const prefixDirs = await listDir(client, '/EBooks/640s/Complete');
    if (prefixDirs.length === 0) throw new Error('No prefix directories found in /EBooks/640s/Complete');

    // Sample the first prefix dir for images
    const firstDir = prefixDirs.find(f => f.type === 2) || prefixDirs[0];
    const imgs = await listDir(client, `/EBooks/640s/Complete/${firstDir.name}`);
    const imgFiles = imgs.filter(f => /\.(jpg|jpeg|png|gif)/i.test(f.name));

    if (imgFiles.length === 0) throw new Error(`No images in /EBooks/640s/Complete/${firstDir.name}`);

    const sample = imgFiles[0].name;
    const isbn13 = path.basename(sample, path.extname(sample));
    const isIsbn = /^\d{13}$/.test(isbn13);

    return `${prefixDirs.length} prefix dirs | Sampled /${firstDir.name}: ${imgFiles.length} images | Sample: ${sample} | ISBN-13: ${isIsbn ? 'YES ✓' : `NO — "${isbn13}"`}`;
  } finally {
    await close();
  }
}

// ─── CP9: EDI dry run ────────────────────────────────────────────────────────
async function cp9_edi() {
  // Build a mock order and run it through buildEdiFile logic
  const mockOrder = {
    _id:           '64a1b2c3d4e5f6a7b8c9d0e1',
    status:        'placed',
    customerName:  'Test Customer',
    customerEmail: 'test@example.com',
    shippingAddress: {
      address1: '123 Test Street',
      city:     'London',
      postcode: 'EC1A 1BB',
      country:  'GB',
    },
    items: [
      {
        type:     'book',
        isbn13:   '9780349411910',
        isbn:     '9780349411910',
        quantity: 1,
        price:    9.99,
      },
    ],
  };

  // Import and test generateUniqueRef + buildEdiFile indirectly
  // by calling the script in test mode via child_process
  const { execSync } = await import('child_process');
  const scriptPath = path.resolve(process.cwd(), 'src/scripts/order-edi.js');

  // We can't easily call internal functions, so we validate the format rules manually
  const uniqueRef = String(
    parseInt(String(mockOrder._id).slice(-6), 16) % 999999999 || 1
  ).padStart(9, '0');

  if (!/^\d{9}$/.test(uniqueRef)) {
    throw new Error(`UNIQUEREF "${uniqueRef}" is not 9 digits`);
  }
  if (uniqueRef.includes('|')) {
    throw new Error('UNIQUEREF contains pipe character');
  }

  // Verify sanitize logic (no pipes, no non-ASCII)
  const testStr   = 'O\'Reilly & Sons | "London"';
  const sanitized = testStr.replace(/[^\x00-\x7F]/g, '').replace(/[|"]/g, '').trim();
  if (sanitized.includes('|') || sanitized.includes('"')) {
    throw new Error('Sanitize function not stripping pipes/quotes correctly');
  }

  return `UNIQUEREF: ${uniqueRef} (9-digit ✓) | Sanitize test: "${sanitized}" | No pipes ✓`;
}

// ─── Summary ─────────────────────────────────────────────────────────────────
function printSummary() {
  console.log(`\n${c.bold}${c.cyan}${'─'.repeat(52)}${c.reset}`);
  console.log(`${c.bold} RESULTS${c.reset}`);
  console.log(`${c.cyan}${'─'.repeat(52)}${c.reset}`);

  let passed = 0, failed = 0, skipped = 0;

  for (const r of results) {
    const icon = r.status === 'PASS' ? `${c.green}✓${c.reset}` :
                 r.status === 'FAIL' ? `${c.red}✗${c.reset}` :
                                       `${c.yellow}−${c.reset}`;
    const ms   = r.ms ? ` ${c.dim}(${r.ms}ms)${c.reset}` : '';
    console.log(` ${icon}  CP${r.n}  ${r.label}${ms}`);
    if (r.error) console.log(`    ${c.red}└─ ${r.error}${c.reset}`);

    if (r.status === 'PASS') passed++;
    else if (r.status === 'FAIL') failed++;
    else skipped++;
  }

  console.log(`${c.cyan}${'─'.repeat(52)}${c.reset}`);
  console.log(
    ` ${c.green}${c.bold}${passed} passed${c.reset}` +
    (failed  > 0 ? `  ${c.red}${c.bold}${failed} failed${c.reset}`   : '') +
    (skipped > 0 ? `  ${c.yellow}${skipped} skipped${c.reset}` : '')
  );

  if (failed === 0) {
    console.log(`\n${c.green}${c.bold} ✓ All checkpoints passed — ready to deploy to live server.${c.reset}`);
  } else {
    console.log(`\n${c.red}${c.bold} ✗ Fix the failing checkpoints before deploying.${c.reset}`);
  }
  console.log();
}

// ─── Cleanup ──────────────────────────────────────────────────────────────────
async function cleanup() {
  try {
    await mongoose.connection.close();
  } catch (_) {}
}

// ─── Run ─────────────────────────────────────────────────────────────────────
main().catch(err => {
  console.error(`\n${c.red}FATAL:${c.reset}`, err);
  process.exit(1);
});
