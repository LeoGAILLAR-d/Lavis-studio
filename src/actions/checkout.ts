"use server";

import { and, desc, eq, like } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { getCart } from "@/lib/cart";
import { getSettings } from "@/lib/settings";
import { getCurrentUser } from "@/lib/session";
import { shippingCost, SHIPPING_ZONES } from "@/lib/shipping";
import { checkoutSchema, fieldErrors, type FormState } from "@/lib/validation";
import { ARTIST_EMAIL, sendMail } from "@/lib/email";
import { OrderConfirmationEmail, SaleAlertEmail, type OrderMailData } from "@/emails/templates";
import { siteUrl } from "@/lib/format";
import { createPaymentRedirect } from "@/lib/payment";

class CheckoutError extends Error {}

async function nextOrderNumber(tx: Pick<typeof db, "select">) {
  const year = new Date().getFullYear();
  const prefix = `LAVIS-${year}-`;
  const [last] = await tx
    .select({ n: schema.orders.orderNumber })
    .from(schema.orders)
    .where(like(schema.orders.orderNumber, `${prefix}%`))
    .orderBy(desc(schema.orders.orderNumber))
    .limit(1);
  const n = last ? parseInt(last.n.slice(prefix.length), 10) + 1 : 1;
  return prefix + String(n).padStart(4, "0");
}

export async function placeOrder(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = checkoutSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Merci de vérifier le formulaire." };
  const f = parsed.data;

  const user = await getCurrentUser();
  const cart = await getCart();
  const lines = cart.lines.filter((l) => l.available);
  if (!cart.id || lines.length === 0) return { message: "Votre panier est vide." };
  if (lines.length !== cart.lines.length) return { message: "Une œuvre de votre panier n'est plus disponible : retirez-la pour continuer." };

  const settings = await getSettings();
  const shipping = shippingCost(f.zone, cart.subtotal, settings);
  const total = Math.round((cart.subtotal + shipping) * 100) / 100;
  const email = user?.email ?? f.email;

  let order: { id: string; orderNumber: string } | null = null;
  for (let attempt = 0; attempt < 3 && !order; attempt++) {
    try {
      order = await db.transaction(async (tx) => {
        // Verrouillage des originaux : échoue si un autre acheteur vient de le prendre
        for (const l of lines.filter((l) => l.variant === "original")) {
          const locked = await tx
            .update(schema.artworks)
            .set({ isOriginalSold: true })
            .where(and(eq(schema.artworks.id, l.artwork.id), eq(schema.artworks.isOriginalSold, false)))
            .returning({ id: schema.artworks.id });
          if (locked.length === 0) throw new CheckoutError(`L'original « ${l.artwork.title} » vient d'être vendu.`);
        }

        const [address] = await tx
          .insert(schema.addresses)
          .values({
            userId: user && f.saveAddress ? user.id : null,
            firstName: f.firstName,
            lastName: f.lastName,
            addressLine1: f.addressLine1,
            addressLine2: f.addressLine2,
            postalCode: f.postalCode,
            city: f.city,
            country: f.country,
            phone: f.phone,
            isArchived: !(user && f.saveAddress),
          })
          .returning({ id: schema.addresses.id });

        const orderNumber = await nextOrderNumber(tx);
        const [o] = await tx
          .insert(schema.orders)
          .values({
            orderNumber,
            userId: user?.id ?? null,
            guestEmail: user ? null : f.email,
            contactEmail: email,
            shippingAddressId: address.id,
            shippingZone: f.zone,
            shippingCost: shipping,
            totalAmount: total,
          })
          .returning({ id: schema.orders.id, orderNumber: schema.orders.orderNumber });

        await tx.insert(schema.orderItems).values(
          lines.map((l) => ({ orderId: o.id, artworkId: l.artwork.id, variant: l.variant, quantity: l.quantity, unitPrice: l.unitPrice })),
        );
        await tx.delete(schema.cartItems).where(eq(schema.cartItems.cartId, cart.id!));
        return o;
      });
    } catch (e) {
      if (e instanceof CheckoutError) return { message: e.message };
      const code = (e as { code?: string; cause?: { code?: string } }).cause?.code ?? (e as { code?: string }).code;
      if (code === "23505" && attempt < 2) continue; // collision de numéro de commande : on réessaie
      console.error("[checkout]", e);
      return { message: "Une erreur est survenue, votre commande n'a pas été enregistrée. Réessayez dans un instant." };
    }
  }
  if (!order) return { message: "Une erreur est survenue, réessayez dans un instant." };

  const mail: OrderMailData = {
    orderNumber: order.orderNumber,
    customerName: f.firstName,
    items: lines.map((l) => ({ title: l.artwork.title, variant: l.variant, quantity: l.quantity, unitPrice: l.unitPrice })),
    shippingCost: shipping,
    totalAmount: total,
    address: [
      `${f.firstName} ${f.lastName}`,
      f.addressLine1,
      f.addressLine2 ?? "",
      `${f.postalCode} ${f.city}`,
      `${f.country} (${SHIPPING_ZONES[f.zone]})`,
    ].filter(Boolean),
    url: user ? `${siteUrl()}/compte` : undefined,
  };
  await Promise.all([
    sendMail({ to: email, subject: `Commande ${order.orderNumber} enregistrée — Lavis Studio`, react: OrderConfirmationEmail({ o: mail }) }),
    sendMail({
      to: ARTIST_EMAIL,
      subject: `💶 Nouvelle commande ${order.orderNumber} (${total.toFixed(2)} €)`,
      react: SaleAlertEmail({ o: mail, email, adminUrl: `${siteUrl()}/admin/commandes/${order.id}` }),
      replyTo: email,
    }),
  ]);

  revalidatePath("/", "layout");
  const paymentUrl = await createPaymentRedirect({ id: order.id, orderNumber: order.orderNumber, totalAmount: total });
  redirect(paymentUrl ?? `/commande/confirmation/${order.id}`);
}
