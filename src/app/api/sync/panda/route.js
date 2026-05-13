/**
 * POST /api/sync/panda
 * Trigger the P&A inventory sync manually or via cron.
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

  const scriptPath = path.resolve(process.cwd(), 'src/scripts/sync-inventory.js');

  exec(`node ${scriptPath}`, { env: process.env }, (error, stdout, stderr) => {
    if (error) {
      console.error('[api/sync/panda] error:', error.message);
      console.error(stderr);
    } else {
      console.log('[api/sync/panda] completed:', stdout);
    }
  });

  return NextResponse.json({
    ok:      true,
    message: 'P&A sync started',
    time:    new Date().toISOString(),
  });
}
