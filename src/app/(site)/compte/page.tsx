import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { logout } from "@/actions/account";
import { db, schema } from "@/db";
import { dateFr, eur, ORDER_STATUS, trackingUrl } from "@/lib/format";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Mon compte", robots: { index: false } };

export default async function AccountPage() {
  const user = await requireUser();
  const orders = await db.query.orders.findMany({
    where: eq(schema.orders.userId, user.id),
    orderBy: desc(schema.orders.createdAt),
    with: { items: { with: { artwork: { columns: { title: true, slug: true } } } } },
  });

  return (
    <div className="wrap section" style={{ maxWidth: 900 }}>
      <div className="spread">
        <h1 style={{ margin: 0 }}>Bonjour {user.firstName}</h1>
        <div className="row">
          <Link href="/compte/adresses" className="btn ghost sm">
            Mes adresses
          </Link>
          <form action={logout}>
            <button className="btn ghost sm">Se déconnecter</button>
          </form>
        </div>
      </div>

      <h2 style={{ marginTop: 32 }}>Mes commandes</h2>
      {orders.length === 0 ? (
        <p>
          Aucune commande pour l&apos;instant. <Link href="/#galerie">Voir la galerie</Link>
        </p>
      ) : (
        <div className="stack">
          {orders.map((o) => (
            <article key={o.id} className="card pad">
              <div className="spread">
                <strong className="sans">{o.orderNumber}</strong>
                <span className={`status ${o.status}`}>{ORDER_STATUS[o.status]}</span>
              </div>
              <p className="small muted" style={{ margin: "4px 0 8px" }}>
                {dateFr(o.createdAt)} · {eur(o.totalAmount)}
              </p>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {o.items.map((i) => (
                  <li key={i.id}>
                    {i.quantity} × <Link href={`/oeuvres/${i.artwork.slug}`}>{i.artwork.title}</Link> —{" "}
                    {i.variant === "original" ? "original" : "tirage signé"}
                  </li>
                ))}
              </ul>
              {o.trackingNumber && (
                <p style={{ margin: "8px 0 0" }}>
                  Suivi du colis :{" "}
                  <a href={trackingUrl(o.trackingCarrier, o.trackingNumber)} target="_blank" rel="noopener noreferrer">
                    {o.trackingNumber}
                  </a>
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
