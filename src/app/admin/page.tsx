import Link from "next/link";
import { and, eq, gte, ne, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { eur } from "@/lib/format";

export default async function Dashboard() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const sixMonths = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const notCancelled = ne(schema.orders.status, "cancelled");

  const [[all], [month], split, monthly, [pending], [newCommissions]] = await Promise.all([
    db.select({ total: sql<number>`coalesce(sum(${schema.orders.totalAmount}),0)::float`, n: sql<number>`count(*)::int` }).from(schema.orders).where(notCancelled),
    db
      .select({ total: sql<number>`coalesce(sum(${schema.orders.totalAmount}),0)::float`, n: sql<number>`count(*)::int` })
      .from(schema.orders)
      .where(and(notCancelled, gte(schema.orders.createdAt, monthStart))),
    db
      .select({
        variant: schema.orderItems.variant,
        qty: sql<number>`sum(${schema.orderItems.quantity})::int`,
        amount: sql<number>`sum(${schema.orderItems.quantity} * ${schema.orderItems.unitPrice})::float`,
      })
      .from(schema.orderItems)
      .innerJoin(schema.orders, eq(schema.orders.id, schema.orderItems.orderId))
      .where(notCancelled)
      .groupBy(schema.orderItems.variant),
    db
      .select({
        m: sql<string>`to_char(date_trunc('month', ${schema.orders.createdAt}), 'YYYY-MM')`,
        total: sql<number>`sum(${schema.orders.totalAmount})::float`,
      })
      .from(schema.orders)
      .where(and(notCancelled, gte(schema.orders.createdAt, sixMonths)))
      .groupBy(sql`1`),
    db.select({ n: sql<number>`count(*)::int` }).from(schema.orders).where(eq(schema.orders.status, "pending")),
    db.select({ n: sql<number>`count(*)::int` }).from(schema.commissionRequests).where(eq(schema.commissionRequests.status, "new")),
  ]);

  const originals = split.find((s) => s.variant === "original") ?? { qty: 0, amount: 0 };
  const prints = split.find((s) => s.variant === "print") ?? { qty: 0, amount: 0 };
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return { key, label: d.toLocaleDateString("fr-FR", { month: "short" }), total: monthly.find((m) => m.m === key)?.total ?? 0 };
  });
  const max = Math.max(1, ...months.map((m) => m.total));

  return (
    <>
      <h1>Tableau de bord</h1>
      <div className="row" style={{ marginBottom: 24 }}>
        <Link href="/admin/commandes?statut=pending" className="btn">
          {pending.n} commande(s) à traiter
        </Link>
        <Link href="/admin/sur-mesure" className="btn ghost">
          {newCommissions.n} nouvelle(s) demande(s) sur-mesure
        </Link>
      </div>
      <div className="kpis">
        <div className="kpi">
          <div className="l">Ventes totales</div>
          <div className="v">{eur(all.total)}</div>
          <div className="small muted">{all.n} commande(s)</div>
        </div>
        <div className="kpi">
          <div className="l">Ce mois-ci</div>
          <div className="v">{eur(month.total)}</div>
          <div className="small muted">{month.n} commande(s)</div>
        </div>
        <div className="kpi">
          <div className="l">Originaux vendus</div>
          <div className="v">{originals.qty}</div>
          <div className="small muted">{eur(originals.amount)}</div>
        </div>
        <div className="kpi">
          <div className="l">Tirages vendus</div>
          <div className="v">{prints.qty}</div>
          <div className="small muted">{eur(prints.amount)}</div>
        </div>
      </div>
      <h2>Ventes des 6 derniers mois</h2>
      <div className="card pad" style={{ maxWidth: 640 }}>
        <div className="bars" role="img" aria-label={months.map((m) => `${m.label} : ${eur(m.total)}`).join(", ")}>
          {months.map((m) => (
            <div key={m.key} className="b" style={{ height: `${(m.total / max) * 100}%` }}>
              {m.total > 0 && <span>{Math.round(m.total)} €</span>}
            </div>
          ))}
        </div>
        <div className="bars-labels">
          {months.map((m) => (
            <span key={m.key}>{m.label}</span>
          ))}
        </div>
      </div>
      <p className="small muted" style={{ marginTop: 12 }}>
        Montants TTC, frais de port inclus, hors commandes annulées.
      </p>
    </>
  );
}
