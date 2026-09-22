#!/usr/bin/env node
// Creates the first super-admin account. Idempotent — safe to run twice.
// Usage: npm run seed:admin [username] [name] [password]
// Without a password argument, a random 6-digit PIN is generated and printed ONCE.

import { randomBytes, randomInt, scryptSync, randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';

// Load .env.local (Next.js-style file; plain Node doesn't read it itself)
const envPath = new URL('../.env.local', import.meta.url);
if (!existsSync(envPath)) {
  console.error('✗ .env.local not found — run `neon env pull` first.');
  process.exit(1);
}
for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^"|"$/g, '');
}
if (!process.env.DATABASE_URL) {
  console.error('✗ DATABASE_URL missing in .env.local');
  process.exit(1);
}

const username = process.argv[2] || process.env.SUPER_ADMIN_USERNAME || 'admin';
const name = process.argv[3] || 'Super Admin';
let password = process.argv[4];
const generated = !password;
if (generated) password = String(randomInt(100000, 999999)); // 6-digit PIN

// Same format as src/lib/hash.ts — scrypt, hex salt:hex digest
const salt = randomBytes(16).toString('hex');
const passwordHash = `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;

const sql = neon(process.env.DATABASE_URL);

const existing = await sql`SELECT id FROM profiles WHERE username = ${username}`;
if (existing.length > 0) {
  console.log(`• Super admin "${username}" already exists — nothing to do.`);
  process.exit(0);
}

const id = randomUUID();
await sql`
  INSERT INTO profiles (id, role, name, username, password_hash, active)
  VALUES (${id}, 'super_admin', ${name}, ${username}, ${passwordHash}, true)
`;

console.log('');
console.log('✅ Super admin created');
console.log(`   Username: ${username}`);
console.log(`   Password: ${password}${generated ? '  (generated — store it now, it is shown only once)' : ''}`);
console.log('');
console.log('   Next: sign in, then create employee accounts from the admin screen.');
