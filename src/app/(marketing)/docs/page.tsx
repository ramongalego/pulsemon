import type { Metadata } from 'next';
import { DocsContent } from '@/components/shared/docs-content';

export const metadata: Metadata = {
  title: 'Documentation',
  description:
    'Quick-start guide and API reference for PulseMon cron job monitoring.',
};

export default function DocsPage() {
  return (
    <div className="px-4 py-16">
      <DocsContent />
    </div>
  );
}
