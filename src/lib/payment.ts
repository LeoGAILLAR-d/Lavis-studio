/**
 * Point d'entrée unique du paiement — isolé pour la phase Stripe.
 * Aujourd'hui : aucune redirection, la commande reste `payment_status = unpaid`
 * et l'atelier envoie les instructions de règlement.
 * Demain : créer une Checkout Session / PaymentIntent ici, enregistrer `payment_intent_id`,
 * puis passer `payment_status` à `paid` dans un webhook (app/api/webhooks/stripe/route.ts).
 */
export async function createPaymentRedirect(_order: { id: string; orderNumber: string; totalAmount: number }): Promise<string | null> {
  return null;
}
