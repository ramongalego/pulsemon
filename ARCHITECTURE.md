# PulseMon — Complete Architecture Summary

> Cron job & heartbeat monitoring SaaS. Users create monitors, add a ping URL to their cron jobs/scripts, and get alerted when pings stop arriving.

## Tech Stack

- **Framework:** Next.js 15 (App Router) + TypeScript (strict mode)
- **Database:** PostgreSQL via Neon + Drizzle ORM
- **Cache/Queue:** Upstash Redis (ping tracking) + QStash (scheduled checks)
- **Auth:** Auth.js v5 (GitHub + Google + magic link via Resend)
- **Email:** Resend (transactional alerts + magic links)
- **Payments:** Stripe (subscriptions)
- **UI:** Tailwind CSS + shadcn/ui, dark mode via next-themes
- **Deployed on:** Vercel (Edge Runtime for ping endpoint)

---

## Core Flow

```
User's cron job → GET /api/ping/:slug → Rate limit (1/sec) → Redis (fast) + async Postgres write
                                                                    ↓
QStash (every 60s) → /api/webhooks/qstash → checkMonitors()
                                                    ↓
                                         Reads Redis "last ping" timestamps
                                         Compares against expectedInterval + gracePeriod
                                                    ↓
                                     Late? → Create incident → Dispatch alerts
                                     Recovered? → Dispatch recovery alert → Resolve incident

QStash (daily 3am UTC) → /api/webhooks/cleanup → Delete pings beyond plan retention
```

---

## Database Schema (10 tables)

| Table                    | Purpose                                                                          |
| ------------------------ | -------------------------------------------------------------------------------- |
| **users**                | Accounts with plan (free/starter/pro), Stripe IDs                                |
| **accounts**             | Auth.js OAuth provider links                                                     |
| **sessions**             | Auth.js session tokens                                                           |
| **verificationTokens**   | Auth.js magic link tokens                                                        |
| **monitors**             | Heartbeat monitors (slug, expectedInterval, gracePeriod, status, isPaused, tags) |
| **pings**                | Individual ping records (receivedAt, sourceIp, duration, status, body)           |
| **incidents**            | Downtime events (startedAt, resolvedAt, cause, alertsSent counter)               |
| **alertChannels**        | Alert destinations (email/slack/discord/webhook config as JSONB)                 |
| **monitorAlertChannels** | Many-to-many join: which channels are linked to which monitors                   |
| **apiKeys**              | User API keys for programmatic access (stored as SHA256 hash)                    |

---

## Ping Endpoint (Edge Runtime)

**`GET/POST /api/ping/[monitorSlug]`**

1. **Rate limit** — 1 req/sec per slug via Redis `SET NX EX 1`. Returns 429 on excess.
2. Looks up monitor by slug — Redis cache first (TTL 5min), Postgres fallback
3. If paused, returns `{ ok: true, paused: true }` and exits
4. Parses optional params: `status` (success/fail), `duration` (ms), `body` (POST only, ≤10KB)
5. Writes `ping:{monitorId}:last = now` to Redis (TTL = interval + grace + 60s)
6. Async (non-blocking) Postgres sync:
   - Inserts ping record
   - Updates monitor lastPingAt + status
   - On success ping: dispatches recovery alert **first**, only resolves incident if alert succeeds (prevents silent recovery)
7. Always returns 200 (even on internal errors) so cron jobs don't break. Exception: 429 for rate limit, 404 for unknown slug.

---

## Monitoring Checker

**`checkMonitors()`** — triggered every 60s by QStash

For each active (non-paused, non-new) monitor:

- Reads last ping timestamp from Redis
- Uses `isMonitorLate(lastPing, expectedInterval, gracePeriod, now)` to determine status

| Transition            | Action                                                                                          |
| --------------------- | ----------------------------------------------------------------------------------------------- |
| **OK → Late**         | Create incident, set status='down', dispatch `monitor.down` alert                               |
| **Late → Still Late** | Check `shouldSendReminder()` for escalation (immediate → +1h → +6h → +24h → daily)              |
| **Late → OK**         | Dispatch `monitor.up` alert **first**, resolve incident only if alert succeeds, set status='up' |
| **OK → OK**           | No action                                                                                       |

