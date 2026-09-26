import Link from "next/link";
import { Gallery, type GalleryItem } from "@/components/Gallery";
import { artworkState, getPublishedArtworks, STATE_LABEL } from "@/lib/artworks";

export const revalidate = 60;

export default async function Home() {
  const works = await getPublishedArtworks();
  const items: GalleryItem[] = works.map((a) => {
    const state = artworkState(a);
    return {
      slug: a.slug,
      title: a.title,
      category: a.category,
      format: a.format,
      imageUrl: a.imageUrl,
      altText: a.altText,
      printPrice: a.printPrice,
      originalPrice: a.originalPrice,
      state,
      stateLabel: STATE_LABEL[state],
    };
  });

  return (
    <>
      <section className="hero wrap">
        <h1 className="title">LAVIS STUDIO</h1>
        <p className="sub">aquarelles et traits de liner, par Léo Gaillard</p>
        <div className="perks">
          <span className="tag">Pièces uniques peintes à la main</span>
          <span className="tag">Tirages signés et numérotés</span>
          <span className="tag">Tirages imprimés et signés à la commande</span>
        </div>
      </section>

      <section className="wrap section" style={{ paddingTop: 24 }}>
        <p style={{ fontSize: 22, maxWidth: 760, margin: "0 auto 32px", textAlign: "center" }}>
          L&apos;aquarelle pose la lumière, le liner noir vient dire où elle s&apos;arrête. Je dessine des paysages et des maisons, à
          l&apos;encre et au lavis, une feuille à la fois.
        </p>
        <div className="offer">
          <div className="card pad">
            <h3>L&apos;original</h3>
            <p className="muted">La feuille peinte elle-même, signée. Un seul exemplaire, jamais repeint à l&apos;identique.</p>
          </div>
          <div className="card pad">
            <h3>Le tirage</h3>
            <p className="muted">
              Papier beaux-arts 310 g/m², encres pigmentaires, signé et numéroté au crayon.{" "}
              <Link href="/guide-des-formats">Voir les formats</Link>
            </p>
          </div>
          <div className="card pad">
            <h3>Le sur-mesure</h3>
            <p className="muted">
              Votre lieu, votre maison, votre paysage. <Link href="/sur-mesure">Faire une demande</Link>
            </p>
          </div>
        </div>
      </section>

      <section className="wrap section" id="galerie">
        <h2>La galerie</h2>
        {items.length ? <Gallery items={items} /> : <p className="muted">De nouvelles œuvres arrivent bientôt.</p>}
      </section>

      <section className="wrap section" id="atelier">
        <div className="grid-2">
          <div>
            <h2>L&apos;atelier</h2>
            <p>
              Je travaille à l&apos;encre et à l&apos;aquarelle, sur papier. Je commence par le trait, puis je pose les lavis en couches
              très diluées.
            </p>
            <p>Chaque feuille terminée est scannée à plat en haute définition, puis calibrée à l&apos;œil contre l&apos;original.</p>
          </div>
          <div className="card pad">
            <h3>Une aquarelle sur-mesure</h3>
            <p className="muted">Votre maison, un lieu qui compte, un paysage de vacances : envoyez-moi vos photos, je vous réponds sous 48 h.</p>
            <Link href="/sur-mesure" className="btn">
              Faire une demande
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
