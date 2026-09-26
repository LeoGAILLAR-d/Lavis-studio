import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { OrderForm } from "@/components/admin/OrderForm";
import { db, schema } from "@/db";
import { dateFr, eur, ORDER_STATUS, trackingUrl } from "@/lib/format";
import { SHIPPING_ZONES, type ShippingZone } from "@/lib/shipping";

export const metadata = { title: "Commande" };

export default async function OrderAdmin({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const o = await db.query.orders.findFirst({
    where: eq(schema.orders.id, id),
    with: { shippingAddress: true, items: { with: { artwork: true } } },
  });
  if (!o) notFound();
  const a = o.shippingAddress;
  const subtotal = o.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  return (
    <>
      <p className="small sans">
        <Link href="/admin/commandes">← Commandes</Link>
      </p>
      <div className="spread">
        <h1 style={{ margin: 0 }}>{o.orderNumber}</h1>
        <span className={`status ${o.status}`}>{ORDER_STATUS[o.status]}</span>
      </div>
      <p className="muted">Passée le {dateFr(o.createdAt)}{o.userId ? " · client avec compte" : " · commande invité"}</p>

      <div className="grid-2" style={{ alignItems: "start", marginTop: 16 }}>
        <div className="card pad">
          <h3>Destinataire</h3>
          <p>
            {a.firstName} {a.lastName}
            <br />
            {a.addressLine1}
            {a.addressLine2 && (
              <>
                <br />
                {a.addressLine2}
              </>
            )}
            <br />
            {a.postalCode} {a.city}
            <br />
            {a.country} ({SHIPPING_ZONES[o.shippingZone as ShippingZone] ?? o.shippingZone})
            <br />
            <a href={`mailto:${o.contactEmail}`}>{o.contactEmail}</a>
            {a.phone && (
              <>
                <br />
                {a.phone}
              </>
            )}
          </p>
          <h3>Articles</h3>
          {o.items.map((i) => (
            <div key={i.id} className="spread" style={{ padding: "4px 0" }}>
              <span>
                {i.quantity} × {i.artwork.title} — <strong>{i.variant === "original" ? "ORIGINAL" : `tirage ${i.artwork.format}`}</strong>
              </span>
              <span>{eur(i.unitPrice * i.quantity)}</span>
            </div>
          ))}
          <div className="totals" style={{ marginTop: 12 }}>
            <span>Sous-total</span>
            <span>{eur(subtotal)}</span>
            <span>Frais de port</span>
            <span>{eur(o.shippingCost)}</span>
            <span className="grand">Total</span>
            <span className="grand">{eur(o.totalAmount)}</span>
          </div>
          {o.trackingNumber && (
            <p style={{ marginTop: 12 }}>
              Suivi :{" "}
              <a href={trackingUrl(o.trackingCarrier, o.trackingNumber)} target="_blank" rel="noopener noreferrer">
                {o.trackingNumber}
              </a>
            </p>
          )}
        </div>
        <div className="card pad">
          <h3>Traitement</h3>
          <OrderForm o={o} />
        </div>
      </div>
    </>
  );
}
