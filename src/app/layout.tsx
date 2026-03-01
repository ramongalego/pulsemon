import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/shared/providers';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'PulseMon - Cron Job Monitoring for Developers',
    template: '%s | PulseMon',
  },
  description:
    'Know the second your cron jobs stop running. Simple heartbeat monitoring with instant alerts via Slack, Discord, email, and webhooks. Free for up to 30 monitors.',
  keywords: [
    'cron job monitoring',
    'heartbeat monitoring',
    'cron monitoring service',
    'scheduled task monitoring',
    "dead man's switch",
    'uptime monitoring',
  ],
  authors: [{ name: 'PulseMon' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'PulseMon',
    title: 'PulseMon - Cron Job Monitoring for Developers',
    description:
      'Know the second your cron jobs stop running. Simple heartbeat monitoring with instant alerts.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PulseMon - Cron Job Monitoring for Developers',
    description:
      'Know the second your cron jobs stop running. Simple heartbeat monitoring with instant alerts.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
