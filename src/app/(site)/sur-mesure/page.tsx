import type { Metadata } from "next";
import { CommissionForm } from "@/components/CommissionForm";

export const metadata: Metadata = {
  title: "Aquarelle sur-mesure",
  description: "Votre maison, votre lieu, votre paysage peint à l'aquarelle et au liner. Demande de devis gratuite, réponse sous 48 h.",
};

export default function CommissionPage() {
  return (
    <div className="wrap section" style={{ maxWidth: 860 }}>
      <h1>Une aquarelle sur-mesure</h1>
      <p>
        Votre maison, un lieu qui compte, un paysage de vacances : décrivez votre projet et joignez une ou deux photos. Je vous réponds
        personnellement sous 48 h avec une proposition.
      </p>
      <div className="card pad" style={{ marginTop: 24 }}>
        <CommissionForm />
      </div>
    </div>
  );
}
