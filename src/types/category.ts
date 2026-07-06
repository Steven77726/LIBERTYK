import type { LucideIcon } from "lucide-react";

export type Category = {
  slug: string;
  label: string;
  shortLabel?: string;
  description: string;
  eyebrow: string;
  icon: LucideIcon;
  color: string;
  softColor: string;
  image: string;
  featured: string[];
};
