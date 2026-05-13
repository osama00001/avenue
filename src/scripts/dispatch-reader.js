/**
 * dispatch-reader.js
 * Downloads and parses Gardners DISPATCH (.HDD) files from HOMEDISP,
 * adds tracking info to MongoDB orders.
 *
 * Dispatch files have a .DONE marker — only collect when {filename}.HDD.DONE exists.
 *
 * Key fields to extract:
 *   DISPATCHNO   → gardnersFulfilment.dispatchNo
 *   GARDNERSREF  → links back to the order line
 *   ISBN         → confirm which item shipped
 *   QTY          → quantity dispatched
 *   DATE         → dispatch date
 *   DETAIL1-4    → shipping description + tracking number
 *
 * Tracking number is embedded in DETAIL fields — parse for "Tracking Number:" string.
 *
 * Run daily at 23:00 via Plesk cron (Gardners generates dispatch files once daily):
 *   node src/scripts/dispatch-reader.js
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

const HOMEDISP_DIR = 'HOMEDISP';
const SCRATCH_DIR  = path.join(os.tmpdir(), 'avenue-dispatch');

// ---------------------------------------------------------------------------
async function run() {
  fs.mkdirSync(SCRATCH_DIR, { recursive: true });

  console.log('[dispatch-reader] Connecting to MongoDB...');
  await connectDB();

  console.log('[dispatch-reader] Connecting to Gardners FTP...');
  const { client, close } = await connectPhysical();

  try {
    const files = await listDir(client, HOMEDISP_DIR);

    // Only collect .HDD files that have a .HDD.DONE marker
    const doneSet = new Set(
      files
        .filter(f => f.name.endsWith('.HDD.DONE'))
        .map(f => f.name.replace('.DONE', ''))
    );

    const hddFiles = files.filter(f =>
      f.name.endsWith('.HDD') && doneSet.has(f.name)
    );

    console.log(`[dispatch-reader] Found ${hddFiles.length} ready dispatch file(s)`);

    for (const file of hddFiles) {
      const localPath = path.join(SCRATCH_DIR, file.name);
      await client.get(`${HOMEDISP_DIR}/${file.name}`, localPath);

      const records = await parseDispatchFile(localPath);
      const updated = await applyDispatchUpdates(records);

      console.log(`[dispatch-reader] ${file.name} → ${records.length} records, ${updated} orders updated`);

      // Clean up from FTP
      await client.delete(`${HOMEDISP_DIR}/${file.name}`);
      await client.delete(`${HOMEDISP_DIR}/${file.name}.DONE`);
      fs.unlinkSync(localPath);
    }

    console.log('[dispatch-reader] Done.');

  } finally {
    await close();
    process.exit(0);
  }
}

// ---------------------------------------------------------------------------
/**
 * Parse a .HDD dispatch file.
 * HDD files are typically fixed-width or delimited — structure varies.
 * We parse them as CSV-like, extracting known field labels.
 */
async function parseDispatchFile(filePath) {
  return new Promise((resolve, reject) => {
    const records   = [];
    let currentRec  = null;

    const rl = createInterface({
      input:     createReadStream(filePath, { encoding: 'ascii' }),
      crlfDelay: Infinity,
    });

    rl.on('line', (line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      const cols = parseCsvLine(trimmed);
      const tag  = (cols[0] || '').toUpperCase().trim();

      switch (tag) {
        case 'DETAIL': {
          // Save previous record if any
          if (currentRec) records.push(currentRec);

          // DETAIL line: DETAIL, DISPATCHNO, GARDNERSREF, ISBN, QTY, DATE, DETAIL1, DETAIL2, DETAIL3, DETAIL4
          currentRec = {
            dispatchNo:  cols[1]  ? cols[1].trim()  : null,
            gardnersRef: cols[2]  ? cols[2].trim()  : null,
            isbn:        cols[3]  ? cols[3].trim()  : null,
            qty:         cols[4]  ? parseInt(cols[4], 10) : 0,
            date:        cols[5]  ? parseDispatchDate(cols[5].trim()) : null,
            detail1:     cols[6]  ? cols[6].trim()  : '',
            detail2:     cols[7]  ? cols[7].trim()  : '',
            detail3:     cols[8]  ? cols[8].trim()  : '',
            detail4:     cols[9]  ? cols[9].trim()  : '',
            trackingNumber: null,
            carrier:     null,
          };

          // Extract tracking number from DETAIL fields
          const allDetails = [currentRec.detail1, currentRec.detail2, currentRec.detail3, currentRec.detail4].join(' ');
          currentRec.trackingNumber = extractTrackingNumber(allDetails);
          currentRec.carrier        = extractCarrier(allDetails);
          break;
        }

        case 'TRAILER':
          if (currentRec) {
            records.push(currentRec);
            currentRec = null;
          }
          break;
      }
    });

    rl.on('close', () => {
      if (currentRec) records.push(currentRec);
      resolve(records);
    });
    rl.on('error', reject);
  });
}

