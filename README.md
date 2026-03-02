# PulseMon

Cron job and heartbeat monitoring for developers. Know the second your cron jobs stop running.

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up external services

You need accounts for these services (all have generous free tiers):

#### Neon (PostgreSQL) - DONE

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project
3. Copy the connection string (looks like `postgresql://user:pass@host/dbname?sslmode=require`)
4. Set `DATABASE_URL` in `.env.local`

#### Upstash (Redis + QStash) - DONE

1. Go to [upstash.com](https://upstash.com) and create a free account
2. Create a Redis database, copy the REST URL and token
3. Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in `.env.local`
4. Go to QStash in the Upstash console, copy the signing keys
5. Set `QSTASH_CURRENT_SIGNING_KEY` and `QSTASH_NEXT_SIGNING_KEY` in `.env.local`

#### Auth.js (Authentication) - DONE

1. Generate a secret: `openssl rand -base64 32`
2. Set `AUTH_SECRET` in `.env.local`

##### GitHub OAuth - DONE

1. Go to [github.com/settings/developers](https://github.com/settings/developers)
2. Create a new OAuth App
   - Homepage URL: `http://localhost:3000`
   - Callback URL: `http://localhost:3000/api/auth/callback/github`
3. Set `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET` in `.env.local`

##### Google OAuth - DONE

1. Go to [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)
2. Create an OAuth 2.0 Client ID (Web application)
   - Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
3. Set `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` in `.env.local`

#### Resend (Email)

1. Go to [resend.com](https://resend.com) and create a free account
2. Create an API key
3. Set `RESEND_API_KEY` in `.env.local`

#### Stripe (Payments)

1. Go to [stripe.com](https://stripe.com) and create an account
2. Get your test mode secret key from the dashboard
3. Set `STRIPE_SECRET_KEY` in `.env.local`
4. Set up a webhook endpoint pointing to `/api/webhooks/stripe`
5. Set `STRIPE_WEBHOOK_SECRET` in `.env.local`

### 3. Set up the database - DONE

```bash
npm run db:generate   # Generate migration files
npm run db:migrate    # Apply migrations to your Neon database
```

### 4. Local testing

The checker that detects missed pings is normally run by QStash in production. For local dev, use the dev-only endpoint:

```bash
# Send a ping
curl http://localhost:3000/api/ping/your-slug

# Manually trigger the checker (simulates what QStash does)
curl -X POST http://localhost:3000/api/dev/check

# Or use the test script (sends pings, waits, triggers checker)
./scripts/test-failure.sh your-slug
```

## Production Deployment

### Deploy to Vercel

1. Push your repo to GitHub
2. Import the project in [vercel.com](https://vercel.com)
3. Add all environment variables from `.env.local` to Vercel's project settings
4. Update `NEXT_PUBLIC_APP_URL` to your production domain (e.g. `https://pulsemon.dev`)
5. Update OAuth callback URLs in GitHub/Google to use your production domain
6. Deploy

### Set up QStash scheduled checks

This is the critical piece — QStash calls your checker endpoint every 60 seconds to detect missed pings and fire alerts.

**Option A: Upstash Console (easiest)**

1. Go to [console.upstash.com/qstash](https://console.upstash.com/qstash)
2. Click "Create Schedule"
3. Set the destination URL: `https://your-domain.com/api/webhooks/qstash`
4. Set the cron expression: `* * * * *` (every minute)
5. Save

**Option B: cURL**

```bash
curl -X POST https://qstash.upstash.io/v2/schedules \
  -H "Authorization: Bearer YOUR_QSTASH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "https://your-domain.com/api/webhooks/qstash",
    "cron": "* * * * *"
  }'
```

**Option C: Upstash SDK**

```typescript
import { Client } from '@upstash/qstash';

const qstash = new Client({ token: process.env.QSTASH_TOKEN! });

await qstash.schedules.create({
  destination: 'https://your-domain.com/api/webhooks/qstash',
  cron: '* * * * *',
});
```

### Set up QStash ping cleanup (daily)

Old pings are automatically deleted based on each user's plan retention (free=7 days, starter=30 days, pro=90 days). This runs daily via QStash.

**Option A: Upstash Console**

1. Go to [console.upstash.com/qstash](https://console.upstash.com/qstash)
2. Click "Create Schedule"
3. Set the destination URL: `https://your-domain.com/api/webhooks/cleanup`
4. Set the cron expression: `0 3 * * *` (daily at 3:00 AM UTC)
5. Save

**Option B: cURL**

```bash
curl -X POST https://qstash.upstash.io/v2/schedules \
  -H "Authorization: Bearer YOUR_QSTASH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "https://your-domain.com/api/webhooks/cleanup",
    "cron": "0 3 * * *"
  }'
```

### Set up Stripe webhook

1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
4. Copy the signing secret and set `STRIPE_WEBHOOK_SECRET` in Vercel

### Verify domain for Resend (email)

1. Go to [resend.com/domains](https://resend.com/domains)
2. Add your production domain and follow the DNS verification steps
3. Update the `from` address in `src/lib/auth.ts` from `onboarding@resend.dev` to `noreply@your-domain.com`

## Project Structure

```
src/
  app/
    (marketing)/     - Landing page, pricing (public)
    (dashboard)/     - App dashboard (authenticated)
    api/
      ping/[slug]    - Heartbeat endpoint (Edge Runtime)
      monitors/      - Monitor CRUD API
      webhooks/      - Stripe + QStash handlers
      auth/          - Auth.js routes
  components/
    ui/              - shadcn/ui components
    dashboard/       - Dashboard components
    marketing/       - Landing page components
    shared/          - Shared components
  lib/
    db/              - Drizzle schema + connection
    monitoring/      - Checker logic, alerter, constants
    auth.ts          - Auth.js config
    redis.ts         - Upstash Redis client
    stripe.ts        - Stripe client
    resend.ts        - Resend email client
```

## Architecture

- **Ping endpoint** runs on Vercel Edge Runtime. Writes to Upstash Redis for speed, syncs to Postgres in the background.
- **QStash** runs a scheduled check every 60 seconds. Compares last ping time against expected intervals and fires alerts when monitors miss their window.
- **Alerts** dispatch to email (Resend), Slack, Discord, and custom webhooks. Escalation: immediate, 1h, 6h, 24h.
