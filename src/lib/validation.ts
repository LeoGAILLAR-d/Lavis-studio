import { z } from "zod";

const str = (max: number) => z.string().trim().min(1, "Champ requis").max(max, "Trop long");
const optStr = (max: number) =>
  z
    .string()
    .trim()
    .max(max, "Trop long")
    .optional()
    .transform((v) => (v ? v : null));

export const emailSchema = z.string().trim().toLowerCase().email("Adresse e-mail invalide").max(200);
export const passwordSchema = z.string().min(10, "10 caractères minimum").max(200);

export const addressSchema = z.object({
  firstName: str(80),
  lastName: str(80),
  addressLine1: str(160),
  addressLine2: optStr(160),
  postalCode: str(20),
  city: str(100),
  country: str(80),
  phone: optStr(30),
});

export const checkoutSchema = addressSchema.extend({
  email: emailSchema,
  zone: z.enum(["fr", "eu", "world"]),
  addressId: z.string().uuid().optional().or(z.literal("")),
  saveAddress: z.coerce.boolean().optional(),
  acceptTerms: z.literal("on", { errorMap: () => ({ message: "Veuillez accepter les conditions de vente" }) }),
});

export const registerSchema = z.object({
  firstName: str(80),
  lastName: str(80),
  email: emailSchema,
  password: passwordSchema,
});

export const ALLOWED_ATTACHMENT_TYPES = ["image/jpeg", "image/png", "application/pdf"] as const;
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

export const attachmentSchema = z.object({
  url: z
    .string()
    .url()
    .refine((u) => new URL(u).hostname.endsWith(".public.blob.vercel-storage.com"), "Fichier invalide"),
  name: z.string().max(200),
  contentType: z.enum(ALLOWED_ATTACHMENT_TYPES),
  size: z.number().int().positive().max(MAX_ATTACHMENT_BYTES),
});

export const commissionSchema = z.object({
  clientName: str(120),
  clientEmail: emailSchema,
  desiredFormat: z.enum(["A5", "A4", "A3", "Autre"]),
  deadline: optStr(60),
  description: z.string().trim().min(20, "Décrivez votre projet en quelques phrases (20 caractères minimum)").max(4000),
  attachments: z.array(attachmentSchema).max(2, "2 fichiers maximum"),
  consent: z.literal("on", { errorMap: () => ({ message: "Merci d'accepter le traitement de votre demande" }) }),
});

export const artworkSchema = z.object({
  title: str(120),
  slug: z
    .string()
    .trim()
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lettres minuscules, chiffres et tirets uniquement")
    .optional()
    .or(z.literal("")),
  category: str(60),
  format: str(80),
  description: str(4000),
  altText: str(300),
  imageUrl: z.string().trim().min(1, "Image requise").max(1000),
  zoomX: z.coerce.number().int().min(0).max(100),
  zoomY: z.coerce.number().int().min(0).max(100),
  zoomScale: z.coerce.number().min(1).max(6).default(2.5),
  originalPrice: z
    .union([z.literal(""), z.coerce.number().min(0).max(100000)])
    .transform((v) => (v === "" ? null : v)),
  printPrice: z.coerce.number().min(0).max(100000),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  isOriginalSold: z.coerce.boolean(),
  isPublished: z.coerce.boolean(),
});

/** Transforme les erreurs Zod en { champ: message } pour l'affichage dans les formulaires. */
export function fieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export type FormState = { ok?: boolean; message?: string; errors?: Record<string, string> } | undefined;
