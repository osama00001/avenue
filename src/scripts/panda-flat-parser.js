/**
 * panda-flat-parser.js
 * Gardners "Panda" flat-file (key-value) format → Book schema mapper.
 *
 * GARDBIB.zip from /Biblio extracts to a single .TXT file in this format:
 *
 *   **START          ← file-start marker
 *   IB 1SINQHCGO     ← tag (2 chars) + space + value
 *   AV TOS
 *   BI General merchandise
 *   PD 20200804
 *   RP 12.00
 *   TI Roald Dahl - James and the Giant Peach 100 Piece Jigsaw Puzzle
 *   EA 5055923785560
 *   I3 5055923785560
 *   **               ← end-of-record marker
 *   IB 1SINQHCH5     ← next record…
 *   …
 *
 * Encoding: UTF-8.  Line endings: CRLF (handled transparently by readline).
 *
 * Tag vocabulary is identical to the compact XML used by WeeklyExtract.zip,
 * so the buildBook() output matches `panda-xml-parser.js` field-for-field.
 *
 * Repeated tags (AU, ED, BC) accumulate into arrays — multiple authors are
 * represented as multiple AU lines within a record, with no nesting markers.
 *
 * Exports:
 *   parsePandaFlat(readableStream, onBook) → Promise<{total: number}>
 *
 * CLI test mode:
 *   node src/scripts/panda-flat-parser.js --file=./GARDBIB.TXT --limit=3
 */

import { createInterface } from 'readline';

// ---------------------------------------------------------------------------
// Vocabulary — kept in sync with panda-xml-parser.js
const AV_MAP = {
  'IP':  { code: '21', status: 'in_stock',     sellable: true  },
  'MD':  { code: '23', status: 'pod',           sellable: true  },
  'OP':  { code: '42', status: 'withdrawn',     sellable: false },
  'TBA': { code: '41', status: 'preorder',      sellable: true  },
  'NYP': { code: '41', status: 'preorder',      sellable: true  },
  'NA':  { code: '31', status: 'out_of_stock',  sellable: false },
  'NP':  { code: '31', status: 'out_of_stock',  sellable: false },
  'WD':  { code: '42', status: 'withdrawn',     sellable: false },
  'TOS': { code: '31', status: 'out_of_stock',  sellable: false }, // title out of stock
  'GXC': { code: '42', status: 'withdrawn',     sellable: false }, // gone, no replacement
  'POS': { code: '31', status: 'out_of_stock',  sellable: false },
};

const BINDING_MAP = {
  'paperback':             'BC',
  'paperback / softback':  'BC',
  'softback':              'BC',
  'hardback':              'BB',
  'hardcover':             'BB',
  'board book':            'BH',
  'spiral bound':          'BE',
  'audio cd':              'AC',
  'cd-rom':                'PC',
  'dvd':                   'VI',
  'ebook':                 'ED',
  'e-book':                'ED',
  'general merchandise':   'ZZ',
};

const LANG_MAP = {
  'english': 'eng', 'french': 'fre',  'german': 'ger',
  'spanish': 'spa', 'italian': 'ita', 'dutch':  'dut',
  'portuguese': 'por', 'welsh': 'wel', 'latin': 'lat',
  'greek': 'gre',   'russian': 'rus', 'chinese': 'chi',
  'japanese': 'jpn', 'arabic': 'ara', 'hebrew': 'heb',
  'swedish': 'swe',  'norwegian': 'nor', 'danish': 'dan',
  'finnish': 'fin',  'polish': 'pol',   'czech': 'cze',
  'hungarian': 'hun', 'turkish': 'tur', 'korean': 'kor',
};

// Section markers we just ignore (they exist in XML, may or may not in flat)
const SECTION_TAGS = new Set(['AUS', 'BCS', 'EDS']);

// ---------------------------------------------------------------------------
/**
 * Parse a Gardners Panda flat-file stream.
 *
 * Streaming, line-by-line. Each record is dispatched to onBook as soon as
 * its terminator (`**`) is seen — no full-file buffering.
 *
 * @param {import('stream').Readable} stream
 * @param {(book: object) => Promise<void>} onBook
 * @returns {Promise<{total: number}>}
 */
export async function parsePandaFlat(stream, onBook) {
  const rl = createInterface({ input: stream, crlfDelay: Infinity });

  let total      = 0;
  let currentRec = null;

  for await (const rawLine of rl) {
    // CRLF is already stripped by readline; just defensively trim trailing CR
    const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;

    if (!line) continue;

    // File-start marker
    if (line === '**START') continue;

    // End-of-record marker
    if (line === '**') {
      if (currentRec) {
        const book = buildBook(currentRec);
        if (book) await onBook(book);
        total++;
      }
      currentRec = null;
      continue;
    }

    // Tag-prefixed line: "XX value"  (XX is 2 chars, then space)
    if (line.length < 2) continue;
    const tag   = line.substring(0, 2);
    const value = line.length > 3 ? line.substring(3) : '';

    // Section markers (no value) — ignore
    if (SECTION_TAGS.has(line) || SECTION_TAGS.has(tag.length === 3 ? line : '')) continue;

    if (!currentRec) currentRec = emptyRecord();

    switch (tag) {
      case 'EA':  currentRec.ean        = value; break;
      case 'I3':  currentRec.isbn13     = value; break;
      case 'IB':  currentRec.internalId = value; break;
      case 'TP':  currentRec.prefix     = value; break;
      case 'TI':  currentRec.title      = value; break;
      case 'ST':  currentRec.subtitle   = value; break;
      case 'SR':  currentRec.series     = value; break;
      case 'AV':  currentRec.avail      = value; break;
      case 'BI':  currentRec.binding    = value; break;
      case 'LA':  currentRec.language   = value; break;
      case 'PD':  currentRec.pubDate    = value; break;
      case 'RP':  currentRec.rrp        = parseFloat(value) || null; break;
      case 'PU':  currentRec.publisher  = value; break;
      case 'YP':  currentRec.year       = value; break;
      case 'NP':  currentRec.pages      = parseInt(value, 10) || null; break;
      case 'WE':  currentRec.weight     = parseInt(value, 10) || null; break;
      case 'DI':  currentRec.dimensions = value; break;
      case 'CO':  currentRec.country    = value; break;
      case 'DE':  currentRec.description = value; break;
      case 'MP':  currentRec.mixedPack  = value.toLowerCase() === 'yes'; break;

      case 'AU':  if (value) currentRec.authors.push(value);  break;
      case 'ED':  if (value) currentRec.editors.push(value);  break;
      case 'BC':  if (value) currentRec.bicCodes.push(value); break;

      default: /* unknown tag — silently ignored */ break;
    }
  }

  // Defensive: dispatch a trailing record if file doesn't end with '**'
  if (currentRec) {
    const book = buildBook(currentRec);
    if (book) await onBook(book);
    total++;
  }

  return { total };
}

