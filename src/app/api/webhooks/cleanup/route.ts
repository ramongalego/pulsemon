import { NextRequest, NextResponse } from 'next/server';
import { Receiver } from '@upstash/qstash';
import { cleanupOldPings } from '@/lib/monitoring/cleanup';
import { env } from '@/lib/env';

const receiver = new Receiver({
  currentSigningKey: env.QSTASH_CURRENT_SIGNING_KEY,
  nextSigningKey: env.QSTASH_NEXT_SIGNING_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('upstash-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    const isValid = await receiver.verify({ signature, body });

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const result = await cleanupOldPings();

    console.log(
      `Ping cleanup completed: ${result.totalDeleted} rows deleted across ${result.monitorsProcessed} monitors`,
    );

    // Ping PulseMon self-monitor so we know cleanup is running
    const slug = 'cleanup-job';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pulsemon.dev';
    await fetch(`${appUrl}/api/ping/${slug}`, { method: 'GET' }).catch((err) =>
      console.error('Failed to ping cleanup monitor:', err),
    );

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('Cleanup webhook error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
