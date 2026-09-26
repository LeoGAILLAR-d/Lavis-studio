import type { CommissionStatus, OrderStatus } from "@/db/schema";

export function eur(n: number) {
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: n % 1 ? 2 : 0 });
}

export function dateFr(d: Date | string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export const ORDER_STATUS: Record<OrderStatus, string> = {
  pending: "Nouvelle",
  processing: "En préparation",
  shipped: "Expédiée",
  completed: "Terminée",
  cancelled: "Annulée",
};

export const COMMISSION_STATUS: Record<CommissionStatus, string> = {
  new: "Nouvelle",
  in_discussion: "En discussion",
  quote_sent: "Devis envoyé",
  declined: "Refusée",
  completed: "Terminée",
};

export const CARRIERS: Record<string, { label: string; url: (n: string) => string }> = {
  colissimo: { label: "Colissimo", url: (n) => `https://www.laposte.fr/outils/suivre-vos-envois?code=${encodeURIComponent(n)}` },
  lettre_suivie: { label: "Lettre suivie", url: (n) => `https://www.laposte.fr/outils/suivre-vos-envois?code=${encodeURIComponent(n)}` },
};

export function trackingUrl(carrier: string | null, number: string) {
  return (CARRIERS[carrier ?? "colissimo"] ?? CARRIERS.colissimo).url(number);
}

export function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