// ---------------------------------------------------------------------------
async function applyDispatchUpdates(records) {
  let updatedCount = 0;

  for (const rec of records) {
    if (!rec.gardnersRef) continue;

    try {
      const result = await Order.findOneAndUpdate(
        { 'gardnersFulfilment.gardnersRef': rec.gardnersRef },
        {
          $set: {
            status:                                 'dispatched',
            'gardnersFulfilment.dispatchNo':        rec.dispatchNo,
            'gardnersFulfilment.trackingNumber':    rec.trackingNumber,
            'gardnersFulfilment.carrier':           rec.carrier,
            'gardnersFulfilment.dispatchDate':      rec.date,
            'gardnersFulfilment.dispatchReceivedAt': new Date(),
          },
        },
        { new: true }
      );

      if (result) {
        updatedCount++;
        // TODO: trigger customer notification email here
        // e.g. await sendDispatchEmail(result);
      }
    } catch (err) {
      console.error(`[dispatch-reader] DB error for gardnersRef ${rec.gardnersRef}: ${err.message}`);
    }
  }

  return updatedCount;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Try to extract a tracking number from the DETAIL text fields.
 * Gardners embeds it in various formats depending on carrier.
 */
function extractTrackingNumber(detailText) {
  if (!detailText) return null;

  // Common patterns: "Tracking Number: JD000123456", "Track: 1Z999AA1012345678"
  const patterns = [
    /tracking\s*(?:number|no|#)[:\s]+([A-Z0-9]+)/i,
    /track[:\s]+([A-Z0-9]{8,30})/i,
    /\b(JD[0-9]{18})\b/,          // Royal Mail Tracked
    /\b(1Z[A-Z0-9]{16})\b/,        // UPS
    /\b([0-9]{12,20})\b/,           // Generic numeric tracking
  ];

  for (const pattern of patterns) {
    const match = detailText.match(pattern);
    if (match) return match[1];
  }

  return null;
}

function extractCarrier(detailText) {
  if (!detailText) return null;
  const lower = detailText.toLowerCase();
  if (lower.includes('royal mail'))  return 'Royal Mail';
  if (lower.includes('parcelforce')) return 'Parcelforce';
  if (lower.includes('hermes') || lower.includes('evri')) return 'Evri';
  if (lower.includes('dpd'))         return 'DPD';
  if (lower.includes('ups'))         return 'UPS';
  if (lower.includes('fedex'))       return 'FedEx';
  if (lower.includes('dhl'))         return 'DHL';
  return null;
}

/**
 * Parse DD/MM/YYYY dispatch date string to a JS Date.
 */
function parseDispatchDate(str) {
  if (!str) return null;
  const [dd, mm, yyyy] = str.split('/');
  if (!dd || !mm || !yyyy) return null;
  return new Date(`${yyyy}-${mm}-${dd}T12:00:00Z`);
}

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

// ---------------------------------------------------------------------------
run().catch(err => {
  console.error('[dispatch-reader] FATAL:', err);
  process.exit(1);
});
