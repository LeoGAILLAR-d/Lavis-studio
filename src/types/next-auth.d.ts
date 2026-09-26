import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role?: "client" | "admin";
  }
  interface Session {
    user: { id: string; role: "client" | "admin" } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: "client" | "admin";
  }
}
