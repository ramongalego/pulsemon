import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const POSTS_DIR = path.join(process.cwd(), 'src/content/blog');
const WORDS_PER_MINUTE = 230;

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  tag: string;
  readTime: string;
  content: string;
}

export function getAllPosts(): BlogPost[] {
  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.mdx'));

  const posts = files.map((filename) => {
    const filePath = path.join(POSTS_DIR, filename);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(raw);

    const wordCount = content.trim().split(/\s+/).length;
    const minutes = Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE));

    return {
      slug: (data.slug as string) ?? filename.replace('.mdx', ''),
      title: data.title as string,
      description: data.description as string,
      date: data.date as string,
      author: (data.author as string) ?? 'Ray',
      tag: (data.tag as string) ?? 'General',
      readTime: `${minutes} min read`,
      content,
    };
  });

  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return getAllPosts().find((post) => post.slug === slug);
}
