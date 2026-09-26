import type { NextAuthConfig } from "next-auth";

// Configuration compatible "edge" (utilisée par le middleware) : pas d'accès base de données ici.
const PUBLIC_ACCOUNT_PAGES = ["/compte/connexion", "/compte/inscription", "/compte/mot-de-passe-oublie", "/compte/reinitialiser"];

export const authConfig = {
  pages: { signIn: "/compte/connexion" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  trustHost: true,
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const path = nextUrl.pathname;
      if (path.startsWith("/admin")) {
        if (auth?.user?.role === "admin") return true;
        return Response.redirect(new URL(`/compte/connexion?callbackUrl=${encodeURIComponent(path)}`, nextUrl));
      }
      if (path.startsWith("/compte") && !PUBLIC_ACCOUNT_PAGES.some((p) => path.startsWith(p))) {
        return !!auth?.user;
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as "client" | "admin";
      return session;
    },
  },
} satisfies NextAuthConfig;
