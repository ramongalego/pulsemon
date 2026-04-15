import Link from 'next/link';
import { Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { MarketingMobileNav } from '@/components/shared/marketing-mobile-nav';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-background/80 sticky top-0 z-50 border-b backdrop-blur-sm">
        <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <MarketingMobileNav />
            <Link href="/" className="flex items-center gap-2">
              <Activity className="text-primary h-6 w-6" />
              <span className="text-lg font-semibold">PulseMon</span>
            </Link>
          </div>
          <div className="hidden items-center gap-6 md:flex">
            <Link
              href="/blog"
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              Blog
            </Link>
            <Link
              href="/docs"
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              Docs
            </Link>
            <Link
              href="/pricing"
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              Pricing
            </Link>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <ThemeToggle />
            <Link href="/login" className="hidden md:block">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/login">
              <Button size="sm">
                <span className="hidden sm:inline">Get Started Free</span>
                <span className="sm:hidden">Sign in</span>
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-muted/30 border-t">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="text-primary h-5 w-5" />
                <span className="font-semibold">PulseMon</span>
              </div>
              <p className="text-muted-foreground mt-2 text-sm">
                Cron job monitoring built for developers.
              </p>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold">Product</h3>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li>
                  <Link href="/pricing" className="hover:text-foreground">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="hover:text-foreground">
                    Blog
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold">Resources</h3>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li>
                  <Link href="/docs" className="hover:text-foreground">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="/docs#api-keys" className="hover:text-foreground">
                    API Reference
                  </Link>
                </li>
                <li>
                  <Link href="/status" className="hover:text-foreground">
                    Status
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="text-muted-foreground mt-8 border-t pt-8 text-center text-sm">
            Built for developers by a developer
          </div>
        </div>
      </footer>
    </div>
  );
}
