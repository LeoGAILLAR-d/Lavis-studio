import type { Metadata } from "next";
import Link from "next/link";
import { register } from "@/actions/account";
import { ActionForm, Field, SubmitButton } from "@/components/forms";

export const metadata: Metadata = { title: "Créer un compte", robots: { index: false } };

export default function RegisterPage() {
  return (
    <div className="wrap section" style={{ maxWidth: 560 }}>
      <h1>Créer un compte</h1>
      <p className="muted">Retrouvez vos commandes, leur suivi et vos adresses de livraison.</p>
      <div className="card pad" style={{ marginTop: 16 }}>
        <ActionForm action={register} className="form-grid">
          <Field name="firstName" label="Prénom" required autoComplete="given-name" />
          <Field name="lastName" label="Nom" required autoComplete="family-name" />
          <Field name="email" label="E-mail" type="email" required autoComplete="email" className="full" />
          <Field name="password" label="Mot de passe" type="password" required autoComplete="new-password" className="full" hint="10 caractères minimum." />
          <div className="full">
            <SubmitButton pendingLabel="Création…">Créer mon compte</SubmitButton>
          </div>
        </ActionForm>
      </div>
      <p style={{ marginTop: 20 }}>
        Déjà inscrit ? <Link href="/compte/connexion">Se connecter</Link>
      </p>
    </div>
  );
}
