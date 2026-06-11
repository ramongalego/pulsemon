import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Cap so a hostile ?page= value can't drive an absurd OFFSET in Postgres.
const MAX_PAGE = 10_000;

export function parsePageParam(value: string | null): number {
  const parsed = parseInt(value ?? '1', 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.min(parsed, MAX_PAGE);
}
