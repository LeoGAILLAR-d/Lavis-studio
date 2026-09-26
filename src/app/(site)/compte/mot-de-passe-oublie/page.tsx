import type { Metadata } from "next";
import { requestPasswordReset } from "@/actions/account";
import { ActionForm, Field, SubmitButton } from "@/components/forms";

export const metadata: Metadata = { title: "Mot de passe oublié", robots: { index: false } };

export default function ForgotPage() {
  return (
    <div className="wrap section" style={{ maxWidth: 520 }}>
      <h1>Mot de passe oublié</h1>
      <p className="muted">Indiquez votre e-mail : vous recevrez un lien valable 1 heure.</p>
      <div className="card pad" style={{ marginTop: 16 }}>
        <ActionForm action={requestPasswordReset} className="stack" hideOnSuccess>
          <Field name="email" label="E-mail" type="email" required autoComplete="email" />
          <SubmitButton>Envoyer le lien</SubmitButton>
        </ActionForm>
      </div>
    </div>
  );
}
