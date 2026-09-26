import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { authConfig } from "./auth.config";
import { db, schema } from "@/db";

const credentials = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1).max(200) });

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(raw) {
        const parsed = credentials.safeParse(raw);
        if (!parsed.success) return null;
        const user = await db.query.users.findFirst({ where: eq(schema.users.email, parsed.data.email) });
        // Comparaison exécutée même si l'utilisateur n'existe pas (limite l'énumération par le temps de réponse)
        const ok = await bcrypt.compare(parsed.data.password, user?.passwordHash ?? "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva");
        if (!user || !ok) return null;
        return { id: user.id, email: user.email, name: `${user.firstName} ${user.lastName}`, role: user.role };
      },
    }),
  ],
});
