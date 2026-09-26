"use server";

import { headers } from "next/headers";
import { db, schema } from "@/db";
import { ARTIST_EMAIL, sendMail } from "@/lib/email";
import { siteUrl } from "@/lib/format";
import { verifyTurnstile } from "@/lib/turnstile";
import { commissionSchema, fieldErrors, type FormState } from "@/lib/validation";
import { CommissionAckEmail, CommissionArtistEmail } from "@/emails/templates";

export async function submitCommission(_prev: FormState, formData: FormData): Promise<FormState> {
  // Pot de miel : champ invisible rempli uniquement par les robots
  if (formData.get("website")) return { ok: true, message: "Merci, votre demande est bien partie." };

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  if (!(await verifyTurnstile(formData.get("cf-turnstile-response") as string | null, ip))) {
    return { message: "La vérification anti-spam a échoué. Rechargez la page et réessayez." };
  }

  let attachments: unknown = [];
  try {
    attachments = JSON.parse((formData.get("attachments") as string) || "[]");
  } catch {
    return { message: "Pièces jointes invalides." };
  }
  const parsed = commissionSchema.safeParse({ ...Object.fromEntries(formData), attachments });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Merci de vérifier le formulaire." };
  const c = parsed.data;

  const [row] = await db
    .insert(schema.commissionRequests)
    .values({
      clientName: c.clientName,
      clientEmail: c.clientEmail,
      desiredFormat: c.desiredFormat,
      deadline: c.deadline,
      description: c.description,
      attachmentUrls: c.attachments,
    })
    .returning({ id: schema.commissionRequests.id });

  const data = { ...c, attachments: c.attachments.map((a) => ({ url: a.url, name: a.name })) };
  await Promise.all([
    sendMail({
      to: ARTIST_EMAIL,
      subject: `✏️ Demande sur-mesure — ${c.clientName} (${c.desiredFormat})`,
      react: CommissionArtistEmail({ c: data, adminUrl: `${siteUrl()}/admin/sur-mesure#${row.id}` }),
      replyTo: c.clientEmail,
    }),
    sendMail({ to: c.clientEmail, subject: "Votre demande sur-mesure est bien reçue — Lavis Studio", react: CommissionAckEmail({ c: data }) }),
  ]);

  return { ok: true, message: "Merci ! Votre demande est bien arrivée. Un e-mail de confirmation vient de vous être envoyé ; je vous réponds sous 48 h." };
}
