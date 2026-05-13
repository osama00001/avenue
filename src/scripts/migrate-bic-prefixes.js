/**
 * migrate-bic-prefixes.js — back-fill bicSubjectPrefixes on every book.
 *
 * Scans all 1.9M docs in batches, extracts the first character of every
 * descriptiveDetail.subjects.code, deduplicates, and writes a single
 * bulkWrite per batch.  Uses cursor so memory stays flat.
 *
 * Run on production:
 *   node --env-file=.env.local src/scripts/migrate-bic-prefixes.js
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../lib/db.js';
import Book from '../models/Book.js';

const BATCH = 5000;

const VALID_BIC_LETTERS = new Set(
  ['A','B','C','D','E','F','G','H','J','K','L','M','P','R','T','U','V','W','Y']
);

function extractPrefixes(book) {
  const codes = book?.descriptiveDetail?.subjects?.map(s => s?.code).filter(Boolean);
  if (!codes?.length) return [];
  // First character of each code, upper-cased, keep only valid BIC top-level letters
  const prefixes = [...new Set(
    codes
      .map(c => String(c).charAt(0).toUpperCase())
      .filter(ch => VALID_BIC_LETTERS.has(ch))
  )];
  return prefixes;
}

async function run() {
  await connectDB();
  await mongoose.connection.asPromise();

  const totalDocs = await Book.countDocuments();
  console.log(`Connected. Total books in DB: ${totalDocs.toLocaleString()}`);
  console.log('Processing in batches...\n');

  let processed = 0;
  let modified = 0;
  let skip = 0;
  const start = Date.now();

  while (true) {
    const batch = await Book.find({}, { descriptiveDetail: 1 })
      .skip(skip)
      .limit(BATCH)
      .lean();

    if (batch.length === 0) break;

    // Always write bicSubjectPrefixes (even if empty) — this ensures field exists
    const ops = batch.map(book => ({
      updateOne: {
        filter: { _id: book._id },
        update: { $set: { bicSubjectPrefixes: extractPrefixes(book) } },
      },
    }));

    const res = await Book.bulkWrite(ops, { ordered: false });
    modified += res.modifiedCount || 0;
    processed += batch.length;
    skip += BATCH;

    if (processed % 50000 === 0 || batch.length < BATCH) {
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      console.log(`  ${processed.toLocaleString()} processed  |  ${modified.toLocaleString()} updated  |  ${elapsed}s`);
    }

    if (batch.length < BATCH) break;
  }

  console.log(`\nDone. ${processed.toLocaleString()} scanned, ${modified.toLocaleString()} updated in ${((Date.now() - start) / 1000).toFixed(1)}s`);
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
