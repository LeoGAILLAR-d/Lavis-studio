import "server-only";
import type { ReactElement } from "react";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM || "Lavis Studio <onboarding@resend.dev>";
export const ARTIST_EMAIL = process.env.ARTIST_EMAIL || "gaillardleo25@gmail.com";

type Mail = { to: string; subject: string; react: ReactElement; replyTo?: string };

/** Envoi d'un e-mail transactionnel. Ne lève jamais d'exception : un e-mail raté ne doit pas annuler une commande. */
export async function sendMail({ to, subject, react, replyTo }: Mail) {
  if (!resend) {
    console.info(`[email:dev] → ${to} | ${subject}${replyTo ? ` | reply-to ${replyTo}` : ""}`);
    return;
  }
  try {
    const { error } = await resend.emails.send({ from: FROM, to, subject, react, replyTo });
    if (error) console.error("[email] échec", subject, error);
  } catch (e) {
    console.error("[email] échec", subject, e);
  }
}
