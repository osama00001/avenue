/**
 * order-lcp.js
 *
 * Gardners LCP eBook order client.
 *
 * Posts a JSON order to Gardners' webservice (POST /Ebook/place_lcp_order) and
 * returns either a download URL (.lcpl file the consumer's reader app fetches)
 * or a structured error.  Wired into the order pipeline AFTER successful
 * payment so we never hand out ebooks for free if payment fails.
 *
 * Spec reference: I24a_LCP_Ordering_Webservice_3 (Gardners 2026-04).
 *
 * Env vars required (in .env.local):
 *   GARDNERS_LCP_API_URL          (e.g. https://testconnect4.gardners.com/Ebook/place_lcp_order)
 *   GARDNERS_LCP_USERNAME         (e.g. EB1196)
 *   GARDNERS_LCP_PASSWORD         (account password)
 *   GARDNERS_LCP_CUSTOMER_CODE    (usually same as USERNAME for Gardners)
 *   GARDNERS_LCP_AES_KEY          (32-char UTF-8 — see lcp-encrypt.js)
 *   GARDNERS_LCP_HINT_URL         (consumer-facing passphrase hint page)
 *
 * CLI smoke-test mode (against Katie's three test ISBNs):
 *   node --env-file=.env.local src/scripts/order-lcp.js --test
 */

import 'dotenv/config';
import { encryptLcpField } from './lcp-encrypt.js';

// ---------------------------------------------------------------------------
// Response code → human-readable summary, derived from the spec's error tables.
// `category: success | client | auth | account | rights | server` lets us
// decide whether to retry, refund, or surface a friendlier error.
const RESPONSE_CODES = {
  // Success
  'E000':       { ok: true,  category: 'success', message: 'Order placed successfully' },
  '900004000':  { ok: true,  category: 'success', message: 'Order placed successfully' },

  // Undocumented short-form codes observed in dev environment (2026-04-29).
  // Gardners aliases the long 9000040xx codes as E9xx in some response paths.
  'E900':       { ok: false, category: 'auth',    message: 'API authentication failed (check username/customerCode/password)' },
  'E901':       { ok: false, category: 'account', message: 'Customer not signed up for any licence covering this EAN (alias of 900004010)' },
  'E902':       { ok: false, category: 'rights',  message: 'No pricing or licence available for this ISBN/licence combination (alias of 900004014)' },

  // Missing-field errors (E910–E929) — these are bugs in OUR request
  'E910': { ok:false, category:'client', message:'Missing EAN (productExternalId)' },
  'E911': { ok:false, category:'client', message:'Missing format code' },
  'E912': { ok:false, category:'client', message:'Missing order number reference' },
  'E913': { ok:false, category:'client', message:'Missing order line reference' },
  'E914': { ok:false, category:'client', message:'Missing customer code' },
  'E915': { ok:false, category:'client', message:'Missing customer name' },
  'E916': { ok:false, category:'client', message:'Missing customer email address' },
  'E917': { ok:false, category:'client', message:'Missing external customer ID' },
  'E918': { ok:false, category:'client', message:'Missing passphrase' },
  'E919': { ok:false, category:'client', message:'Missing passphrase hint' },
  'E920': { ok:false, category:'client', message:'Missing order date' },
  'E921': { ok:false, category:'client', message:'Missing sales country' },
  'E922': { ok:false, category:'client', message:'Sales country must be 2 characters' },
  'E923': { ok:false, category:'client', message:'Missing sales currency' },
  'E924': { ok:false, category:'client', message:'Sales currency must be 3 characters' },
  'E925': { ok:false, category:'client', message:'No valid sales price supplied' },
  'E926': { ok:false, category:'client', message:'No valid sales tax supplied' },
  'E927': { ok:false, category:'client', message:'No valid endUserId supplied' },
  'E928': { ok:false, category:'client', message:'No valid username supplied' },
  'E929': { ok:false, category:'client', message:'No valid password supplied' },

  // Auth & order processing
  '900001001': { ok:false, category:'auth',    message:'No customer code or password provided' },
  '900001002': { ok:false, category:'auth',    message:'Customer code or password not recognised' },
  '900001003': { ok:false, category:'server',  message:'Gardners returned unexpected status code' },
  '900001004': { ok:false, category:'server',  message:'Gardners returned malformed JSON' },
  '900001005': { ok:false, category:'server',  message:'Token could not be retrieved from Gardners response' },
  '900001006': { ok:false, category:'server',  message:'Other unexpected error from Gardners' },
  '900002001': { ok:false, category:'server',  message:'Invalid response from Gardners licence server' },
  '900002002': { ok:false, category:'server',  message:'No valid Licence URL in response' },
  '900003001': { ok:false, category:'auth',    message:'Invalid username or password' },

  '900004001': { ok:false, category:'client',  message:'Duplicate order — UniqueRef already used for this customer' },
  '900004002': { ok:false, category:'client',  message:'Invalid ISBN13 / format-code combination' },
  '900004003': { ok:false, category:'client',  message:'Missing or invalid country code' },
  '900004004': { ok:false, category:'client',  message:'Missing or invalid currency code' },
  '900004005': { ok:false, category:'account', message:'Account not found' },
  '900004006': { ok:false, category:'account', message:'Account status — contact Gardners digital services' },
  '900004007': { ok:false, category:'account', message:'Account status — contact Gardners accounts dept' },
  '900004008': { ok:false, category:'account', message:'Account status — contact Gardners accounts dept' },
  '900004009': { ok:false, category:'rights',  message:'Consumer country excluded from allowed territories' },
  '900004010': { ok:false, category:'account', message:'Customer not signed up for any licence covering this EAN' },
  '900004011': { ok:false, category:'server',  message:'Multiple licences match — Gardners-side data error' },
  '900004012': { ok:false, category:'rights',  message:'Product/licence not purchasable in this country' },
  '900004013': { ok:false, category:'rights',  message:'Product/licence not purchasable in this currency' },
  '900004014': { ok:false, category:'rights',  message:'No pricing or licence available for this ISBN/licence combination' },
};

