import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { SupabaseAuthProvider } from "@/components/providers/supabase-auth-provider";
import { AnalyticsTracker } from "@/components/analytics/analytics-tracker";
import { AdminAccessGate } from "@/components/admin/admin-access-gate";

export const metadata: Metadata = {
  title: { default: "Liberty — L'univers juif et casher", template: "%s | Liberty" },
  description: "Le meilleur de l'univers juif et casher, au même endroit.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  return (
    <html lang="fr">
      <head>
        <link rel="stylesheet" href={`${basePath}/liberty.css`} />
      </head>
      <body>
        <SupabaseAuthProvider>
          <AnalyticsTracker />
          <AdminAccessGate />
          <Header />
          <main>{children}</main>
          <Footer />
        </SupabaseAuthProvider>
      </body>
    </html>
  );
}
