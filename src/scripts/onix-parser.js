/**
 * onix-parser.js
 * Streaming ONIX 3.1 XML → Book schema mapper.
 *
 * Uses saxes for streaming SAX parsing — never loads the full file into memory.
 * Processes one <Product> element at a time and yields plain objects that match
 * the existing Book Mongoose schema (avenue-server-audit.md §6).
 *
 * Exports:
 *   parseOnixStream(readableStream, onProduct, onDone)
 *     - onProduct(bookObj) called for each parsed product
 *     - onDone(stats)      called when stream ends
 *
 * CLI test mode:
 *   node src/scripts/onix-parser.js --file=./downloads/test.xml --limit=3
 */

import { createReadStream } from 'fs';
import { SaxesParser } from 'saxes';

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Parse an ONIX 3.1 XML stream.
 *
 * @param {import('stream').Readable} stream  - Readable stream of ONIX XML
 * @param {(book: object) => Promise<void>} onProduct - Called for each <Product>
 * @returns {Promise<{total: number}>}
 */
export async function parseOnixStream(stream, onProduct) {
  return new Promise((resolve, reject) => {
    const parser = new SaxesParser({ xmlns: false });

    // --- state machine ---
    let inProduct   = false;
    let currentBook = null;

    // element path stack
    const path = [];

    // sub-element accumulators
    let currentText  = '';
    let currentIdent = null;   // ProductIdentifier in progress
    let currentTitle = null;   // TitleElement in progress
    let currentContrib = null; // Contributor in progress
    let currentLang  = null;
    let currentExtent = null;
    let currentSubject = null;
    let currentTextContent = null;
    let currentSalesRight = null;
    let currentPrice = null;

    let stats = { total: 0 };

    // ------------------------------------------------------------------
    // saxes v6 uses EventEmitter API: parser.on('opentag', fn)
    parser.on('opentag', ({ name, attributes }) => {
      path.push(name);
      currentText = '';

      if (!inProduct && name === 'Product') {
        inProduct = true;
        currentBook = emptyBook();
        return;
      }
      if (!inProduct) return;

      switch (name) {
        case 'ProductIdentifier':
          currentIdent = { type: null, value: null };
          break;
        case 'TitleElement':
          currentTitle = { titleType: null, level: null, text: null, subtitle: null };
          break;
        case 'Contributor':
          currentContrib = { sequence: null, role: null, nameInverted: null };
          break;
        case 'Language':
          currentLang = { role: null, code: null };
          break;
        case 'Extent':
          currentExtent = { type: null, value: null, unit: null };
          break;
        case 'Subject':
          currentSubject = { scheme: null, code: null, headingText: null };
          break;
        case 'TextContent':
          currentTextContent = { format: null, textType: null, audience: null, text: '' };
          break;
        case 'SalesRights':
          currentSalesRight = { type: null, countriesIncluded: null };
          break;
        case 'Price':
          currentPrice = { type: null, qualifier: null, discountPercent: null, amount: null, currency: null };
          break;
      }
    });

    // ------------------------------------------------------------------
    parser.on('text', (text) => {
      currentText += text;
    });

    parser.on('cdata', (cdata) => {
      currentText += cdata;
    });

    // ------------------------------------------------------------------
    parser.on('closetag', async (tagOrName) => {
      const name = typeof tagOrName === 'string' ? tagOrName : tagOrName.name;
      path.pop();
      const text = currentText.trim();

      if (!inProduct) {
        currentText = '';
        return;
      }

      // ---- Product-level fields ----
      switch (name) {
        case 'Product':
          inProduct = false;
          stats.total++;
          await onProduct(currentBook);
          currentBook = null;
          break;

        case 'RecordReference':   currentBook.recordReference  = text; break;
        case 'NotificationType':  currentBook.notificationType = text; break;

        // --- ProductIdentifier ---
        case 'ProductIDType':
          if (currentIdent) currentIdent.type = text;
          break;
        case 'IDValue':
          if (currentIdent) currentIdent.value = text;
          break;
        case 'ProductIdentifier':
          if (currentIdent) {
            currentBook.productIdentifiers.push(currentIdent);
            currentIdent = null;
          }
          break;

        // --- DescriptiveDetail ---
        case 'ProductComposition': currentBook.descriptiveDetail.productComposition = text; break;
        case 'ProductForm':        currentBook.descriptiveDetail.productForm        = text; break;
        case 'ProductFormDetail':  currentBook.descriptiveDetail.productFormDetail  = text; break;
        case 'EpubTechnicalProtection': currentBook.descriptiveDetail.epubTechnicalProtection = text; break;

        // --- TitleElement ---
        case 'TitleType':         if (currentTitle) currentTitle.titleType  = text; break;
        case 'TitleElementLevel': if (currentTitle) currentTitle.level      = text; break;
        case 'TitleText':         if (currentTitle) currentTitle.text       = text; break;
        case 'TitleWithoutPrefix':if (currentTitle && !currentTitle.text) currentTitle.text = text; break;
        case 'Subtitle':          if (currentTitle) currentTitle.subtitle   = text; break;
        case 'TitleElement':
          if (currentTitle) {
            currentBook.descriptiveDetail.titles.push(currentTitle);
            currentTitle = null;
          }
          break;

        // --- Contributor ---
        case 'SequenceNumber':  if (currentContrib) currentContrib.sequence    = text; break;
        case 'ContributorRole': if (currentContrib) currentContrib.role        = text; break;
        case 'PersonNameInverted':
          if (currentContrib) currentContrib.nameInverted = text;
          break;
        case 'PersonName':
          // fallback if no inverted name
          if (currentContrib && !currentContrib.nameInverted) currentContrib.nameInverted = text;
          break;
        case 'Contributor':
          if (currentContrib) {
            currentBook.descriptiveDetail.contributors.push(currentContrib);
            currentContrib = null;
          }
          break;

        // --- Language ---
        case 'LanguageRole': if (currentLang) currentLang.role = text; break;
        case 'LanguageCode': if (currentLang) currentLang.code = text; break;
        case 'Language':
          if (currentLang) {
            currentBook.descriptiveDetail.languages.push(currentLang);
            currentLang = null;
          }
          break;

        // --- Extent ---
        case 'ExtentType':  if (currentExtent) currentExtent.type  = text; break;
        case 'ExtentValue': if (currentExtent) currentExtent.value = text; break;
        case 'ExtentUnit':  if (currentExtent) currentExtent.unit  = text; break;
        case 'Extent':
          if (currentExtent) {
            currentBook.descriptiveDetail.extents.push(currentExtent);
            currentExtent = null;
          }
          break;

        // --- Subject ---
        case 'SubjectSchemeIdentifier': if (currentSubject) currentSubject.scheme      = text; break;
        case 'SubjectCode':             if (currentSubject) currentSubject.code        = text; break;
        case 'SubjectHeadingText':      if (currentSubject) currentSubject.headingText = text; break;
        case 'Subject':
          if (currentSubject) {
            currentBook.descriptiveDetail.subjects.push(currentSubject);
            currentSubject = null;
          }
          break;

        // --- CollateralDetail / TextContent ---
        case 'TextType':
          if (currentTextContent) currentTextContent.textType = text;
          break;
        case 'Text':
          if (currentTextContent) currentTextContent.text = text;
          break;
        case 'TextContent':
          if (currentTextContent) {
            currentBook.collateralDetail.textContents.push(currentTextContent);
            currentTextContent = null;
          }
          break;

        // --- PublishingDetail ---
        case 'ImprintName':     currentBook.publishingDetail.imprint.name      = text; break;
        case 'PublisherName':   currentBook.publishingDetail.publisher.name    = text; break;
        case 'PublishingRole':  currentBook.publishingDetail.publisher.role    = text; break;
        case 'PublishingStatus': currentBook.publishingDetail.publishingStatus = text; break;
        case 'Date':
          if (inPath(path, 'PublishingDate')) {
            currentBook.publishingDetail.publishingDate = text;
          }
          break;

        // --- SalesRights ---
        case 'SalesRightsType':    if (currentSalesRight) currentSalesRight.type             = text; break;
        case 'CountriesIncluded':  if (currentSalesRight) currentSalesRight.countriesIncluded = text; break;
        case 'SalesRights':
          if (currentSalesRight) {
            currentBook.publishingDetail.salesRights.push(currentSalesRight);
            currentSalesRight = null;
          }
          break;

        // --- ProductSupply ---
        case 'SupplierRole': currentBook.productSupply.supplier.role = text; break;
        case 'SupplierName': currentBook.productSupply.supplier.name = text; break;
        case 'ProductAvailability': currentBook.productSupply.availability = text; break;

        // --- Price ---
        case 'PriceType':       if (currentPrice) currentPrice.type            = text; break;
        case 'PriceQualifier':  if (currentPrice) currentPrice.qualifier       = text; break;
        case 'DiscountPercent': if (currentPrice) currentPrice.discountPercent = parseFloat(text); break;
        case 'PriceAmount':     if (currentPrice) currentPrice.amount          = parseFloat(text); break;
        case 'CurrencyCode':    if (currentPrice) currentPrice.currency        = text; break;
        case 'Price':
          if (currentPrice) {
            currentBook.productSupply.prices.push(currentPrice);
            currentPrice = null;
          }
          break;
      }

      currentText = '';
    });

    // ------------------------------------------------------------------
    parser.on('error', (err) => {
      reject(new Error(`ONIX parse error: ${err.message}`));
    });

    // ------------------------------------------------------------------
    stream.on('data', (chunk) => {
      try {
        parser.write(chunk.toString());
      } catch (err) {
        reject(err);
      }
    });

    stream.on('error', reject);

    stream.on('end', () => {
      try {
        parser.close();
        resolve(stats);
      } catch (err) {
        reject(err);
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function inPath(path, tag) {
  return path.includes(tag);
}

function emptyBook() {
  return {
    recordReference:  null,
    notificationType: null,
    productIdentifiers: [],
    descriptiveDetail: {
      productComposition:       null,
      productForm:              null,
      productFormDetail:        null,
      epubTechnicalProtection:  null,
      titles:       [],
      contributors: [],
      languages:    [],
      extents:      [],
      subjects:     [],
    },
    collateralDetail: {
      textContents: [],
    },
    publishingDetail: {
      imprint:         { name: null },
      publisher:       { role: null, name: null },
      publishingStatus: null,
      publishingDate:   null,
      salesRights:      [],
    },
    productSupply: {
      supplier:     { role: null, name: null },
      availability: null,
      prices:       [],
    },
    meta: {
      source:     'gardners-biblio',
      importedAt: new Date(),
    },
  };
}

// ---------------------------------------------------------------------------
// CLI test mode
// ---------------------------------------------------------------------------
if (process.argv[1] && process.argv[1].endsWith('onix-parser.js')) {
  const args = Object.fromEntries(
    process.argv.slice(2)
      .filter(a => a.startsWith('--'))
      .map(a => {
        const [k, v] = a.slice(2).split('=');
        return [k, v ?? true];
      })
  );

  if (!args.file) {
    console.error('Usage: node src/scripts/onix-parser.js --file=./downloads/test.xml [--limit=3]');
    process.exit(1);
  }

  const limit = args.limit ? parseInt(args.limit, 10) : Infinity;
  let count = 0;

  const stream = createReadStream(args.file, { encoding: 'utf8' });

  const stats = await parseOnixStream(stream, async (book) => {
    if (count < limit) {
      console.log('\n--- Product', count + 1, '---');
      console.log(JSON.stringify(book, null, 2));
    }
    count++;
  });

  console.log(`\nParsed ${stats.total} products to