import type { MetadataRoute } from 'next';
import { db } from '@/lib/db';
import { statusPages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAllPosts } from '@/lib/blog';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://pulsemon.dev';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/pricing`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/docs`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/blog`, changeFrequency: 'weekly', priority: 0.8 },
  ];

  const blogPosts = getAllPosts().map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const publicPages = await db
    .select({ slug: statusPages.slug, createdAt: statusPages.createdAt })
    .from(statusPages)
    .where(eq(statusPages.isPublic, true));

  const statusPageEntries = publicPages.map((page) => ({
    url: `${BASE_URL}/status/${page.slug}`,
    lastModified: page.createdAt,
    changeFrequency: 'daily' as const,
    priority: 0.5,
  }));

  return [...staticPages, ...blogPosts, ...statusPageEntries];
}
