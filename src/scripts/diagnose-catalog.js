/**
 * diagnose-catalog.js
 *
 * One-shot diagnostic to figure out where covers should come from given the
 * actual contents of the catalog DB.
 *
 * Run:
 *   node --env-file=.env.local src/scripts/diagnose-catalog.js
 */

import 'dotenv/config';
import path from 'path';
import fs   from 'fs';
import { connectDB } from '../lib/db.js';
import mongoose from 'mongoose';

const COVERS_DIR = path.resolve(process.cwd(), 'public', 'covers');

async function run() {
  await connectDB();
  const db = mongoose.connection.db;

  console.log('=== CATALOG COMPOSITION ===');
  const total  = await db.collection('books').countDocuments();
  const c978   = await db.collection('books').countDocuments({ recordReference: { $regex: '^978' } });
  const c505   = await db.collection('books').countDocuments({ recordReference: { $regex: '^505' } });
  const c506   = await db.collection('books').countDocuments({ recordReference: { $regex: '^506' } });
  const cOther = total - c978 - c505 - c506;
  console.log(`  total           : ${total.toLocaleString()}`);
  console.log(`  books (978...)  : ${c978.toLocaleString()} (${((c978 / total) * 100).toFixed(1)}%)`);
  console.log(`  merchandise 505 : ${c505.toLocaleString()}`);
  console.log(`  merchandise 506 : ${c506.toLocaleString()}`);
  console.log(`  other           : ${cOther.toLocaleString()}`);

  console.log('\n=== TOP 20 PUBLISHER PREFIXES (8-digit) IN OUR CATALOG ===');
  const top = await db.collection('books').aggregate([
    { $match: { recordReference: { $regex: '^978' } } },
    { $project: { prefix: { $substr: ['$recordReference', 0, 8] } } },
    { $group:   { _id: '$prefix', count: { $sum: 1 } } },
    { $sort:    { count: -1 } },
    { $limit:   20 },
  ]).toArray();
  top.forEach(t => console.log(`  ${t._id}  →  ${t.count.toLocaleString()} books`));

  console.log('\n=== RANDOM REAL BOOK SAMPLE ===');
  const real = await db.collection('books').findOne(
    { recordReference: { $regex: '^978' } },
    { projection: { recordReference: 1, 'descriptiveDetail.titles': 1 } }
  );
  if (real) {
    console.log(`  ISBN  : ${real.recordReference}`);
    console.log(`  Title : ${real.descriptiveDetail?.titles?.[0]?.text}`);
    const cp = path.join(COVERS_DIR, `${real.recordReference}.jpg`);
    console.log(`  Cover on disk? ${fs.existsSync(cp)}`);
  } else {
    console.log('  (none found)');
  }

  console.log('\n=== COVER FILE OVERLAP CHECK ===');
  if (!fs.existsSync(COVERS_DIR)) {
    console.log('  No covers directory.');
    process.exit(0);
  }
  const coverFiles = fs.readdirSync(COVERS_DIR);
  const coverIsbns = new Set(coverFiles.map(f => path.basename(f, path.extname(f))));
  console.log(`  Covers on disk    : ${coverIsbns.size.toLocaleString()}`);

  // Sample 1000 books from the 978 set, count overlap
  const samples = await db.collection('books').find(
    { recordReference: { $regex: '^978' } },
    { projection: { recordReference: 1 } }
  ).limit(1000).toArray();
  let overlap = 0;
  for (const s of samples) {
    if (coverIsbns.has(s.recordReference)) overlap++;
  }
  console.log(`  1000 random books, ${overlap} have a cover already downloaded`);

  // Now distribution: which 8-digit prefixes do the on-disk covers belong to?
  console.log('\n=== TOP 20 PREFIXES IN ON-DISK COVERS ===');
  const coverPrefixCounts = {};
  for (const isbn of coverIsbns) {
    if (!/^\d{13}$/.test(isbn)) continue;
    const p = isbn.slice(0, 8);
    coverPrefixCounts[p] = (coverPrefixCounts[p] || 0) + 1;
  }
  Object.entries(coverPrefixCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .forEach(([p, c]) => console.log(`  ${p}  →  ${c.toLocaleString()} covers`));

  process.exit(0);
}

run().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
