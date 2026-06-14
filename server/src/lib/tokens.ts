import crypto from 'crypto';

/**
 * Secret used to sign non-JWT tokens (e.g. unsubscribe links).
 * Reuses JWT_SECRET so there is a single source of trust to configure.
 */
function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not configured');
  return secret;
}

/**
 * Deterministic, unforgeable token for a subscriber's unsubscribe link.
 * HMAC-SHA256 means it cannot be derived from the subscriber id alone —
 * only someone holding JWT_SECRET can produce a valid token.
 */
export function generateUnsubscribeToken(subscriberId: string): string {
  return crypto.createHmac('sha256', getSecret()).update(subscriberId).digest('hex');
}

/** Constant-time comparison to avoid leaking validity via timing. */
export function verifyUnsubscribeToken(subscriberId: string, token: string): boolean {
  if (!token) return false;
  const expected = generateUnsubscribeToken(subscriberId);
  const a = Buffer.from(expected);
  const b = Buffer.from(token);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
