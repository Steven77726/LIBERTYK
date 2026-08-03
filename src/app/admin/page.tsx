import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Dashboard Administrateur",
  description: "Espace privé d'administration Liberty.",
  path: "/admin",
  noIndex: true,
});

export default function AdminPage() {
  return <AdminDashboard />;
}
