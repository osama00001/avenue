/**
 * lcp-encrypt.js
 *
 * AES-256-CBC encryption helper for Gardners LCP webservice fields.
 *
 * Confirmed convention (validated against Katie's published test vectors,
 * 2026-04-29):
 *   - Cipher       : AES-256-CBC
 *   - Key          : 32-byte UTF-8 of GARDNERS_LCP_AES_KEY
 *   - IV           : 16 zero bytes  (yes, fixed — Gardners uses a static IV)
 *   - Padding      : PKCS#7 (Node default for createCipheriv)
 *   - Output       : Base64
 *
 * Test vectors from Gardners dev key 822hCXtsQxFGVk29VZDf1MiHfNyEanmm:
 *   "Richard Jacobs"            → "2myfh4tgboMcqXS2YwNnog=="
 *   "richardjacobs42@gmail.com" → "0YD+PW676FPINbIfOhA3LZE+b91w/3rPkasOqvbCU0k="
 *
 * Used to encrypt these JSON fields before posting to /Ebook/place_lcp_order:
 *   passPhrase, passPhraseHint, customerName, customerEmailAddress
 */

import crypto from 'crypto';

const ZERO_IV = Buffer.alloc(16, 0);

function getKey() {
  const raw = process.env.GARDNERS_LCP_AES_KEY;
  if (!raw) throw new Error('GARDNERS_LCP_AES_KEY is not set in environment');
  const key = Buffer.from(raw, 'utf8');
  if (key.length !== 32) {
    throw new Error(`GARDNERS_LCP_AES_KEY must be 32 bytes (got ${key.length}). Check .env.local.`);
  }
  return key;
}

/**
 * Encrypt a UTF-8 string for an LCP order field.
 * @param {string} plaintext
 * @returns {string} base64 ciphertext
 */
export function encryptLcpField(plaintext) {
  if (plaintext == null) return '';
  const key    = getKey();
  const cipher = crypto.createCipheriv('aes-256-cbc', key, ZERO_IV);
  const enc    = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  return enc.toString('base64');
}

/**
 * Decrypt a base64 ciphertext back to UTF-8. Useful only for debugging /
 * verifying our own encryption — Gardners does the real decryption.
 * @param {string} cipherB64
 * @returns {string}
 */
export function decryptLcpField(cipherB64) {
  if (!cipherB64) return '';
  const key      = getKey();
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, ZERO_IV);
  const dec      = Buffer.concat([decipher.update(Buffer.from(cipherB64, 'base64')), decipher.final()]);
  return dec.toString('utf8');
}

// CLI self-test
if (process.argv[1] && process.argv[1].endsWith('lcp-encrypt.js')) {
  const VECTORS = [
    { plain: 'Richard Jacobs',            expected: '2myfh4tgboMcqXS2YwNnog==' },
    { plain: 'richardjacobs42@gmail.com', expected: '0YD+PW676FPINbIfOhA3LZE+b91w/3rPkasOqvbCU0k=' },
  ];
  let ok = true;
  for (const { plain, expected } of VECTORS) {
    const got = encryptLcpField(plain);
    const round = decryptLcpField(got);
    const enc_ok = got === expected;
    const dec_ok = round === plain;
    if (!enc_ok || !dec_ok) ok = false;
    console.log(`${enc_ok && dec_ok ? '✓' : '✗'} "${plain}"`);
    console.log(`    enc: ${got} ${enc_ok ? '' : '(expected ' + expected + ')'}`);
    console.log(`    dec: ${round} ${dec_ok ? '' : '(roundtrip failed)'}`);
  }
  process.exit(ok ? 0 : 1);
}
