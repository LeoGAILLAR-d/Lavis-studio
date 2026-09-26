import Image from "next/image";
import Link from "next/link";
import { asc, desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { artworkState, STATE_LABEL } from "@/lib/artworks";
import { eur } from "@/lib/format";

export const metadata = { title: "Œuvres" };

export default async function ArtworksAdmin({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const sp = await searchParams;
  const list = await db.query.artworks.findMany({ orderBy: [asc(schema.artworks.sortOrder), desc(schema.artworks.createdAt)] });
  return (
    <>
      <div className="spread">
        <h1 style={{ margin: 0 }}>Œuvres</h1>
        <Link href="/admin/oeuvres/nouvelle" className="btn">
          + Nouvelle œuvre
        </Link>
      </div>
      {sp.saved && <p className="notice ok" style={{ marginTop: 16 }}>Œuvre enregistrée.</p>}
      <div className="table-wrap" style={{ marginTop: 24 }}>
        <table className="table">
          <thead>
            <tr>
              <th></th>
              <th>Titre</th>
              <th>Catégorie</th>
              <th>Original</th>
              <th>Tirage</th>
              <th>État</th>
              <th>Publiée</th>
            </tr>
          </thead>
          <tbody>
            {list.map((a) => (
              <tr key={a.id}>
                <td style={{ width: 72 }}>
                  <div style={{ position: "relative", width: 64, height: 48, border: "1.5px solid var(--ink)" }}>
                    <Image src={a.imageUrl} alt="" fill sizes="64px" style={{ objectFit: "cover" }} />
                  </div>
                </td>
                <td>
                  <Link href={`/admin/oeuvres/${a.id}`}>
                    <strong>{a.title}</strong>
                  </Link>
                </td>
                <td>{a.category}</td>
                <td>{a.originalPrice != null ? eur(a.originalPrice) : "—"}</td>
                <td>{eur(a.printPrice)}</td>
                <td>{STATE_LABEL[artworkState(a)]}</td>
                <td>{a.isPublished ? "Oui" : "Non"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
