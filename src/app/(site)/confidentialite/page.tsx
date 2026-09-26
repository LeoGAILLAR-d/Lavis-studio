import type { Metadata } from "next";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = { title: "Politique de confidentialité" };

export default function Privacy() {
  return (
    <article className="wrap section" style={{ maxWidth: 820 }}>
      <h1>Politique de confidentialité</h1>
      <p className="muted">Dernière mise à jour : {LEGAL.lastUpdate}</p>

      <h2>Responsable du traitement</h2>
      <p>
        {LEGAL.owner} ({LEGAL.brand}), {LEGAL.address} — <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>
      </p>

      <h2>Données collectées et finalités</h2>
      <ul>
        <li>
          <strong>Commandes</strong> : nom, adresse, e-mail, téléphone (facultatif), contenu de la commande — pour exécuter la vente, la
          livraison et le service après-vente (base légale : exécution du contrat) et remplir nos obligations comptables (obligation
          légale).
        </li>
        <li>
          <strong>Compte client</strong> : nom, e-mail, mot de passe chiffré, adresses — pour gérer votre compte et l&apos;historique de
          vos commandes (exécution du contrat).
        </li>
        <li>
          <strong>Demandes sur-mesure</strong> : nom, e-mail, description et photos jointes — pour répondre à votre demande (mesures
          précontractuelles).
        </li>
      </ul>
      <p>Les données bancaires sont traitées directement par Stripe et ne sont jamais stockées par le site.</p>

      <h2>Durées de conservation</h2>
      <ul>
        <li>Commandes et factures : 10 ans (obligation comptable).</li>
        <li>Compte client : jusqu&apos;à sa suppression, ou 3 ans après la dernière activité.</li>
        <li>Demandes sur-mesure sans suite : 3 ans après le dernier échange.</li>
      </ul>

      <h2>Destinataires et sous-traitants</h2>
      <p>
        Vos données ne sont ni vendues ni cédées. Elles sont traitées par les prestataires techniques suivants, uniquement pour faire
        fonctionner le service : Vercel (hébergement, stockage des images), Neon (base de données), Resend (envoi des e-mails), Stripe
        (paiement), Cloudflare Turnstile (protection anti-spam), La Poste (livraison). Certains sont établis hors de l&apos;Union
        européenne ; les transferts sont encadrés par les clauses contractuelles types de la Commission européenne ou le Data Privacy
        Framework.
      </p>

      <h2>Cookies</h2>
      <p>
        Le site n&apos;utilise que des cookies strictement nécessaires à son fonctionnement (session de connexion, panier) et ne dépose
        aucun cookie publicitaire ou de mesure d&apos;audience : aucun consentement n&apos;est donc requis.
      </p>

      <h2>Vos droits</h2>
      <p>
        Vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement, de limitation, d&apos;opposition et de
        portabilité de vos données. Pour les exercer : <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>. Vous pouvez aussi adresser
        une réclamation à la CNIL (<a href="https://www.cnil.fr">www.cnil.fr</a>).
      </p>
    </article>
  );
}
