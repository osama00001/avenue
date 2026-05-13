/**
 * ftp-test.mjs — tests both SFTP (physical) and FTPS (covers)
 * Usage: /var/www/vhosts/avenuebookstore.com/.nodenv/shims/node ftp-test.mjs
 */
import SftpClient from 'ssh2-sftp-client';
import { Client as FtpClient } from 'basic-ftp';

// --- SFTP: Physical feed ---
async function testSftp() {
  console.log('\n=== Gardners Physical SFTP test (port 22) ===');
  const sftp = new SftpClient();
  try {
    await sftp.connect({
      host:     'data.gardners.com',
      port:     22,
      username: 'AVE011FTP',
      password: '62AVu42H2y',
    });
    console.log('✅ SFTP connected OK');

    const files = await sftp.list('/Biblio');
    console.log(`✅ /Biblio listed — ${files.length} file(s)`);
    if (files.length) console.log('   First:', files[0].name);

    const inv = await sftp.list('/Inventory');
    console.log(`✅ /Inventory listed — ${inv.length} file(s)`);

  } catch (err) {
    console.error('❌ SFTP error:', err.message);
  } finally {
    await sftp.end();
  }
}

// --- FTPS: Covers feed (unchanged) ---
async function testCovers() {
  console.log('\n=== Gardners Covers FTPS test ===');
  const ftp = new FtpClient();
  ftp.ftp.verbose = false;
  try {
    await ftp.access({
      host:     'covers.gardners.com',
      user:     'EB1196COVERSFTP',
      password: 'uMhKk54GDt',
      secure:   true,
      secureOptions: { rejectUnauthorized: false },
    });
    console.log('✅ Covers FTPS connected OK');

    await ftp.cd('/EBooks/640s/Complete');
    const dirs = await ftp.list();
    console.log(`✅ /EBooks/640s/Complete listed — ${dirs.length} prefix dirs`);

  } catch (err) {
    console.error('❌ Covers error:', err.message);
  } finally {
    ftp.close();
  }
}

await testSftp();
await testCovers();
console.log('\nDone.');
