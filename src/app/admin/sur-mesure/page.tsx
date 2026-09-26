import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { updateCommissionStatus } from "@/actions/admin";
import { db, schema } from "@/db";
import type { CommissionStatus } from "@/db/schema";
import { COMMISSION_STATUS, dateFr } from "@/lib/format";

export const metadata = { title: "Sur-mesure" };

export default async function CommissionsAdmin({ searchParams }: { searchParams: Promise<{ statut?: string }> }) {
  const { statut } = await searchParams;
  const filter = statut && statut in COMMISSION_STATUS ? (statut as CommissionStatus) : null;
  const list = await db.query.commissionRequests.findMany({
    where: filter ? eq(schema.commissionRequests.status, filter) : undefined,
    orderBy: desc(schema.commissionRequests.createdAt),
    limit: 200,
  });
  return (
    <>
      <h1>Demandes sur-mesure</h1>
      <div className="filters">
        <Link href="/admin/sur-mesure" className={`chip ${!filter ? "on" : ""}`}>
          Toutes
        </Link>
        {Object.entries(COMMISSION_STATUS).map(([v, l]) => (
          <Link key={v} href={`/admin/sur-mesure?statut=${v}`} className={`chip ${filter === v ? "on" : ""}`}>
            {l}
          </Link>
        ))}
      </div>
      {list.length === 0 && <p className="muted">Aucune demande.</p>}
      <div className="stack">
        {list.map((c) => (
          <article key={c.id} id={c.id} className="card pad">
            <div className="spread">
              <div>
                <strong className="sans">{c.clientName}</strong> · <a href={`mailto:${c.clientEmail}`}>{c.clientEmail}</a>
                <p className="small muted" style={{ margin: 0 }}>
                  Reçue le {dateFr(c.createdAt)} · Format {c.desiredFormat} · Échéance : {c.deadline || "non précisée"}
                </p>
              </div>
              <form action={updateCommissionStatus} className="row" style={{ gap: 6 }}>
                <input type="hidden" name="id" value={c.id} />
                <label className="sr-only" htmlFor={`s-${c.id}`}>
                  Statut
                </label>
                <select id={`s-${c.id}`} name="status" defaultValue={c.status} className="chip">
                  {Object.entries(COMMISSION_STATUS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
                <button className="btn sm">OK</button>
              </form>
            </div>
            <p style={{ whiteSpace: "pre-wrap", marginTop: 12 }}>{c.description}</p>
            {c.attachmentUrls.length > 0 && (
              <div className="row">
                {c.attachmentUrls.map((f) =>
                  f.contentType.startsWith("image/") ? (
                    <a key={f.url} href={f.url} target="_blank" rel="noopener noreferrer" title={f.name}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={f.url} alt={f.name} style={{ height: 120, width: "auto", border: "2px solid var(--ink)" }} loading="lazy" />
                    </a>
                  ) : (
                    <a key={f.url} href={f.url} target="_blank" rel="noopener noreferrer" className="btn ghost sm">
                      📄 {f.name}
                    </a>
                  ),
                )}
              </div>
            )}
            <p style={{ marginTop: 12 }}>
              <a className="btn ghost sm" href={`mailto:${c.clientEmail}?subject=${encodeURIComponent("Votre aquarelle sur-mesure — Lavis Studio")}`}>
                Répondre par e-mail
              </a>
            </p>
          </article>
        ))}
      </div>
    </>
  );
}
