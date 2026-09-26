import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { deleteArtwork } from "@/actions/admin";
import { ArtworkForm } from "@/components/admin/ArtworkForm";
import { db, schema } from "@/db";

export const metadata = { title: "Modifier l'œuvre" };

export default async function EditArtwork({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [a, cats] = await Promise.all([
    db.query.artworks.findFirst({ where: eq(schema.artworks.id, id) }),
    db.selectDistinct({ c: schema.artworks.category }).from(schema.artworks),
  ]);
  if (!a) notFound();
  return (
    <>
      <p className="small sans">
        <Link href="/admin/oeuvres">← Œuvres</Link> · <Link href={`/oeuvres/${a.slug}`}>Voir sur le site</Link>
      </p>
      <h1>{a.title}</h1>
      <div className="card pad">
        <ArtworkForm artwork={a} categories={cats.map((c) => c.c)} />
      </div>
      <form action={deleteArtwork} style={{ marginTop: 32 }}>
        <input type="hidden" name="id" value={a.id} />
        <button className="btn danger sm">Supprimer l&apos;œuvre</button>
        <p className="small muted">Si l&apos;œuvre a déjà été commandée, elle est seulement dépubliée (l&apos;historique est conservé).</p>
      </form>
    </>
  );
}
