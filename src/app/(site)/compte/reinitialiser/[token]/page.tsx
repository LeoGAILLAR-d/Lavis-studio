import type { Metadata } from "next";
import { resetPassword } from "@/actions/account";
import { ActionForm, Field, SubmitButton } from "@/components/forms";

export const metadata: Metadata = { title: "Nouveau mot de passe", robots: { index: false } };

export default async function ResetPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <div className="wrap section" style={{ maxWidth: 520 }}>
      <h1>Nouveau mot de passe</h1>
      <div className="card pad" style={{ marginTop: 16 }}>
        <ActionForm action={resetPassword} className="stack">
          <input type="hidden" name="token" value={token} />
          <Field name="password" label="Nouveau mot de passe" type="password" required autoComplete="new-password" hint="10 caractères minimum." />
          <SubmitButton>Enregistrer</SubmitButton>
        </ActionForm>
      </div>
    </div>
  );
}
