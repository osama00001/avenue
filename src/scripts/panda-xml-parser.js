/**
 * panda-xml-parser.js
 * Gardners compact "Panda" XML format → Book schema mapper.
 *
 * Gardners /Biblio delivers ZIP files containing a proprietary compact XML
 * format (NOT standard ONIX 3.0/3.1). This parser handles that format.
 *
 * Each <Record> element maps to one book. Short element names used:
 *   <EA>  EAN/ISBN-13        <I3>  ISBN-13
 *   <TP>  Title prefix       <TI>  Title          <ST>  Subtitle
 *   <SR>  Series             <AUS><AU> Author(s)  <EDS><ED> Editor(s)
 *   <AV>  Availability       <BI>  Binding/format
 *   <LA>  Language           <PD>  Pub date (YYYYMMDD)
 *   <RP>  RRP price (GBP)    <PU>  Publisher      <YP>  Year
 *   <NP>  Page count         <WE>  Weight (g)     <DI>  Dimensions
 *   <BCS><BC> BIC codes      <DE>  Description    <CO>  Country
 *
 * Architecture: SAX parse is 100% synchronous (raw records collected into an
 * array), then onBook is called asynchronously for each record after streaming
 * completes. This avoids the silent-error problem with async SAX handlers.
 *
 * Exports:
 *   parsePandaXML(readableStream, onBook) → Promise<{total: number}>
 *
 * CLI test mode:
 *   node src/scripts/panda-xml-parser.js --file=./file.xml --limit=3
 */

import { SaxesParser } from 'saxes';

