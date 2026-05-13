/**
 * ack-reader.js
 * Downloads and parses Gardners ACK files from HOMEACK, updates MongoDB order status.
 *
 * ACK file format (from I12 spec):
 *   "HEADER","ACC123","DD/MM/YYYY","N","SEQREF"
 *   "DETAIL",UNIQUEREF,"ADDLREF","ISBN13",QTY_ORDERED,GARDNERSREF,QTY_SUPPLIED,"REPORT","REPORTDATE"
 *   "TRAILER",
 *
 * Interpretation (GARDNERSREF + QTY_SUPPLIED):
 *   GARDNERSREF > 0 + QTY = ordered  → accepted, fully fulfilled  → status: processing
 *   GARDNERSREF > 0 + QTY < ordered  → accepted, partial          → status: processing (note)
 *   GARDNERSREF > 0 + QTY = 0        → accepted, backordered      → status: processing (backorder)
 *   GARDNERSREF = 0 + QTY = 0        → rejected                   → status: cancelled
 *
 * ACK files follow the .DONE pattern: only collect when {filename}.DONE exists.
 *
 * Run every 30 minutes via cron (after order upload window):
 *   node src/scripts/ack-reader.js
 *
 * Test against a local ACK file:
 *   node src/scripts/ack-reader.js --test --file=./test-data/sample.ACK
 */

import 'dotenv/config';
import path   from 'path';
import fs     from 'fs';
import os     from 'os';
import { createReadStream } from 'fs';
import { createInterface }  from 'readline';
import { connectDB }        from '../lib/db.js';
import Order                from '../models/Order.js';
import { connectPhysical, listDir } from './ftp-client.js';

const HOMEACK_DIR  = 'HOMEACK';
const SCRATCH_DIR  = path.join(os.tmpdir(), 'avenue-acks');

// ---------------------------------------------------------------------------
async function run() {
  fs.mkdirSync(SCRATCH_DIR, { recursive: true });

  const args = parseArgs();

  console.log('[ack-reader] Connecting to MongoDB...');
  await connectDB();

  if (args.test && args.file) {
    console.log(`[ack-reader] Test mode — parsing ${args.file}`);
    const records = await parseAckFile(args.file);
    await applyAckUpdates(records, true);
    process.exit(0);
  }

  console.log('[ack-reader] Connecting to Gardners FTP...');
  const { client, close } = await connectPhysical();

  try {
    const files = await listDir(client, HOMEACK_DIR);

    // Only process ACK files that have a corresponding .DONE file
    const doneFiles = new Set(
      files
        .filter(f => f.name.endsWith('.ACK.DONE'))
        .map(f => f.name.replace('.DONE', ''))
    );

    const ackFiles = files.filter(f =>
      f.name.endsWith('.ACK') && doneFiles.has(f.name)
    );

    console.log(`[ack-reader] Found ${ackFiles.length} ready ACK file(s)`);

    for (const file of ackFiles) {
      const localPath = path.join(SCRATCH_DIR, file.name);
      await client.get(`${HOMEACK_DIR}/${file.name}`, localPath);

      const records = await parseAckFile(localPath);
      const updated = await applyAckUpdates(records);
      console.log(`[ack-reader] ${file.name} → ${records.length} detail lines, ${updated} orders updated`);

      // Clean up from FTP (our responsibility per spec)
      await client.delete(`${HOMEACK_DIR}/${file.name}`);
      await client.delete(`${HOMEACK_DIR}/${file.name}.DONE`);
      fs.unlinkSync(localPath);
    }

    console.log('[ack-reader] Done.');

  } finally {
    await close();
    process.exit(0);
  }
}

// ---------------------------------------------------------------------------
async function parseAckFile(filePath) {
  return new Promise((resolve, reject) => {
    const records = [];
    const rl = createInterface({
      input:     createReadStream(filePath, { encoding: 'ascii' }),
      crlfDelay: Infinity,
    });

    rl.on('line', (line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      const cols = parseCsvLine(trimmed);
      if (!cols[0]) return;

      if (cols[0].toUpperCase() === 'DETAIL') {
        // "DETAIL",UNIQUEREF,"ADDLREF","ISBN13",QTY_ORDERED,GARDNERSREF,QTY_SUPPLIED,"REPORT","REPORTDATE"
        records.push({
          uniqueRef:      cols[1] ? cols[1].trim() : null,
          additionalRef:  cols[2] ? cols[2].trim() : null,
          isbn13:         cols[3] ? cols[3].trim() : null,
          qtyOrdered:     cols[4] ? parseInt(cols[4], 10) : 0,
          gardnersRef:    cols[5] ? cols[5].trim() : '0',
          qtySupplied:    cols[6] ? parseInt(cols[6], 10) : 0,
          report:         cols[7] ? cols[7].trim() : '',
          reportDate:     cols[8] ? cols[8].trim() : '',
        });
      }
    });

    rl.on('close',  () => resolve(records));
    rl.on('error',  reject);
  });
}

// ---------------------------------------------------------------------------
async function applyAckUpdates(records, dryRun = false) {
  let updatedCount = 0;

  for (const rec of records) {
    const gardnersRef  = parseInt(rec.gardnersRef, 10) || 0;
    const qtySupplied  = rec.qtySupplied;
    const qtyOrdered   = rec.qtyOrdered;

    // Determine ack status
    let ackStatus;
    let orderStatus;

    if (gardnersRef === 0) {
      ackStatus   = 'rejected';
      orderStatus = 'cancelled';
    } else if (qtySupplied === 0) {
      ackStatus   = 'backordered';
      orderStatus = 'processing';
    } else if (qtySupplied < qtyOrdered) {
      ackStatus   = 'partial';
      orderStatus = 'processing';
    } else {
      ackStatus   = 'accepted';
      orderStatus = 'processing';
    }

    if (dryRun) {
      console.log(`[ack-reader] DRY RUN — uniqueRef: ${rec.uniqueRef} | gardnersRef: ${gardnersRef} | ackStatus: ${ackStatus} | orderStatus: ${orderStatus}`);
      continue;
    }

    // Find the order by its Gardners uniqueRef (which we stored as gardnersFulfilment.orderRef)
    try {
      const result = await Order.findOneAndUpdate(
        { 'gardnersFulfilment.orderRef': rec.uniqueRef },
        {
          $set: {
            status:                              orderStatus,
            'gardnersFulfilment.gardnersRef':    String(gardnersRef),
            'gardnersFulfilment.ackStatus':      ackStatus,
            'gardnersFulfilment.ackReceivedAt':  new Date(),
          },
        },
        { new: true }
      );

      if (result) {
        updatedCount++;
      } else {
        console.warn(`[ack-reader] No order found for uniqueRef ${rec.uniqueRef}`);
      }
    } catch (err) {
      console.error(`[ack-reader] DB error for uniqueRef ${rec.uniqueRef}: ${err.message}`);
    }
  }

  return updatedCount;
}

// ---------------------------------------------------------------------------
function parseCsvLine(line) {
  const result = [];
  let current  = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function parseArgs() {
  return Object.fromEntries(
    process.argv.slice(2)
      .filter(a => a.startsWith('--'))
      .map(a => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; })
  );
}

// ---------------------------------------------------------------------------
run().catch(err => {
  console.error('[ack-reader] FATAL:', err);
  process.exit(1);
});
