"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/db";
import { sendMail } from "@/lib/email";
import { CARRIERS, slugify, trackingUrl } from "@/lib/format";
import { requireAdmin } from "@/lib/session";
import { artworkSchema, fieldErrors, type FormState } from "@/lib/validation";
import { ShippingEmail } from "@/emails/templates";

/* ---------- Bandeau & réglages ---------- */
const settingsSchema = z.object({
  bannerText: z.string().trim().max(200),
  bannerActive: z.coerce.boolean(),
  freeShippingThreshold: z.coerce.number().min(0).max(100000),
  shippingFr: z.coerce.number().min(0).max(1000),
  shippingEu: z.coerce.number().min(0).max(1000),
  shippingWorld: z.coerce.number().min(0).max(1000),
  printLeadTime: z.string().trim().min(1, "Champ requis").max(60),
});

export async function updateSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = settingsSchema.safeParse({ ...Object.fromEntries(formData), bannerActive: formData.get("bannerActive") === "on" });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const values = { ...parsed.data, updatedAt: new Date() };
  await db.insert(schema.siteSettings).values({ id: 1, ...values }).onConflictDoUpdate({ target: schema.siteSettings.id, set: values });
  revalidatePath("/", "layout");
  return { ok: true, message: "Réglages enregistrés." };
}

export async function toggleBanner(formData: FormData) {
  await requireAdmin();
  const active = formData.get("active") === "1";
  await db.insert(schema.siteSettings).values({ id: 1, bannerActive: active }).onConflictDoUpdate({ target: schema.siteSettings.id, set: { bannerActive: active, updatedAt: new Date() } });
  revalidatePath("/", "layout");
}

/* ---------- Œuvres ---------- */
export async function saveArtwork(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = (formData.get("id") as string) || null;
  const parsed = artworkSchema.safeParse({
    ...Object.fromEntries(formData),
    isOriginalSold: formData.get("isOriginalSold") === "on",
    isPublished: formData.get("isPublished") === "on",
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Merci de vérifier le formulaire." };
  const { slug: rawSlug, ...data } = parsed.data;
  const slug = rawSlug || slugify(data.title);
  if (!slug) return { errors: { slug: "Slug invalide" } };

  const clash = await db.query.artworks.findFirst({ where: eq(schema.artworks.slug, slug), columns: { id: true } });
  if (clash && clash.id !== id) return { errors: { slug: "Ce slug est déjà utilisé par une autre œuvre." } };

  if (id) {
    await db.update(schema.artworks).set({ ...data, slug }).where(eq(schema.artworks.id, id));
  } else {
    await db.insert(schema.artworks).values({ ...data, slug });
  }
  revalidatePath("/", "layout");
  redirect("/admin/oeuvres?saved=1");
}

export async function deleteArtwork(formData: FormData) {
  await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.orderItems).where(eq(schema.orderItems.artworkId, id));
  if (n > 0) {
    // Déjà vendue : on conserve l'historique des commandes, l'œuvre est seulement dépubliée
    await db.update(schema.artworks).set({ isPublished: false }).where(eq(schema.artworks.id, id));
  } else {
    await db.delete(schema.artworks).where(eq(schema.artworks.id, id));
  }
  revalidatePath("/", "layout");
  redirect("/admin/oeuvres");
}

/* ---------- Commandes ---------- */
const orderUpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "processing", "shipped", "completed", "cancelled"]),
  trackingNumber: z.string().trim().max(60).optional().default(""),
  trackingCarrier: z.enum(Object.keys(CARRIERS) as [string, ...string[]]).optional().default("colissimo"),
  paymentStatus: z.enum(["unpaid", "paid", "refunded"]),
});

export async function updateOrder(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = orderUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const f = parsed.data;
  if (f.status === "shipped" && !f.trackingNumber) return { errors: { trackingNumber: "Numéro de suivi requis pour passer en « Expédiée »." } };

  const order = await db.query.orders.findFirst({ where: eq(schema.orders.id, f.id), with: { items: true, shippingAddress: true } });
  if (!order) return { message: "Commande introuvable." };

  const becameShipped = f.status === "shipped" && (order.status !== "shipped" || order.trackingNumber !== f.trackingNumber);
  const becameCancelled = f.status === "cancelled" && order.status !== "cancelled";

  await db.transaction(async (tx) => {
    await tx
      .update(schema.orders)
      .set({
        status: f.status,
        trackingNumber: f.trackingNumber || null,
        trackingCarrier: f.trackingNumber ? f.trackingCarrier : null,
        paymentStatus: f.paymentStatus,
        updatedAt: new Date(),
      })
      .where(eq(schema.orders.id, f.id));
    if (becameCancelled) {
      // Annulation : les originaux redeviennent disponibles
      const originals = order.items.filter((i) => i.variant === "original").map((i) => i.artworkId);
      if (originals.length) await tx.update(schema.artworks).set({ isOriginalSold: false }).where(inArray(schema.artworks.id, originals));
    }
  });

  if (becameShipped) {
    const carrier = CARRIERS[f.trackingCarrier] ?? CARRIERS.colissimo;
    await sendMail({
      to: order.contactEmail,
      subject: `Votre commande ${order.orderNumber} est expédiée — Lavis Studio`,
      react: ShippingEmail({
        orderNumber: order.orderNumber,
        customerName: order.shippingAddress.firstName,
        carrier: carrier.label,
        trackingNumber: f.trackingNumber,
        trackingUrl: trackingUrl(f.trackingCarrier, f.trackingNumber),
      }),
    });
  }
  revalidatePath("/admin", "layout");
  revalidatePath("/", "layout");
  return { ok: true, message: becameShipped ? "Commande expédiée : e-mail de suivi envoyé au client." : "Commande mise à jour." };
}

/* ---------- Sur-mesure ---------- */
export async function updateCommissionStatus(formData: FormData) {
  await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  const status = z.enum(["new", "in_discussion", "quote_sent", "declined", "completed"]).parse(formData.get("status"));
  await db.update(schema.commissionRequests).set({ status }).where(and(eq(schema.commissionRequests.id, id)));
  revalidatePath("/admin", "layout");
}
