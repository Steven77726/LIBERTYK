import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: { default: "Liberty — L'univers juif et casher", template: "%s | Liberty" },
  description: "Le meilleur de l'univers juif et casher, au même endroit.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body><Header /><main>{children}</main><Footer /></body></html>;
}
