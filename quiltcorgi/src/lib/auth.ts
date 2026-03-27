import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, accounts, verificationTokens } from '@/db/schema';

// JWT strategy is used — sessions table is not needed by the adapter.
// The adapter type expects a sessions table with sessionToken as PK,
// but our schema uses id as PK. Since JWT makes sessions unused, cast is safe.
/* eslint-disable @typescript-eslint/no-explicit-any */
const adapter = DrizzleAdapter(
  db as any,
  {
    usersTable: users,
    accountsTable: accounts,
    verificationTokensTable: verificationTokens,
  } as any
);
/* eslint-enable @typescript-eslint/no-explicit-any */

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin',
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user.role as 'free' | 'pro' | 'admin') ?? 'free';
      }

      // Allow session updates to refresh role (e.g., after Stripe upgrade)
      if (trigger === 'update' && session?.role) {
        token.role = session.role;
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // Set default role for new OAuth users
      if (user.id) {
        await db.update(users).set({ role: 'free' }).where(eq(users.id, user.id));
      }
    },
  },
});