function interpretResponse(responseCode, responseDescription) {
  const known = RESPONSE_CODES[responseCode];
  if (known) return { ...known, responseCode, responseDescription: responseDescription || known.message };
  return {
    ok: false,
    category: 'unknown',
    responseCode,
    responseDescription: responseDescription || `Unknown response code ${responseCode}`,
    message: responseDescription || `Unknown response code ${responseCode}`,
  };
}

// ---------------------------------------------------------------------------
/**
 * Place a single LCP eBook order with Gardners.
 *
 * @param {Object} args
 * @param {string} args.isbn13               13-digit EAN of the ebook
 * @param {string} args.formatCode           Gardners format code (e.g. "6" = ePub)
 * @param {string} args.orderNoRef           Unique reference for the order (≤40 chars). Re-using one returns 900004001.
 * @param {string} args.orderLineRef         Order-line reference (≤15 chars).
 * @param {string} args.customerName         Plaintext consumer name (will be encrypted).
 * @param {string} args.customerEmail        Plaintext consumer email (will be encrypted).
 * @param {string} args.passphrase           Plaintext passphrase (will be encrypted).
 * @param {string} args.passphraseHint       Plaintext passphrase hint (will be encrypted).
 * @param {string} args.endUserId            Mongo user._id (or other unique consumer id).
 * @param {number} args.localSalesPrice      Price the consumer paid (decimal).
 * @param {number} args.localSalesTax        Sales tax amount (decimal).
 * @param {string} [args.localSalesCountryCode='GB']
 * @param {string} [args.localSalesCurrency='GBP']
 * @param {number} [args.rentDays=0]         0 = perpetual licence
 * @param {number} [args.printLimit=0]
 * @returns {Promise<{ok: boolean, url?: string, responseCode: string, responseDescription: string, category: string, message: string, raw: any}>}
 */
