"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { addToCart } from "@/actions/cart";
import { SubmitButton } from "./forms";
import { eur } from "@/lib/format";

type Props = {
  artworkId: string;
  originalPrice: number | null;
  printPrice: number;
  originalSold: boolean;
  originalInCart: boolean;
  format: string;
  printLeadTime: string;
};

/** Sélecteur de variante : l'original est désactivé s'il est vendu ou déjà dans le panier. */
export function AddToCart({ artworkId, originalPrice, printPrice, originalSold, originalInCart, format, printLeadTime }: Props) {
  const originalAvailable = originalPrice != null && !originalSold && !originalInCart;
  const [variant, setVariant] = useState<"original" | "print">(originalAvailable ? "original" : "print");
  const [state, action] = useActionState(addToCart, undefined);
  const disabledOriginal = !originalAvailable || (state?.ok && variant === "original");

  let originalNote = "Pièce unique, signée";
  if (originalPrice == null) originalNote = "Non proposé à la vente";
  else if (originalSold) originalNote = "Vendu";
  else if (originalInCart || (state?.ok && variant === "original")) originalNote = "Déjà dans votre panier";

  return (
    <form action={action}>
      <input type="hidden" name="artworkId" value={artworkId} />
      <fieldset className="variants" style={{ border: 0, padding: 0 }}>
        <legend className="sans" style={{ fontWeight: 700, marginBottom: 8 }}>
          Choisir une version
        </legend>
        <label className="variant">
          <span className="row">
            <input
              type="radio"
              name="variant"
              value="original"
              checked={variant === "original"}
              disabled={disabledOriginal}
              onChange={() => setVariant("original")}
            />
            <span>
              <strong>Œuvre originale</strong>
              <br />
              <span className="small muted">{originalNote}</span>
            </span>
          </span>
          <span className="price">{originalPrice != null ? eur(originalPrice) : "—"}</span>
        </label>
        <label className="variant">
          <span className="row">
            <input type="radio" name="variant" value="print" checked={variant === "print"} onChange={() => setVariant("print")} />
            <span>
              <strong>Tirage signé</strong>
              <br />
              <span className="small muted">{format} · papier beaux-arts 310 g/m²</span>
            </span>
          </span>
          <span className="price">{eur(printPrice)}</span>
        </label>
      </fieldset>
      {variant === "print" && (
        <p className="notice small" style={{ marginBottom: 16 }}>
          <strong>Tirage réalisé à la commande :</strong> je le fais imprimer, je le signe et le numérote à la main, puis je
          l&apos;expédie. Comptez <strong>{printLeadTime}</strong> avant l&apos;envoi.
        </p>
      )}
      {variant === "original" && originalPrice != null && !originalSold && (
        <p className="small muted" style={{ marginBottom: 16 }}>
          L&apos;original est expédié sous 3 jours ouvrés après paiement.
        </p>
      )}
      {variant === "print" && (
        <label className="field" style={{ maxWidth: 140, marginBottom: 16 }}>
          Quantité
          <select name="quantity" defaultValue="1">
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
      )}
      <div className="row">
        <SubmitButton pendingLabel="Ajout…">Ajouter au panier</SubmitButton>
        {state?.ok && (
          <Link href="/panier" className="btn ghost">
            Voir le panier
          </Link>
        )}
      </div>
      {state?.message && (
        <p role="status" className={`notice ${state.ok ? "ok" : "err"}`} style={{ marginTop: 16 }}>
          {state.message}
        </p>
      )}
    </form>
  );
}
