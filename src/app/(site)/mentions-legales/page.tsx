import type { Metadata } from "next";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = { title: "Mentions légales" };

export default function LegalNotice() {
  return (
    <article className="wrap section" style={{ maxWidth: 820 }}>
      <h1>Mentions légales</h1>
      <h2>Éditeur du site</h2>
      <p>
        {LEGAL.brand} — {LEGAL.owner}
        <br />
        {LEGAL.status}
        <br />
        SIRET : {LEGAL.siret}
        <br />
        Adresse : {LEGAL.address}
        <br />
        E-mail : <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>
        <br />
        Téléphone : {LEGAL.phone}
        <br />
        {LEGAL.vat}
      </p>
      <p>Directeur de la publication : {LEGAL.owner}.</p>
      <h2>Hébergement</h2>
      <p>
        {LEGAL.host.name}, {LEGAL.host.address} — <a href={LEGAL.host.url}>{LEGAL.host.url}</a>
      </p>
      <h2>Propriété intellectuelle</h2>
      <p>
        L&apos;ensemble des œuvres, photographies, textes et éléments graphiques présents sur ce site sont la propriété exclusive de{" "}
        {LEGAL.owner}. Toute reproduction, représentation ou diffusion, totale ou partielle, sans autorisation écrite préalable est
        interdite. L&apos;achat d&apos;une œuvre ou d&apos;un tirage n&apos;emporte aucune cession des droits d&apos;auteur.
      </p>
      <h2>Données personnelles</h2>
      <p>
        Voir la <a href="/confidentialite">politique de confidentialité</a>.
      </p>
    </article>
  );
}
