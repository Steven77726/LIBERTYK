import type { Metadata } from "next";
import { HebrewCalendarPage } from "@/components/calendar/hebrew-calendar-page";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Calendrier Juif, Fêtes, Paracha & Horaires de Chabbat — Liberty K",
  description:
    "Consultez en temps réel les horaires de Chabbat géolocalisés, la Paracha de la semaine, les dates des fêtes juives et jeûnes, et synchronisez-les en 1 clic sur Google Agenda et Apple Calendar.",
  path: "/calendrier-juif",
});

export default function Page() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Accueil", item: absoluteUrl("/") },
            { "@type": "ListItem", position: 2, name: "Calendrier Juif", item: absoluteUrl("/calendrier-juif") },
          ],
        }}
      />
      <HebrewCalendarPage />
    </>
  );
}
