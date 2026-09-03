import type { Metadata } from "next";
import { AccountDashboard } from "@/components/account/account-dashboard";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Rejoindre Liberty K — Créer un compte",
  description: "Créez votre compte Liberty K pour enregistrer vos établissements favoris, vos adresses et recevoir les recommandations personnalisées.",
  path: "/inscription",
});

export default function InscriptionPage() {
  return (
    <section className="page-shell py-8 sm:py-12">
      <AccountDashboard initialAuthMode="register" />
    </section>
  );
}
