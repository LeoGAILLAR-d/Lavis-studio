import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db, schema } from "@/db";
import { eur } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { paymentsEnabled } from "@/lib/payment";
import { resumePayment } from "@/actions/payment";

export const metadata: Metadata = { title: "Commande enregistrée", robots: { index: false } };

export const dynamic = "force-dynamic";

export default async function ConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paiement?: string }>;
}) {
  const { id } = await params;
  const { paiement } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const order = await db.query.orders.findFirst({ where: eq(schema.orders.id, id), with: { items: { with: { artwork: true } } } });
  if (!order) notFound();

  const online = paymentsEnabled();
  const { printLeadTime } = await getSettings();
  const hasPrints = order.items.some((i) => i.variant === "print");
  const delay = hasPrints ? `sous ${printLeadTime} (les tirages sont imprimés, signés et numérotés à la main pour vous)` : "sous 3 jours ouvrés";
  const paid = order.paymentStatus === "paid";
  const cancelled = order.status === "cancelled";
  const awaiting = online && !paid && !cancelled;

  let title = "Merci, votre commande est enregistrée";
  if (paid) title = "Merci, votre paiement est confirmé";
  else if (cancelled) title = "Commande annulée";
  else if (awaiting && paiement === "ok") title = "Paiement en cours de confirmation…";
  else if (awaiting) title = "Paiement non finalisé";

  return (
    <div className="wrap section" style={{ maxWidth: 720 }}>
      <h1>{title}</h1>
      <p className={`notice ${cancelled ? "err" : "ok"}`}>
        Référence <strong>{order.orderNumber}</strong>
        {paid && <> · un e-mail de confirmation vient d&apos;être envoyé à {order.contactEmail}.</>}
        {!online && !cancelled && <> · un e-mail de confirmation vient d&apos;être envoyé à {order.contactEmail}.</>}
        {cancelled && <> · le paiement n&apos;a pas été finalisé à temps. Les œuvres sont de nouveau disponibles dans la galerie.</>}
      </p>
      {awaiting && paiement === "ok" && (
        <p className="small muted" style={{ marginTop: 12 }}>
          Stripe nous transmet la confirmation dans quelques secondes. <a href={`/commande/confirmation/${order.id}?paiement=ok`}>Actualiser</a>
        </p>
      )}
      {awaiting && paiement !== "ok" && (
        <form action={resumePayment} style={{ marginTop: 16 }}>
          <input type="hidden" name="orderId" value={order.id} />
          <p>Votre commande est réservée pendant 30 minutes. Vous pouvez reprendre le paiement :</p>
          <button className="btn">Payer {eur(order.totalAmount)}</button>
        </form>
      )}
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
      {!cancelled && (
        <p style={{ marginTop: 24 }}>
          {paid || online
            ? `Votre commande part ${delay} après paiement. Vous recevrez le numéro de suivi par e-mail.`
            : `L'atelier vous contacte très vite pour le règlement ; votre commande part ensuite ${delay}. Vous recevrez le numéro de suivi par e-mail.`}
        </p>
      )}
      <Link href="/" className="btn ghost">
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
