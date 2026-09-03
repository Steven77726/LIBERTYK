import type { Metadata } from "next";
import { AccountDashboard } from "@/components/account/account-dashboard";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Rejoindre Liberty K — Inscription",
  description: "Créez votre compte personnel Liberty K.",
  path: "/signup",
});

export default function SignupPage() {
  return (
    <section className="page-shell py-8 sm:py-12">
      <AccountDashboard initialAuthMode="register" />
    </section>
  );
}
