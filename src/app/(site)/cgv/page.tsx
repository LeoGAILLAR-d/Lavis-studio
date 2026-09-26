import type { Metadata } from "next";
import { LEGAL } from "@/lib/legal";
import { getSettings } from "@/lib/settings";
import { eur } from "@/lib/format";

export const metadata: Metadata = { title: "Conditions générales de vente" };

export default async function Terms() {
  const s = await getSettings();
  return (
    <article className="wrap section" style={{ maxWidth: 820 }}>
      <h1>Conditions générales de vente</h1>
      <p className="muted">Dernière mise à jour : {LEGAL.lastUpdate}</p>

      <h2>1. Vendeur</h2>
      <p>
        Les présentes conditions régissent les ventes conclues sur ce site entre {LEGAL.brand} ({LEGAL.owner}, {LEGAL.status}, SIRET{" "}
        {LEGAL.siret}, {LEGAL.address}, <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>) et tout acheteur consommateur.
      </p>

      <h2>2. Produits</h2>
      <p>
        Le site propose des <strong>œuvres originales</strong> (aquarelles sur papier, pièces uniques signées) et des{" "}
        <strong>tirages d&apos;art</strong> signés et numérotés (papier beaux-arts 310 g/m², encres pigmentaires). Les photographies sont
        aussi fidèles que possible ; de légères variations de couleur liées à l&apos;écran peuvent exister. Les œuvres sont livrées sans
        cadre. Les commandes <strong>sur-mesure</strong> font l&apos;objet d&apos;un devis personnalisé.
      </p>

      <h2>3. Prix</h2>
      <p>
        Les prix sont indiqués en euros, toutes taxes comprises ({LEGAL.vat}), hors frais de livraison. Les frais de livraison sont
        indiqués avant la validation de la commande. Les prix applicables sont ceux affichés au moment de la commande.
      </p>

      <h2>4. Commande</h2>
      <p>
        La commande est passée après sélection des articles, saisie de l&apos;adresse de livraison, acceptation des présentes CGV et
        paiement. Un e-mail de confirmation récapitulant la commande est envoyé à l&apos;acheteur. Une œuvre originale est réservée pendant
        la durée du paiement ; si le paiement n&apos;aboutit pas, elle redevient disponible.
      </p>

      <h2>5. Paiement</h2>
      <p>
        Le paiement s&apos;effectue en ligne par carte bancaire via la plateforme sécurisée Stripe. Les données bancaires ne transitent
        jamais par le site et ne sont pas conservées par le vendeur. La commande est définitivement validée à la réception du paiement.
      </p>

      <h2>6. Livraison</h2>
      <p>
        Expédition sous 3 jours ouvrés après paiement, en pochette rigide, avec numéro de suivi. Tarifs : France métropolitaine{" "}
        {eur(s.shippingFr)}
        {s.freeShippingThreshold > 0 && ` (offerte dès ${eur(s.freeShippingThreshold)} d'achat)`}, Union européenne {eur(s.shippingEu)},
        reste du monde {eur(s.shippingWorld)}. Les délais d&apos;acheminement dépendent du transporteur. Hors Union européenne, des droits
        de douane peuvent être dus par l&apos;acheteur. En cas de colis endommagé, l&apos;acheteur est invité à émettre des réserves auprès
        du transporteur et à prévenir le vendeur sous 48 h avec photos.
      </p>

      <h2>7. Droit de rétractation</h2>
      <p>
        Conformément à l&apos;article L221-18 du Code de la consommation, l&apos;acheteur dispose de <strong>14 jours</strong> à compter de
        la réception pour se rétracter, sans avoir à se justifier, en adressant une déclaration dénuée d&apos;ambiguïté par e-mail à{" "}
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> (ou via le formulaire ci-dessous). Le produit doit être retourné dans son état
        d&apos;origine, dans les 14 jours suivant la rétractation ; les frais de retour sont à la charge de l&apos;acheteur. Le
        remboursement (prix et frais de livraison initiaux au tarif standard) intervient dans les 14 jours suivant la rétractation, par
        le même moyen de paiement, et peut être différé jusqu&apos;à réception du produit.
      </p>
      <p>
        <strong>Exception :</strong> le droit de rétractation ne s&apos;applique pas aux œuvres réalisées sur-mesure selon les
        spécifications de l&apos;acheteur (article L221-28, 3° du Code de la consommation).
      </p>

      <h2>8. Garanties légales</h2>
      <p>
        Le vendeur est tenu de la garantie légale de conformité (articles L217-3 et suivants du Code de la consommation) et de la garantie
        des vices cachés (articles 1641 et suivants du Code civil). L&apos;acheteur dispose d&apos;un délai de 2 ans à compter de la
        délivrance du bien pour agir au titre de la garantie de conformité.
      </p>

      <h2>9. Propriété intellectuelle</h2>
      <p>
        L&apos;achat d&apos;une œuvre ou d&apos;un tirage transfère la propriété de l&apos;objet, mais pas les droits d&apos;auteur :
        toute reproduction ou exploitation commerciale reste interdite sans accord écrit de l&apos;artiste.
      </p>

      <h2>10. Médiation et litiges</h2>
      <p>
        En cas de litige, l&apos;acheteur s&apos;adresse d&apos;abord au vendeur. À défaut de solution amiable, il peut recourir
        gratuitement au médiateur de la consommation : {LEGAL.mediator.name} — {LEGAL.mediator.url}. Les présentes CGV sont soumises au
        droit français.
      </p>

      <h2>Annexe — Formulaire de rétractation</h2>
      <div className="card pad">
        <p className="small">
          À l&apos;attention de {LEGAL.brand}, {LEGAL.address}, {LEGAL.email} :<br />
          Je vous notifie par la présente ma rétractation du contrat portant sur la vente du bien ci-dessous :<br />
          Commandé le / reçu le : …<br />
          Référence de commande : …<br />
          Nom et adresse du consommateur : …<br />
          Date et signature (si envoi papier) : …
        </p>
      </div>
    </article>
  );
}
