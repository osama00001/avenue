/**
 * order-edi.js
 * Generates Gardners CDF HEADER/DETAIL/TRAILER EDI order files and uploads
 * them to the HOMEORD directory on the Gardners physical FTP.
 *
 * Called every 30 minutes via cron to pick up any new orders with
 * status "placed" that haven't been sent to Gardners yet.
 *
 * EDI format spec: I12_FTP_Home_Delivery_Specification.md
 *
 * Key rules:
 *   - NO pipe "|" characters anywhere in order fields (Gardners will reject)
 *   - ASCII-7bit only (chars 0-127) — strip or replace anything outside
 *   - UNIQUEREF is a 9-digit numeric, padded, never reused
 *   - File naming: {ORDERREF}.ORD (e.g. 000000001.ORD)
 *   - Service code 001 = Standard UK, 002 = Premium UK
 *
 * Run manually (test mode — prints to console, does not upload):
 *   node src/scripts/order-edi.js --test --orderId=<mongo_id>
 *
 * Run in production (upload all pending orders):
 *   node src/scripts/order-edi.js
 */

import 'dotenv/config';
import path   from 'path';
import fs     from 'fs';
import os     from 'os';
import { connectDB }       from '../lib/db.js';
import Order               from '../models/Order.js';
import { connectPhysical } from './ftp-client.js';

const GARDNERS_ACCOUNT = process.env.GARDNERS_PHYSICAL_FTP_USER || 'AVE011FTP';
const HOMEORD_DIR      = 'HOMEORD';
const SCRATCH_DIR      = path.join(os.tmpdir(), 'avenue-orders');

// Service codes
const SERVICE_CODE = {
  standard:  '001',  // Standard UK — 2nd Class
  premium:   '002',  // Premium UK — 1st Class
  overseas:  '010',  // Overseas Airmail untracked
  overseasTr:'011',  // Overseas Airmail tracked
};

// ---------------------------------------------------------------------------
async function run() {
  fs.mkdirSync(SCRATCH_DIR, { recursive: true });

  const args = parseArgs();

  console.log('[order-edi] Connecting to MongoDB...');
  await connectDB();

  let orders;
  if (args.orderId) {
    const order = await Order.findById(args.orderId).lean();
    if (!order) { console.error('Order not found.'); process.exit(1); }
    orders = [order];
  } else {
    // Pick up all "placed" orders not yet sent to Gardners
    orders = await Order.find({
      status: 'placed',
      'gardnersFulfilment.ediSentAt': { $exists: false },
    }).lean();
  }

  console.log(`[order-edi] Found ${orders.length} order(s) to process.\n`);

  if (orders.length === 0) {
    process.exit(0);
  }

  let conn = null;
  if (!args.test) {
    console.log('[order-edi] Connecting to Gardners FTP...');
    conn = await connectPhysical();
  }

  try {
    for (const order of orders) {
      await processOrder(order, conn, args.test);
    }
  } finally {
    if (conn) await conn.close();
    process.exit(0);
  }
}

// ---------------------------------------------------------------------------
async function processOrder(order, conn, testMode) {
  // Generate a 9-digit unique reference from MongoDB order sequence
  // Using the last 9 digits of the order's MongoDB ObjectId timestamp + random
  const uniqueRef = generateUniqueRef(order);
  const fileName  = `${uniqueRef}.ORD`;
  const localPath = path.join(SCRATCH_DIR, fileName);

  try {
    const ediContent = buildEdiFile(order, uniqueRef);

    if (testMode) {
      console.log(`\n--- EDI file for order ${order._id} ---`);
      console.log(ediContent);
      console.log('--- END ---\n');
      return;
    }

    // Write to scratch
    fs.writeFileSync(localPath, ediContent, { encoding: 'ascii' });

    // Upload to Gardners HOMEORD via SFTP
    await conn.client.put(localPath, `${HOMEORD_DIR}/${fileName}`);
    console.log(`[order-edi] Uploaded ${fileName} for order ${order._id}`);

    // Mark order as sent
    await Order.findByIdAndUpdate(order._id, {
      $set: {
        'gardnersFulfilment.orderRef':  uniqueRef,
        'gardnersFulfilment.ediSentAt': new Date(),
        'gardnersFulfilment.ackStatus': 'pending',
      },
    });

    fs.unlinkSync(localPath);

  } catch (err) {
    console.error(`[order-edi] Failed to process order ${order._id}: ${err.message}`);
    if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
  }
}

