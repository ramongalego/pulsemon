import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getAllPosts } from '@/lib/blog';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Tips, guides, and insights on cron job monitoring, infrastructure reliability, and developer operations.',
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function BlogPage() {
  const posts = getAllPosts();
  const [featured, ...rest] = posts;

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Blog</h1>
        <p className="text-muted-foreground mt-4 text-lg">
          Tips and guides on cron job monitoring and infrastructure reliability.
        </p>
      </div>

      {featured && (
        <div className="mx-auto mt-12 max-w-3xl">
          <Link
            href={`/blog/${featured.slug}`}
            className="bg-muted/50 group hover:border-primary/30 hover:bg-muted/80 block rounded-xl border p-8 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Badge variant="secondary">{featured.tag}</Badge>
              <span className="text-muted-foreground text-sm">
                {formatDate(featured.date)}
              </span>
              <span className="text-muted-foreground text-sm">
                · {featured.readTime}
              </span>
            </div>
            <h2 className="group-hover:text-primary mt-4 text-3xl font-bold tracking-tight">
              {featured.title}
            </h2>
            <p className="text-muted-foreground mt-3 text-lg">
              {featured.description}
            </p>
            <span className="text-primary mt-4 inline-flex items-center gap-1 text-sm font-medium">
              Read article
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        </div>
      )}

      {rest.length > 0 && (
        <div className="mx-auto mt-12 max-w-3xl">
          <h2 className="text-muted-foreground mb-6 text-sm font-medium tracking-wide uppercase">
            More articles
          </h2>
          <div className="divide-y">
            {rest.map((post) => (
              <article key={post.slug} className="py-5">
                <Link
                  href={`/blog/${post.slug}`}
                  className="group flex items-start justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {post.tag}
                      </Badge>
                      <span className="text-muted-foreground text-xs">
                        {formatDate(post.date)} · {post.readTime}
                      </span>
                    </div>
                    <h3 className="group-hover:text-primary mt-1.5 font-semibold tracking-tight">
                      {post.title}
                    </h3>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {post.description}
                    </p>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
