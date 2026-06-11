'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { RelativeTime } from '@/components/shared/relative-time';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { Ping } from '@/lib/db/schema';

const PAGE_SIZE = 10;
const MAX_INLINE = 50;

function isValidJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

function PingBody({ body }: { body: string }) {
  const formatted = useMemo(() => {
    if (isValidJson(body)) {
      try {
        return JSON.stringify(JSON.parse(body), null, 2);
      } catch {
        return body;
      }
    }
    return body;
  }, [body]);

  const isJson = isValidJson(body);

  return (
    <div className="bg-muted overflow-x-auto rounded-md border p-3">
      <pre className="font-mono text-xs leading-relaxed break-all whitespace-pre-wrap">
        {isJson ? <JsonHighlighted text={formatted} /> : formatted}
      </pre>
    </div>
  );
}

type TokenType = 'key' | 'string' | 'boolean' | 'number' | 'plain' | 'colon';

interface Token {
  type: TokenType;
  value: string;
}

const VALUE_RE =
  /("(?:[^"\\]|\\.)*")|(\b(?:true|false|null)\b)|(\b-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)/g;

function tokenizeValues(text: string): Token[] {
  const tokens: Token[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;

  VALUE_RE.lastIndex = 0;
  while ((m = VALUE_RE.exec(text)) !== null) {
    if (m.index > lastIndex) {
      tokens.push({ type: 'plain', value: text.slice(lastIndex, m.index) });
    }
    if (m[1]) tokens.push({ type: 'string', value: m[0] });
    else if (m[2]) tokens.push({ type: 'boolean', value: m[0] });
    else if (m[3]) tokens.push({ type: 'number', value: m[0] });
    lastIndex = VALUE_RE.lastIndex;
  }
  if (lastIndex < text.length) {
    tokens.push({ type: 'plain', value: text.slice(lastIndex) });
  }
  return tokens;
}

const TOKEN_CLASS: Record<TokenType, string | null> = {
  key: 'text-blue-600 dark:text-blue-400',
  string: 'text-green-600 dark:text-green-400',
  boolean: 'text-purple-600 dark:text-purple-400',
  number: 'text-orange-600 dark:text-orange-400',
  plain: null,
  colon: null,
};

function JsonHighlighted({ text }: { text: string }) {
  const tokens = useMemo(() => {
    const result: Token[] = [];
    // Split on JSON keys: quoted strings followed by a colon
    const parts = text.split(/("(?:[^"\\]|\\.)*")\s*:/g);

    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 1) {
        // Odd indices are captured JSON keys
        result.push({ type: 'key', value: parts[i] });
        result.push({ type: 'colon', value: ':' });
      } else {
        // Even indices: highlight string values, numbers, booleans, null
        result.push(...tokenizeValues(parts[i]));
      }
    }
    return result;
  }, [text]);

  return (
    <>
      {tokens.map((token, i) => {
        const cls = TOKEN_CLASS[token.type];
        return cls ? (
          <span key={i} className={cls}>
            {token.value}
          </span>
        ) : (
          <span key={i}>{token.value}</span>
        );
      })}
    </>
  );
}

function PingRow({ ping }: { ping: Ping }) {
  const [expanded, setExpanded] = useState(false);
  const hasBody = ping.body !== null && ping.body !== '';

  return (
    <div className="rounded-lg border">
      <div
        className={`grid grid-cols-[1fr_1fr_1fr_auto] gap-4 px-2 py-2 text-sm sm:grid-cols-[1fr_1fr_1fr_1fr_auto] ${hasBody ? 'cursor-pointer select-none' : ''}`}
        onClick={hasBody ? () => setExpanded(!expanded) : undefined}
      >
        <span
          className={
            ping.status === 'success'
              ? 'text-green-600'
              : ping.status === 'start'
                ? 'text-blue-600'
                : 'text-red-600'
          }
        >
          {ping.status === 'success'
            ? 'OK'
            : ping.status === 'start'
              ? 'START'
              : 'FAIL'}
        </span>
        <span>
          <RelativeTime date={ping.receivedAt} />
        </span>
        <span className="text-muted-foreground">
          {ping.duration ? `${ping.duration}ms` : '–'}
        </span>
        <span className="text-muted-foreground hidden truncate sm:block">
          {ping.sourceIp || '–'}
        </span>
        <span className="flex w-5 items-center justify-center">
          {hasBody &&
            (expanded ? (
              <ChevronUp className="text-muted-foreground h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="text-muted-foreground h-3.5 w-3.5" />
            ))}
        </span>
      </div>
      {expanded && hasBody && (
        <div className="border-t px-2 py-2">
          <PingBody body={ping.body!} />
        </div>
      )}
    </div>
  );
}

export function PingsTable({
  initialPings,
  monitorId,
}: {
  initialPings: Ping[];
  monitorId: string;
}) {
  const [allPings, setAllPings] = useState(initialPings);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialPings.length >= PAGE_SIZE);
  const [loading, setLoading] = useState(false);

  // Sync with server data on refresh (reset to page 1)
  useEffect(() => {
    setAllPings(initialPings);
    setPage(1);
    setHasMore(initialPings.length >= PAGE_SIZE);
  }, [initialPings]);

  const loadMore = useCallback(async () => {
    setLoading(true);
    try {
      const nextPage = page + 1;
      const res = await fetch(
        `/api/monitors/${monitorId}/pings?page=${nextPage}`,
      );
      const json = await res.json();
      if (json.data) {
        setAllPings((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const newPings = json.data.filter(
            (p: Ping) => !existingIds.has(p.id),
          );
          return [...prev, ...newPings];
        });
        setPage(nextPage);
        setHasMore(json.hasMore);
      }
    } finally {
      setLoading(false);
    }
  }, [monitorId, page]);

  if (allPings.length === 0) {
    return (
      <div className="text-muted-foreground flex h-20 items-center justify-center">
        No pings yet
      </div>
    );
  }

  const reachedCap = allPings.length >= MAX_INLINE;

  return (
    <div className="space-y-2">
      <div className="text-muted-foreground grid grid-cols-[1fr_1fr_1fr_auto] gap-4 px-2 text-xs font-medium sm:grid-cols-[1fr_1fr_1fr_1fr_auto]">
        <span>Status</span>
        <span>Received</span>
        <span>Duration</span>
        <span className="hidden sm:block">Source IP</span>
        <span className="w-5" />
      </div>
      {allPings.map((ping) => (
        <PingRow key={ping.id} ping={ping} />
      ))}
      {hasMore && (
        <div className="flex justify-center pt-2">
          {reachedCap ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/monitors/${monitorId}/pings`}>
                View full ping history
              </Link>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={loadMore}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Load more'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
