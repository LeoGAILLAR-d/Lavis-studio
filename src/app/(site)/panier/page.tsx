import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { updateCartLine } from "@/actions/cart";
import { getCart } from "@/lib/cart";
import { eur } from "@/lib/format";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Panier", robots: { index: false } };

export default async function CartPage() {
  const [cart, s] = await Promise.all([getCart(), getSettings()]);
  const missing = s.freeShippingThreshold - cart.subtotal;

  return (
    <div className="wrap section" style={{ maxWidth: 900 }}>
      <h1>Votre panier</h1>
      {cart.lines.length === 0 ? (
        <p>
          Votre panier est vide. <Link href="/#galerie">Découvrir la galerie</Link>
        </p>
      ) : (
        <>
          {cart.lines.map((l) => (
            <div key={l.id} className="cart-line">
              <Link href={`/oeuvres/${l.artwork.slug}`} className="img">
                <Image src={l.artwork.imageUrl} alt={l.artwork.altText} fill sizes="96px" style={{ objectFit: "cover" }} />
              </Link>
              <div>
                <strong className="sans">{l.artwork.title}</strong>
                <br />
                <span className="small muted">
                  {l.variant === "original" ? "Œuvre originale · pièce unique" : `Tirage signé · ${l.artwork.format}`}
                </span>
                {!l.available && (
                  <p className="small" style={{ color: "var(--danger)", margin: "4px 0 0" }}>
                    Plus disponible — merci de retirer cet article.
                  </p>
                )}
                <div className="row" style={{ marginTop: 8 }}>
                  {l.variant === "print" && l.available && (
                    <form action={updateCartLine} className="row" style={{ gap: 6 }}>
                      <input type="hidden" name="lineId" value={l.id} />
                      <label className="sr-only" htmlFor={`q-${l.id}`}>
                        Quantité
                      </label>
                      <select id={`q-${l.id}`} name="quantity" defaultValue={l.quantity} className="chip">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                          <option key={n}>{n}</option>
                        ))}
                      </select>
                      <button className="btn ghost sm">Mettre à jour</button>
                    </form>
                  )}
                  <form action={updateCartLine}>
                    <input type="hidden" name="lineId" value={l.id} />
                    <input type="hidden" name="quantity" value="0" />
                    <button className="linkbtn small">Retirer</button>
                  </form>
                </div>
              </div>
              <strong className="sans">{eur(l.unitPrice * l.quantity)}</strong>
            </div>
          ))}
          <div className="totals" style={{ marginTop: 24, maxWidth: 360, marginLeft: "auto" }}>
            <span>Sous-total</span>
            <span>{eur(cart.subtotal)}</span>
            <span className="small muted">Livraison</span>
            <span className="small muted">calculée à l&apos;étape suivante</span>
          </div>
          {s.freeShippingThreshold > 0 && missing > 0 && (
            <p className="small muted" style={{ textAlign: "right" }}>
              Plus que {eur(missing)} pour la livraison offerte en France.
            </p>
          )}
          <div className="row" style={{ justifyContent: "flex-end", marginTop: 24 }}>
            <Link href="/#galerie" className="btn ghost">
              Continuer mes achats
            </Link>
            {cart.count > 0 && (
              <Link href="/commande" className="btn">
                Passer commande
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  );
}
