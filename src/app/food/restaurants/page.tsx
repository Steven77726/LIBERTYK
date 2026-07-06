import type { Metadata } from "next";
import { RestaurantExplorer } from "@/components/restaurants/restaurant-explorer";
import { restaurants } from "@/data/restaurants";

export const metadata: Metadata = {
  title: "Restaurants casher à Paris",
  description: "Recherchez et filtrez les restaurants casher de Paris.",
};

export default function RestaurantsPage() {
  return <RestaurantExplorer initialRestaurants={restaurants} />;
}
