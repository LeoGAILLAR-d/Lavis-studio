import type { Metadata, Viewport } from "next";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/newsreader";
import "@fontsource-variable/newsreader/wght-italic.css";
import "./globals.css";
import { siteUrl } from "@/lib/format";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Lavis Studio — Aquarelles originales et tirages signés de Léo Gaillard", template: "%s · Lavis Studio" },
  description:
    "Aquarelles originales au liner noir et tirages signés, peints à la main par Léo Gaillard. Pièces uniques, tirages numérotés et commandes sur-mesure.",
  authors: [{ name: "Léo Gaillard" }],
  openGraph: { type: "website", siteName: "Lavis Studio", locale: "fr_FR" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
