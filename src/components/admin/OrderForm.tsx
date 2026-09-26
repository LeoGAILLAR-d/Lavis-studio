"use client";

import { useState } from "react";
import { updateOrder } from "@/actions/admin";
import { ActionForm, Field, SubmitButton } from "@/components/forms";
import { CARRIERS, ORDER_STATUS } from "@/lib/format";

type O = { id: string; status: keyof typeof ORDER_STATUS; trackingNumber: string | null; trackingCarrier: string | null; paymentStatus: string };

export function OrderForm({ o }: { o: O }) {
  const [status, setStatus] = useState(o.status);
  return (
    <ActionForm action={updateOrder} className="form-grid">
      <input type="hidden" name="id" value={o.id} />
      <label className="field">
        Statut
        <select name="status" value={status} onChange={(e) => setStatus(e.target.value as O["status"])}>
          {Object.entries(ORDER_STATUS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </label>
      <Field
        name="paymentStatus"
        label="Paiement"
        defaultValue={o.paymentStatus}
        options={[
          { value: "unpaid", label: "Non payé" },
          { value: "paid", label: "Payé" },
          { value: "refunded", label: "Remboursé" },
        ]}
      />
      {(status === "shipped" || status === "completed" || o.trackingNumber) && (
        <>
          <Field name="trackingCarrier" label="Transporteur" defaultValue={o.trackingCarrier ?? "colissimo"} options={Object.entries(CARRIERS).map(([v, c]) => ({ value: v, label: c.label }))} />
          <Field name="trackingNumber" label="Numéro de suivi" defaultValue={o.trackingNumber} required={status === "shipped"} />
        </>
      )}
      {status === "shipped" && o.status !== "shipped" && (
        <p className="full small muted" style={{ margin: 0 }}>
          En enregistrant, le client reçoit automatiquement un e-mail avec son lien de suivi.
        </p>
      )}
      {status === "cancelled" && o.status !== "cancelled" && (
        <p className="full small muted" style={{ margin: 0 }}>
          L&apos;annulation remet automatiquement en vente les originaux de cette commande.
        </p>
      )}
      <div className="full">
        <SubmitButton>Enregistrer</SubmitButton>
      </div>
    </ActionForm>
  );
}
