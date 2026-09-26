"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createPaymentRedirect } from "@/lib/payment";

/** Relance le paiement d'une commande non payée (après abandon sur la page Stripe). */
export async function resumePayment(formData: FormData) {
  const id = z.string().uuid().parse(formData.get("orderId"));
  const url = await createPaymentRedirect(id);
  redirect(url ?? `/commande/confirmation/${id}`);
}
