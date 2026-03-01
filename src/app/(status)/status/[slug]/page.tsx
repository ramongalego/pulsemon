import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { statusPages } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { StatusPageView } from '@/components/status-page/status-page-view';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  const [page] = await db
    .select({ title: statusPages.title, description: statusPages.description })
    .from(statusPages)
    .where(and(eq(statusPages.slug, slug), eq(statusPages.isPublic, true)))
    .limit(1);

  if (!page) {
    return { title: 'Status Page Not Found' };
  }

  return {
    title: `${page.title} - Status`,
    description: page.description ?? `Current status for ${page.title}`,
    robots: { index: true, follow: true },
    openGraph: {
      title: `${page.title} - Status`,
      description: page.description ?? `Current status for ${page.title}`,
      type: 'website',
    },
  };
}

export default async function PublicStatusPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [page] = await db
    .select({ id: statusPages.id })
    .from(statusPages)
    .where(and(eq(statusPages.slug, slug), eq(statusPages.isPublic, true)))
    .limit(1);

  if (!page) notFound();

  return <StatusPageView slug={slug} />;
}
