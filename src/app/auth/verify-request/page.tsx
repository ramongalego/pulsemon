import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Activity, Mail } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Check your email - PulseMon',
};

export default function VerifyRequestPage() {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-primary mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg">
            <Activity className="text-primary-foreground h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">Check your email</CardTitle>
          <CardDescription>
            A sign-in link has been sent to your email address.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 flex flex-col items-center gap-3 rounded-lg p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
              <Mail className="h-6 w-6 text-blue-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">
                Click the link in the email to sign in
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                The link will expire in 24 hours. Check your spam folder if you
                don&apos;t see it.
              </p>
            </div>
          </div>

          <p className="text-muted-foreground text-center text-xs">
            Wrong email?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Try again
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
