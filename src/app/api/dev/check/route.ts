import { NextResponse } from 'next/server';
import { checkMonitors } from '@/lib/monitoring/checker';

// Dev-only endpoint to manually trigger the monitor checker.
// In production, this is done by QStash on a schedule.
export async function POST() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }

  const results = await checkMonitors();

  const summary = {
    checked: results.length,
    wentDown: results.filter((r) => r.action === 'went_down').length,
    recovered: results.filter((r) => r.action === 'recovered').length,
    stillDown: results.filter((r) => r.action === 'still_down').length,
  };

  return NextResponse.json({ ok: true, summary, results });
}
