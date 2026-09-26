import type { Settings } from "./settings";

export const SHIPPING_ZONES = {
  fr: "France métropolitaine",
  eu: "Union européenne",
  world: "Reste du monde",
} as const;
export type ShippingZone = keyof typeof SHIPPING_ZONES;

/** Frais de port par zone. La livraison offerte au-delà du seuil s'applique à la France (comme sur le site actuel). */
export function shippingCost(zone: ShippingZone, subtotal: number, s: Pick<Settings, "shippingFr" | "shippingEu" | "shippingWorld" | "freeShippingThreshold">) {
  if (zone === "fr") return s.freeShippingThreshold > 0 && subtotal >= s.freeShippingThreshold ? 0 : s.shippingFr;
  if (zone === "eu") return s.shippingEu;
  return s.shippingWorld;
}
