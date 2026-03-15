import { MobileNav } from './mobile-nav';

export function MobileHeader() {
  return (
    <header className="bg-card flex h-14 items-center border-b px-4 md:hidden">
      <MobileNav />
    </header>
  );
}
