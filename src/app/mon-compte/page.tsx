import type { Metadata } from "next";
import { AccountExperience } from "@/components/account/account-experience";

export const metadata: Metadata = { title: "Mon compte" };

export default function AccountPage() {
  return <AccountExperience />;
}
