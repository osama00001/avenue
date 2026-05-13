/**
 * sync-avail.js
 * Hourly stock availability update from Gardners /Avail13.
 *
 * /Avail13 contains stock turn data (faster-moving availability updates
 * vs. the full P&A in /Inventory). Same CSV structure — reuses panda-parser.
 *
 * Run manually:
 *   node src/scripts/sync-avail.js
 */

import 'dotenv/config';
import path from 'path';
import fs   from 'fs';
import os   from 'os';
import { connectDB }       from '../lib/db.js';
import Book                from '../models/Book.js';
import { connectPhysical, listDir } from './ftp-client.js';
import { parsePandaCSV, resolveAvailability } from './panda-parser.js';

const AVAIL_DIR   = '/Avail13';
const BATCH_SIZE  = 500;
const SCRATCH_DIR = path.join(os.tmpdir(), 'avenue-avail');

// ---------------------------------------------------------------------------
async function run() {
  fs.mkdirSync(SCRATCH_DIR, { recursive: true });

  console.log('[sync-avail] Connecting to MongoDB...');
  await connectDB();

  const { client, close } = await connectPhysical();

  try {
    const files = await listDir(client, AVAIL_DIR);
    // Avail13 uses same STK format as Inventory, with .DONE markers
    const doneSet = new Set(
      files.filter(f => f.name.endsWith('.DONE')).map(f => f.name.slice(0, -5))
    );
    const csvFiles = files.filter(f =>
      f.type !== 2 && /\.STK$/i.test(f.name) && doneSet.has(f.name)
    );

    console.log(`[sync-avail] Found ${csvFiles.length} file(s) in ${AVAIL_DIR}`);

    let totalUpdated = 0;

    for (const file of csvFiles) {
      const localPath = path.join(SCRATCH_DIR, file.name);
      await client.get(`${AVAIL_DIR}/${file.name}`, localPath);

      const records = await parsePandaCSV(localPath);

      const ops = [];
      for (const rec of records) {
        if (!rec.isbn13 || rec.price === null) continue;

        const { availabilityStatus, isSellable } = resolveAvailability(rec.availabilityCode, rec.active);

        ops.push({
          updateOne: {
            filter: { 'productIdentifiers': { $elemMatch: { type: '15', value: rec.isbn13 } } },
            update: {
              $set: {
                'productSupply.availability': rec.availabilityCode,
                'availabilityCode':           rec.availabilityCode,
                'availabilityStatus':         availabilityStatus,
                'isSellable':                 isSellable,
                'meta.availUpdatedAt':        new Date(),
              },
            },
            upsert: false,
          },
        });

        if (ops.length >= BATCH_SIZE) {
          const r = await Book.bulkWrite(ops.splice(0), { ordered: false });
          totalUpdated += r.modifiedCount || 0;
        }
      }

      if (ops.length > 0) {
        const r = await Book.bulkWrite(ops, { ordered: false });
        totalUpdated += r.modifiedCount || 0;
      }

      fs.unlinkSync(localPath);
   