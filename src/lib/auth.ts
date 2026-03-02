import NextAuth from 'next-auth';
import type { Provider } from 'next-auth/providers';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';
import Resend from 'next-auth/providers/resend';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/lib/db';
import { users, accounts, sessions, verificationTokens } from '@/lib/db/schema';
import { resend } from '@/lib/resend';

const FROM = 'PulseMon <onboarding@resend.dev>';

const providers: Provider[] = [
  Resend({
    apiKey: process.env.RESEND_API_KEY,
    from: FROM,
    async sendVerificationRequest({ identifier: email, url }) {
      await resend.emails.send({
        from: FROM,
        to: email,
        subject: 'Sign in to PulseMon',
        html: magicLinkEmail(url),
      });
    },
  }),
];

function magicLinkEmail(url: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:12px;overflow:hidden;">
        <!-- Header -->
        <tr><td style="background-color:#18181b;padding:32px 40px;text-align:center;">
          <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">PulseMon</span>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px;">
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">Sign in to PulseMon</h1>
          <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#52525b;">
            Click the button below to securely sign in. This link expires in 24 hours and can only be used once.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="${url}" target="_blank" style="display:inline-block;background-color:#18181b;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:8px;">
                Sign in
              </a>
            </td></tr>
          </table>
          <p style="margin:28px 0 0;font-size:13px;line-height:1.5;color:#71717a;">
            If the button doesn&rsquo;t work, copy and paste this link into your browser:
          </p>
          <p style="margin:8px 0 0;font-size:13px;line-height:1.5;color:#a1a1aa;word-break:break-all;">${url}</p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:24px 40px;border-top:1px solid #f4f4f5;">
          <p style="margin:0;font-size:12px;color:#a1a1aa;text-align:center;">
            You received this email because someone requested a sign-in link for PulseMon. If this wasn&rsquo;t you, you can safely ignore it.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
  providers.push(GitHub);
}

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(Google);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers,
  pages: {
    signIn: '/login',
    verifyRequest: '/auth/verify-request',
  },
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});
