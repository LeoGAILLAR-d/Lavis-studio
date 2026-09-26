"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { saveArtwork } from "@/actions/admin";
import { ActionForm, Check, Field, SubmitButton, useFieldError } from "@/components/forms";

type A = {
  id?: string;
  title?: string;
  slug?: string;
  category?: string;
  format?: string;
  description?: string;
  altText?: string;
  imageUrl?: string;
  zoomX?: number;
  zoomY?: number;
  zoomScale?: number;
  originalPrice?: number | null;
  printPrice?: number;
  isOriginalSold?: boolean;
  isPublished?: boolean;
  sortOrder?: number;
};

function ImageAndFocus({ initial }: { initial: A }) {
  const [url, setUrl] = useState(initial.imageUrl ?? "");
  const [x, setX] = useState(initial.zoomX ?? 50);
  const [y, setY] = useState(initial.zoomY ?? 50);
  const [scale, setScale] = useState(initial.zoomScale ?? 2.5);
  const [natW, setNatW] = useState<number | null>(null);
  // Zoom conseillé : ~1 000 px affichés par « fois » de zoom sans pixellisation visible
  const advised = natW ? Math.max(1, Math.min(6, Math.floor((natW / 1000) * 2) / 2)) : null;
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const fieldErr = useFieldError("imageUrl");

  async function onFile(f?: File) {
    if (!f) return;
    setErr(null);
    setBusy(true);
    try {
      const safe = f.name.replace(/[^\w.-]+/g, "_").slice(-80);
      const blob = await upload(`artworks/${safe}`, f, { access: "public", handleUploadUrl: "/api/upload", clientPayload: "artwork" });
      setUrl(blob.url);
    } catch (e) {
      setErr("Échec du téléversement : " + (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function pick(e: React.MouseEvent<HTMLDivElement>) {
    const r = imgRef.current?.getBoundingClientRect();
    if (!r) return;
    setX(Math.round(Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100))));
    setY(Math.round(Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100))));
  }

  return (
    <div className="full stack">
      <div className="field">
        Scan HD (JPG, PNG, WebP ou AVIF · 50 Mo max. · converti automatiquement en AVIF/WebP à l&apos;affichage)
        <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(e) => onFile(e.target.files?.[0])} disabled={busy} />
        {busy && <span className="hint">Téléversement en cours…</span>}
        {(err || fieldErr) && <span className="err">{err || fieldErr}</span>}
      </div>
      <input type="hidden" name="imageUrl" value={url} />
      <input type="hidden" name="zoomX" value={x} />
      <input type="hidden" name="zoomY" value={y} />
      <input type="hidden" name="zoomScale" value={scale} />
      {url && (
        <div className="grid-2" style={{ alignItems: "start" }}>
          <div>
            <p className="sans small" style={{ fontWeight: 700 }}>
              Cliquez sur l&apos;image pour choisir le point de détail (zoom)
            </p>
            <div className="picker" onClick={pick}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img ref={imgRef} src={url} alt="Aperçu du scan" onLoad={(e) => setNatW(e.currentTarget.naturalWidth)} />
              <span className="dot" style={{ left: `${x}%`, top: `${y}%` }} />
            </div>
            <div className="form-grid" style={{ marginTop: 12 }}>
              <label className="field">
                Horizontal : {x} %
                <input type="range" min={0} max={100} value={x} onChange={(e) => setX(+e.target.value)} />
              </label>
              <label className="field">
                Vertical : {y} %
                <input type="range" min={0} max={100} value={y} onChange={(e) => setY(+e.target.value)} />
              </label>
              <label className="field full">
                Puissance du zoom : {scale <= 1 ? "pas de zoom" : `× ${scale.toFixed(1)}`}
                <span className="row" style={{ gap: 8 }}>
                  <button type="button" className={scale <= 1 ? "btn sm" : "btn ghost sm"} onClick={() => setScale(1)}>
                    Pas de zoom
                  </button>
                  <button type="button" className={scale > 1 ? "btn sm" : "btn ghost sm"} onClick={() => setScale(scale > 1 ? scale : 2.5)}>
                    Zoom activé
                  </button>
                </span>
                <input type="range" min={1} max={6} step={0.5} value={scale} onChange={(e) => setScale(+e.target.value)} aria-label="Puissance du zoom" />
                <span className="hint">
                  Détail de la fiche et zoom plein écran maximal. « Pas de zoom » : la fiche affiche seulement l&apos;image, sans vignette de détail ni plein écran.
                  {natW && advised != null && (
                    <>
                      {" "}
                      Image de {natW} px de large : zoom conseillé ≤ × {advised.toFixed(1)}
                      {scale > advised && <strong style={{ color: "var(--danger)" }}> — risque de pixellisation</strong>}.
                    </>
                  )}
                </span>
              </label>
            </div>
          </div>
          <div>
            <p className="sans small" style={{ fontWeight: 700 }}>
              Aperçu du détail sur la fiche
            </p>
            <div style={{ aspectRatio: "16/9", overflow: "hidden", border: "2px solid var(--ink)", position: "relative" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${x}% ${y}%`, transform: `scale(${scale})`, transformOrigin: `${x}% ${y}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const FORMATS = [
  "A6 — 14,8 × 10,5 cm",
  "A5 — 21 × 14,8 cm",
  "A4 — 29,7 × 21 cm",
  "A3 — 42 × 29,7 cm",
  "A2 — 59,4 × 42 cm",
  "Carré 20 × 20 cm",
  "Carré 30 × 30 cm",
  "30 × 40 cm",
  "40 × 50 cm",
  "50 × 70 cm",
];
const OTHER = "__autre__";

/** Formats prédéfinis + saisie libre (« Autre format… »). */
function FormatPicker({ initial }: { initial?: string }) {
  const start = initial ?? FORMATS[1];
  const [choice, setChoice] = useState(FORMATS.includes(start) ? start : OTHER);
  const [custom, setCustom] = useState(FORMATS.includes(start) ? "" : start);
  const err = useFieldError("format");
  return (
    <div className="field">
      Format *
      <select value={choice} onChange={(e) => setChoice(e.target.value)} aria-label="Format">
        {FORMATS.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
        <option value={OTHER}>Autre format…</option>
      </select>
      {choice === OTHER && (
        <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Ex. 24 × 32 cm" maxLength={80} aria-label="Autre format" />
      )}
      <input type="hidden" name="format" value={choice === OTHER ? custom : choice} />
      {err && <span className="err">{err}</span>}
    </div>
  );
}

export function ArtworkForm({ artwork = {}, categories }: { artwork?: A; categories: string[] }) {
  return (
    <ActionForm action={saveArtwork} className="form-grid">
      {artwork.id && <input type="hidden" name="id" value={artwork.id} />}
      <Field name="title" label="Titre" required defaultValue={artwork.title} maxLength={120} />
      <Field name="slug" label="Slug (URL)" defaultValue={artwork.slug} hint="Laisser vide pour le générer depuis le titre." />
      <Field name="category" label="Catégorie" required defaultValue={artwork.category} hint={categories.length ? `Existantes : ${categories.join(", ")}` : "Ex. Paysage, Architecture"} />
      <FormatPicker initial={artwork.format} />
      <Field name="description" label="Description" textarea required className="full" defaultValue={artwork.description} />
      <Field name="altText" label="Texte alternatif (accessibilité)" required className="full" defaultValue={artwork.altText} hint="Décrivez l'image pour les personnes malvoyantes." />
      <ImageAndFocus initial={artwork} />
      <Field name="originalPrice" label="Prix de l'original (€)" type="number" step="0.01" min={0} defaultValue={artwork.originalPrice ?? ""} hint="Vide = original non proposé à la vente (tirage seul)." />
      <Field name="printPrice" label="Prix du tirage (€)" type="number" step="0.01" min={0} required defaultValue={artwork.printPrice} />
      <Field name="sortOrder" label="Ordre d'affichage" type="number" min={0} defaultValue={artwork.sortOrder ?? 0} hint="Les plus petits nombres en premier." />
      <div className="full stack">
        <Check name="isOriginalSold" label="Original vendu (se coche automatiquement à la commande)" defaultChecked={artwork.isOriginalSold} />
        <Check name="isPublished" label="Publiée sur le site" defaultChecked={artwork.isPublished ?? true} />
      </div>
      <div className="full">
        <SubmitButton pendingLabel="Enregistrement…">Enregistrer l&apos;œuvre</SubmitButton>
      </div>
    </ActionForm>
  );
}
