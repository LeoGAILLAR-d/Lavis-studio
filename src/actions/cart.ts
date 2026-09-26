"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { ensureCartId, getCartId } from "@/lib/cart";
import type { FormState } from "@/lib/validation";

const addSchema = z.object({
  artworkId: z.string().uuid(),
  variant: z.enum(["original", "print"]),
  quantity: z.coerce.number().int().min(1).max(10).default(1),
});

export async function addToCart(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = addSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { message: "Sélection invalide." };
  const { artworkId, variant, quantity } = parsed.data;

  const art = await db.query.artworks.findFirst({ where: eq(schema.artworks.id, artworkId) });
  if (!art || !art.isPublished) return { message: "Cette œuvre n'est plus disponible." };
  if (variant === "original" && (art.originalPrice == null || art.isOriginalSold)) {
    return { message: "L'original n'est plus disponible." };
  }

  const cartId = await ensureCartId();
  const existing = await db.query.cartItems.findFirst({
    where: and(eq(schema.cartItems.cartId, cartId), eq(schema.cartItems.artworkId, artworkId), eq(schema.cartItems.variant, variant)),
  });
  if (existing) {
    if (variant === "original") return { message: "L'original est déjà dans votre panier." };
    await db
      .update(schema.cartItems)
      .set({ quantity: Math.min(10, existing.quantity + quantity) })
      .where(eq(schema.cartItems.id, existing.id));
  } else {
    await db.insert(schema.cartItems).values({ cartId, artworkId, variant, quantity: variant === "original" ? 1 : quantity });
  }
  await db.update(schema.carts).set({ updatedAt: new Date() }).where(eq(schema.carts.id, cartId));
  revalidatePath("/", "layout");
  return { ok: true, message: variant === "original" ? "Original ajouté au panier." : "Tirage ajouté au panier." };
}

const lineSchema = z.object({ lineId: z.string().uuid(), quantity: z.coerce.number().int().min(0).max(10).optional() });

export async function updateCartLine(formData: FormData) {
  const parsed = lineSchema.safeParse(Object.fromEntries(formData));
  const cartId = await getCartId();
  if (!parsed.success || !cartId) return;
  const { lineId, quantity } = parsed.data;
  const where = and(eq(schema.cartItems.id, lineId), eq(schema.cartItems.cartId, cartId));
  if (!quantity) {
    await db.delete(schema.cartItems).where(where);
  } else {
    const line = await db.query.cartItems.findFirst({ where });
    if (line && line.variant === "print") await db.update(schema.cartItems).set({ quantity }).where(where);
  }
  revalidatePath("/", "layout");
}
