"use client";

import { useState } from "react";
import { placeOrder } from "@/actions/checkout";
import { ActionForm, Check, Field, SubmitButton } from "./forms";
import { eur } from "@/lib/format";
import { shippingCost, SHIPPING_ZONES, type ShippingZone } from "@/lib/shipping";

type Rates = { shippingFr: number; shippingEu: number; shippingWorld: number; freeShippingThreshold: number };
type Addr = {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2: string | null;
  postalCode: string;
  city: string;
  country: string;
  phone: string | null;
};

export function CheckoutForm({
  subtotal,
  rates,
  email,
  address,
  onlinePayment,
}: {
  subtotal: number;
  rates: Rates;
  email?: string;
  address?: Addr | null;
  onlinePayment: boolean;
}) {
  const [zone, setZone] = useState<ShippingZone>("fr");
  const ship = shippingCost(zone, subtotal, rates);

  return (
    <ActionForm action={placeOrder} className="stack">
      <fieldset className="form-grid" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="sans" style={{ fontWeight: 800, fontSize: 20, marginBottom: 12 }}>
          Coordonnées
        </legend>
        {email ? (
          <p className="full small muted" style={{ margin: 0 }}>
            Commande passée avec le compte <strong>{email}</strong>.
            <input type="hidden" name="email" value={email} />
          </p>
        ) : (
          <Field name="email" label="E-mail" type="email" required autoComplete="email" className="full" hint="Pour la confirmation et le suivi du colis. Aucun compte n'est nécessaire." />
        )}
        <Field name="firstName" label="Prénom" required autoComplete="given-name" defaultValue={address?.firstName} />
        <Field name="lastName" label="Nom" required autoComplete="family-name" defaultValue={address?.lastName} />
        <Field name="addressLine1" label="Adresse" required autoComplete="address-line1" className="full" defaultValue={address?.addressLine1} />
        <Field name="addressLine2" label="Complément d'adresse" autoComplete="address-line2" className="full" defaultValue={address?.addressLine2} />
        <Field name="postalCode" label="Code postal" required autoComplete="postal-code" defaultValue={address?.postalCode} />
        <Field name="city" label="Ville" required autoComplete="address-level2" defaultValue={address?.city} />
        <Field name="country" label="Pays" required autoComplete="country-name" defaultValue={address?.country ?? "France"} />
        <Field name="phone" label="Téléphone (pour le transporteur)" type="tel" autoComplete="tel" defaultValue={address?.phone} />
      </fieldset>

      <fieldset style={{ border: 0, padding: 0, margin: "24px 0 0" }}>
        <legend className="sans" style={{ fontWeight: 800, fontSize: 20, marginBottom: 12 }}>
          Livraison
        </legend>
        <div className="variants" style={{ margin: 0 }}>
          {(Object.keys(SHIPPING_ZONES) as ShippingZone[]).map((z) => (
            <label key={z} className="variant">
              <span className="row">
                <input type="radio" name="zone" value={z} checked={zone === z} onChange={() => setZone(z)} />
                {SHIPPING_ZONES[z]}
              </span>
              <span className="sans" style={{ fontWeight: 700 }}>
                {shippingCost(z, subtotal, rates) === 0 ? "Offerte" : eur(shippingCost(z, subtotal, rates))}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {email && <Check name="saveAddress" label="Enregistrer cette adresse dans mon carnet" defaultChecked={!address} />}

      <div className="totals card pad" style={{ boxShadow: "var(--shadow-sm)" }}>
        <span>Sous-total</span>
        <span>{eur(subtotal)}</span>
        <span>Livraison ({SHIPPING_ZONES[zone]})</span>
        <span>{ship === 0 ? "Offerte" : eur(ship)}</span>
        <span className="grand">Total</span>
        <span className="grand">{eur(subtotal + ship)}</span>
      </div>

      <Check
        name="acceptTerms"
        required
        label={
          <>
            J&apos;ai lu et j&apos;accepte les{" "}
            <a href="/cgv" target="_blank" rel="noopener">
              conditions générales de vente
            </a>
            . Rétractation 14 jours (hors sur-mesure).
          </>
        }
      />
      {onlinePayment ? (
        <p className="small muted">Paiement sécurisé par carte bancaire via Stripe. Vous êtes redirigé vers la page de paiement.</p>
      ) : (
        <p className="small muted">
          Après validation, vous recevez un e-mail de confirmation et l&apos;atelier vous contacte pour le règlement avant
          l&apos;expédition.
        </p>
      )}
      <SubmitButton pendingLabel={onlinePayment ? "Redirection vers le paiement…" : "Enregistrement…"}>
        {onlinePayment ? `Payer ${eur(subtotal + ship)}` : "Valider ma commande"}
      </SubmitButton>
    </ActionForm>
  );
}
