import type { Metadata } from "next";
import Link from "next/link";
import { login } from "@/actions/account";
import { ActionForm, Field, SubmitButton } from "@/components/forms";

export const metadata: Metadata = { title: "Connexion", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string; reset?: string }> }) {
  const sp = await searchParams;
  return (
    <div className="wrap section" style={{ maxWidth: 520 }}>
      <h1>Connexion</h1>
      {sp.reset && <p className="notice ok">Mot de passe modifié. Vous pouvez vous connecter.</p>}
      <div className="card pad" style={{ marginTop: 16 }}>
        <ActionForm action={login} className="stack">
          <input type="hidden" name="callbackUrl" value={sp.callbackUrl ?? "/compte"} />
          <Field name="email" label="E-mail" type="email" required autoComplete="email" />
          <Field name="password" label="Mot de passe" type="password" required autoComplete="current-password" />
          <SubmitButton pendingLabel="Connexion…">Se connecter</SubmitButton>
        </ActionForm>
      </div>
      <p style={{ marginTop: 20 }}>
        <Link href="/compte/mot-de-passe-oublie">Mot de passe oublié ?</Link>
        <br />
        Pas encore de compte ? <Link href="/compte/inscription">Créer un compte</Link>
      </p>
    </div>
  );
}
