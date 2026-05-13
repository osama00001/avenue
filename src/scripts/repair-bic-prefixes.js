/**
 * repair-bic-prefixes.js — fix already-migrated books that have
 * numeric sub-level codes (e.g. "1","3") in bicSubjectPrefixes.
 *
 * Re-scans descriptiveDetail.subjects.code, extracts only valid
 * BIC top-level letters (A-Y), and overwrites bicSubjectPrefixes.
 *
 * Run on production:
 *   node --env-file=.env.local src/scripts/repair-bic-prefixes.js
 */

import 'dotenv/config';
import { connectDB } from '../lib/db.js';
import Book from '../models/Book.js';

const BATCH = 5000;

const VALID_BIC_LETTERS = new Set(
  ['A','B','C','D','E','F','G','H','J','K','L','M','P','R','T','U','V','W','Y']
);

function extractValidPrefixes(book) {
  const codes = book?.descriptiveDetail?.subjects?.map(s => s?.code).filter(Boolean);
  if (!codes?.length) return [];
  return [...new Set(
    codes
      .map(c => String(c).charAt(0).toUpperCase())
      .filter(ch => VALID_BIC_LETTERS.has(ch))
  )];
}

async function run() {
  await connectDB();
  console.log('Connected. Scanning for corrupted bicSubjectPrefixes...\n');

  // Scan ALL docs that have bicSubjectPrefixes and re-extract valid letters only
  const cursor = Book.find(
    { bicSubjectPrefixes: { $exists: true } },
    { descriptiveDetail: 1, bicSubjectPrefixes: 1 }
  )
    .lean()
    .cursor({ batchSize: BATCH });

  let ops = [];
  let processed = 0;
  let modified = 0;
  const start = Date.now();

  for await (const book of cursor) {
    const correct = extractValidPrefixes(book);
    const existing = book.bicSubjectPrefixes || [];

    const needsFix =
      correct.length !== existing.length ||
      correct.some((p, i) => p !== existing[i]) ||
      existing.some(p => !VALID_BIC_LETTERS.has(p));

    if (needsFix) {
      ops.push({
        updateOne: {
          filter: { _id: book._id },
          update: { $set: { bicSubjectPrefixes: correct } },
        },
      });
    }

    if (ops.length >= BATCH) {
      const res = await Book.bulkWrite(ops, { ordered: false });
      modified += res.modifiedCount || 0;
      ops = [];
      processed += BATCH;
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      console.log(`  ${processed.toLocaleString()} processed  |  ${modified.toLocaleString()} repaired  |  ${elapsed}s`);
    }
  }

  if (ops.length) {
    const res = await Book.bulkWrite(ops, { ordered: false });
    modified += res.modifiedCount || 0;
    processed += ops.length;
  }

  console.log(`\nDone. ${processed.toLocaleString()} scanned, ${modified.toLocaleString()} repaired in ${((Date.now() - start) / 1000).toFixed(1)}s`);
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
