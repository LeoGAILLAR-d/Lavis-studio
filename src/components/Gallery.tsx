"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { eur } from "@/lib/format";

export type GalleryItem = {
  slug: string;
  title: string;
  category: string;
  format: string;
  imageUrl: string;
  altText: string;
  printPrice: number;
  originalPrice: number | null;
  state: "original" | "sold" | "print";
  stateLabel: string;
};

const TAG: Record<GalleryItem["state"], string> = { original: "available", sold: "sold", print: "print" };

export function Gallery({ items }: { items: GalleryItem[] }) {
  const categories = useMemo(() => Array.from(new Set(items.map((i) => i.category))).sort((a, b) => a.localeCompare(b, "fr")), [items]);
  const [cat, setCat] = useState<string | null>(null);
  const shown = cat ? items.filter((i) => i.category === cat) : items;

  return (
    <>
      <div className="filters" role="group" aria-label="Filtrer par catégorie">
        <button type="button" className="chip" aria-pressed={cat === null} onClick={() => setCat(null)}>
          Tout ({items.length})
        </button>
        {categories.map((c) => (
          <button key={c} type="button" className="chip" aria-pressed={cat === c} onClick={() => setCat(c)}>
            {c}
          </button>
        ))}
      </div>
      <div className="gallery">
        {shown.map((a, i) => (
          <Link key={a.slug} href={`/oeuvres/${a.slug}`} className="work">
            <div className="thumb">
              <span className={`tag ${TAG[a.state]}`}>{a.stateLabel}</span>
              <Image src={a.imageUrl} alt={a.altText} fill sizes="(max-width: 700px) 100vw, 380px" priority={i < 3} />
            </div>
            <h3>{a.title}</h3>
            <p className="muted small sans" style={{ margin: 0 }}>
              {a.category} · {a.format}
            </p>
            <p className="sans" style={{ margin: "4px 0 0", fontWeight: 700 }}>
              {a.state === "original" && a.originalPrice != null ? `Original ${eur(a.originalPrice)} · ` : ""}Tirage {eur(a.printPrice)}
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}
