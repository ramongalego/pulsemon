import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET(req: Request) {
  // Verify the request is from Vercel Cron. Reject if CRON_SECRET is unset
  // so an unconfigured deploy can't be triggered by sending "Bearer undefined".
  const cronSecret = process.env.CRON_SECRET;
  if (
    !cronSecret ||
    req.headers.get('authorization') !== `Bearer ${cronSecret}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check DB is reachable
  await db.execute(sql`SELECT 1`);

  // Ping PulseMon
  const slug = 'vercel-health';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pulsemon.dev';
  await fetch(`${appUrl}/api/ping/${slug}`, { method: 'GET' });

  return NextResponse.json({ ok: true });
}
