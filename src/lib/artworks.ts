import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Artwork } from "@/db/schema";

export async function getPublishedArtworks() {
  return db.query.artworks.findMany({
    where: eq(schema.artworks.isPublished, true),
    orderBy: [asc(schema.artworks.sortOrder), desc(schema.artworks.createdAt)],
  });
}

export async function getArtworkBySlug(slug: string) {
  return db.query.artworks.findFirst({ where: and(eq(schema.artworks.slug, slug), eq(schema.artworks.isPublished, true)) });
}

export type ArtworkState = "original" | "sold" | "print";

/** Étiquette automatique : Original disponible / Original vendu / Tirage seul. */
export function artworkState(a: Pick<Artwork, "originalPrice" | "isOriginalSold">): ArtworkState {
  if (a.originalPrice == null) return "print";
  return a.isOriginalSold ? "sold" : "original";
}

export const STATE_LABEL: Record<ArtworkState, string> = {
  original: "Original disponible",
  sold: "Original vendu",
  print: "Tirage seul",
};
