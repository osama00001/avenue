/**
 * POST /api/sync/onix
 * Trigger the ONIX bibliographic sync manually or via cron.
 * Protected by Authorization: Bearer {SYNC_SECRET}
 */

import { NextResponse } from 'next/server';
import { exec }         from 'child_process';
import path             from 'path';

export async function POST(request) {
  // Auth check
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '').trim();

  if (!process.env.SYNC_SECRET || token !== process.env.SYNC_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const scriptPath = path.resolve(process.cwd(), 'src/scripts/sync-biblio.js');

  // Run the sync script as a background child process
  // so the HTTP response returns immediately
  exec(`node ${scriptPath}`, { env: process.env }, (error, stdout, stderr) => {
    if (error) {
      console.error('[api/sync/onix] sync-biblio error:', error.message);
      console.error(stderr);
    } else {
      console.log('[api/sync/onix] sync-biblio completed:', stdout);
    }
  });

  return NextResponse.json({
    ok:      true,
    message: 'ONIX sync started',
    time:    new Date().toISOString(),
  });
}
