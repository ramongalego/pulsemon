import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center px-4">
      <h1 className="text-6xl font-bold tracking-tight">404</h1>
      <p className="text-muted-foreground mt-3 text-lg">
        This page could not be found.
      </p>
      <Link href="/" className="mt-6">
        <Button variant="outline">Go home</Button>
      </Link>
    </div>
  );
}
