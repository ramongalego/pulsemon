import { NextRequest, NextResponse } from 'next/server';
import { Receiver } from '@upstash/qstash';
import { cleanupOldPings } from '@/lib/monitoring/cleanup';

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
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

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('Cleanup webhook error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
