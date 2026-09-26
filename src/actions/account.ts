"use server";

import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq, gt, isNull } from "drizzle-orm";
import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { signIn, signOut } from "@/auth";
import { db, schema } from "@/db";
import { sendMail } from "@/lib/email";
import { siteUrl } from "@/lib/format";
import { requireUser } from "@/lib/session";
import { addressSchema, emailSchema, fieldErrors, passwordSchema, registerSchema, type FormState } from "@/lib/validation";
import { PasswordResetEmail } from "@/emails/templates";

function safeCallback(url: FormDataEntryValue | null) {
  const s = typeof url === "string" ? url : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : "/compte";
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: safeCallback(formData.get("callbackUrl")),
    });
  } catch (e) {
    if (e instanceof AuthError) return { message: "E-mail ou mot de passe incorrect." };
    throw e; // redirection Next.js
  }
}

export async function register(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const { email, password, firstName, lastName } = parsed.data;
  const exists = await db.query.users.findFirst({ where: eq(schema.users.email, email), columns: { id: true } });
  if (exists) return { errors: { email: "Un compte existe déjà avec cette adresse." } };
  await db
    .insert(schema.users)
    .values({ email, firstName, lastName, passwordHash: await bcrypt.hash(password, 12) });
  await signIn("credentials", { email, password, redirectTo: "/compte" });
}

export async function logout() {
  await signOut({ redirectTo: "/" });
}

const sha = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  const done = { ok: true, message: "Si un compte existe pour cette adresse, un e-mail de réinitialisation vient d'être envoyé." };
  if (!parsed.success) return { errors: { email: "Adresse e-mail invalide" } };
  const user = await db.query.users.findFirst({ where: eq(schema.users.email, parsed.data) });
  if (!user) return done;
  const token = crypto.randomBytes(32).toString("base64url");
  await db.insert(schema.passwordResetTokens).values({ userId: user.id, tokenHash: sha(token), expiresAt: new Date(Date.now() + 3600_000) });
  await sendMail({
    to: user.email,
    subject: "Réinitialisation de votre mot de passe — Lavis Studio",
    react: PasswordResetEmail({ url: `${siteUrl()}/compte/reinitialiser/${token}` }),
  });
  return done;
}

export async function resetPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const token = String(formData.get("token") ?? "");
  const pw = passwordSchema.safeParse(formData.get("password"));
  if (!pw.success) return { errors: { password: pw.error.issues[0].message } };
  const row = await db.query.passwordResetTokens.findFirst({
    where: and(eq(schema.passwordResetTokens.tokenHash, sha(token)), isNull(schema.passwordResetTokens.usedAt), gt(schema.passwordResetTokens.expiresAt, new Date())),
  });
  if (!row) return { message: "Ce lien a expiré ou a déjà été utilisé. Faites une nouvelle demande." };
  await db.transaction(async (tx) => {
    await tx.update(schema.users).set({ passwordHash: await bcrypt.hash(pw.data, 12) }).where(eq(schema.users.id, row.userId));
    await tx.update(schema.passwordResetTokens).set({ usedAt: new Date() }).where(eq(schema.passwordResetTokens.userId, row.userId));
  });
  redirect("/compte/connexion?reset=1");
}

export async function saveAddress(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = addressSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const makeDefault = formData.get("isDefault") === "on";
  await db.transaction(async (tx) => {
    if (makeDefault) await tx.update(schema.addresses).set({ isDefault: false }).where(eq(schema.addresses.userId, user.id));
    await tx.insert(schema.addresses).values({ ...parsed.data, userId: user.id, isDefault: makeDefault });
  });
  revalidatePath("/compte/adresses");
  return { ok: true, message: "Adresse enregistrée." };
}

const idSchema = z.string().uuid();

export async function setDefaultAddress(formData: FormData) {
  const user = await requireUser();
  const id = idSchema.parse(formData.get("id"));
  await db.transaction(async (tx) => {
    await tx.update(schema.addresses).set({ isDefault: false }).where(eq(schema.addresses.userId, user.id));
    await tx.update(schema.addresses).set({ isDefault: true }).where(and(eq(schema.addresses.id, id), eq(schema.addresses.userId, user.id)));
  });
  revalidatePath("/compte/adresses");
}

export async function removeAddress(formData: FormData) {
  const user = await requireUser();
  const id = idSchema.parse(formData.get("id"));
  // Archivage plutôt que suppression : l'adresse peut être liée à une commande
  await db
    .update(schema.addresses)
    .set({ isArchived: true, isDefault: false })
    .where(and(eq(schema.addresses.id, id), eq(schema.addresses.userId, user.id)));
  revalidatePath("/compte/adresses");
}
