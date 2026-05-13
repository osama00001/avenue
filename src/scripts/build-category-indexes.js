/**
 * build-category-indexes.js — create the production compound indexes
 * that make category queries fast on 1.9M records.
 *
 * Run on production:
 *   node --env-file=.env.local src/scripts/build-category-indexes.js
 */

import 'dotenv/config';
import { connectDB } from '../lib/db.js';
import Book from '../models/Book.js';

const INDEX_SPECS = [
  // 1. Homepage sliders (existing behaviour, keep but rebuild if needed)
  { keys: { isSellable: -1, coverImage: -1, createdAt: -1 }, opts: { background: true, name: 'idx_homepage_sort' } },

  // 2. Category pages — exact-match prefix, then cover/date for top-k sort
  { keys: { isSellable: 1, bicSubjectPrefixes: 1, coverImage: -1, createdAt: -1 }, opts: { background: true, name: 'idx_category_prefix' } },

  // 3. Product-form filtering (paperback / hardback / highlights)
  { keys: { 'descriptiveDetail.productForm': 1, isSellable: -1, coverImage: -1 }, opts: { background: true, name: 'idx_product_form' } },
];

async function run() {
  await connectDB();
  console.log('Creating indexes (background=true, no blocking)...\n');

  for (const { keys, opts } of INDEX_SPECS) {
    const name = opts.name || Object.entries(keys).map(([k, v]) => `${k}_${v}`).join('_');
    try {
      await Book.collection.createIndex(keys, opts);
      console.log(`  ✓ ${name}`);
    } catch (err) {
      if (err.code === 86) {
        console.log(`  ⊘ ${name}  (already exists)`);
      } else if (err.code === 85) {
        console.log(`  ⊘ ${name}  (same keys exist under different name)`);
      } else {
        console.error(`  ✗ ${name}: ${err.message}`);
        throw err;
      }
    }
  }

  console.log('\nDone.');
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
