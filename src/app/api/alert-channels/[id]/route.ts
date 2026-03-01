import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { alertChannels } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { updateAlertChannelSchema } from '@/lib/validations/alert-channel';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = updateAlertChannelSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.issues.map((i) => i.message).join(', '),
          },
        },
        { status: 400 },
      );
    }

    const [existing] = await db
      .select({ id: alertChannels.id })
      .from(alertChannels)
      .where(
        and(
          eq(alertChannels.id, id),
          eq(alertChannels.userId, session.user.id),
        ),
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        {
          data: null,
          error: { code: 'NOT_FOUND', message: 'Alert channel not found' },
        },
        { status: 404 },
      );
    }

    const updateFields: Record<string, unknown> = {};
    if (parsed.data.config !== undefined)
      updateFields.config = parsed.data.config;
    if (parsed.data.isDefault !== undefined)
      updateFields.isDefault = parsed.data.isDefault;

    const [updated] = await db
      .update(alertChannels)
      .set(updateFields)
      .where(eq(alertChannels.id, id))
      .returning();

    return NextResponse.json({ data: updated, error: null });
  } catch {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update alert channel',
        },
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const { id } = await params;

  await db
    .delete(alertChannels)
    .where(
      and(eq(alertChannels.id, id), eq(alertChannels.userId, session.user.id)),
    );

  return NextResponse.json({ data: { deleted: true }, error: null });
}
