import "server-only";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db, schema } from "@/db";

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await db.query.users.findFirst({ where: eq(schema.users.id, session.user.id) });
  return user ?? null;
}

/** À appeler dans CHAQUE page et Server Action d'administration (le rôle est revérifié en base). */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/compte/connexion?callbackUrl=/admin");
  return user;
}

export async function requireUser(callbackUrl = "/compte") {
  const user = await getCurrentUser();
  if (!user) redirect(`/compte/connexion?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  return user;
}
