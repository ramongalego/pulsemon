import { NextRequest, NextResponse } from 'next/server';
import { Receiver } from '@upstash/qstash';
import { checkMonitors } from '@/lib/monitoring/checker';
import { env } from '@/lib/env';

const receiver = new Receiver({
  currentSigningKey: env.QSTASH_CURRENT_SIGNING_KEY,
  nextSigningKey: env.QSTASH_NEXT_SIGNING_KEY,
});

export async function POST(req: NextRequest) {
  try {
    // Verify QStash signature
    const body = await req.text();
    const signature = req.headers.get('upstash-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    const isValid = await receiver.verify({
      signature,
      body,
    });

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Run the monitoring check
    const results = await checkMonitors();

    const summary = {
      checked: results.length,
      wentDown: results.filter((r) => r.action === 'went_down').length,
      recovered: results.filter((r) => r.action === 'recovered').length,
      stillDown: results.filter((r) => r.action === 'still_down').length,
    };

    return NextResponse.json({ ok: true, summary });
  } catch (err) {
    console.error('QStash webhook error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
