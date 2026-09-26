import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/CheckoutForm";
import { db, schema } from "@/db";
import { getCart } from "@/lib/cart";
import { eur } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Commande", robots: { index: false } };

export default async function CheckoutPage() {
  const [cart, s, user] = await Promise.all([getCart(), getSettings(), getCurrentUser()]);
  if (cart.count === 0) redirect("/panier");
  const address = user
    ? await db.query.addresses.findFirst({
        where: and(eq(schema.addresses.userId, user.id), eq(schema.addresses.isArchived, false)),
        orderBy: [desc(schema.addresses.isDefault)],
      })
    : null;

  return (
    <div className="wrap section">
      <h1>Commande</h1>
      {!user && (
        <p className="notice" style={{ marginBottom: 24 }}>
          Déjà client ? <Link href="/compte/connexion?callbackUrl=/commande">Connectez-vous</Link> pour retrouver vos adresses. Sinon,
          continuez simplement en invité.
        </p>
      )}
      <div className="grid-2" style={{ alignItems: "start" }}>
        <CheckoutForm
          subtotal={cart.subtotal}
          rates={s}
          email={user?.email}
          address={address}
        />
        <aside className="card pad">
          <h3>Récapitulatif</h3>
          {cart.lines
            .filter((l) => l.available)
            .map((l) => (
              <div key={l.id} className="spread small" style={{ padding: "6px 0" }}>
                <span>
                  {l.quantity} × {l.artwork.title} — {l.variant === "original" ? "original" : "tirage"}
                </span>
                <strong>{eur(l.unitPrice * l.quantity)}</strong>
              </div>
            ))}
          <p className="small" style={{ marginTop: 12 }}>
            <Link href="/panier">Modifier le panier</Link>
          </p>
        </aside>
      </div>
    </div>
  );
}
