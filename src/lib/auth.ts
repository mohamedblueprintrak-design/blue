/**
 * @module auth
 * @description NextAuth.js Configuration — PART of the Dual Authentication System
 *
 * ARCHITECTURE OVERVIEW — Dual Authentication System:
 * ═══════════════════════════════════════════════════════
 *
 * This application uses TWO complementary authentication mechanisms:
 *
 * 1. NextAuth.js (this file — src/lib/auth.ts)
 *    - Used by: Server Components, getServerSession() calls
 *    - Token: NextAuth JWT (stored in NEXTAUTH_SECRET)
 *    - Session: Accessible via useSession() / getServerSession()
 *    - Purpose: SSR page authentication, session management for UI
 *
 * 2. Custom JWT with jose (src/lib/auth/auth-service.ts)
 *    - Used by: API routes, middleware, client-side auth state
 *    - Token: Custom JWT stored in 'blue_token' cookie
 *    - Session: Accessible via cookie parsing / middleware verification
 *    - Purpose: API authentication, middleware route protection, RBAC
 *
 * IMPORTANT: The middleware (src/middleware.ts) uses the CUSTOM JWT (jose)
 * for route protection, NOT NextAuth. This is because NextAuth's middleware
 * helper doesn't support the fine-grained RBAC we need.
 *
 * When a user logs in via /api/auth/login, a custom JWT (blue_token) is set.
 * The NextAuth session is created separately if needed for SSR pages.
 *
 * JWT_SECRET vs NEXTAUTH_SECRET:
 * - JWT_SECRET: Used by the custom jose JWT system (min 32 chars)
 * - NEXTAUTH_SECRET: Used by NextAuth.js for its own JWT encryption
 * - In production, BOTH must be set to different secure values
 * ═══════════════════════════════════════════════════════
 */

import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from 'bcryptjs';
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "البريد الإلكتروني", type: "email" },
        password: { label: "كلمة المرور", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          return null;
        }

        if (!user.isActive) {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        // Update last login
        await db.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.avatar = user.avatar;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role as string;
        session.user.avatar = token.avatar as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
