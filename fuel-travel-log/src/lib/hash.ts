import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

// Employee PIN hashing — scrypt with a per-user salt. Never store raw PINs.

export function hashPin(pin: string): string {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(pin, salt, 64);
  return `${salt}:${derived.toString('hex')}`;
}

export function verifyPin(pin: string, stored: string): boolean {
  const [salt, hashHex] = stored.split(':');
  if (!salt || !hashHex) return false;
  const derived = scryptSync(pin, salt, 64);
  const expected = Buffer.from(hashHex, 'hex');
  if (expected.length !== derived.length) return false;
  return timingSafeEqual(derived, expected);
}
