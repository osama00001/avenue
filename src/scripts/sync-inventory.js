/**
 * sync-inventory.js
 * Orchestrator: FTP /Inventory → P&A CSV parser → MongoDB price/availability update.
 *
 * Runs twice daily (06:00 and 18:00 via Plesk cron).
 * P&A CSV is the authoritative source for prices — it overrides ONIX prices.
 *
 * Run manually:
 *   node src/scripts/sync-inventory.js
 *
 * Run against local test DB:
 *   MONGODB_URI=mongodb://localhost:27017/avenue-test node src/scripts/sync-inventory.js
 */

import 'dotenv/config';
import path  from 'path';
import fs    from 'fs';
import os    from 'os';
import { connectDB }       from '../lib/db.js';
import Book                from '../models/Book.js';
import { connectPhysical, listDir } from './ftp-client.js';
import { parsePandaCSV, resolveAvailability } from './panda-parser.js';

const INVENTORY_DIR = '/Inventory';
const BATCH_SIZE    = 500;
const SCRATCH_DIR   = path.join(os.tmpdir(), 'avenue-inventory');

// ---------------------------------------------------------------------------
async function run() {
  fs.mkdirSync(SCRATCH_DIR, { recursive: true });

  console.log('[sync-inventory] Connecting to MongoDB...');
  await connectDB();
  console.log('[sync-inventory] MongoDB connected.\n');

  console.log('[sync-inventory] Connecting to Gardners physical FTP...');
  const { client, close } = await connectPhysical();

  try {
    console.log(`[sync-inventory] Listing ${INVENTORY_DIR}...`);
    const files = await listDir(client, INVENTORY_DIR);

    // Gardners inventory files are MMDDYYYY.STK (CSV format, different extension)
    // Only process when a corresponding .STK.DONE marker exists
    const doneSet = new Set(
      files
        .filter(f => f.name.endsWith('.DONE'))
        .map(f => f.name.slice(0, -5))   // strip .DONE → e.g. 04282026.STK
    );

    const csvFiles = files.filter(f =>
      f.type !== 2 && /\.STK$/i.test(f.name) && doneSet.has(f.name)
    );
    console.log(`[sync-inventory] Found ${csvFiles.length} ready STK file(s)\n`);

    if (csvFiles.length === 0) {
      console.log('[sync-inventory] No ready STK files found (waiting for .DONE marker). Exiting.');
      return;
    }

    let grandTotal = { updated: 0, notFound: 0, errors: 0 };

    for (const file of csvFiles) {
      const remotePath = `${INVENTORY_DIR}/${file.name}`;
      const localPath  = path.join(SCRATCH_DIR, file.name);

      console.log(`[sync-inventory] Downloading ${file.name}...`);
      await client.get(`${INVENTORY_DIR}/${file.name}`, localPath);

      console.log(`[sync-inventory] Parsing ${file.name}...`);
      const records = await parsePandaCSV(localPath);
      console.log(`[sync-inventory] Parsed ${records.length} records. Updating MongoDB...`);

      const stats = await applyPandaUpdates(records);

      grandTotal.updated  += stats.updated;
      grandTotal.notFound += stats.notFound;
      grandTotal.errors   += stats.errors;

      console.log(`[sync-inventory] ${file.name} → updated: ${stats.updated} | not found: ${stats.notFound} | errors: ${stats.errors}\n`);

      fs.unlinkSync(localPath);
    }

    console.log('='.repeat(60));
    console.log('[sync-inventory] COMPLETE');
    console.log(`  Total updated   : ${grandTotal.updated}`);
    console.log(`  Total not found : ${grandTotal.notFound}`);
    console.log(`  Total errors    : ${grandTotal.errors}`);
    console.log('='.repeat(60));

  } finally {
    await close();
    console.log('[sync-inventory] FTP connection closed.');
    process.exit(0);
  }
}

// ---------------------------------------------------------------------------
async function applyPandaUpdates(records) {
  const stats = { updated: 0, notFound: 0, errors: 0 };

  // Process in batches to avoid overwhelming the DB
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const ops = [];

    for (const rec of batch) {
      const { availabilityStatus, isSellable } = resolveAvailability(rec.availabilityCode, rec.active);

      // Build the price update.
      // We replace the prices array with the P&A authoritative price,
      // preserving the price type rules:
      //   PriceType "01" = RRP (discount may apply)
      //   PriceType "42" = agency (no discount ever)
      const priceEntry = {
        type:            '01',          // P&A price is treated as RRP
        qualifier:       '05',          // consumer
        discountPercent: rec.discountPercent,
        amount:          rec.price,
        currency:        rec.currency || 'GBP',
      };

      if (rec.price === null) continue; // skip records with no price

      ops.push({
        updateOne: {
          filter: {
            'productIdentifiers': {
              $elemMatch: { type: '15', value: rec.isbn13 }
            }
          },
          update: {
            $set: {
              'productSupply.prices':       [priceEntry],
              'productSupply.availability': rec.availabilityCode,
              'availabilityCode':           rec.availabilityCode,
              'availabilityStatus':         availabilityStatus,
              'isSellable':                 isSellable,
              'meta.pandaUpdatedAt':        new Date(),
            },
          },
          upsert: false,  // never create new books from P&A — only update existing
        },
      });
    }

    if (ops.length === 0) continue;

    try {
      const result = await Book.bulkWrite(ops, { ordered: false });
      stats.updated  += result.modifiedCount || 0