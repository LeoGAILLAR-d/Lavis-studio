import Link from "next/link";
import { ArtworkForm } from "@/components/admin/ArtworkForm";
import { db, schema } from "@/db";

export const metadata = { title: "Nouvelle œuvre" };

export default async function NewArtwork() {
  const cats = await db.selectDistinct({ c: schema.artworks.category }).from(schema.artworks);
  return (
    <>
      <p className="small sans">
        <Link href="/admin/oeuvres">← Œuvres</Link>
      </p>
      <h1>Nouvelle œuvre</h1>
      <div className="card pad">
        <ArtworkForm categories={cats.map((c) => c.c)} />
      </div>
    </>
  );
}
