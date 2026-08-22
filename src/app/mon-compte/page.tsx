import type { Metadata } from "next";
import { AccountDashboard } from "@/components/account/account-dashboard";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Mon Compte & Mes Favoris — Liberty",
  description: "Espace personnel Liberty : retrouvez vos favoris, sélections et préférences.",
  path: "/mon-compte",
  noIndex: true,
});

export default function AccountPage() {
  return (
    <section className="page-shell py-8 sm:py-12">
      <AccountDashboard />
    </section>
  );
}
