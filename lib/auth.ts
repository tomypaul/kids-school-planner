import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { UpstashRedisAdapter } from "@auth/upstash-redis-adapter";
import { redis } from "./redis";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: UpstashRedisAdapter(redis),
  providers: [
    Google({
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope:
            "openid email profile https://www.googleapis.com/auth/calendar",
        },
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        return token;
      }
      if (token.expiresAt && Date.now() < (token.expiresAt as number) * 1000) {
        return token;
      }
      // Access token expired — refresh it
      try {
        const res = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: process.env.AUTH_GOOGLE_ID!,
            client_secret: process.env.AUTH_GOOGLE_SECRET!,
            grant_type: "refresh_token",
            refresh_token: token.refreshToken as string,
          }),
        });
        const newTokens = await res.json();
        if (!res.ok) throw newTokens;
        token.accessToken = newTokens.access_token;
        token.expiresAt =
          Math.floor(Date.now() / 1000) + newTokens.expires_in;
        token.error = undefined;
      } catch {
        token.error = "RefreshTokenError";
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      session.error = token.error as string | undefined;
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
});
