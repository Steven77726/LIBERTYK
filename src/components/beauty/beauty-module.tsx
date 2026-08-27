"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, HomeIcon, Instagram, MapPin, MessageCircle, Search, Sparkles } from "lucide-react";
import { assetPath } from "@/lib/assets";
import { listPublishedEstablishments, type EstablishmentRecord } from "@/lib/supabase/establishments-repository";
import { listBeautyCategories, listBeautyServices } from "@/lib/supabase/beauty-repository";
import type { BeautyCategory, BeautyService } from "@/lib/beauty/types";
import { EstablishmentDetailDrawer } from "@/components/ui/establishment-detail-drawer";
import { UniversalEstablishmentCard } from "@/components/ui/universal-establishment-card";

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function safeExternalUrl(value?: string) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("@")) return `https://instagram.com/${trimmed.slice(1)}`;
  return `https://${trimmed}`;
}

function formatPrice(price?: number | null, priceFrom?: boolean) {
  if (price === null || price === undefined || !Number.isFinite(Number(price))) return "";
  return `${priceFrom ? "Dès " : ""}${Number(price).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} €`;
}

export function BeautyModule() {
  const [categories, setCategories] = useState<BeautyCategory[]>([]);
  const [services, setServices] = useState<BeautyService[]>([]);
  const [professionals, setProfessionals] = useState<EstablishmentRecord[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [atHome, setAtHome] = useState(false);
  const [onSite, setOnSite] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState<EstablishmentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([
      listBeautyCategories().catch(() => []),
      listBeautyServices().catch(() => []),
      listPublishedEstablishments({ rubricSlug: "soins-feminin" }).catch(() => []),
    ])
      .then(([nextCategories, nextServices, nextProfessionals]) => {
        if (!mounted) return;
        setCategories(nextCategories);
        setServices(nextServices);
        setProfessionals(nextProfessionals ?? []);
        setError("");
      })
      .catch((loadError) => {
        if (!mounted) return;
        setError(loadError instanceof Error ? loadError.message : "Impossible de charger les soins.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const filteredServices = useMemo(() => {
    if (!selectedCategory) return services;
    return services.filter((service) => service.categoryId === selectedCategory);
  }, [selectedCategory, services]);

  const cities = useMemo(() => [...new Set(professionals.map((item) => item.city).filter(Boolean))].sort(), [professionals]);

  const results = useMemo(() => {
    const normalizedQuery = normalize(query.trim());
    const normalizedCity = normalize(city.trim());
    return professionals.filter((professional) => {
      const proServices = professional.beautyServices ?? [];
      if (selectedCategory && !proServices.some((service) => service.categoryId === selectedCategory)) return false;
      if (selectedService && !proServices.some((service) => service.serviceId === selectedService)) return false;
      if (atHome && !proServices.some((service) => service.atHome)) return false;
      if (onSite && !proServices.some((service) => service.onSite)) return false;
      if (normalizedCity && !normalize(`${professional.city} ${professional.arrondissement} ${professional.postalCode}`).includes(normalizedCity)) return false;
      if (!normalizedQuery) return true;
      const corpus = normalize([
        professional.name,
        professional.city,
        professional.arrondissement,
        professional.description,
        professional.shortDescription,
        professional.customerSearches?.join(" "),
        professional.visibleTagIds?.join(" "),
        proServices.map((service) => `${service.serviceName ?? ""} ${service.serviceSlug ?? ""} ${service.categoryName ?? ""} ${service.categorySlug ?? ""}`).join(" "),
      ].join(" "));
      return corpus.includes(normalizedQuery) || normalizedQuery.split(/\s+/).every((token) => corpus.includes(token));
    });
  }, [atHome, city, onSite, professionals, query, selectedCategory, selectedService]);

  return (
    <>
      <section className="page-shell py-10 sm:py-14">
        <div className="rounded-[2rem] border border-black/[.06] bg-white/80 p-5 shadow-sm backdrop-blur sm:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="eyebrow">Soins de la femme</p>
              <h2 className="section-title">Trouvez une professionnelle beauté</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/50">Recherchez par soin, prestation, ville ou professionnelle. La prise de contact se fait directement par WhatsApp, téléphone ou Instagram.</p>
            </div>
            <span className="w-fit rounded-full bg-cream px-3 py-1.5 text-[11px] font-semibold text-ink/45">
              {loading ? "Chargement…" : `${results.length} professionnelle${results.length > 1 ? "s" : ""}`}
            </span>
          </div>

          <div className="mt-6 grid gap-3 lg:grid-cols-[1.3fr_.8fr]">
            <label className="flex min-w-0 items-center gap-3 rounded-2xl bg-cream px-4 py-3 ring-1 ring-black/[.04] focus-within:bg-white focus-within:ring-moss/30">
              <Search size={18} className="shrink-0 text-ink/35" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Quel soin ou quelle professionnelle recherchez-vous ?"
                className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:truncate placeholder:text-ink/35"
              />
            </label>
            <select value={city} onChange={(event) => setCity(event.target.value)} className="rounded-2xl bg-cream px-4 py-3 text-sm font-semibold text-ink/65 outline-none ring-1 ring-black/[.04]">
              <option value="">Toutes les villes / zones</option>
              {cities.map((cityName) => <option key={cityName} value={cityName}>{cityName}</option>)}
            </select>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            <button onClick={() => { setSelectedCategory(""); setSelectedService(""); }} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold ${!selectedCategory ? "bg-ink text-white" : "bg-cream text-ink/50"}`}>Tout</button>
            {categories.map((category) => (
              <button key={category.id} onClick={() => { setSelectedCategory(category.id); setSelectedService(""); }} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold ${selectedCategory === category.id ? "bg-ink text-white" : "bg-cream text-ink/50"}`}>
                {category.name}
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => setAtHome((value) => !value)} className={`rounded-full px-3 py-2 text-xs font-semibold ${atHome ? "bg-moss text-white" : "bg-white text-ink/50"}`}><HomeIcon size={13} className="mr-1 inline" /> À domicile</button>
            <button onClick={() => setOnSite((value) => !value)} className={`rounded-full px-3 py-2 text-xs font-semibold ${onSite ? "bg-moss text-white" : "bg-white text-ink/50"}`}>Sur place</button>
            {filteredServices.slice(0, 14).map((service) => (
              <button key={service.id} onClick={() => setSelectedService((value) => value === service.id ? "" : service.id)} className={`rounded-full px-3 py-2 text-xs font-semibold ${selectedService === service.id ? "bg-moss text-white" : "bg-white text-ink/50"}`}>
                {service.name}
              </button>
            ))}
          </div>

          {error && <p className="mt-5 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
        </div>
      </section>

      <section className="page-shell pb-14">
        {!loading && !error && results.length === 0 && (
          <div className="rounded-[2rem] bg-white px-6 py-14 text-center shadow-soft">
            <Sparkles size={24} className="mx-auto text-ink/20" />
            <p className="mt-4 text-sm font-semibold">Aucune professionnelle trouvée.</p>
            <p className="mt-1 text-xs text-ink/40">Essayez un autre soin, une autre ville ou retirez un filtre.</p>
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {results.map((professional, index) => (
            <UniversalEstablishmentCard
              key={professional.id}
              establishment={professional}
              onOpen={() => setSelectedProfessional(professional)}
              priorityImage={index < 3}
            />
          ))}
        </div>
      </section>

      <EstablishmentDetailDrawer establishment={selectedProfessional} open={Boolean(selectedProfessional)} onClose={() => setSelectedProfessional(null)} />
    </>
  );
}
