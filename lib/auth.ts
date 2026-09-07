import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  checkRateLimit,
  clearAttempts,
  registerFailedAttempt,
} from "@/lib/rateLimit";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password ?? "";
        if (!email || !password) return null;

        const ip =
          (req?.headers?.["x-forwarded-for"] as string | undefined)
            ?.split(",")[0]
            ?.trim() || "unknown";
        const key = `login:${email}:${ip}`;

        const limit = checkRateLimit(key);
        if (!limit.allowed) {
          throw new Error(
            `RATE_LIMITED:${limit.retryAfterSeconds}`,
          );
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          registerFailedAttempt(key);
          return null;
        }

        const valid = await compare(password, user.passwordHash);
        if (!valid) {
          registerFailedAttempt(key);
          return null;
        }

        clearAttempts(key);
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role ?? "ADMIN";
        token.uid = (user as { id?: string }).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.uid as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
};
