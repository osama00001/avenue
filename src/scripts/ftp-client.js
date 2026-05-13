/**
 * ftp-client.js
 * Shared connection utility for Gardners feeds.
 *
 * Physical feed  — data.gardners.com  — SFTP (SSH, port 22)
 * Covers feed    — covers.gardners.com — FTPS (explicit TLS, port 21)
 *
 * Both connectPhysical() and connectCovers() return a unified adapter:
 *
 *   const { client, close } = await connectPhysical();
 *   const files = await client.list('/Biblio');
 *   await client.get('/Biblio/file.xml', '/tmp/file.xml');
 *   await client.put('/tmp/order.ORD', '/HOMEORD/order.ORD');
 *   await client.delete('/HOMEACK/file.ACK');
 *   await close();
 *
 * The adapter normalises file-list entries to:
 *   { name, type: 1|2, size, isDirectory }
 *   (type 2 = directory, type 1 = file — same as basic-ftp convention)
 *
 * Exported helpers (thin wrappers kept for backward compat):
 *   listDir(client, remotePath)               → client.list(remotePath)
 *   downloadFile(client, remotePath, local)   → client.get(remotePath, local)
 *
 * CLI test mode:
 *   node src/scripts/ftp-client.js --test --feed=physical
 *   node src/scripts/ftp-client.js --test --feed=covers
 *   node src/scripts/ftp-client.js --list --feed=physical --dir=/Biblio
 */

import 'dotenv/config';
import SftpClient    from 'ssh2-sftp-client';
import { Client as FtpClient } from 'basic-ftp';

// ---------------------------------------------------------------------------
// Physical — data.gardners.com  (SFTP, port 22)
// ---------------------------------------------------------------------------
export async function connectPhysical() {
  const sftp = new SftpClient();

  await sftp.connect({
    host:              process.env.GARDNERS_PHYSICAL_FTP_HOST || 'data.gardners.com',
    port:              22,
    username:          process.env.GARDNERS_PHYSICAL_FTP_USER,
    password:          process.env.GARDNERS_PHYSICAL_FTP_PASS,
    readyTimeout:      30000,
    keepaliveInterval: 10000,   // send keepalive every 10 s
    keepaliveCountMax: 30,      // tolerate up to 5 min of silence
  });

  const client = {
    list: async (remotePath) => {
      const entries = await sftp.list(remotePath);
      return entries.map(normalizeSftpEntry);
    },
    get:    (remotePath, localPath) => sftp.get(remotePath, localPath),
    put:    (localPath, remotePath) => sftp.put(localPath, remotePath),
    delete: (remotePath)            => sftp.delete(remotePath),
  };

  return {
    client,
    close: async () => { try { await sftp.end(); } catch (_) {} },
  };
}

// ---------------------------------------------------------------------------
// Covers — covers.gardners.com  (FTPS explicit TLS, port 21)
// ---------------------------------------------------------------------------
export async function connectCovers() {
  const ftp = new FtpClient();
  ftp.ftp.verbose = process.env.FTP_DEBUG === 'true';

  await ftp.access({
    host:          process.env.GARDNERS_COVERS_FTP_HOST || 'covers.gardners.com',
    user:          process.env.GARDNERS_COVERS_FTP_USER,
    password:      process.env.GARDNERS_COVERS_FTP_PASS,
    secure:        true,                         // explicit FTPS (AUTH TLS)
    secureOptions: { rejectUnauthorized: false }, // self-signed cert OK
  });

  const client = {
    list: async (remotePath) => {
      await ftp.cd(remotePath);
      const entries = await ftp.list();
      return entries.map(normalizeFtpEntry);
    },
    get: async (remotePath, localPath) => {
      await ftp.cd(posixDir(remotePath));
      return ftp.downloadTo(localPath, posixBase(remotePath));
    },
    put: async (localPath, remotePath) => {
      await ftp.cd(posixDir(remotePath));
      return ftp.uploadFrom(localPath, posixBase(remotePath));
    },
    delete: async (remotePath) => {
      await ftp.cd(posixDir(remotePath));
      return ftp.remove(posixBase(remotePath));
    },
  };

  return {
    client,
    close: async () => { try { ftp.close(); } catch (_) {} },
  };
}

// ---------------------------------------------------------------------------
// Helpers (thin wrappers — kept for compatibility with calling scripts)
// ---------------------------------------------------------------------------

export async function listDir(client, remotePath) {
  return client.list(remotePath);
}

export async function downloadFile(client, remotePath, localPath) {
  return client.get(remotePath, localPath);
}

// ---------------------------------------------------------------------------
// Internal normalisation
// ---------------------------------------------------------------------------

function normalizeSftpEntry(e) {
  return {
    name:        e.name,
    type:        e.type === 'd' ? 2 : 1,
    size:        e.size,
    isDirectory: e.type === 'd',
  };
}

function normalizeFtpEntry(e) {
  return {
    name:        e.name,
    type:        e.type,          // already 1|2 from basic-ftp
    size:        e.size,
    isDirectory: e.type === 2,
  };
}

function posixDir(p)  { return p.split('/').slice(0, -1).join('/') || '/'; }
function posixBase(p) { return p.split('/').pop(); }

// ---------------------------------------------------------------------------
// CLI entry point — manual testing
// ---------------------------------------------------------------------------
if (process.argv[1] && process.argv[1].endsWith('ftp-client.js')) {
  const args = Object.fromEntries(
    process.argv.slice(2)
      .filter(a => a.startsWith('--'))
      .map(a => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; })
  );

  const feed = args.feed || 'physical';
  const dir  = args.dir  || (feed === 'covers' ? '/EBooks/640s/Complete' : '/Biblio');

  console.log(`\n[ftp-client] Connecting to ${feed}...`);

  let conn;
  try {
    conn = feed === 'covers' ? await connectCovers() : await connectPhysical();
    console.log('[ftp-client] Connected OK\n');

    if (args.test || args.list) {
      console.log(`[ftp-client] Listing ${dir} ...\n`);
      const files = await conn.client.list(dir);
      files.forEach(f => {
        const size = f.size ? `${(f.size / 1024 / 1024).toFixed(2)} MB` : '(dir)';
        console.log(`  ${f.type === 2 ? 'd' : '-'}  ${f.name.padEnd(60)} ${size}`);
      });
      console.log(`\n[ftp-client] Total: ${files.length} entries`);
    }
  } catch (err) {
    console.error('[ftp-client] ERROR:', err.message);
    process.exit(1);
  } finally {
    if (conn) await conn.close();
    console.log('\n[ftp-client] Connection closed.');
  }
}