export async function placeLcpOrder(args) {
  const {
    isbn13, formatCode, orderNoRef, orderLineRef,
    customerName, customerEmail, passphrase, passphraseHint, endUserId,
    localSalesPrice, localSalesTax,
    localSalesCountryCode = 'GB',
    localSalesCurrency    = 'GBP',
    rentDays              = 0,
    printLimit            = 0,
  } = args;

  // ── Validate inputs locally so we don't waste a round-trip ─────────────────
  const required = { isbn13, formatCode, orderNoRef, orderLineRef, customerName, customerEmail, passphrase, passphraseHint, endUserId };
  for (const [k, v] of Object.entries(required)) {
    if (v == null || v === '') throw new Error(`order-lcp: missing required field "${k}"`);
  }
  if (!/^\d{13}$/.test(isbn13))                    throw new Error(`order-lcp: isbn13 must be 13 digits, got "${isbn13}"`);
  if (orderNoRef.length > 40)                      throw new Error(`order-lcp: orderNoRef exceeds 40 chars`);
  if (orderLineRef.length > 15)                    throw new Error(`order-lcp: orderLineRef exceeds 15 chars`);
  if (localSalesCountryCode.length !== 2)          throw new Error(`order-lcp: country code must be 2 chars`);
  if (localSalesCurrency.length    !== 3)          throw new Error(`order-lcp: currency code must be 3 chars`);
  if (typeof localSalesPrice !== 'number')         throw new Error(`order-lcp: localSalesPrice must be a number`);
  if (typeof localSalesTax   !== 'number')         throw new Error(`order-lcp: localSalesTax must be a number`);

  const apiUrl       = process.env.GARDNERS_LCP_API_URL;
  const userName     = process.env.GARDNERS_LCP_USERNAME;
  const password     = process.env.GARDNERS_LCP_PASSWORD;
  const customerCode = process.env.GARDNERS_LCP_CUSTOMER_CODE || userName;
  const externalId   = process.env.LCP_EXTERNAL_CUSTOMER_ID || 'AVENUE BOOKSTORE';

  if (!apiUrl)   throw new Error('GARDNERS_LCP_API_URL not set');
  if (!userName) throw new Error('GARDNERS_LCP_USERNAME not set');
  if (!password) throw new Error('GARDNERS_LCP_PASSWORD not set');

  const body = {
    // Auth
    userName,                    // note: lower-case 'u' — matches Gardners' working JSON example
    password,
    customerCode,

    // Product
    productExternalId: isbn13,
    productFormatCode: String(formatCode),

    // Order references
    orderNoRef,
    orderLineRef,
    orderDate: new Date().toISOString().replace(/Z$/, '0Z'), // matches "2023-07-05T13:27:05.9Z" shape

    // Licensing
    rentDays,
    printLimit,

    // Pricing / territory
    localSalesPrice:       Number(localSalesPrice.toFixed(2)),
    localSalesCountryCode,
    localSalesCurrency,
    localSalesTax:         Number(localSalesTax.toFixed(2)),

    // Encrypted PII (AES-256-CBC, IV=zero, base64 — see lcp-encrypt.js)
    passPhrase:           encryptLcpField(passphrase),
    passPhraseHint:       encryptLcpField(passphraseHint),
    customerName:         encryptLcpField(customerName),
    customerEmailAddress: encryptLcpField(customerEmail),

    externalCustomerId: externalId,
    endUserId:          String(endUserId),
  };

  let res;
  try {
    res = await fetch(apiUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body:    JSON.stringify(body),
    });
  } catch (err) {
    return {
      ok: false,
      category: 'server',
      responseCode: 'NETWORK_ERROR',
      responseDescription: err.message,
      message: `Network error contacting Gardners: ${err.message}`,
      raw: null,
    };
  }

  let data;
  try { data = await res.json(); }
  catch (_) {
    const text = await res.text().catch(() => '');
    return {
      ok: false,
      category: 'server',
      responseCode: `HTTP_${res.status}`,
      responseDescription: text.slice(0, 200),
      message: `Gardners returned non-JSON ${res.status}: ${text.slice(0, 100)}`,
      raw: text,
    };
  }

  // Gardners' docs are inconsistent: spec says `responceCode` (sic), example says `responseCode`.
  // Accept either.
  const responseCode        = data.responseCode        || data.responceCode        || `HTTP_${res.status}`;
  const responseDescription = data.responseDescription || data.responceDescription || '';
  const interpreted         = interpretResponse(responseCode, responseDescription);

  return {
    ...interpreted,
    url: data.url || null,
    raw: data,
  };
}

// ---------------------------------------------------------------------------
// CLI smoke-test — uses Katie's three test ISBNs against the dev environment.
// Run:  node --env-file=.env.local src/scripts/order-lcp.js --test
// ---------------------------------------------------------------------------
if (process.argv[1] && process.argv[1].endsWith('order-lcp.js')) {
  const TEST_ISBNS = ['9781838578022', '9781849892100', '9781444971330'];

  console.log('[order-lcp] === Smoke test against', process.env.GARDNERS_LCP_API_URL, '===\n');

  for (const isbn of TEST_ISBNS) {
    // Each request needs a fresh, unique orderNoRef — re-using one returns 900004001
    const ts          = Date.now();
    const orderNoRef  = `AVE${ts}${Math.floor(Math.random() * 1000)}`.slice(0, 40);
    const orderLine   = `L${ts}`.slice(0, 15);

    console.log(`[order-lcp] Placing order for ${isbn} (orderNoRef=${orderNoRef})`);
    try {
      const result = await placeLcpOrder({
        isbn13:          isbn,
        formatCode:      '6',
        orderNoRef,
        orderLineRef:    orderLine,
        customerName:    'Test Buyer',
        customerEmail:   'test@avenuebookstore.com',
        passphrase:      'TestPassphrase123',
        passphraseHint:  'Smoke-test passphrase hint',
        endUserId:       `smoketest-${ts}`,
        localSalesPrice: 4.99,
        localSalesTax:   0.99,
      });

      console.log(`  responseCode : ${result.responseCode}`);
      console.log(`  category     : ${result.category}`);
      console.log(`  message      : ${result.message}`);
      if (result.url) console.log(`  download url : ${result.url}`);
      console.log(`  ${result.ok ? '✓ SUCCESS' : '✗ FAILED'}\n`);
    } catch (err) {
      console.log(`  ✗ EXCEPTION: ${err.message}\n`);
    }
  }
  process.exit(0);
}
