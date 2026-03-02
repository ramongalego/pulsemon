import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getAllPosts, getPostBySlug } from '@/lib/blog';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  return {
    title: `${post.title} - PulseMon`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
      <article className="mx-auto max-w-3xl">
        <Link
          href="/blog"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to blog
        </Link>

        <header className="mt-8">
          <div className="flex items-center gap-3">
            <Badge variant="secondary">{post.tag}</Badge>
            <span className="text-muted-foreground text-sm">
              {new Date(post.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            <span className="text-muted-foreground text-sm">
              · {post.readTime}
            </span>
          </div>
          <h1 className="mt-2 text-4xl font-bold tracking-tight md:text-5xl">
            {post.title}
          </h1>
          <p className="text-muted-foreground mt-4 text-lg">
            {post.description}
          </p>
        </header>

        <div className="prose dark:prose-invert mt-10 max-w-none">
          <MDXRemote source={post.content} />
        </div>
      </article>
    </div>
  );
}
