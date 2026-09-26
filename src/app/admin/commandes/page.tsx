import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { OrderStatus } from "@/db/schema";
import { dateFr, eur, ORDER_STATUS } from "@/lib/format";

export const metadata = { title: "Commandes" };

export default async function OrdersAdmin({ searchParams }: { searchParams: Promise<{ statut?: string }> }) {
  const { statut } = await searchParams;
  const filter = statut && statut in ORDER_STATUS ? (statut as OrderStatus) : null;
  const list = await db.query.orders.findMany({
    where: filter ? eq(schema.orders.status, filter) : undefined,
    orderBy: desc(schema.orders.createdAt),
    with: { shippingAddress: true, items: true },
    limit: 200,
  });
  return (
    <>
      <h1>Commandes</h1>
      <div className="filters">
        <Link href="/admin/commandes" className={`chip ${!filter ? "on" : ""}`}>
          Toutes
        </Link>
        {Object.entries(ORDER_STATUS).map(([v, l]) => (
          <Link key={v} href={`/admin/commandes?statut=${v}`} className={`chip ${filter === v ? "on" : ""}`}>
            {l}
          </Link>
        ))}
      </div>
      {list.length === 0 ? (
        <p className="muted">Aucune commande.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Date</th>
                <th>Client</th>
                <th>Articles</th>
                <th>Total</th>
                <th>Paiement</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {list.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link href={`/admin/commandes/${o.id}`}>
                      <strong>{o.orderNumber}</strong>
                    </Link>
                  </td>
                  <td>{dateFr(o.createdAt)}</td>
                  <td>
                    {o.shippingAddress.firstName} {o.shippingAddress.lastName}
                    <br />
                    <span className="small muted">
                      {o.contactEmail}
                      {!o.userId && " · invité"}
                    </span>
                  </td>
                  <td>{o.items.reduce((s, i) => s + i.quantity, 0)}</td>
                  <td>{eur(o.totalAmount)}</td>
                  <td>{o.paymentStatus === "paid" ? "Payé" : o.paymentStatus === "refunded" ? "Remboursé" : "Non payé"}</td>
                  <td>
                    <span className={`status ${o.status}`}>{ORDER_STATUS[o.status]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
