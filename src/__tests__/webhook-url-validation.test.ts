import { describe, it, expect } from 'vitest';
import { createAlertChannelSchema } from '@/lib/validations/alert-channel';

function isAccepted(url: string): boolean {
  const result = createAlertChannelSchema.safeParse({
    type: 'webhook',
    config: { url },
    isDefault: false,
  });
  return result.success;
}

describe('safeWebhookUrl SSRF protection', () => {
  describe('accepts valid public URLs', () => {
    it('accepts a normal HTTPS URL', () => {
      expect(isAccepted('https://hooks.example.com/abc')).toBe(true);
    });

    it('accepts a URL with a path and query', () => {
      expect(isAccepted('https://api.example.com/path?token=xyz')).toBe(true);
    });

    it('accepts a public IPv4 address', () => {
      expect(isAccepted('https://8.8.8.8/hook')).toBe(true);
    });
  });

  describe('rejects insecure or unsafe URLs', () => {
    it('rejects HTTP (non-TLS)', () => {
      expect(isAccepted('http://example.com/hook')).toBe(false);
    });

    it('rejects localhost', () => {
      expect(isAccepted('https://localhost/hook')).toBe(false);
    });

    it('rejects subdomains of .localhost', () => {
      expect(isAccepted('https://api.localhost/hook')).toBe(false);
    });

    it('rejects .local mDNS hostnames', () => {
      expect(isAccepted('https://my-server.local/hook')).toBe(false);
    });

    it('rejects .internal hostnames', () => {
      expect(isAccepted('https://kube.internal/hook')).toBe(false);
    });

    it('rejects loopback IPv4', () => {
      expect(isAccepted('https://127.0.0.1/hook')).toBe(false);
      expect(isAccepted('https://127.10.20.30/hook')).toBe(false);
    });

    it('rejects RFC1918 private ranges', () => {
      expect(isAccepted('https://10.0.0.1/hook')).toBe(false);
      expect(isAccepted('https://192.168.1.1/hook')).toBe(false);
      expect(isAccepted('https://172.16.0.1/hook')).toBe(false);
      expect(isAccepted('https://172.31.255.255/hook')).toBe(false);
    });

    it('rejects link-local IPv4', () => {
      expect(isAccepted('https://169.254.169.254/hook')).toBe(false);
      expect(isAccepted('https://169.254.1.1/hook')).toBe(false);
    });

    it('rejects 0.0.0.0 and 0/8', () => {
      expect(isAccepted('https://0.0.0.0/hook')).toBe(false);
      expect(isAccepted('https://0.1.2.3/hook')).toBe(false);
    });

    it('rejects CGNAT 100.64.0.0/10', () => {
      expect(isAccepted('https://100.64.0.1/hook')).toBe(false);
      expect(isAccepted('https://100.127.255.255/hook')).toBe(false);
    });

    it('rejects multicast 224.0.0.0/4', () => {
      expect(isAccepted('https://224.0.0.1/hook')).toBe(false);
      expect(isAccepted('https://239.255.255.255/hook')).toBe(false);
    });

    it('rejects benchmark range 198.18.0.0/15', () => {
      expect(isAccepted('https://198.18.0.1/hook')).toBe(false);
      expect(isAccepted('https://198.19.255.255/hook')).toBe(false);
    });

    it('rejects IPv6 loopback', () => {
      expect(isAccepted('https://[::1]/hook')).toBe(false);
    });

    it('rejects IPv6 link-local', () => {
      expect(isAccepted('https://[fe80::1]/hook')).toBe(false);
    });

    it('rejects IPv6 unique local (fc00::/7)', () => {
      expect(isAccepted('https://[fc00::1]/hook')).toBe(false);
      expect(isAccepted('https://[fd12:3456::1]/hook')).toBe(false);
    });

    it('rejects IPv4-mapped IPv6 (could embed loopback)', () => {
      expect(isAccepted('https://[::ffff:127.0.0.1]/hook')).toBe(false);
    });
  });
});
