"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

/** Visualiseur HD : vue d'ensemble, détail centré sur (zoomX, zoomY), plein écran avec zoom molette / pincement. */
export function ArtworkViewer({ src, alt, title, zoomX, zoomY }: { src: string; alt: string; title: string; zoomX: number; zoomY: number }) {
  const [open, setOpen] = useState(false);
  const [t, setT] = useState({ s: 1, x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const pinch = useRef<{ d: number; s: number } | null>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  const openAt = useCallback(
    (focus: boolean) => {
      setOpen(true);
      // Ouvre directement zoomé sur le point de détail choisi par l'artiste
      setT(focus ? { s: 2.5, x: (50 - zoomX) * 4, y: (50 - zoomY) * 3 } : { s: 1, x: 0, y: 0 });
    },
    [zoomX, zoomY],
  );

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "+" || e.key === "=") setT((v) => ({ ...v, s: Math.min(6, v.s * 1.3) }));
      if (e.key === "-") setT((v) => ({ ...v, s: Math.max(1, v.s / 1.3) }));
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const zoom = (f: number) => setT((v) => ({ ...v, s: Math.min(6, Math.max(1, v.s * f)) }));

  return (
    <div className="viewer">
      <button type="button" className="main" onClick={() => openAt(false)} aria-label={`Voir ${title} en plein écran avec zoom`}>
        <Image src={src} alt={alt} width={1600} height={1200} sizes="(max-width: 900px) 100vw, 640px" priority style={{ width: "100%", height: "auto" }} />
      </button>
      <div className="detail">
        <button type="button" className="crop" onClick={() => openAt(true)} aria-label="Voir le détail du trait" style={{ cursor: "zoom-in", padding: 0 }}>
          <Image
            src={src}
            alt=""
            fill
            sizes="640px"
            style={{ objectFit: "cover", objectPosition: `${zoomX}% ${zoomY}%`, transform: "scale(2.2)", transformOrigin: `${zoomX}% ${zoomY}%` }}
          />
        </button>
        <p className="small muted" style={{ margin: 0, maxWidth: 160 }}>
          Détail du trait. Cliquez pour zoomer en plein écran.
        </p>
      </div>

      {open && (
        <div className="zoom-ov" role="dialog" aria-modal="true" aria-label={`Vue zoomée : ${title}`}>
          <div className="bar">
            <span>{title}</span>
            <div>
              <button type="button" onClick={() => zoom(1 / 1.4)} aria-label="Dézoomer">
                −
              </button>
              <button type="button" onClick={() => zoom(1.4)} aria-label="Zoomer">
                +
              </button>
              <button type="button" ref={closeBtn} onClick={() => setOpen(false)} aria-label="Fermer">
                ✕
              </button>
            </div>
          </div>
          <div
            className="stage"
            onWheel={(e) => zoom(e.deltaY < 0 ? 1.15 : 1 / 1.15)}
            onPointerDown={(e) => {
              (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
              drag.current = { x: e.clientX, y: e.clientY, ox: t.x, oy: t.y };
            }}
            onPointerMove={(e) => {
              if (!drag.current || pinch.current) return;
              const d = drag.current;
              setT((v) => ({ ...v, x: d.ox + (e.clientX - d.x) / v.s, y: d.oy + (e.clientY - d.y) / v.s }));
            }}
            onPointerUp={() => (drag.current = null)}
            onTouchStart={(e) => {
              if (e.touches.length === 2) {
                const [a, b] = [e.touches[0], e.touches[1]];
                pinch.current = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), s: t.s };
              }
            }}
            onTouchMove={(e) => {
              if (e.touches.length === 2 && pinch.current) {
                const [a, b] = [e.touches[0], e.touches[1]];
                const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
                const p = pinch.current;
                setT((v) => ({ ...v, s: Math.min(6, Math.max(1, (p.s * d) / p.d)) }));
              }
            }}
            onTouchEnd={() => (pinch.current = null)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- image pleine résolution pour le zoom */}
            <img src={src} alt={alt} draggable={false} style={{ transform: `scale(${t.s}) translate(${t.x}px, ${t.y}px)` }} />
          </div>
        </div>
      )}
    </div>
  );
}
