import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Webhook, Mail } from 'lucide-react';

const integrations = [
  {
    name: 'Email',
    description: 'Get alerts via email. Enabled by default for all accounts.',
    icon: Mail,
  },
  {
    name: 'Slack',
    description: 'Send alerts to a Slack channel via incoming webhook.',
    icon: MessageSquare,
  },
  {
    name: 'Discord',
    description: 'Send alerts to a Discord channel via webhook.',
    icon: MessageSquare,
  },
  {
    name: 'Custom Webhook',
    description: 'POST alert payloads to any URL.',
    icon: Webhook,
  },
];

export default async function IntegrationsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground">
          Connect PulseMon with your favorite tools
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {integrations.map((integration) => (
          <Card key={integration.name}>
            <CardHeader className="flex flex-row items-start gap-4">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                <integration.icon className="text-primary h-5 w-5" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-base">{integration.name}</CardTitle>
                <CardDescription className="text-sm">
                  {integration.description}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/alerts">
                <Button variant="outline" size="sm">
                  Configure
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
