"use client";

import Script from "next/script";
import { useState } from "react";
import { upload } from "@vercel/blob/client";
import { submitCommission } from "@/actions/commission";
import { ActionForm, Check, Field, SubmitButton } from "./forms";

type Att = { url: string; name: string; contentType: string; size: number };
const TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX = 10 * 1024 * 1024;

export function CommissionForm() {
  const [files, setFiles] = useState<Att[]>([]);
  const [uploading, setUploading] = useState(false);
  const [fileErr, setFileErr] = useState<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  async function onFiles(list: FileList | null) {
    setFileErr(null);
    if (!list?.length) return;
    const picked = Array.from(list);
    if (files.length + picked.length > 2) return setFileErr("2 fichiers maximum.");
    for (const f of picked) {
      if (!TYPES.includes(f.type)) return setFileErr(`« ${f.name} » : formats acceptés JPG, PNG ou PDF.`);
      if (f.size > MAX) return setFileErr(`« ${f.name} » dépasse 10 Mo.`);
    }
    setUploading(true);
    try {
      const done: Att[] = [];
      for (const f of picked) {
        const safe = f.name.replace(/[^\w.-]+/g, "_").slice(-80);
        const blob = await upload(`commissions/${safe}`, f, { access: "public", handleUploadUrl: "/api/upload", clientPayload: "commission" });
        done.push({ url: blob.url, name: f.name, contentType: f.type, size: f.size });
      }
      setFiles((prev) => [...prev, ...done]);
    } catch {
      setFileErr("Le téléversement a échoué. Réessayez ou envoyez vos photos en réponse à mon e-mail.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      {siteKey && <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />}
      <ActionForm action={submitCommission} className="form-grid" hideOnSuccess>
        <Field name="clientName" label="Prénom et nom" required autoComplete="name" maxLength={120} />
        <Field name="clientEmail" label="E-mail" type="email" required autoComplete="email" />
        <Field
          name="desiredFormat"
          label="Format souhaité"
          options={[
            { value: "A5", label: "A5 — 21 × 14,8 cm" },
            { value: "A4", label: "A4 — 29,7 × 21 cm" },
            { value: "A3", label: "A3 — 42 × 29,7 cm" },
            { value: "Autre", label: "Je ne sais pas encore" },
          ]}
        />
        <Field name="deadline" label="Pour quelle date ?" placeholder="ex. avant le 15 décembre" maxLength={60} />
        <Field
          name="description"
          label="Votre projet"
          textarea
          required
          className="full"
          maxLength={4000}
          hint="Le lieu, ce qui compte pour vous, l'usage (cadeau, décoration…)."
        />
        <div className="field full">
          <span>Photos de référence (1 à 2 fichiers, JPG, PNG ou PDF, 10 Mo max.)</span>
          <input type="file" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" multiple disabled={uploading || files.length >= 2} onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} />
          {uploading && <span className="hint">Téléversement en cours…</span>}
          {fileErr && <span className="err">{fileErr}</span>}
          {files.length > 0 && (
            <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>
              {files.map((f) => (
                <li key={f.url}>
                  {f.name}{" "}
                  <button type="button" className="linkbtn" onClick={() => setFiles((p) => p.filter((x) => x.url !== f.url))}>
                    retirer
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <input type="hidden" name="attachments" value={JSON.stringify(files)} />
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />
        <div className="full">
          <Check
            name="consent"
            required
            label="J'accepte que mes informations servent à répondre à ma demande. Elles ne sont ni revendues, ni utilisées à d'autres fins."
          />
        </div>
        {siteKey && <div className="cf-turnstile full" data-sitekey={siteKey} data-language="fr" />}
        <div className="full">
          <SubmitButton pendingLabel="Envoi en cours…">{uploading ? "Patientez…" : "Envoyer ma demande"}</SubmitButton>
        </div>
      </ActionForm>
    </>
  );
}
