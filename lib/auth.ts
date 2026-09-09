import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { encode } from "next-auth/jwt";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
  callbacks: {
    async signIn({ user }) {
      if (user.email && API_URL) {
        try {
          await fetch(`${API_URL}/auth/upsert`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-internal-secret": process.env.INTERNAL_SECRET || "",
            },
            body: JSON.stringify({
              email: user.email,
              name: user.name ?? null,
              avatar: user.image ?? null,
            }),
          });
        } catch (err) {
          console.error("[auth] upsertUser failed, allowing sign-in anyway:", err);
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        token.email = user.email;
      }
      // Mint the API JWE once and persist it in the JWT cookie. Re-encoding
      // per session() call produced a DIFFERENT string on every session
      // refetch (random IV/jti), which cascaded into new tokenized audio
      // URLs and reset playback to 0 whenever the tab regained focus.
      // Re-mint daily; the JWE itself is valid for 30 days.
      const REFRESH_MS = 24 * 60 * 60 * 1000;
      const mintedAt = (token.apiTokenMintedAt as number) || 0;
      if (!token.apiToken || Date.now() - mintedAt > REFRESH_MS) {
        const { apiToken: _a, apiTokenMintedAt: _b, ...payload } = token as Record<string, unknown>;
        token.apiToken = await encode({
          token: payload,
          secret: process.env.AUTH_SECRET!,
          salt: "",
        });
        token.apiTokenMintedAt = Date.now();
      }
      return token;
    },
    async session({ session, token }) {
      if (token.email && session.user) {
        session.user.email = token.email as string;
      }
      // @ts-expect-error - extending session with apiToken
      session.apiToken = token.apiToken;
      return session;
    },
  },
});