---

## Alert System

**`dispatchAlerts(monitor, event, incident)`**

1. Queries `monitorAlertChannels` join table for linked channels
2. Falls back to user's default channels if none linked
3. Dispatches to all channels in parallel via `Promise.allSettled()`

| Channel     | How                                                                                                                     |
| ----------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Email**   | Resend API — "[DOWN]/[RECOVERED] {name}" from alerts@pulsemon.dev                                                       |
| **Slack**   | Webhook POST with colored attachment (red=down, green=up)                                                               |
| **Discord** | Webhook POST with colored embed                                                                                         |
| **Webhook** | POST raw AlertEvent JSON to user URL, signed with `X-PulseMon-Signature: sha256=<hex>` (HMAC-SHA256 via Web Crypto API) |

---

## Plan & Billing System

### Plan Limits

| Feature                | Free            | Starter ($9/mo)       | Pro ($19/mo)        |
| ---------------------- | --------------- | --------------------- | ------------------- |
| Monitors               | 30              | 100                   | Unlimited           |
| Min check interval     | 60s             | 30s                   | 10s                 |
| Ping history retention | 7 days          | 30 days               | 90 days             |
| Team members           | 1               | 3                     | 10                  |
| Alert channels         | 2               | 5                     | Unlimited           |
| Channel types          | email + 1 other | email, slack, discord | All (incl. webhook) |

### Enforcement Points

- **Monitor creation:** count limit + interval minimum
- **Monitor update:** interval minimum
- **Alert channel creation:** type allowed + count limit + type diversity limit
- **Ping history API:** filtered by retention days
- **UI:** Plan limit exceeded → dialog with upgrade CTA

### Stripe Integration

Webhook handler at `/api/webhooks/stripe` processes:

- `checkout.session.completed` → sets plan + Stripe IDs
- `customer.subscription.updated` → updates plan from price lookup_key
- `customer.subscription.deleted` → downgrades to free
- `invoice.payment_failed` → logs warning (Stripe auto-retries)

---

## Auth System

- **Auth.js v5** with Drizzle adapter
- **Providers:** GitHub OAuth, Google OAuth, Resend magic link (all conditional on env vars)
- **Middleware:** protects `/dashboard/*` (redirects to `/login`), redirects authenticated users from `/` to `/dashboard`
- **API key auth:** V1 API routes use Bearer token (SHA256 hash lookup)

---

## API Routes

### Session-authenticated (dashboard)

| Method                | Route                        | Purpose                                       |
| --------------------- | ---------------------------- | --------------------------------------------- |
| GET                   | /api/monitors                | List user's monitors                          |
| POST                  | /api/monitors                | Create monitor (plan limits enforced)         |
| PATCH                 | /api/monitors/[id]           | Update monitor                                |
| DELETE                | /api/monitors/[id]           | Delete monitor + Redis cleanup                |
| GET                   | /api/monitors/[id]/pings     | Paginated pings (10/page, retention filtered) |
| GET                   | /api/monitors/[id]/incidents | Paginated incidents (10/page)                 |
| GET                   | /api/monitors/[id]/channels  | Get linked alert channels                     |
| PUT                   | /api/monitors/[id]/channels  | Update channel links                          |
| GET                   | /api/monitors/[id]/status    | Get monitor status                            |
| GET/POST/PATCH/DELETE | /api/alert-channels[/id]     | CRUD alert channels                           |
| GET/POST/DELETE       | /api/api-keys                | Manage API keys                               |

### Webhook endpoints (QStash-authenticated)

| Method | Route                 | Purpose                                                  |
| ------ | --------------------- | -------------------------------------------------------- |
| POST   | /api/webhooks/qstash  | Monitor checker — runs every 60s                         |
| POST   | /api/webhooks/stripe  | Stripe subscription events                               |
| POST   | /api/webhooks/cleanup | Daily ping cleanup — deletes pings beyond plan retention |

