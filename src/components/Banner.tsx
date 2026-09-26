"use client";

import { useEffect, useState } from "react";

/** Bandeau d'annonce : fermable par le visiteur pour la durée de sa session. */
export function Banner({ text, version }: { text: string; version: string }) {
  const key = `lavis_banner_closed_${version}`;
  const [open, setOpen] = useState(true);
  useEffect(() => {
    try {
      if (sessionStorage.getItem(key)) setOpen(false);
    } catch {}
  }, [key]);
  if (!open) return null;
  return (
    <div className="banner" role="region" aria-label="Annonce">
      <div className="wrap">
        <span>{text}</span>
        <button
          type="button"
          aria-label="Fermer l'annonce"
          onClick={() => {
            setOpen(false);
            try {
              sessionStorage.setItem(key, "1");
            } catch {}
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
