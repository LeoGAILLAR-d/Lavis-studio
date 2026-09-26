import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/AddToCart";
import { ArtworkViewer } from "@/components/ArtworkViewer";
import { artworkState, getArtworkBySlug, STATE_LABEL } from "@/lib/artworks";
import { cartHasOriginal } from "@/lib/cart";
import { getSettings } from "@/lib/settings";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = await getArtworkBySlug((await params).slug);
  if (!a) return {};
  return { title: a.title, description: a.description.slice(0, 160), openGraph: { images: [a.imageUrl] } };
}

export default async function ArtworkPage({ params }: Props) {
  const a = await getArtworkBySlug((await params).slug);
  if (!a) notFound();
  const state = artworkState(a);
  const [inCart, settings] = await Promise.all([a.originalPrice != null ? cartHasOriginal(a.id) : false, getSettings()]);

  return (
    <div className="wrap section">
      <p className="small sans">
        <Link href="/#galerie">← Retour à la galerie</Link>
      </p>
      <div className="grid-2" style={{ alignItems: "start" }}>
        <ArtworkViewer src={a.imageUrl} alt={a.altText} title={a.title} zoomX={a.zoomX} zoomY={a.zoomY} />
        <div>
          <span className={`tag ${state === "original" ? "available" : state}`}>{STATE_LABEL[state]}</span>
          <h1 style={{ marginTop: 12 }}>{a.title}</h1>
          <p>{a.description}</p>
          <dl className="specs">
            <dt>Catégorie</dt>
            <dd>{a.category}</dd>
            <dt>Format</dt>
            <dd>{a.format}</dd>
            <dt>Technique</dt>
            <dd>Aquarelle et liner noir sur papier</dd>
          </dl>
          <AddToCart
            artworkId={a.id}
            originalPrice={a.originalPrice}
            printPrice={a.printPrice}
            originalSold={a.isOriginalSold}
            originalInCart={inCart}
            format={a.format}
            printLeadTime={settings.printLeadTime}
          />
          <p className="small muted" style={{ marginTop: 16 }}>
            Hésitation sur la taille ? <Link href="/guide-des-formats">Comparer les formats A5, A4 et A3</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
