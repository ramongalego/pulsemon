import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { monitors, monitorAlertChannels, alertChannels } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { z } from 'zod';

export async function GET(
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

  // Verify ownership
  const [monitor] = await db
    .select({ id: monitors.id })
    .from(monitors)
    .where(and(eq(monitors.id, id), eq(monitors.userId, session.user.id)))
    .limit(1);

  if (!monitor) {
    return NextResponse.json(
      {
        data: null,
        error: { code: 'NOT_FOUND', message: 'Monitor not found' },
      },
      { status: 404 },
    );
  }

  const links = await db
    .select({ alertChannelId: monitorAlertChannels.alertChannelId })
    .from(monitorAlertChannels)
    .where(eq(monitorAlertChannels.monitorId, id));

  return NextResponse.json({
    data: links.map((l) => l.alertChannelId),
    error: null,
  });
}

const updateChannelsSchema = z.object({
  channelIds: z.array(z.string().uuid()),
});

export async function PUT(
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

  // Verify ownership
  const [monitor] = await db
    .select({ id: monitors.id })
    .from(monitors)
    .where(and(eq(monitors.id, id), eq(monitors.userId, session.user.id)))
    .limit(1);

  if (!monitor) {
    return NextResponse.json(
      {
        data: null,
        error: { code: 'NOT_FOUND', message: 'Monitor not found' },
      },
      { status: 404 },
    );
  }

  try {
    const body = await req.json();
    const parsed = updateChannelsSchema.safeParse(body);

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

    // Verify all channels belong to the authenticated user
    if (parsed.data.channelIds.length > 0) {
      const ownedChannels = await db
        .select({ id: alertChannels.id })
        .from(alertChannels)
        .where(
          and(
            inArray(alertChannels.id, parsed.data.channelIds),
            eq(alertChannels.userId, session.user.id),
          ),
        );

      if (ownedChannels.length !== parsed.data.channelIds.length) {
        return NextResponse.json(
          {
            data: null,
            error: {
              code: 'FORBIDDEN',
              message:
                'One or more alert channels do not belong to your account',
            },
          },
          { status: 403 },
        );
      }
    }

    // Replace all links: delete existing, insert new
    await db
      .delete(monitorAlertChannels)
      .where(eq(monitorAlertChannels.monitorId, id));

    if (parsed.data.channelIds.length > 0) {
      await db.insert(monitorAlertChannels).values(
        parsed.data.channelIds.map((channelId) => ({
          monitorId: id,
          alertChannelId: channelId,
        })),
      );
    }

    return NextResponse.json({ data: parsed.data.channelIds, error: null });
  } catch {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update channel links',
        },
      },
      { status: 500 },
    );
  }
}
