import { auth } from '@/lib/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { MobileNav } from './mobile-nav';

export async function DashboardHeader() {
  const session = await auth();
  const user = session?.user;

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : (user?.email?.[0]?.toUpperCase() ?? '?');

  return (
    <header className="bg-card flex h-14 items-center justify-between border-b px-4">
      <div className="flex items-center gap-2">
        <MobileNav />
      </div>
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground hidden text-sm sm:inline">
          {user?.email}
        </span>
        <ThemeToggle />
        <Avatar className="h-8 w-8">
          <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? ''} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
