import type { Metadata } from "next";
import Link from "next/link";
import { FormatComparator } from "@/components/FormatComparator";
import { getPublishedArtworks } from "@/lib/artworks";
import { getSettings } from "@/lib/settings";
import { eur } from "@/lib/format";

export const metadata: Metadata = {
  title: "Guide des formats & FAQ",
  description: "Papier beaux-arts 310 g/m², encres pigmentaires, formats A5, A4, A3 : tout savoir sur les tirages Lavis Studio.",
};

export default async function GuidePage() {
  const [works, s] = await Promise.all([getPublishedArtworks(), getSettings()]);
  const sample = works[0];
  const faq = [
    {
      q: "Sur quel papier sont imprimés les tirages ?",
      a: "Sur un papier beaux-arts 310 g/m² 100 % coton, à la texture chiffon légèrement grainée, proche de celle de la feuille d'aquarelle d'origine. Il est sans acide pour une conservation durable.",
    },
    {
      q: "Quelles encres sont utilisées ?",
      a: "Des encres pigmentaires (et non à colorants), qui résistent à la lumière pendant plusieurs décennies en intérieur. Le rendu des lavis et du trait de liner est calibré à l'œil contre l'original.",
    },
    {
      q: "Les tirages sont-ils signés ?",
      a: "Oui : chaque tirage est signé et numéroté à la main au crayon, dans la marge blanche.",
    },
    {
      q: "Quelle différence avec l'original ?",
      a: "L'original est la feuille peinte elle-même : une pièce unique, avec les reliefs du papier et les superpositions de lavis. Le tirage est une reproduction fidèle à partir d'un scan haute définition.",
    },
    {
      q: "Les œuvres sont-elles encadrées ?",
      a: "Non, elles sont livrées sans cadre, protégées sous pochette rigide. Les formats A5, A4 et A3 correspondent aux cadres standard du commerce.",
    },
    {
      q: "Quels sont les délais et frais de livraison ?",
      a: `Les originaux partent sous 3 jours ouvrés. Les tirages sont réalisés à la commande : je les fais imprimer, je les signe et les numérote à la main, puis je les expédie — comptez ${s.printLeadTime} avant l'envoi. Frais de port : France ${eur(s.shippingFr)}${s.freeShippingThreshold > 0 ? ` (offerte dès ${eur(s.freeShippingThreshold)})` : ""}, Union européenne ${eur(s.shippingEu)}, reste du monde ${eur(s.shippingWorld)}.`,
    },
    { q: "Puis-je retourner une œuvre ?", a: "Oui, vous disposez de 14 jours de rétractation à réception (hors commandes sur-mesure)." },
  ];

  return (
    <div className="wrap section">
      <h1>Guide des formats</h1>
      <p style={{ maxWidth: 720 }}>
        Choisissez un format pour le voir à l&apos;échelle, accroché au-dessus d&apos;un canapé de 2 mètres.
      </p>
      <FormatComparator image={sample ? { src: sample.imageUrl, alt: sample.altText } : undefined} />

      <div className="table-wrap" style={{ marginTop: 32 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Format</th>
              <th>Dimensions</th>
              <th>Idéal pour</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>A5</td>
              <td>21 × 14,8 cm</td>
              <td>Étagère, bureau, petit mur</td>
            </tr>
            <tr>
              <td>A4</td>
              <td>29,7 × 21 cm</td>
              <td>Chambre, couloir, composition</td>
            </tr>
            <tr>
              <td>A3</td>
              <td>42 × 29,7 cm</td>
              <td>Au-dessus d&apos;un canapé ou d&apos;une console</td>
            </tr>
          </tbody>
        </table>
      </div>

      <section className="section faq">
        <h2>Questions fréquentes</h2>
        {faq.map((f) => (
          <details key={f.q}>
            <summary>{f.q}</summary>
            <div>
              <p>{f.a}</p>
            </div>
          </details>
        ))}
        <p className="muted">
          Une autre question ? <Link href="/sur-mesure">Écrivez-moi via le formulaire</Link>.
        </p>
      </section>
    </div>
  );
}