// ---------------------------------------------------------------------------
// buildBook — identical output shape to panda-xml-parser.js so the rest of
// the pipeline (category-upsert, Book.bulkWrite, etc.) doesn't care which
// parser produced the record.
// ---------------------------------------------------------------------------
function buildBook(rec) {
  const isbn13 = rec.isbn13 || rec.ean || null;
  if (!isbn13) return null;

  const avKey   = (rec.avail || '').toUpperCase();
  const avEntry = AV_MAP[avKey] || { code: '31', status: 'unknown', sellable: false };

  const bindKey     = (rec.binding || '').toLowerCase();
  const productForm = BINDING_MAP[bindKey] || 'ZZ';

  const langKey  = (rec.language || '').toLowerCase();
  const langCode = LANG_MAP[langKey] || null;

  const fullTitle = rec.prefix
    ? `${rec.prefix} ${rec.title || ''}`
    : (rec.title || null);

  const contributors = [
    ...rec.authors.map((name, i) => ({ sequence: String(i + 1), role: 'A01', nameInverted: name })),
    ...rec.editors.map((name, i) => ({ sequence: String(rec.authors.length + i + 1), role: 'B01', nameInverted: name })),
  ];

  return {
    recordReference:  isbn13,
    notificationType: '03',
    productIdentifiers: [{ type: '15', value: isbn13 }],
    descriptiveDetail: {
      productComposition: '00',
      productForm,
      productFormDetail:  null,
      epubTechnicalProtection: null,
      titles: [{ titleType: '01', level: '01', text: fullTitle, subtitle: rec.subtitle || null }],
      contributors,
      languages: langCode ? [{ role: '01', code: langCode }] : [],
      extents:   rec.pages ? [{ type: '00', value: String(rec.pages), unit: '03' }] : [],
      subjects:  rec.bicCodes.map(code => ({ scheme: '12', code, headingText: null })),
    },
    collateralDetail: {
      textContents: rec.description ? [{
        textType: '01', format: '02', audience: null, text: rec.description,
      }] : [],
    },
    publishingDetail: {
      imprint:          { name: rec.publisher || null },
      publisher:        { role: '01', name: rec.publisher || null },
      publishingStatus: '04',
      publishingDate:   rec.pubDate || null,
      salesRights:      [],
    },
    productSupply: {
      supplier:     { role: '01', name: 'Gardners' },
      availability: avEntry.code,
      prices: rec.rrp != null ? [{
        type: '01', qualifier: '05', discountPercent: null,
        amount: rec.rrp, currency: 'GBP',
      }] : [],
    },
    availabilityCode:   avEntry.code,
    availabilityStatus: avEntry.status,
    isSellable:         avEntry.sellable,
    coverImage:         null,
    meta: {
      source:           'gardners-biblio-flat',
      gardnersInternal: rec.internalId || null,
      importedAt:       new Date(),
    },
  };
}

// ---------------------------------------------------------------------------
function emptyRecord() {
  return {
    ean: null, isbn13: null, internalId: null, prefix: null, title: null,
    subtitle: null, series: null, avail: null, binding: null, language: null,
    pubDate: null, rrp: null, publisher: null, year: null, pages: null,
    weight: null, dimensions: null, country: null, description: null,
    mixedPack: false, authors: [], editors: [], bicCodes: [],
  };
}

// ---------------------------------------------------------------------------
// CLI test mode
if (process.argv[1] && process.argv[1].endsWith('panda-flat-parser.js')) {
  const { createReadStream } = await import('fs');
  const args = Object.fromEntries(
    process.argv.slice(2).filter(a => a.startsWith('--'))
      .map(a => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; })
  );
  if (!args.file) {
    console.error('Usage: node src/scripts/panda-flat-parser.js --file=./GARDBIB.TXT [--limit=3]');
    process.exit(1);
  }
  const limit = args.limit ? parseInt(args.limit, 10) : Infinity;
  let count = 0;
  const stream = createReadStream(args.file, { encoding: 'utf8' });
  parsePandaFlat(stream, async (book) => {
    if (count < limit) {
      console.log(`\n--- Book ${count + 1} ---`);
      console.log(JSON.stringify(book, null, 2));
    }
    count++;
  }).then(stats => {
    console.log(`\nParsed ${stats.total.toLocaleString()} records total, ${count.toLocaleString()} with valid ISBN-13.`);
  }).catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
}
