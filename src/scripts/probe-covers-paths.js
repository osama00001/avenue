/**
 * probe-covers-paths.js
 *
 * Find where the cover images actually live on Gardners' covers FTP for
 * the prefixes WE have in our catalogue.
 *
 * The default sync-covers walks /EBooks/640s/Complete which only covers
 * eBook editions. Most of our 1.9M catalog is physical books from academic
 * publishers (Springer, Routledge, etc). Their covers likely live under
 * /Books/640s/Complete/ — but we've never confirmed it.
 *
 * This script:
 *   1. Lists the FTP root to confirm the top-level structure
 *   2. For each candidate path (/Books, /EBooks, with various size variants):
 *      - Attempts to list it and report counts
 *      - Probes our top 5 catalogue prefixes inside each
 *      - Reports which paths actually contain covers for our books
 *
 * Run:
 *   node --env-file=.env.local src/scripts/probe-covers-paths.js
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB }    from '../lib/db.js';
import { connectCovers } from './ftp-client.js';

async function withTimeout(p, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([p, timeout]).finally(() => clearTimeout(timer));
}

async function tryList(client, path) {
  try {
    const entries = await withTimeout(client.list(path), 15000, `list ${path}`);
    return { ok: true, count: entries.length, sample: entries.slice(0, 3).map(e => e.name) };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function run() {
  await connectDB();
  console.log('=== Top 5 catalog prefixes ===');
  const topPrefixes = await mongoose.connection.db.collection('books').aggregate([
    { $match:   { recordReference: { $regex: '^978' } } },
    { $project: { prefix: { $substr: ['$recordReference', 0, 8] } } },
    { $group:   { _id: '$prefix', count: { $sum: 1 } } },
    { $sort:    { count: -1 } },
    { $limit:   5 },
  ]).toArray();
  topPrefixes.forEach(p => console.log(`  ${p._id}  →  ${p.count.toLocaleString()} books`));
  const sample = await mongoose.connection.db.collection('books').findOne(
    { recordReference: { $regex: `^${topPrefixes[0]._id}` } },
    { projection: { recordReference: 1 } }
  );
  console.log(`  Sample full ISBN: ${sample?.recordReference}\n`);

  console.log('=== Connecting to Gardners covers FTP ===');
  const { client, close } = await connectCovers();

  // 1. Root listing
  console.log('\n=== FTP Root ===');
  try {
    const root = await client.list('/');
    root.forEach(e => console.log(`  ${e.isDirectory || e.type === 2 ? 'd' : '-'}  ${e.name}`));
  } catch (err) {
    console.log(`  failed: ${err.message}`);
  }

  // 2. Candidate top-level paths
  const TOP_DIRS = ['/Books', '/EBooks'];
  for (const top of TOP_DIRS) {
    console.log(`\n=== ${top} ===`);
    const r = await tryList(client, top);
    if (!r.ok) { console.log(`  ${r.error}`); continue; }
    console.log(`  ${r.count} entries. Sample: ${r.sample.join(', ')}`);
  }

  // 3. Size variants under /Books
  const SIZE_VARIANTS = ['640s', '160s', '320s', '128s', '90s'];
  for (const top of TOP_DIRS) {
    console.log(`\n=== ${top}/<size> ===`);
    for (const sz of SIZE_VARIANTS) {
      const r = await tryList(client, `${top}/${sz}`);
      console.log(`  ${top}/${sz} → ${r.ok ? `${r.count} entries` : `(missing)  ${r.error}`}`);
    }
  }

  // 4. /Books/640s/Complete
  console.log(`\n=== Probing /Books/640s/Complete/<our-top-prefix> ===`);
  for (const p of topPrefixes) {
    const r = await tryList(client, `/Books/640s/Complete/${p._id}`);
    console.log(`  ${p._id} (${p.count} catalog books) → ${r.ok ? `${r.count} covers, e.g. ${r.sample.join(', ')}` : '(missing)'}`);
  }

  // 5. /EBooks/640s/Complete (control — we know this exists)
  console.log(`\n=== Probing /EBooks/640s/Complete/<our-top-prefix> (control) ===`);
  for (const p of topPrefixes) {
    const r = await tryList(client, `/EBooks/640s/Complete/${p._id}`);
    console.log(`  ${p._id} → ${r.ok ? `${r.count} covers` : '(missing)'}`);
  }

  await close();
  process.exit(0);
}

run().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
