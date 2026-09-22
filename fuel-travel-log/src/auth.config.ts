import type { NextAuthConfig } from 'next-auth';
import type { UserRole } from '@/types/next-auth';

// Edge-safe base config (no database imports) — shared by middleware and the full app config.
export const authConfig = {
  // Providers are attached in src/auth.ts (Credentials needs the DB)
  providers: [],
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
