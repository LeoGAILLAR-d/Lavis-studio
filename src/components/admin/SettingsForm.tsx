"use client";

import { updateSettings } from "@/actions/admin";
import { ActionForm, Check, Field, SubmitButton } from "@/components/forms";

type S = { bannerText: string; bannerActive: boolean; freeShippingThreshold: number; shippingFr: number; shippingEu: number; shippingWorld: number; printLeadTime: string };

export function SettingsForm({ s }: { s: S }) {
  return (
    <ActionForm action={updateSettings} className="form-grid">
      <Field name="bannerText" label="Message du bandeau" defaultValue={s.bannerText} className="full" maxLength={200} hint="Ex. « Commandes pour Noël jusqu'au 15 décembre » · 200 caractères max." />
      <div className="full">
        <Check name="bannerActive" label="Bandeau actif (visible sur le site)" defaultChecked={s.bannerActive} />
      </div>
      <h3 className="full" style={{ marginTop: 16 }}>
        Frais de port (€)
      </h3>
      <Field name="shippingFr" label="France métropolitaine" type="number" step="0.01" min={0} defaultValue={s.shippingFr} />
      <Field name="shippingEu" label="Union européenne" type="number" step="0.01" min={0} defaultValue={s.shippingEu} />
      <Field name="shippingWorld" label="Reste du monde" type="number" step="0.01" min={0} defaultValue={s.shippingWorld} />
      <Field name="freeShippingThreshold" label="Livraison offerte en France dès" type="number" step="0.01" min={0} defaultValue={s.freeShippingThreshold} hint="0 = jamais offerte" />
      <h3 className="full" style={{ marginTop: 16 }}>
        Délais
      </h3>
      <Field
        name="printLeadTime"
        label="Délai d'envoi des tirages"
        defaultValue={s.printLeadTime}
        className="full"
        maxLength={60}
        hint="Affiché sur les fiches, le panier, la commande et les e-mails. Ex. « 1 à 2 semaines », « 10 jours ouvrés »."
      />
      <div className="full">
        <SubmitButton>Enregistrer</SubmitButton>
      </div>
    </ActionForm>
  );
}
