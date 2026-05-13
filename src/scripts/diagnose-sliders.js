/**
 * diagnose-sliders.js — confirms Mongo can answer every homepage section.
 *
 * If "No books found" is showing for sections that should be huge (e.g.
 * bestsellers, popular, paperback) this script reveals whether it's:
 *   (a) Mongo simply has no matching docs for the filter
 *   (b) the API is failing silently
 *   (c) the frontend isn't receiving data
 *
 * Run:
 *   node --env-file=.env.local src/scripts/diagnose-sliders.js
 */

import 'dotenv/config';
import { connectDB } from '../lib/db.js';
import Book          from '../models/Book.js';

const SECTIONS = {
  "(no filter)":       {},
  "isSellable=true":   { isSellable: true },
  "isSellable=false":  { isSellable: false },
  "has coverImage":    { coverImage: { $ne: null, $exists: true } },
  "fiction (^F)":      { "descriptiveDetail.subjects.code": { $regex: "^F" } },
  "children (^Y)":     { "descriptiveDetail.subjects.code": { $regex: "^Y" } },
  "games (^W)":        { "descriptiveDetail.subjects.code": { $regex: "^W" } },
  "non_fiction":       { "descriptiveDetail.subjects.code": { $exists: true, $not: { $regex: "^[FY]" } } },
  "paperback (BC)":    { "descriptiveDetail.productForm": "BC" },
  "hardback (BB)":     { "descriptiveDetail.productForm": "BB" },
  "any subjects":      { "descriptiveDetail.subjects.0": { $exists: true } },
  "no subjects":       { "descriptiveDetail.subjects": { $size: 0 } },
};

async function run() {
  await connectDB();
  const total = await Book.estimatedDocumentCount();
  console.log(`\n=== Total books: ${total.toLocaleString()} ===\n`);

  for (const [label, filter] of Object.entries(SECTIONS)) {
    const c = await Book.countDocuments(filter);
    const pct = ((c / total) * 100).toFixed(1);
    console.log(`  ${label.padEnd(24)}  ${c.toString().padStart(10)}  (${pct}%)`);
  }

  console.log('\n=== Random sellable book ===');
  const sample = await Book.findOne({ isSellable: true }, { recordReference: 1, isSellable: 1, coverImage: 1, "descriptiveDetail.titles": 1, "descriptiveDetail.subjects": 1 }).lean();
  console.log(JSON.stringify(sample, null, 2)?.slice(0, 800));

  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
