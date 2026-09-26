import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { eur } from "@/lib/format";

export async function Footer() {
  const s = await getSettings();
  return (
    <footer className="footer">
      <div className="wrap cols">
        <div>
          <p className="sans" style={{ fontWeight: 800 }}>
            Lavis Studio
          </p>
          <p className="muted">Aquarelles originales et tirages signés de Léo Gaillard. Envois en France et à l&apos;international.</p>
        </div>
        <div>
          <p className="sans" style={{ fontWeight: 800 }}>
            Le site
          </p>
          <p>
            <Link href="/#galerie">Galerie</Link>
            <br />
            <Link href="/sur-mesure">Sur-mesure</Link>
            <br />
            <Link href="/guide-des-formats">Guide des formats & FAQ</Link>
            <br />
            <Link href="/compte">Mon compte</Link>
          </p>
        </div>
        <div>
          <p className="sans" style={{ fontWeight: 800 }}>
            Livraison & retours
          </p>
          <p className="small">
            France {eur(s.shippingFr)}
            {s.freeShippingThreshold > 0 && ` · offerte dès ${eur(s.freeShippingThreshold)}`}
            <br />
            Union européenne {eur(s.shippingEu)}
            <br />
            Reste du monde {eur(s.shippingWorld)}
            <br />
            Expédition sous 3 jours ouvrés, pochette rigide
            <br />
            Rétractation 14 jours, hors sur-mesure
          </p>
        </div>
      </div>
    </footer>
  );
}
