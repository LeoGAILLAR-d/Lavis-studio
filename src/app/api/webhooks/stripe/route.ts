/* Webhook Stripe : valide le paiement ou libère la commande. URL à déclarer dans Stripe : /api/webhooks/stripe */
import type Stripe from "stripe";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { cancelUnpaidOrder, sendOrderEmails } from "@/lib/orders";
import { stripe } from "@/lib/payment";

export const runtime = "nodejs";

async function markPaid(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId;
  if (!orderId) return;
  const paymentIntent = typeof session.payment_intent === "string" ? session.payment_intent : (session.payment_intent?.id ?? session.id);
  const updated = await db
    .update(schema.orders)
    .set({ paymentStatus: "paid", paymentIntentId: paymentIntent, updatedAt: new Date() })
    .where(and(eq(schema.orders.id, orderId), eq(schema.orders.paymentStatus, "unpaid")))
    .returning({ id: schema.orders.id, status: schema.orders.status });
  // Idempotent : Stripe peut renvoyer le même événement ; les e-mails ne partent qu'une fois
  if (updated.length) {
    if (updated[0].status === "cancelled") {
      // Paiement reçu sur une commande déjà annulée : on la réactive
      await db.update(schema.orders).set({ status: "pending" }).where(eq(schema.orders.id, orderId));
    }
    await sendOrderEmails(orderId, { paid: true });
    revalidatePath("/admin", "layout");
  }
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return NextResponse.json({ error: "Stripe non configuré" }, { status: 503 });

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, req.headers.get("stripe-signature") ?? "", secret);
  } catch {
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object;
        if (session.payment_status === "paid") await markPaid(session);
        break;
      }
      case "checkout.session.expired":
      case "checkout.session.async_payment_failed": {
        const orderId = event.data.object.metadata?.orderId;
        if (orderId) await cancelUnpaidOrder(orderId);
        revalidatePath("/", "layout");
        break;
      }
      case "charge.refunded": {
        const pi = event.data.object.payment_intent;
        const id = typeof pi === "string" ? pi : pi?.id;
        if (id && event.data.object.refunded) {
          await db.update(schema.orders).set({ paymentStatus: "refunded", updatedAt: new Date() }).where(eq(schema.orders.paymentIntentId, id));
        }
        break;
      }
    }
  } catch (e) {
    console.error("[stripe webhook]", event.type, e);
    return NextResponse.json({ error: "Erreur de traitement" }, { status: 500 }); // Stripe réessaiera
  }
  return NextResponse.json({ received: true });
}
