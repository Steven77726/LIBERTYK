import type { Metadata } from "next";
import { RestaurantExplorer } from "@/components/restaurants/restaurant-explorer";
import { restaurants } from "@/data/restaurants";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = buildPageMetadata({
  title: "Restaurants casher à Paris",
  description: "Recherchez, filtrez et découvrez les restaurants casher à Paris par cuisine, arrondissement, service, budget et ouverture.",
  path: "/food/restaurants",
  image: "/images/food/restaurants-khan.jpg",
  imageAlt: "Restaurants casher à Paris",
});

export default function RestaurantsPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Restaurants casher à Paris",
          itemListElement: restaurants.slice(0, 20).map((restaurant, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": "Restaurant",
              name: restaurant.name,
              servesCuisine: restaurant.cuisine,
              address: `${restaurant.fullAddress}, ${restaurant.postalCode} ${restaurant.city ?? "Paris"}`,
              telephone: restaurant.phone,
              image: absoluteUrl(restaurant.image),
              url: absoluteUrl(`/food/restaurants#${restaurant.id}`),
            },
          })),
        }}
      />
      <RestaurantExplorer initialRestaurants={restaurants} />
    </>
  );
}