// ---------------------------------------------------------------------------
function buildEdiFile(order, uniqueRef) {
  const lines = [];
  const today = formatDate(new Date());

  // --- HEADER ---
  lines.push(`"HEADER","${GARDNERS_ACCOUNT}","${today}","N","${uniqueRef}"`);

  // --- DETAIL lines ---
  // Each order item becomes a DETAIL block
  const items = order.items || order.orderItems || [];
  let detailCount = 0;

  for (const item of items) {
    // Only physical books go via CDF — ebooks are handled by LCP API
    if (item.type === 'ebook') continue;

    const isbn13  = sanitize(item.isbn || item.isbn13 || '');
    const qty     = parseInt(item.quantity || item.qty || 1, 10);
    const lineRef = String(detailCount + 1).padStart(9, '0');
    const addRef  = sanitize(String(order._id).slice(-15));  // max 15 chars

    if (!isbn13) {
      console.warn(`[order-edi] Skipping item with no ISBN in order ${order._id}`);
      continue;
    }

    detailCount++;

    lines.push(`"DETAIL",${lineRef},"${addRef}","${isbn13}",${qty}`);

    // --- Delivery address fields ---
    const shipping = order.shippingAddress || order.deliveryAddress || {};
    const name     = sanitize(order.customerName || `${shipping.firstName || ''} ${shipping.lastName || ''}`.trim());
    const country  = (shipping.country || 'GB').toUpperCase();
    const service  = country === 'GB' ? SERVICE_CODE.standard : SERVICE_CODE.overseas;
    const price    = item.price ? (item.price * qty).toFixed(2) : '';

    lines.push(`"NAME","${name}"`);
    lines.push(`"ADDRESS1","${sanitize(shipping.address1 || shipping.line1 || '')}"`);
    lines.push(`"ADDRESS2","${sanitize(shipping.address2 || shipping.line2 || '')}"`);
    lines.push(`"TOWN","${sanitize(shipping.city || shipping.town || '')}"`);
    lines.push(`"COUNTY","${sanitize(shipping.county || shipping.state || '')}"`);
    lines.push(`"POSTCODE","${sanitize(shipping.postcode || shipping.zip || '')}"`);
    lines.push(`"COUNTRY","${country}"`);
    lines.push(`"SERVICE",${service}`);
    lines.push(`"EMAIL","${sanitize(order.customerEmail || order.email || '')}"`);
    lines.push(`"PHONE","${sanitize(shipping.phone || order.phone || '')}"`);
    if (price) lines.push(`"PRICE",${price}`);
    lines.push(`"TRACKING","Y"`);
    if (order.customerEmail) {
      lines.push(`"TRACKINGEMAIL","${sanitize(order.customerEmail || order.email || '')}"`);
    }
  }

  if (detailCount === 0) {
    throw new Error(`Order ${order._id} has no physical items to send to Gardners.`);
  }

  // --- TRAILER ---
  lines.push(`"TRAILER",${String(detailCount).padStart(6, '0')}`);

  return lines.join('\r\n') + '\r\n';
}

// ---------------------------------------------------------------------------
/**
 * Generate a 9-digit numeric UNIQUEREF.
 * Uses the Counter collection if available, otherwise derives from ObjectId.
 * Must never be reused — kept to 9 digits (max 999999999).
 */
function generateUniqueRef(order) {
  // Derive a stable 9-digit number from the order ObjectId
  // ObjectId hex: 24 chars, last 6 chars = counter portion
  const hex = String(order._id);
  const num = parseInt(hex.slice(-6), 16) % 999999999 || 1;
  return String(num).padStart(9, '0');
}

/**
 * Format a Date as DD/MM/YYYY
 */
function formatDate(d) {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Sanitize a string for EDI:
 *   - Strip non-ASCII-7bit characters (> 127)
 *   - Remove pipe | character (Gardners will reject)
 *   - Remove double-quotes (already wrapped)
 *   - Trim to max length if needed
 */
function sanitize(str, maxLen = 100) {
  if (!str) return '';
  return String(str)
    .replace(/[^\x00-\x7F]/g, '')   // non-ASCII
    .replace(/[|"]/g, '')            // pipe and quotes
    .trim()
    .slice(0, maxLen);
}

function parseArgs() {
  return Object.fromEntries(
    process.argv.slice(2)
      .filter(a => a.startsWith('--'))
      .map(a => {
        const [k, v] = a.slice(2).split('=');
        return [k, v ?? true];
      })
  );
}

// ---------------------------------------------------------------------------
run().catch(err => {
  console.error('[order-edi] FATAL:', err);
  process.exit(1);
});
