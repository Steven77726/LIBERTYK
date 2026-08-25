import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { SupabaseAuthProvider } from "@/components/providers/supabase-auth-provider";
import { AnalyticsTracker } from "@/components/analytics/analytics-tracker";
import { AdminAccessGate } from "@/components/admin/admin-access-gate";
import { JsonLd } from "@/components/seo/json-ld";
import { DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE, DEFAULT_TITLE, SITE_NAME, SITE_ORIGIN, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: { default: "Liberty K — Le guide d'excellence de la communauté juive", template: "%s | Liberty K" },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ["casher", "cacher", "kosher", "restaurant casher", "Liberty K", "Paris", "voyage casher", "vin casher", "communauté juive"],
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: "Liberty K, le guide de la communauté juive et du cacher" }],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  return (
    <html lang="fr">
      <head>
        <link rel="stylesheet" href={`${basePath}/liberty.css`} />
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://dnpcrousaeoyyuxszwwm.supabase.co" crossOrigin="" />
        <JsonLd
          data={[
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              name: SITE_NAME,
              url: SITE_URL,
              logo: `${SITE_URL}/images/food/restaurants-khan.jpg`,
            },
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: SITE_NAME,
              url: SITE_URL,
              potentialAction: {
                "@type": "SearchAction",
                target: `${SITE_URL}/?q={search_term_string}`,
                "query-input": "required name=search_term_string",
              },
            },
          ]}
        />
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