### API key-authenticated (V1 programmatic)

| Method           | Route                           | Purpose             |
| ---------------- | ------------------------------- | ------------------- |
| GET              | /api/v1/monitors                | List monitors       |
| POST             | /api/v1/monitors                | Create monitor      |
| GET/PATCH/DELETE | /api/v1/monitors/[id]           | Single monitor CRUD |
| POST             | /api/v1/monitors/[id]/pause     | Pause monitor       |
| POST             | /api/v1/monitors/[id]/resume    | Resume monitor      |
| GET              | /api/v1/monitors/[id]/pings     | Get pings (20/page) |
| GET              | /api/v1/monitors/[id]/incidents | Get incidents       |

---

## Pages

### Dashboard (authenticated)

| Route                                | What it does                                                                                                                                                                                  |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/dashboard`                         | Monitor list with stats cards, filters, sort, pause/resume                                                                                                                                    |
| `/dashboard/monitors/new`            | Create monitor form                                                                                                                                                                           |
| `/dashboard/monitors/[id]`           | Monitor detail: uptime badge, ping URL + code snippets, ping timeline (incident-based), response time chart, pings table, incidents table, config editor, alert channel linker, delete button |
| `/dashboard/monitors/[id]/pings`     | Full paginated ping history (25/page, server-rendered)                                                                                                                                        |
| `/dashboard/monitors/[id]/incidents` | Full paginated incident history (25/page, server-rendered)                                                                                                                                    |
| `/dashboard/alerts`                  | Alert channel management                                                                                                                                                                      |
| `/dashboard/integrations`            | Integration overview cards                                                                                                                                                                    |
| `/dashboard/settings`                | Profile, plan badge, API keys, delete account                                                                                                                                                 |

### Marketing (public)

| Route      | What it does                                                               |
| ---------- | -------------------------------------------------------------------------- |
| `/`        | Landing page: hero, features, competitor comparison, pricing, FAQ, JSON-LD |
| `/pricing` | Plan cards, feature comparison table, FAQ                                  |
| `/docs`    | Documentation/quick-start guide                                            |
| `/login`   | Auth.js sign-in (GitHub, Google, magic link)                               |

---

## Key Components

### Dashboard

- **PingTimeline** — 50-slot visual timeline. Green=pings received, Red=incident overlap (from DB), Grey=idle. Gradient (red→green) for slots where an incident was resolved. Time range tabs appear progressively as monitor ages.
- **ResponseTimeChart** — Duration chart for last 50 pings
- **PingsTable / IncidentsTable** — Paginated tables with load-more (cap at 50, then "View full history" link)
- **MonitorConfigEditor** — Edit name, interval, grace period, tags + delete with confirmation dialog
- **PauseResumeButton** — Optimistic toggle with loading state
- **PingWatcher** — Auto-refresh side-effect component for new/active monitors (30s interval)
- **AlertChannelManager** — CRUD for email/slack/discord/webhook channels
- **MonitorChannelLinker** — Toggle which channels are linked to a monitor
- **PlanLimitDialog** — Modal with upgrade CTA when plan limits exceeded

### Shared

- **RelativeTime** — Client-side "X ago" with 1-second tick
- **StatusBadge** — Colored badge (up=green, down=red, paused=amber, new=grey)
- **ThemeToggle** — Dark/light mode toggle (sun/moon icon)
- **Providers** — ThemeProvider + TooltipProvider + Toaster (sonner)

---

## Testing

**Framework:** Vitest (33 tests across 3 files)

| File                   | Tests | What                                                                |
| ---------------------- | ----- | ------------------------------------------------------------------- |
| checker.test.ts        | 17    | `isMonitorLate()` (9) + `shouldSendReminder()` (8) — pure functions |
| ping-endpoint.test.ts  | 9     | Edge ping endpoint: cache hit/miss, 404, paused, params, resilience |
| stripe-webhook.test.ts | 7     | Signature verification, plan updates, downgrades, unknown events    |

**Strategy:** Only high-stakes, silent-failure areas. Skip UI, CRUD, auth, landing page.

---

## Environment Variables

| Variable                           | Purpose                              |
| ---------------------------------- | ------------------------------------ |
| DATABASE_URL                       | Neon PostgreSQL connection           |
| NEXT_PUBLIC_APP_URL                | Frontend URL (for ping URLs, emails) |
| UPSTASH_REDIS_REST_URL + TOKEN     | Redis for ping tracking + cache      |
| QSTASH_CURRENT/NEXT_SIGNING_KEY    | QStash webhook verification          |
| RESEND_API_KEY                     | Email alerts + magic links           |
| STRIPE_SECRET_KEY + WEBHOOK_SECRET | Payment processing                   |
| AUTH_SECRET                        | Auth.js session encryption           |
| AUTH_GITHUB_ID + SECRET            | GitHub OAuth (optional)              |
| AUTH_GOOGLE_ID + SECRET            | Google OAuth (optional)              |

---

## Features NOT Yet Implemented (Placeholder/Planned)

These are listed in CLAUDE.md Phase 5 and are not built:

- **Team/org support** — multi-user access to monitors (team members limit exists in plan but not enforced)
- **PulseMon self-monitoring status page** — `/status` page exists as a basic health check (DB + Redis ping) but isn't meaningful: self-hosted status pages fail when the app fails, and it has no historical data or real monitoring. Post-launch: set up internal PulseMon monitors on PulseMon's own endpoints, then build a proper status page as a showcase of the public status pages feature
- **One-click deploy integrations** — Vercel/Render/Fly integration templates
- **SDK packages** — npm/pip packages for easier ping integration
- **Public status pages** — per-user public status page showing monitor uptime

## Known Scaling Considerations

- **Checker fan-out** — `checkMonitors()` processes all active monitors in a single QStash invocation. At scale (thousands of monitors), this will hit Vercel's serverless timeout (10s default, 30s pro). When needed, batch monitors and fan out into multiple QStash calls (e.g., chunk by 100 monitors, publish N messages to QStash in parallel).
- **Ping cleanup at scale** — if daily cleanup is deleting millions of rows, consider Postgres table partitioning by month instead of row-level deletes.

## Design Decisions

- **Uptime calculation window** — Uses `max(30 days ago, monitor.createdAt)` as the measurement window. A 50-minute-old monitor with 10 minutes of downtime shows ~80% uptime, not 99.97%. Returns `null` (displays "Waiting for data") until the first ping arrives, avoiding misleading 0% on brand-new monitors.
- **Ping rate limit returns 429** — The ping endpoint rate limits at 1 req/sec per slug via Redis `SET NX EX 1`. Returns HTTP 429 on excess. Some cron frameworks auto-retry on non-2xx which could cause a retry loop. If this becomes an issue with specific clients, switch to `200 + { ok: true, throttled: true }` instead. For now 429 is correct semantics — anything faster than 1/sec isn't a legitimate cron job.
- **Grace period smart defaults** — When `gracePeriod` is omitted on monitor creation, the server applies `defaultGracePeriod(expectedInterval)` which scales: 30s for ≤1min intervals, 60s for ≤5min, 5min for ≤1hr, 15min for ≤1day, 30min for weekly+. The create monitor UI auto-populates this but lets the user override. Explicit values are always respected.
- **Recovery alert resilience** — Both the ping endpoint (async sync) and the checker dispatch recovery alerts _before_ resolving the incident in the DB. If alert delivery fails, the incident stays open so the next checker cycle retries. This prevents silent recoveries where the user never gets notified.

## Known TODOs in Code

- **Webhook signature verification docs** — HMAC signing is implemented (`X-PulseMon-Signature: sha256=<hex>`) but the docs/quick-start page needs verification snippets in Node.js and Python so users can actually use it
- **Plan downgrade handling** — if a user downgrades, existing monitors/channels beyond the new limit remain functional (no retroactive enforcement)
