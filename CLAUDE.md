# PulseMon - Cron Job & Heartbeat Monitoring

## Tech Stack

- Next.js 15 (App Router) + TypeScript (strict mode)
- PostgreSQL via Neon + Drizzle ORM
- Upstash Redis (ping tracking) + QStash (scheduled checks)
- Auth.js v5 (GitHub + Google + magic link)
- Resend (transactional email)
- Tailwind CSS + shadcn/ui
- Stripe (payments)
- Deployed on Vercel

## Key Architecture

- Ping endpoint runs on Vercel Edge Runtime, writes to Redis (not Postgres) for speed
- Background process syncs pings to Postgres for history
- QStash runs 60s checks comparing "last ping time" against expected intervals
- Drizzle ORM (not Prisma) for lighter cold starts

## Code Conventions

- TypeScript strict mode, no `any`, no `@ts-ignore`
- Path aliases: `@/lib/...`, `@/components/...`
- Server components by default, `'use client'` only when needed
- Named exports (except page.tsx/layout.tsx)
- Zod for all API inputs and form data
- Consistent API responses: `{ data: T, error: null }` or `{ data: null, error: { code, message } }`
- All styling via Tailwind classes, no inline styles
- Inter font via next/font
- Dark mode support via Tailwind `dark:` variant

## Commands

- `npm run dev` - Start dev server
- `npm test` - Run tests (vitest)
- `npm run test:watch` - Run tests in watch mode
- `npm run db:generate` - Generate DB migrations
- `npm run db:migrate` - Run migrations
- `npm run db:studio` - Open Drizzle Studio
- `npx tsc --noEmit` - Type check

## Environment Setup

See `.env.example` for required environment variables.
User needs to:

1. Create a Neon database and set DATABASE_URL
2. Create Upstash Redis + QStash and set tokens
3. Create GitHub/Google OAuth apps for Auth.js
4. Create Resend account and set API key
5. Create Stripe account and set keys
6. Generate AUTH_SECRET with `openssl rand -base64 32`

---

## Implementation Progress

### Phase 1: Foundation

- [x] 1. Next.js project setup with TypeScript strict mode, Tailwind, shadcn/ui
- [x] 2. Drizzle schema + Neon connection + initial migration
- [x] 3. Auth.js setup (GitHub + Google + magic link)
- [x] 4. Basic dashboard layout (sidebar, header, empty states)

### Phase 2: Core Monitoring

- [x] 5. Monitor CRUD (create, list, edit, delete)
- [x] 6. Ping endpoint (Edge Runtime + Redis write)
- [x] 7. Background Postgres sync for ping history
- [x] 8. QStash checker + monitor status updates
- [x] 9. Email alerts via Resend (down + recovery)

### Phase 3: Dashboard Polish

- [x] 10. Monitor detail page with ping timeline visualisation
- [x] 11. Real-time "waiting for first ping" onboarding UX
- [x] 12. Slack + Discord webhook integrations
- [x] 13. Custom webhook alert channel
- [x] 14. API key management

### Phase 4: Landing Page & Growth

- [x] 15. Landing page with full SEO
- [x] 16. Pricing page + Stripe integration
- [x] 17. Documentation / quick-start guide
- [x] 18. Status page for PulseMon itself

### Phase 5: Expansion (Later)

- [ ] 19. Team/org support
- [ ] 20. Public status pages per user
- [ ] 21. One-click Vercel/Render/Fly integrations
- [ ] 22. SDK packages (npm, pip)

### Testing Strategy

Test only high-stakes, silent-failure areas:

- [x] **Monitoring checker logic** - `isMonitorLate`, `shouldSendReminder` (pure functions, high stakes)
- [x] **Ping endpoint** - Redis updates, correct responses, error resilience
- [x] **Stripe webhook handling** - subscription created/cancelled/payment failed

Skip tests for: UI components, CRUD operations, auth flows, landing page
