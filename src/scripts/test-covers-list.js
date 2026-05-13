/**
 * test-covers-list.js
 *
 * Minimal isolated test: connect to Gardners covers FTPS and list ONE
 * prefix directory. If this hangs, we know it's a basic-ftp / IIS FTPS
 * incompatibility, not a problem with our wrapper or rate-limit logic.
 *
 * Run:
 *   node --env-file=.env.local src/scripts/test-covers-list.js
 */

import 'dotenv/config';
import { connectCovers } from './ftp-client.js';

const TEST_DIR = '/EBooks/640s/Complete/97800000';

async function withTimeout(p, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} TIMEOUT after ${ms}ms`)), ms);
  });
  return Promise.race([p, timeout]).finally(() => clearTimeout(timer));
}

async function main() {
  console.log('[test-covers-list] === Isolated FTP list test ===');

  console.log('[test-covers-list] Step 1: connectCovers()');
  const t0 = Date.now();
  const { client, close } = await withTimeout(connectCovers(), 30000, 'connectCovers');
  console.log(`[test-covers-list]   OK in ${Date.now() - t0}ms`);

  console.log(`[test-covers-list] Step 2: client.list("${TEST_DIR}")`);
  const t1 = Date.now();
  try {
    const entries = await withTimeout(client.list(TEST_DIR), 20000, 'list sub-dir');
    console.log(`[test-covers-list]   OK in ${Date.now() - t1}ms — got ${entries.length} entries`);
    console.log('[test-covers-list]   First 3:');
    entries.slice(0, 3).forEach(e => {
      console.log(`     ${e.name}  type=${e.type}  size=${e.size}`);
    });
  } catch (err) {
    console.error(`[test-covers-list]   FAILED after ${Date.now() - t1}ms:`, err.message);
  }

  console.log('[test-covers-list] Step 3: client.list(SAME dir again)');
  const t2 = Date.now();
  try {
    const entries = await withTimeout(client.list(TEST_DIR), 20000, 'list sub-dir 2nd time');
    console.log(`[test-covers-list]   OK in ${Date.now() - t2}ms — got ${entries.length} entries`);
  } catch (err) {
    console.error(`[test-covers-list]   FAILED after ${Date.now() - t2}ms:`, err.message);
  }

  console.log('[test-covers-list] Step 4: client.list(DIFFERENT dir)');
  const t3 = Date.now();
  try {
    const entries = await withTimeout(client.list('/EBooks/640s/Complete/97800009'), 20000, 'list other dir');
    console.log(`[test-covers-list]   OK in ${Date.now() - t3}ms — got ${entries.length} entries`);
  } catch (err) {
    console.error(`[test-covers-list]   FAILED after ${Date.now() - t3}ms:`, err.message);
  }

  await close();
  console.log('[test-covers-list] DONE');
  process.exit(0);
}

main().catch(err => {
  console.error('[test-covers-list] FATAL:', err);
  process.exit(1);
});
