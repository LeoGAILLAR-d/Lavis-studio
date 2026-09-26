import type { MetadataRoute } from "next";
import { getPublishedArtworks } from "@/lib/artworks";
import { siteUrl } from "@/lib/format";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const works = await getPublishedArtworks().catch(() => []);
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/sur-mesure` },
    { url: `${base}/guide-des-formats` },
    { url: `${base}/cgv` },
    { url: `${base}/mentions-legales` },
    { url: `${base}/confidentialite` },
    ...works.map((a) => ({ url: `${base}/oeuvres/${a.slug}`, lastModified: a.createdAt })),
  ];
}
