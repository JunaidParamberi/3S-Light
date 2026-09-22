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
        employeeId: { label: 'Employee ID', type: 'text' },
        pin: { label: 'PIN', type: 'password' },
      },
      async authorize(credentials) {
        const employeeId = credentials?.employeeId as string | undefined;
        const pin = credentials?.pin as string | undefined;
        if (!employeeId || !pin) return null;

        const [profile] = await db
          .select()
          .from(profiles)
          .where(eq(profiles.employeeId, employeeId.trim()))
          .limit(1);

        if (!profile?.pinHash) return null;
        if (!verifyPin(pin, profile.pinHash)) return null;

        return {
          id: profile.id,
          name: profile.name,
          role: profile.role,
        };
      },
    }),
  ],
});
