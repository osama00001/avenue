/**
 * POST /api/sync/covers
 * Trigger the covers bulk download manually or via cron.
 * Protected by Authorization: Bearer {SYNC_SECRET}
 */

import { NextResponse } from 'next/server';
import { exec }         from 'child_process';
import path             from 'path';

export async function POST(request) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '').trim();

  if (!process.env.SYNC_SECRET || token !== process.env.SYNC_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const scriptPath = path.resolve(process.cwd(), 'src/scripts/sync-covers.js');

  exec(`node ${scriptPath}`, { env: process.env }, (error, stdout, stderr) => {
    if (error) {
      console.error('[api/sync/covers] error:', error.message);
      console.error(stderr);
    } else {
      console.log('[api/sync/covers] completed:', stdout);
    }
  });

  return NextResponse.json({
    ok:      true,
    message: 'Covers sync started',
    time:    new Date().toISOString(),
  });
}
