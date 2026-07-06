"use client";

import { useState } from "react";
import { BellRing, CheckCircle2, Send } from "lucide-react";
import type { Restaurant } from "@/types/restaurant";

export function ReservationForm({ restaurant, onDone }: { restaurant: Restaurant; onDone?: () => void }) {
  const [sent, setSent] = useState(false);
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    const notification = { id: crypto.randomUUID(), restaurantId: restaurant.id, restaurantName: restaurant.name, createdAt: new Date().toISOString(), status: "pending", channels: ["email", "message", "mobile"], ...data };
    const existing = JSON.parse(localStorage.getItem("liberty-reservation-notifications") ?? "[]");
    localStorage.setItem("liberty-reservation-notifications", JSON.stringify([notification, ...existing]));
    setSent(true);
  };

  if (sent) return (
    <div className="grid min-h-[60vh] place-items-center p-8 text-center"><div><span className="mx-auto grid size-16 place-items-center rounded-full bg-sage text-moss"><CheckCircle2 size={27} /></span><h3 className="mt-6 text-2xl font-semibold tracking-tight">Demande préparée.</h3><p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-ink/50">Une notification simulée a été créée pour {restaurant.name}. Les canaux email, message et mobile seront activés depuis le dashboard.</p><button onClick={onDone} className="mt-7 rounded-xl bg-ink px-5 py-3 text-xs font-semibold text-white">Terminer</button></div></div>
  );

  return (
    <form onSubmit={submit} className="p-6 sm:p-8">
      <div className="rounded-2xl bg-sage p-4"><BellRing size={18} className="text-moss" /><p className="mt-2 text-sm font-semibold">Réservation chez {restaurant.name}</p><p className="mt-1 text-xs text-ink/45">Demande sans paiement, soumise à confirmation du restaurant.</p></div>
      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        {[["Prénom", "firstName", "text"], ["Nom", "lastName", "text"], ["Téléphone", "phone", "tel"], ["Email", "email", "email"], ["Nombre de personnes", "guests", "number"], ["Date", "date", "date"], ["Heure", "time", "time"]].map(([label, name, type]) => <label key={name} className="block"><span className="mb-2 block text-xs font-medium">{label}</span><input required name={name} type={type} min={type === "number" ? "1" : undefined} className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-moss" /></label>)}
      </div>
      <label className="mt-4 block"><span className="mb-2 block text-xs font-medium">Message optionnel</span><textarea name="message" rows={4} className="w-full resize-none rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-moss" /></label>
      <button type="submit" className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-4 text-sm font-semibold text-white"><Send size={16} /> Envoyer la demande</button>
    </form>
  );
}
