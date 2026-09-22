import { eq } from 'drizzle-orm';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { db } from './db';
import { profiles } from './db/schema';
import { verifyPin } from './lib/hash';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const username = credentials?.username as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!username || !password) return null;

        const [profile] = await db
          .select()
          .from(profiles)
          .where(eq(profiles.username, username.trim()))
          .limit(1);

        // Accounts are created by a super admin — no account, no login.
        if (!profile?.passwordHash) return null;
        if (!profile.active) return null; // deactivated leaver
        if (!verifyPin(password, profile.passwordHash)) return null;

        return {
          id: profile.id,
          name: profile.name,
          role: profile.role,
        };
      },
    }),
  ],
});
