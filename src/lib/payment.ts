import "server-only";
import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { siteUrl } from "@/lib/format";
import { getOrderWithItems } from "@/lib/orders";

/** Stripe est activé dès que STRIPE_SECRET_KEY est renseignée. Sans clé : commandes « non payées », règlement manuel. */
export const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
export const paymentsEnabled = () => !!stripe;

const cents = (n: number) => Math.round(n * 100);

/**
 * Crée une session Stripe Checkout pour la commande et renvoie l'URL de paiement (ou null si Stripe n'est pas configuré).
 * La session expire après 30 min : le webhook `checkout.session.expired` annule alors la commande et libère les originaux.
 */
export async function createPaymentRedirect(orderId: string): Promise<string | null> {
  if (!stripe) return null;
  const o = await getOrderWithItems(orderId);
  if (!o || o.paymentStatus !== "unpaid" || o.status === "cancelled") return null;

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = o.items.map((i) => ({
    quantity: i.quantity,
    price_data: {
      currency: "eur",
      unit_amount: cents(i.unitPrice),
      product_data: {
        name: `${i.artwork.title} — ${i.variant === "original" ? "œuvre originale" : "tirage signé"}`,
        description: i.variant === "original" ? "Pièce unique, signée" : `${i.artwork.format} · papier beaux-arts 310 g/m²`,
      },
    },
  }));
  if (o.shippingCost > 0) {
    lineItems.push({ quantity: 1, price_data: { currency: "eur", unit_amount: cents(o.shippingCost), product_data: { name: "Livraison" } } });
  }

  const base = siteUrl();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    customer_email: o.contactEmail,
    client_reference_id: o.id,
    metadata: { orderId: o.id, orderNumber: o.orderNumber },
    payment_intent_data: { metadata: { orderId: o.id, orderNumber: o.orderNumber }, description: `Commande ${o.orderNumber}` },
    locale: "fr",
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    success_url: `${base}/commande/confirmation/${o.id}?paiement=ok`,
    cancel_url: `${base}/commande/confirmation/${o.id}?paiement=annule`,
  });
  // Id de session enregistré en attendant le PaymentIntent (remplacé par le webhook)
  await db.update(schema.orders).set({ paymentIntentId: session.id }).where(eq(schema.orders.id, o.id));
  return session.url;
}
