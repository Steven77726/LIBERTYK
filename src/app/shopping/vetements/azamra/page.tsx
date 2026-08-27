import { azamra } from "@/data/shops";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo";
import { AzamraDetailView } from "@/components/shops/azamra-detail-view";

export const metadata = buildPageMetadata({
  title: "Azamra — Boutique Vêtements Paris 17e | Liberty K",
  description: "Boutique Azamra : 124 Avenue de Villiers, 75017 Paris. Découvrez les collections homme, femme et enfant sélectionnées par Liberty K.",
  path: "/shopping/vetements/azamra",
  image: azamra.image,
  imageAlt: "Boutique Azamra Paris",
});

export default function AzamraPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ClothingStore",
          name: azamra.name,
          description: azamra.description,
          image: absoluteUrl(azamra.image),
          url: absoluteUrl("/shopping/vetements/azamra"),
          address: {
            "@type": "PostalAddress",
            streetAddress: azamra.address,
            addressLocality: azamra.city,
            postalCode: azamra.postalCode,
            addressCountry: azamra.country,
          },
          telephone: azamra.phone,
        }}
      />
      <AzamraDetailView />
    </>
  );
}
