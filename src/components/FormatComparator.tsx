"use client";

import { useState } from "react";

const FORMATS = {
  A5: { w: 21, h: 14.8, note: "Idéal pour une étagère, un bureau ou un petit mur d'entrée." },
  A4: { w: 29.7, h: 21, note: "Le format polyvalent : chambre, couloir, composition murale." },
  A3: { w: 42, h: 29.7, note: "Une vraie présence au-dessus d'un canapé ou d'une console." },
} as const;
type F = keyof typeof FORMATS;

// Scène : mur de 300 cm de large, canapé de 200 cm (repère d'échelle)
const WALL_CM = 300;
const pct = (cm: number) => (cm / WALL_CM) * 100;

export function FormatComparator({ image }: { image?: { src: string; alt: string } }) {
  const [f, setF] = useState<F>("A4");
  const fmt = FORMATS[f];
  const artW = pct(fmt.w);
  // Hauteur de l'œuvre en % de la hauteur du mur (mur 16:9 → 300 × 168,75 cm)
  const wallH = (WALL_CM * 9) / 16;
  const artH = (fmt.h / wallH) * 100;

  return (
    <div>
      <div className="filters" role="group" aria-label="Choisir un format">
        {(Object.keys(FORMATS) as F[]).map((k) => (
          <button key={k} type="button" className="chip" aria-pressed={f === k} onClick={() => setF(k)}>
            {k} — {FORMATS[k].w} × {FORMATS[k].h} cm
          </button>
        ))}
      </div>
      <div className="wall" role="img" aria-label={`Tirage ${f} (${fmt.w} × ${fmt.h} cm) accroché au-dessus d'un canapé de 2 m`}>
        <div className="art" style={{ width: `${artW}%`, height: `${artH}%`, bottom: `${10 + (85 / wallH) * 100 + 8}%` }}>
          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image.src} alt="" />
          )}
        </div>
        <div className="sofa" style={{ width: `${pct(200)}%`, height: `${(85 / wallH) * 100}%` }} />
        <span className="ruler" style={{ left: 8, bottom: 8 }}>
          Canapé : 200 cm
        </span>
        <span className="ruler" style={{ right: 8, top: 8 }}>
          {f} · {fmt.w} × {fmt.h} cm
        </span>
      </div>
      <p className="muted" style={{ marginTop: 12 }}>
        {fmt.note} Les proportions sont à l&apos;échelle (tirage hors cadre).
      </p>
    </div>
  );
}
