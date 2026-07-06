import type { Metadata } from "next";
import { BrunchExplorer } from "@/components/brunch/brunch-explorer";
import { brunches } from "@/data/brunches";

export const metadata: Metadata = { title: "Brunch casher à Paris", description: "Découvrez les meilleures adresses de brunch casher à Paris." };

export default function BrunchPage() {
  return <BrunchExplorer initialBrunches={brunches} />;
}
