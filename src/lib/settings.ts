import "server-only";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";

const DEFAULTS = {
  id: 1,
  bannerText: "",
  bannerActive: false,
  freeShippingThreshold: 150,
  shippingFr: 6.9,
  shippingEu: 12.9,
  shippingWorld: 19.9,
  updatedAt: new Date(0),
};

export type Settings = typeof DEFAULTS;

export const getSettings = cache(async (): Promise<Settings> => {
  const row = await db.query.siteSettings.findFirst({ where: eq(schema.siteSettings.id, 1) });
  return row ?? DEFAULTS;
});
