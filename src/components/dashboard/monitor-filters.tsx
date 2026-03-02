'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowUpDown, Search } from 'lucide-react';

export function MonitorFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsRef = useRef(searchParams);
  useEffect(() => {
    searchParamsRef.current = searchParams;
  }, [searchParams]);

  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const currentStatus = searchParams.get('status') || 'all';
  const currentSort = searchParams.get('sort') || 'created';

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParamsRef.current.toString());
      if (value && value !== 'all' && value !== 'created') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      const query = params.toString();
      startTransition(() => {
        router.replace(`/dashboard${query ? `?${query}` : ''}`, {
          scroll: false,
        });
      });
    },
    [router],
  );

  // Debounced search — only push when the value actually changed
  useEffect(() => {
    const current = searchParamsRef.current.get('q') || '';
    if (search === current) return;

    const timeout = setTimeout(() => {
      updateParams('q', search);
    }, 400);
    return () => clearTimeout(timeout);
  }, [search, updateParams]);

  return (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:items-center ${isPending ? 'opacity-60' : ''}`}
    >
      <div className="relative flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Search monitors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <Tabs
        value={currentStatus}
        onValueChange={(v) => updateParams('status', v)}
      >
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="up">Up</TabsTrigger>
          <TabsTrigger value="down">Down</TabsTrigger>
          <TabsTrigger value="paused">Paused</TabsTrigger>
        </TabsList>
      </Tabs>
      <Select
        value={currentSort}
        onValueChange={(v) => updateParams('sort', v)}
      >
        <SelectTrigger className="w-[160px]">
          <ArrowUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="created">Newest first</SelectItem>
          <SelectItem value="name">Name (A–Z)</SelectItem>
          <SelectItem value="status">Status</SelectItem>
          <SelectItem value="lastPing">Last ping</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
