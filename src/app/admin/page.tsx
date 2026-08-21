import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { buildPageMetadata } from "@/lib/seo";

const AdminDashboard = dynamic(
  () => import("@/components/admin/admin-dashboard").then((mod) => mod.AdminDashboard),
  {
    loading: () => (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm font-semibold text-ink/50">Chargement du dashboard administrateur...</p>
      </div>
    ),
  }
);

export const metadata: Metadata = buildPageMetadata({
  title: "Dashboard Administrateur",
  description: "Espace privé d'administration Liberty.",
  path: "/admin",
  noIndex: true,
});

export default function AdminPage() {
  return <AdminDashboard />;
}
