import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db, schema } from "@/db";
import { eur } from "@/lib/format";

export const metadata: Metadata = { title: "Commande enregistrée", robots: { index: false } };

export default async function ConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const order = await db.query.orders.findFirst({ where: eq(schema.orders.id, id), with: { items: { with: { artwork: true } } } });
  if (!order) notFound();

  return (
    <div className="wrap section" style={{ maxWidth: 720 }}>
      <h1>Merci, votre commande est enregistrée</h1>
      <p className="notice ok">
        Référence <strong>{order.orderNumber}</strong> · un e-mail de confirmation vient d&apos;être envoyé à {order.contactEmail}.
      </p>
      <div className="card pad" style={{ marginTop: 24 }}>
        {order.items.map((i) => (
          <div key={i.id} className="spread" style={{ padding: "6px 0" }}>
            <span>
              {i.quantity} × {i.artwork.title} — {i.variant === "original" ? "œuvre originale" : "tirage signé"}
            </span>
            <strong>{eur(i.unitPrice * i.quantity)}</strong>
          </div>
        ))}
        <div className="spread" style={{ padding: "6px 0" }}>
          <span>Livraison</span>
          <span>{order.shippingCost === 0 ? "Offerte" : eur(order.shippingCost)}</span>
        </div>
        <div className="spread sans" style={{ fontWeight: 800, fontSize: 20, borderTop: "2px solid var(--ink)", paddingTop: 8 }}>
          <span>Total</span>
          <span>{eur(order.totalAmount)}</span>
        </div>
      </div>
      <p style={{ marginTop: 24 }}>
        L&apos;atelier vous contacte très vite pour le règlement, puis prépare votre envoi (sous 3 jours ouvrés). Vous recevrez le numéro de
        suivi par e-mail.
      </p>
      <Link href="/" className="btn ghost">
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
