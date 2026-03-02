import { NextResponse } from 'next/server';
import { getLifetimeCount } from '@/lib/lifetime-count';

export async function GET() {
  const count = await getLifetimeCount();
  return NextResponse.json({ data: { count }, error: null });
}
