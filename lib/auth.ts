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
    jwt({ token, user }) {
      if (user?.email) {
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.email && session.user) {
        session.user.email = token.email as string;
      }
      // Encode the JWT as JWE so the client can send it to the API as Bearer token.
      // The backend decrypts this with the same NEXTAUTH_SECRET.
      const apiToken = await encode({
        token,
        secret: process.env.AUTH_SECRET!,
        salt: "",
      });
      // @ts-expect-error - extending session with apiToken
      session.apiToken = apiToken;
      return session;
    },
  },
});
