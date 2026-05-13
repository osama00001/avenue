/**
 * panda-parser.js
 * Gardners STK (Price & Availability) CSV parser.
 *
 * P&A is the authoritative price source — it overrides prices in the ONIX/Panda feed.
 *
 * Actual STK format (confirmed from live /Inventory file 04282026.STK):
 *   Line 1 : HEADER,START   ← file marker, not column headers
 *   Data   : ISBN10, ISBN13, PRICE, DISCOUNT_PCT, STOCK_COUNT, FLAG, [empty]
 *
 *   Col 0 : ISBN-10 / old EAN  (may end in X or Y check digit)
 *   Col 1 : ISBN-13            ← primary identifier
 *   Col 2 : Price (GBP)
 *   Col 3 : Discount %         (0.00 = no discount)
 *   Col 4 : Stock count        (integer; 0 = none)
 *   Col 5 : Flag               (M/D = made-to-demand/POD, POS, GXC, R/P, etc.)
 *
 * Availability is DERIVED from stock count + flag (there is no raw code column):
 *   stock > 0              → '21' in_stock     (sellable)
 *   stock = 0, flag = M/D  → '23' pod          (sellable)
 *   stock = 0, flag = NYP  → '41' preorder     (sellable)
 *   stock = 0, otherwise   → '31' out_of_stock (not sellable)
 *
 * Export:
 *   parsePandaCSV(filePath) → Promise<PandaRecord[]>
 *   resolveAvailability(code, active) → { availabilityStatus, isSellable }
 *
 * Where PandaRecord = {
 *   isbn13:           string,
 *   price:            number | null,
 *   currency:         'GBP',
 *   discountPercent:  number | null,
 *   stockCount:       number,
 *   flag:             string,
 *   availabilityCode: string,   // derived: '21' | '23' | '31' | '41'
 *   active:           boolean,  // derived: true if sellable
 * }
 */

import { createReadStream } from 'fs';
import { createInterface }  from 'readline';

// ---------------------------------------------------------------------------
// Positional column mapping for the headerless STK format — { fieldName: colIndex }
// (matches the shape built by the header-detection path so getCol works for both)
const POSITIONAL_MAP = {
  isbn10:          0,   // ISBN-10 / old EAN  — not used for matching
  isbn13:          1,   // ISBN-13            ← primary key
  price:           2,   // RRP price (GBP)
  discountPercent: 3,   // Discount percentage
  stockCount:      4,   // Units in stock (integer)
  flag:            5,   // Status flag (M/D, POS, GXC, R/P, NYP, …)
};

// Known column header names for files that DO include a header row
const COLUMN_MAP = {
  'isbn10':           'isbn10',
  'isbn':             'isbn13',
  'isbn13':           'isbn13',
  'ean':              'isbn13',
  'price':            'price',
  'rrp':              'price',
  'retailprice':      'price',
  'discount':         'discountPercent',
  'discountpercent':  'discountPercent',
  'discount%':        'discountPercent',
  'stock':            'stockCount',
  'stockcount':       'stockCount',
  'qty':              'stockCount',
  'quantity':         'stockCount',
  'flag':             'flag',
  'status':           'flag',
};

// ---------------------------------------------------------------------------
/**
 * Derive an ONIX-style availability code from the raw STK fields.
 * @param {number} stockCount
 * @param {string} flag
 * @returns {string}  '21' | '23' | '31' | '41'
 */
function deriveAvailCode(stockCount, flag) {
  if (stockCount > 0) return '21';                          // in stock
  const f = (flag || '').trim().toUpperCase();
  if (f === 'M/D' || f === 'POD') return '23';             // made-to-demand / print-on-demand
  if (f === 'NYP' || f === 'TBA') return '41';             // not yet published / preorder
  return '31';                                              // out of stock (default)
}

// ---------------------------------------------------------------------------
/**
 * Parse a Gardners STK P&A CSV file.
 * @param {string} filePath - Absolute path to the downloaded .STK file
 * @returns {Promise<PandaRecord[]>}
 */
