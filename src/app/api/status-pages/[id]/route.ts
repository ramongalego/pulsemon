import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { statusPages } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { updateStatusPageSchema } from '@/lib/validations/status-page';
import { checkMutationRateLimit } from '@/lib/rate-limit';

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

  const [page] = await db
    .select()
    .from(statusPages)
    .where(and(eq(statusPages.id, id), eq(statusPages.userId, session.user.id)))
    .limit(1);

  if (!page) {
    return NextResponse.json(
      {
        data: null,
        error: { code: 'NOT_FOUND', message: 'Status page not found' },
      },
      { status: 404 },
    );
  }

  return NextResponse.json({ data: page, error: null });
}

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

  const limited = await checkMutationRateLimit(session.user.id);
  if (limited) return limited;

  try {
    const body = await req.json();
    const parsed = updateStatusPageSchema.safeParse(body);

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

    // Verify ownership
    const [existing] = await db
      .select({ id: statusPages.id })
      .from(statusPages)
      .where(
        and(eq(statusPages.id, id), eq(statusPages.userId, session.user.id)),
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        {
          data: null,
          error: { code: 'NOT_FOUND', message: 'Status page not found' },
        },
        { status: 404 },
      );
    }

    // Check slug uniqueness if slug is being changed
    if (parsed.data.slug) {
      const slugExists = await db
        .select({ id: statusPages.id })
        .from(statusPages)
        .where(and(eq(statusPages.slug, parsed.data.slug)))
        .limit(1);

      if (slugExists.length > 0 && slugExists[0].id !== id) {
        return NextResponse.json(
          {
            data: null,
            error: {
              code: 'SLUG_TAKEN',
              message: 'A status page with this slug already exists',
            },
          },
          { status: 409 },
        );
      }
    }

    const [updated] = await db
      .update(statusPages)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(
        and(eq(statusPages.id, id), eq(statusPages.userId, session.user.id)),
      )
      .returning();

    return NextResponse.json({ data: updated, error: null });
  } catch (err) {
    console.error('Update status page failed:', err);
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update status page',
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

  const limited = await checkMutationRateLimit(session.user.id);
  if (limited) return limited;

  const [existing] = await db
    .select({ id: statusPages.id })
    .from(statusPages)
    .where(and(eq(statusPages.id, id), eq(statusPages.userId, session.user.id)))
    .limit(1);

  if (!existing) {
    return NextResponse.json(
      {
        data: null,
        error: { code: 'NOT_FOUND', message: 'Status page not found' },
      },
      { status: 404 },
    );
  }

  await db
    .delete(statusPages)
    .where(
      and(eq(statusPages.id, id), eq(statusPages.userId, session.user.id)),
    );

  return NextResponse.json({ data: { deleted: true }, error: null });
}
