import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { feedback } from '@/lib/db/schema';
import { feedbackSchema } from '@/lib/validations/feedback';
import { checkFeedbackRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      {
        data: null,
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
      },
      { status: 401 },
    );
  }

  const limited = await checkFeedbackRateLimit(session.user.id);
  if (limited) return limited;

  const body = await req.json();
  const parsed = feedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0].message,
        },
      },
      { status: 400 },
    );
  }

  const [row] = await db
    .insert(feedback)
    .values({
      userId: session.user.id,
      type: parsed.data.type,
      message: parsed.data.message,
    })
    .returning({ id: feedback.id });

  return NextResponse.json({ data: { id: row.id }, error: null });
}
