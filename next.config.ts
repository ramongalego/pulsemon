import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV === 'development';

const cspDirectives = [
  "default-src 'self'",
  // 'unsafe-inline' required for Next.js App Router inline RSC hydration scripts (nonce-based CSP out of scope)
  // 'unsafe-eval' required by React in development mode for debugging features
  // cloud.umami.is: Umami analytics script loaded in app/layout.tsx
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://cloud.umami.is`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  // Umami analytics sends tracking data to cloud.umami.is and api-gateway.umami.dev
  "connect-src 'self' https://cloud.umami.is https://api-gateway.umami.dev",
  "font-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
];

const nextConfig: NextConfig = {
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: cspDirectives.join('; '),
        },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()',
        },
      ],
    },
  ],
};

export default nextConfig;
