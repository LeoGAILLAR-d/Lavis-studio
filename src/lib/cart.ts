import "server-only";
import { cookies } from "next/headers";
import { and, desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db, schema } from "@/db";

export const CART_COOKIE = "lavis_cart";

/** Retrouve l'id du panier courant (cookie, sinon dernier panier du compte connecté). */
export async function getCartId(): Promise<string | null> {
  const jar = await cookies();
  const id = jar.get(CART_COOKIE)?.value;
  if (id && /^[0-9a-f-]{36}$/i.test(id)) {
    const cart = await db.query.carts.findFirst({ where: eq(schema.carts.id, id), columns: { id: true } });
    if (cart) return cart.id;
  }
  const session = await auth();
  if (session?.user?.id) {
    const cart = await db.query.carts.findFirst({
      where: eq(schema.carts.userId, session.user.id),
      orderBy: desc(schema.carts.updatedAt),
      columns: { id: true },
    });
    if (cart) return cart.id;
  }
  return null;
}

/** Crée le panier si besoin (uniquement dans une Server Action : écrit un cookie). */
export async function ensureCartId(): Promise<string> {
  const existing = await getCartId();
  const session = await auth();
  const jar = await cookies();
  let id = existing;
  if (!id) {
    const [cart] = await db.insert(schema.carts).values({ userId: session?.user?.id ?? null }).returning({ id: schema.carts.id });
    id = cart.id;
  } else if (session?.user?.id) {
    await db.update(schema.carts).set({ userId: session.user.id, updatedAt: new Date() }).where(eq(schema.carts.id, id));
  }
  jar.set(CART_COOKIE, id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 90, path: "/" });
  return id;
}

export type CartLine = {
  id: string;
  variant: "original" | "print";
  quantity: number;
  unitPrice: number;
  available: boolean;
  artwork: { id: string; title: string; slug: string; imageUrl: string; altText: string; format: string };
};

/** Panier avec prix recalculés depuis la base (jamais depuis le navigateur). */
export async function getCart(): Promise<{ id: string | null; lines: CartLine[]; subtotal: number; count: number }> {
  const id = await getCartId();
  if (!id) return { id: null, lines: [], subtotal: 0, count: 0 };
  const items = await db.query.cartItems.findMany({ where: eq(schema.cartItems.cartId, id), with: { artwork: true } });
  const lines: CartLine[] = items.map((i) => {
    const a = i.artwork;
    const isOriginal = i.variant === "original";
    const unitPrice = isOriginal ? (a.originalPrice ?? 0) : a.printPrice;
    const available = a.isPublished && (!isOriginal || (a.originalPrice != null && !a.isOriginalSold));
    return {
      id: i.id,
      variant: i.variant,
      quantity: isOriginal ? 1 : i.quantity,
      unitPrice,
      available,
      artwork: { id: a.id, title: a.title, slug: a.slug, imageUrl: a.imageUrl, altText: a.altText, format: a.format },
    };
  });
  const valid = lines.filter((l) => l.available);
  return {
    id,
    lines,
    subtotal: valid.reduce((s, l) => s + l.unitPrice * l.quantity, 0),
    count: valid.reduce((s, l) => s + l.quantity, 0),
  };
}

export async function cartHasOriginal(artworkId: string) {
  const id = await getCartId();
  if (!id) return false;
  const row = await db.query.cartItems.findFirst({
    where: and(eq(schema.cartItems.cartId, id), eq(schema.cartItems.artworkId, artworkId), eq(schema.cartItems.variant, "original")),
    columns: { id: true },
  });
  return !!row;
}
