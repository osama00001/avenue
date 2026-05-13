/**
 * test-lcp-aes.js
 *
 * Determines which AES-256-CBC IV convention Gardners' LCP webservice uses,
 * by trying several common strategies against Katie's published test vectors.
 *
 * Usage:
 *   node src/scripts/test-lcp-aes.js
 *
 * No env vars required — key and vectors are embedded for the dev environment.
 * Once one strategy matches both vectors, lock that strategy into the real
 * encryption helper used by the order-lcp client.
 */

import crypto from 'crypto';

const KEY_RAW = '822hCXtsQxFGVk29VZDf1MiHfNyEanmm';
const KEY     = Buffer.from(KEY_RAW, 'utf8');
console.log(`Key bytes: ${KEY.length} (need 32 for AES-256-CBC)`);
if (KEY.length !== 32) {
  console.error('Key is not 32 bytes — abort.');
  process.exit(1);
}

const VECTORS = [
  { plain: 'Richard Jacobs',                  cipher: '2myfh4tgboMcqXS2YwNnog==' },
  { plain: 'richardjacobs42@gmail.com',       cipher: '0YD+PW676FPINbIfOhA3LZE+b91w/3rPkasOqvbCU0k=' },
];

const STRATEGIES = {
  'zero-IV':            Buffer.alloc(16, 0),
  'first-16-of-key':    KEY.slice(0, 16),
  'last-16-of-key':     KEY.slice(16, 32),
  'md5-of-key':         crypto.createHash('md5').update(KEY).digest(),
  'sha256-of-key (16)': crypto.createHash('sha256').update(KEY).digest().slice(0, 16),
  'sha1-of-key (16)':   crypto.createHash('sha1').update(KEY).digest().slice(0, 16),
};

let winner = null;

for (const [name, iv] of Object.entries(STRATEGIES)) {
  console.log(`\n--- IV strategy: ${name} (iv hex: ${iv.toString('hex')}) ---`);
  let allMatch = true;
  for (const { plain, cipher: expected } of VECTORS) {
    try {
      const c   = crypto.createCipheriv('aes-256-cbc', KEY, iv);
      const enc = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
      const got = enc.toString('base64');
      const ok  = got === expected;
      if (!ok) allMatch = false;
      console.log(`  ${ok ? '✓' : '✗'} "${plain}"`);
      console.log(`      got     : ${got}`);
      if (!ok) console.log(`      expected: ${expected}`);
    } catch (e) {
      allMatch = false;
      console.log(`  ✗ "${plain}" — ERROR: ${e.message}`);
    }
  }
  if (allMatch && !winner) winner = name;
}

console.log('\n' + '='.repeat(60));
if (winner) {
  console.log(`MATCH: ${winner} reproduces both Gardners test vectors.`);
  console.log(`Use this IV derivation in the production LCP client.`);
} else {
  console.log('NO MATCH against any tested IV strategy.');
  console.log('Possibilities: (a) different cipher mode (CFB/CTR), (b) PKCS7 vs no padding,');
  console.log('(c) IV is sent alongside the cipher (e.g. prefixed in some other field),');
  console.log('(d) key needs base64-decoding rather than UTF-8 raw.');
  console.log('Try: ask Katie to confirm the IV convention.');
}
console.log('='.repeat(60));
