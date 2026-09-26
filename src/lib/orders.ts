import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { ARTIST_EMAIL, sendMail } from "@/lib/email";
import { siteUrl } from "@/lib/format";
import { SHIPPING_ZONES, type ShippingZone } from "@/lib/shipping";
import { OrderConfirmationEmail, SaleAlertEmail, type OrderMailData } from "@/emails/templates";

export async function getOrderWithItems(orderId: string) {
  return db.query.orders.findFirst({
    where: eq(schema.orders.id, orderId),
    with: { shippingAddress: true, items: { with: { artwork: true } } },
  });
}

/** E-mails de commande : confirmation au client + alerte de vente à l'artiste. */
export async function sendOrderEmails(orderId: string, { paid }: { paid: boolean }) {
  const o = await getOrderWithItems(orderId);
  if (!o) return;
  const a = o.shippingAddress;
  const mail: OrderMailData = {
    orderNumber: o.orderNumber,
    customerName: a.firstName,
    items: o.items.map((i) => ({ title: i.artwork.title, variant: i.variant, quantity: i.quantity, unitPrice: i.unitPrice })),
    shippingCost: o.shippingCost,
    totalAmount: o.totalAmount,
    address: [
      `${a.firstName} ${a.lastName}`,
      a.addressLine1,
      a.addressLine2 ?? "",
      `${a.postalCode} ${a.city}`,
      `${a.country} (${SHIPPING_ZONES[o.shippingZone as ShippingZone] ?? o.shippingZone})`,
    ].filter(Boolean),
    url: o.userId ? `${siteUrl()}/compte` : `${siteUrl()}/commande/confirmation/${o.id}`,
    paid,
  };
  await Promise.all([
    sendMail({
      to: o.contactEmail,
      subject: `Commande ${o.orderNumber} ${paid ? "confirmée" : "enregistrée"} — Lavis Studio`,
      react: OrderConfirmationEmail({ o: mail }),
    }),
    sendMail({
      to: ARTIST_EMAIL,
      subject: `💶 ${paid ? "Commande payée" : "Nouvelle commande (non payée)"} ${o.orderNumber} (${o.totalAmount.toFixed(2)} €)`,
      react: SaleAlertEmail({ o: mail, email: o.contactEmail, adminUrl: `${siteUrl()}/admin/commandes/${o.id}` }),
      replyTo: o.contactEmail,
    }),
  ]);
}

/** Annule une commande non payée et remet ses originaux en vente (paiement abandonné ou expiré). */
export async function cancelUnpaidOrder(orderId: string) {
  await db.transaction(async (tx) => {
    const [o] = await tx
      .update(schema.orders)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(and(eq(schema.orders.id, orderId), eq(schema.orders.paymentStatus, "unpaid"), eq(schema.orders.status, "pending")))
      .returning({ id: schema.orders.id });
    if (!o) return;
    const items = await tx.query.orderItems.findMany({ where: eq(schema.orderItems.orderId, orderId) });
    const originals = items.filter((i) => i.variant === "original").map((i) => i.artworkId);
    if (originals.length) await tx.update(schema.artworks).set({ isOriginalSold: false }).where(inArray(schema.artworks.id, originals));
  });
}
