/* Templates React Email (rendus par Resend). */
import { Body, Button, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text } from "@react-email/components";
import type { ReactNode } from "react";
import { eur } from "@/lib/format";

const S = {
  body: { backgroundColor: "#FBF7EF", fontFamily: "Georgia, 'Times New Roman', serif", color: "#111" },
  box: { maxWidth: 560, margin: "24px auto", background: "#fff", border: "2px solid #000", padding: "28px 28px 20px" },
  h1: { fontFamily: "Helvetica, Arial, sans-serif", fontSize: 22, margin: "0 0 12px" },
  small: { fontSize: 12, color: "#6b6357" },
  btn: { background: "#000", color: "#FBF7EF", padding: "12px 18px", fontFamily: "Helvetica, Arial, sans-serif", fontWeight: 700, textDecoration: "none" },
  row: { margin: "4px 0", fontSize: 15 },
};

function Layout({ preview, title, children }: { preview: string; title: string; children: ReactNode }) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={S.body}>
        <Container style={S.box}>
          <Text style={{ ...S.small, letterSpacing: 2, fontFamily: "Helvetica, Arial, sans-serif", fontWeight: 700 }}>LAVIS STUDIO</Text>
          <Heading style={S.h1}>{title}</Heading>
          {children}
          <Hr />
          <Text style={S.small}>Lavis Studio · Aquarelles originales et tirages signés de Léo Gaillard</Text>
        </Container>
      </Body>
    </Html>
  );
}

export type OrderMailData = {
  orderNumber: string;
  customerName: string;
  items: { title: string; variant: "original" | "print"; quantity: number; unitPrice: number }[];
  shippingCost: number;
  totalAmount: number;
  address: string[];
  url?: string;
  paid?: boolean;
};

function OrderLines({ o }: { o: OrderMailData }) {
  return (
    <Section>
      {o.items.map((i, k) => (
        <Text key={k} style={S.row}>
          {i.quantity} × {i.title} — {i.variant === "original" ? "Œuvre originale" : "Tirage signé"} · {eur(i.unitPrice * i.quantity)}
        </Text>
      ))}
      <Text style={S.row}>Livraison · {o.shippingCost === 0 ? "offerte" : eur(o.shippingCost)}</Text>
      <Text style={{ ...S.row, fontWeight: 700 }}>Total · {eur(o.totalAmount)}</Text>
      <Text style={S.small}>Livraison à : {o.address.join(", ")}</Text>
    </Section>
  );
}

export function OrderConfirmationEmail({ o }: { o: OrderMailData }) {
  return (
    <Layout
      preview={`Commande ${o.orderNumber} ${o.paid ? "confirmée" : "bien reçue"}`}
      title={`Merci ${o.customerName}, votre commande est ${o.paid ? "confirmée" : "enregistrée"}`}
    >
      <Text>
        Référence : <strong>{o.orderNumber}</strong>.{" "}
        {o.paid
          ? "Votre paiement est bien reçu. Je prépare votre envoi (expédition sous 3 jours ouvrés, en pochette rigide) et vous enverrai le numéro de suivi."
          : "Je vous recontacte très vite pour le règlement, puis je prépare votre envoi (expédition sous 3 jours ouvrés après paiement, en pochette rigide)."}
      </Text>
      <OrderLines o={o} />
      {o.url && (
        <Section style={{ margin: "18px 0" }}>
          <Button href={o.url} style={S.btn}>Suivre ma commande</Button>
        </Section>
      )}
    </Layout>
  );
}

export function SaleAlertEmail({ o, email, adminUrl }: { o: OrderMailData; email: string; adminUrl: string }) {
  return (
    <Layout preview={`Nouvelle commande ${o.orderNumber}`} title={`${o.paid ? "Commande payée" : "Nouvelle commande (non payée)"} ${o.orderNumber}`}>
      <Text>
        Client : {o.customerName} · <Link href={`mailto:${email}`}>{email}</Link>
      </Text>
      <OrderLines o={o} />
      <Section style={{ margin: "18px 0" }}>
        <Button href={adminUrl} style={S.btn}>Ouvrir dans l'admin</Button>
      </Section>
    </Layout>
  );
}

export function ShippingEmail({ orderNumber, customerName, carrier, trackingNumber, trackingUrl }: { orderNumber: string; customerName: string; carrier: string; trackingNumber: string; trackingUrl: string }) {
  return (
    <Layout preview={`Votre commande ${orderNumber} est en route`} title={`${customerName}, votre commande est expédiée`}>
      <Text>
        La commande <strong>{orderNumber}</strong> vient de partir par {carrier}. Numéro de suivi : <strong>{trackingNumber}</strong>.
      </Text>
      <Section style={{ margin: "18px 0" }}>
        <Button href={trackingUrl} style={S.btn}>Suivre le colis</Button>
      </Section>
    </Layout>
  );
}

export type CommissionMailData = {
  clientName: string;
  clientEmail: string;
  desiredFormat: string;
  deadline: string | null;
  description: string;
  attachments: { url: string; name: string }[];
};

export function CommissionArtistEmail({ c, adminUrl }: { c: CommissionMailData; adminUrl: string }) {
  return (
    <Layout preview={`Demande sur-mesure de ${c.clientName}`} title={`Demande sur-mesure — ${c.clientName}`}>
      <Text style={S.row}>E-mail : {c.clientEmail} (répondez directement à ce message)</Text>
      <Text style={S.row}>Format : {c.desiredFormat}</Text>
      <Text style={S.row}>Échéance : {c.deadline || "non précisée"}</Text>
      <Text style={{ whiteSpace: "pre-wrap" }}>{c.description}</Text>
      {c.attachments.length > 0 && (
        <Section>
          <Text style={{ ...S.row, fontWeight: 700 }}>Pièces jointes</Text>
          {c.attachments.map((a) => (
            <Text key={a.url} style={S.row}>
              <Link href={a.url}>{a.name}</Link>
            </Text>
          ))}
        </Section>
      )}
      <Section style={{ margin: "18px 0" }}>
        <Button href={adminUrl} style={S.btn}>Voir dans l'admin</Button>
      </Section>
    </Layout>
  );
}

export function CommissionAckEmail({ c }: { c: CommissionMailData }) {
  return (
    <Layout preview="Votre demande sur-mesure est bien reçue" title={`Merci ${c.clientName}, votre demande est bien arrivée`}>
      <Text>
        J'ai bien reçu votre projet d'aquarelle sur-mesure (format {c.desiredFormat}). Je vous réponds personnellement sous 48 h
        avec mes questions et une proposition.
      </Text>
      <Text style={{ whiteSpace: "pre-wrap", ...S.small }}>« {c.description} »</Text>
      <Text>À très vite,<br />Léo</Text>
    </Layout>
  );
}

export function PasswordResetEmail({ url }: { url: string }) {
  return (
    <Layout preview="Réinitialisation de votre mot de passe" title="Réinitialiser votre mot de passe">
      <Text>Vous avez demandé à réinitialiser votre mot de passe. Ce lien est valable 1 heure.</Text>
      <Section style={{ margin: "18px 0" }}>
        <Button href={url} style={S.btn}>Choisir un nouveau mot de passe</Button>
      </Section>
      <Text style={S.small}>Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet e-mail.</Text>
    </Layout>
  );
}
