import { NextResponse } from 'next/server';
import { createHash, timingSafeEqual } from 'node:crypto';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

// Hash both sides so the comparison is constant-time regardless of length.
function safeCompare(a: string, b: string): boolean {
  const hashA = createHash('sha256').update(a).digest();
  const hashB = createHash('sha256').update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

export async function GET(req: Request) {
  // Verify the request is from Vercel Cron. Reject if CRON_SECRET is unset
  // so an unconfigured deploy can't be triggered by sending "Bearer undefined".
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization') ?? '';
  if (!cronSecret || !safeCompare(authHeader, `Bearer ${cronSecret}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check DB is reachable
  await db.execute(sql`SELECT 1`);

  // Ping PulseMon's own self-monitor. If this fails, the missed ping itself
  // raises the alert, so don't fail the health check over it.
  const slug = 'vercel-health';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pulsemon.dev';
  try {
    await fetch(`${appUrl}/api/ping/${slug}`, { method: 'GET' });
  } catch (err) {
    console.error('Failed to ping health self-monitor:', err);
  }

  return NextResponse.json({ ok: true });
}