// ---------------------------------------------------------------------------
// Availability: Gardners AV code → internal availability fields
const AV_MAP = {
  'IP':  { code: '21', status: 'in_stock',     sellable: true  },
  'MD':  { code: '23', status: 'pod',           sellable: true  },
  'OP':  { code: '42', status: 'withdrawn',     sellable: false },
  'TBA': { code: '41', status: 'preorder',      sellable: true  },
  'NYP': { code: '41', status: 'preorder',      sellable: true  },
  'NA':  { code: '31', status: 'out_of_stock',  sellable: false },
  'NP':  { code: '31', status: 'out_of_stock',  sellable: false },
  'WD':  { code: '42', status: 'withdrawn',     sellable: false },
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

// ---------------------------------------------------------------------------
/**
 * Parse a Gardners Panda XML stream.
 *
 * Phase 1 — synchronous SAX parse: raw records are collected into an array.
 * Phase 2 — async dispatch: onBook is awaited for each built Book object.
 *
 * @param {import('stream').Readable} stream
 * @param {(book: object) => Promise<void>} onBook
 * @returns {Promise<{total: number}>}
 */
export async function parsePandaXML(stream, onBook) {
  // ── Phase 1: synchronous SAX → raw record objects ────────────────────────
  const rawRecords = await new Promise((resolve, reject) => {
    const parser  = new SaxesParser({ xmlns: false });
    const records = [];

    let inRecord    = false;
    let currentRec  = null;
    let currentText = '';
    let inAUS = false;
    let inBCS = false;
    let inEDS = false;

    // saxes v6 uses EventEmitter API: parser.on('opentag', fn)
    parser.on('opentag', (tag) => {
      const name = typeof tag === 'string' ? tag : tag.name;
      currentText = '';

      if (!inRecord && name === 'Record') {
        inRecord   = true;
        currentRec = emptyRecord();
        return;
      }
      if (!inRecord) return;

      if (name === 'AUS') { inAUS = true;  return; }
      if (name === 'BCS') { inBCS = true;  return; }
      if (name === 'EDS') { inEDS = true;  return; }
    });

    parser.on('text',  (t) => { currentText += t; });
    parser.on('cdata', (t) => { currentText += t; });

    // SYNCHRONOUS — no async/await here
    parser.on('closetag', (tag) => {
      const name = typeof tag === 'string' ? tag : tag.name;
      const text = currentText.trim();
      currentText = '';

      if (name === 'AUS') { inAUS = false; return; }
      if (name === 'BCS') { inBCS = false; return; }
      if (name === 'EDS') { inEDS = false; return; }

      if (!inRecord) return;

      switch (name) {
        case 'Record':
          inRecord = false;
          records.push(currentRec);
          currentRec = null;
          break;

        case 'EA':  currentRec.ean       = text; break;
        case 'I3':  currentRec.isbn13    = text; break;
        case 'TP':  currentRec.prefix    = text; break;
        case 'TI':  currentRec.title     = text; break;
        case 'ST':  currentRec.subtitle  = text; break;
        case 'SR':  currentRec.series    = text; break;
        case 'AV':  currentRec.avail     = text; break;
        case 'BI':  currentRec.binding   = text; break;
        case 'LA':  currentRec.language  = text; break;
        case 'PD':  currentRec.pubDate   = text; break;
        case 'RP':  currentRec.rrp       = parseFloat(text) || null; break;
        case 'PU':  currentRec.publisher = text; break;
        case 'YP':  currentRec.year      = text; break;
        case 'NP':  currentRec.pages     = parseInt(text, 10) || null; break;
        case 'WE':  currentRec.weight    = parseInt(text, 10) || null; break;
        case 'DI':  currentRec.dimensions = text; break;
        case 'CO':  currentRec.country   = text; break;
        case 'DE':  currentRec.description = text; break;
        case 'MP':  currentRec.mixedPack = text.toLowerCase() === 'yes'; break;

        case 'AU':  if (inAUS && text) currentRec.authors.push(text);  break;
        case 'ED':  if (inEDS && text) currentRec.editors.push(text);  break;
        case 'BC':  if (inBCS && text) currentRec.bicCodes.push(text); break;
      }
    });

    parser.on('error', (err) => reject(new Error(`Panda XML parse error: ${err.message}`)));

    stream.on('data',  (chunk) => {
      try { parser.write(chunk.toString()); }
      catch (err) { reject(err); }
    });
    stream.on('error', reject);
    stream.on('end',   () => {
      try { parser.close(); resolve(records); }
      catch (err) { reject(err); }
    });
  });

  // ── Phase 2: async dispatch ───────────────────────────────────────────────
  for (const rec of rawRecords) {
    const book = buildBook(rec);
    if (book) await onBook(book);
  }

  return { total: rawRecords.length };
}

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
    meta: { source: 'gardners-biblio', importedAt: new Date() },
  };
}

// ---------------------------------------------------------------------------
function emptyRecord() {
  return {
    ean: null, isbn13: null, prefix: null, title: null, subtitle: null,
    series: null, avail: null, binding: null, language: null, pubDate: null,
    rrp: null, publisher: null, year: null, pages: null, weight: null,
    dimensions: null, country: null, description: null, mixedPack: false,
    authors: [], editors: [], bicCodes: [],
  };
}

// ---------------------------------------------------------------------------
// CLI test mode
if (process.argv[1] && process.argv[1].endsWith('panda-xml-parser.js')) {
  const { createReadStream } = await import('fs');
  const args = Object.fromEntries(
    process.argv.slice(2).filter(a => a.startsWith('--'))
      .map(a => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; })
  );
  if (!args.file) {
    console.error('Usage: node src/scripts/panda-xml-parser.js --file=./file.xml [--limit=3]');
    process.exit(1);
  }
  const limit = args.limit ? parseInt(args.limit, 10) : Infinity;
  let count = 0;
  const stream = createReadStream(args.file, { encoding: 'utf8' });
  parsePandaXML(stream, async (book) => {
    if (count < limit) {
      console.log(`\n--- Book ${count + 1} ---`);
      console.log(JSON.stringify(book, null, 2));
    }
    count++;
  }).then(stats => {
    console.log(`\nParsed ${stats.total} records total, ${count} with valid ISBN-13.`);
  }).catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
}