export async function parsePandaCSV(filePath) {
  return new Promise((resolve, reject) => {
    const records = [];
    const rl = createInterface({
      input:     createReadStream(filePath, { encoding: 'utf8' }),
      crlfDelay: Infinity,
    });

    let lineNumber    = 0;
    let columnIndices = null;   // set on first line

    rl.on('line', (line) => {
      lineNumber++;
      const trimmed = line.trim();
      if (!trimmed) return;

      const cols = parseCsvLine(trimmed);

      // ── First line: detect column headers or fall back to positional ──
      if (lineNumber === 1) {
        const lowerCols = cols.map(c => c.toLowerCase().replace(/[^a-z0-9%]/g, ''));
        if (lowerCols.some(c => COLUMN_MAP[c])) {
          // File has a recognised header row
          columnIndices = {};
          lowerCols.forEach((c, i) => {
            const field = COLUMN_MAP[c];
            if (field) columnIndices[field] = i;
          });
          return; // skip the header row itself
        }
        // No recognised headers (e.g. "HEADER,START") — use positional mapping
        columnIndices = { ...POSITIONAL_MAP };
        // Fall through: attempt to parse this line as data (will be skipped by
        // the isbn13 length check below if it's a marker row like "HEADER,START")
      }

      // ── Map columns → raw values ──
      const isbn13raw = getCol(cols, columnIndices, 'isbn13');
      if (!isbn13raw || isbn13raw.length < 10) return; // skip marker / malformed rows

      const isbn13 = isbn13raw.replace(/\D/g, '');
      if (isbn13.length !== 13) return; // must be a proper 13-digit EAN

      const priceRaw    = getCol(cols, columnIndices, 'price');
      const discountRaw = getCol(cols, columnIndices, 'discountPercent');
      const stockRaw    = getCol(cols, columnIndices, 'stockCount');
      const flag        = (getCol(cols, columnIndices, 'flag') || '').trim();

      const price          = priceRaw    ? parseFloat(priceRaw)    : null;
      const discountPercent = discountRaw ? parseFloat(discountRaw) : null;
      const stockCount     = stockRaw    ? (parseInt(stockRaw, 10) || 0) : 0;

      const availabilityCode = deriveAvailCode(stockCount, flag);
      const active           = availabilityCode !== '31' && availabilityCode !== '42';

      records.push({
        isbn13,
        price,
        currency:        'GBP',
        discountPercent,
        stockCount,
        flag,
        availabilityCode,
        active,
      });
    });

    rl.on('close', () => resolve(records));
    rl.on('error', reject);
  });
}

// ---------------------------------------------------------------------------
// Map ONIX-style availability code → { availabilityStatus, isSellable }
// Used by sync-inventory.js and sync-avail.js
// ---------------------------------------------------------------------------
const AVAILABILITY_MAP = {
  '20': { status: 'available',     sellable: true  },
  '21': { status: 'in_stock',      sellable: true  },
  '22': { status: 'to_order',      sellable: true  },
  '23': { status: 'pod',           sellable: true  },
  '31': { status: 'out_of_stock',  sellable: false },
  '41': { status: 'preorder',      sellable: true  },
  '42': { status: 'withdrawn',     sellable: false },
  '43': { status: 'cancelled',     sellable: false },
};

export function resolveAvailability(code, active) {
  if (!code) return { availabilityStatus: 'unknown', isSellable: false };
  const mapped = AVAILABILITY_MAP[String(code)];
  if (!mapped) return { availabilityStatus: 'unknown', isSellable: false };
  // If active is explicitly false, override sellable regardless of stock code
  const isSellable = mapped.sellable && (active !== false);
  return { availabilityStatus: mapped.status, isSellable };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getCol(cols, indices, field) {
  const idx = indices[field];
  if (idx === undefined || idx === null) return undefined;
  return cols[idx] !== undefined ? cols[idx] : undefined;
}

/**
 * Parse a single CSV line, respecting quoted fields and escaped double-quotes.
 */
function parseCsvLine(line) {
  const result = [];
  let current  = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}
