import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { removeAddress, saveAddress, setDefaultAddress } from "@/actions/account";
import { ActionForm, Check, Field, SubmitButton } from "@/components/forms";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Mes adresses", robots: { index: false } };

export default async function AddressesPage() {
  const user = await requireUser("/compte/adresses");
  const list = await db.query.addresses.findMany({
    where: and(eq(schema.addresses.userId, user.id), eq(schema.addresses.isArchived, false)),
    orderBy: [desc(schema.addresses.isDefault)],
  });

  return (
    <div className="wrap section" style={{ maxWidth: 900 }}>
      <p className="small sans">
        <Link href="/compte">← Mon compte</Link>
      </p>
      <h1>Mes adresses de livraison</h1>
      <div className="grid-2">
        {list.map((a) => (
          <div key={a.id} className="card pad">
            {a.isDefault && <span className="tag available">Par défaut</span>}
            <p style={{ marginTop: 8 }}>
              {a.firstName} {a.lastName}
              <br />
              {a.addressLine1}
              {a.addressLine2 && (
                <>
                  <br />
                  {a.addressLine2}
                </>
              )}
              <br />
              {a.postalCode} {a.city}, {a.country}
            </p>
            <div className="row">
              {!a.isDefault && (
                <form action={setDefaultAddress}>
                  <input type="hidden" name="id" value={a.id} />
                  <button className="btn ghost sm">Définir par défaut</button>
                </form>
              )}
              <form action={removeAddress}>
                <input type="hidden" name="id" value={a.id} />
                <button className="linkbtn small">Supprimer</button>
              </form>
            </div>
          </div>
        ))}
      </div>
      <h2 style={{ marginTop: 40 }}>Ajouter une adresse</h2>
      <div className="card pad">
        <ActionForm action={saveAddress} className="form-grid" resetOnSuccess>
          <Field name="firstName" label="Prénom" required defaultValue={user.firstName} />
          <Field name="lastName" label="Nom" required defaultValue={user.lastName} />
          <Field name="addressLine1" label="Adresse" required className="full" />
          <Field name="addressLine2" label="Complément" className="full" />
          <Field name="postalCode" label="Code postal" required />
          <Field name="city" label="Ville" required />
          <Field name="country" label="Pays" required defaultValue="France" />
          <Field name="phone" label="Téléphone" type="tel" />
          <div className="full">
            <Check name="isDefault" label="Adresse par défaut" defaultChecked={list.length === 0} />
          </div>
          <div className="full">
            <SubmitButton>Enregistrer l&apos;adresse</SubmitButton>
          </div>
        </ActionForm>
      </div>
    </div>
  );
}
