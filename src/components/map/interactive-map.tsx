"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Crosshair, MapPin, Navigation, Phone, X } from "lucide-react";
import { assetPath } from "@/lib/assets";

export type MapEstablishment = {
  id: string;
  name: string;
  address?: string;
  arrondissement?: number | string;
  latitude: number;
  longitude: number;
  image?: string;
  cuisine?: string;
  specialty?: string;
  price?: string;
  kosherType?: string;
  phone?: string;
  distanceKm?: number;
  href?: string;
};

type Props = {
  items: MapEstablishment[];
  selectedItem: MapEstablishment | null;
  onSelect: (item: MapEstablishment | null) => void;
  onOpenDetail?: (item: MapEstablishment) => void;
  onUserLocationChange?: (location: { latitude: number; longitude: number }) => void;
  className?: string;
};

// Chargeur dynamique de Leaflet sans problème SSR
function loadLeaflet(): Promise<any> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return;
    if ((window as any).L) {
      resolve((window as any).L);
      return;
    }

    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => resolve((window as any).L);
    document.head.appendChild(script);
  });
}

export function InteractiveMap({
  items,
  selectedItem,
  onSelect,
  onOpenDetail,
  onUserLocationChange,
  className = "",
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const userMarkerRef = useRef<any>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // Initialisation de la carte
  useEffect(() => {
    let active = true;

    loadLeaflet().then((L) => {
      if (!active || !mapContainerRef.current || mapInstanceRef.current) return;

      const parisCenter: [number, number] = [48.8666, 2.3333];
      const map = L.map(mapContainerRef.current, {
        center: parisCenter,
        zoom: 12,
        zoomControl: false,
      });

      // CartoDB Voyager tiles (fond de carte clair et élégant)
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
      setMapReady(true);
    });

    return () => {
      active = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Gestion des marqueurs d'établissements
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    const map = mapInstanceRef.current;

    // Supprimer les anciens marqueurs
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    const validItems = items.filter(
      (item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude)
    );

    const bounds = L.latLngBounds([]);

    validItems.forEach((item, index) => {
      const isSelected = selectedItem?.id === item.id;
      const markerHtml = `
        <div class="group relative grid size-9 -translate-x-1/2 -translate-y-1/2 cursor-pointer place-items-center rounded-full border-2 ${
          isSelected
            ? "border-white bg-[#c99b42] text-white shadow-2xl scale-125 z-30"
            : "border-white bg-[#20362b] text-white shadow-lg transition-transform hover:scale-115 hover:bg-[#2e5241]"
        }">
          <span class="text-[11px] font-bold">${index + 1}</span>
          ${
            isSelected
              ? '<span class="absolute -bottom-1 size-2 rotate-45 bg-[#c99b42]"></span>'
              : ""
          }
        </div>
      `;

      const customIcon = L.divIcon({
        className: "custom-map-pin",
        html: markerHtml,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([item.latitude, item.longitude], { icon: customIcon })
        .addTo(map)
        .on("click", () => {
          onSelect(item);
          map.panTo([item.latitude, item.longitude], { animate: true });
        });

      markersRef.current.set(item.id, marker);
      bounds.extend([item.latitude, item.longitude]);
    });

    if (validItems.length > 0 && !selectedItem && !userLocation) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [items, selectedItem, mapReady, onSelect, userLocation]);

  // Centrer sur l'élément sélectionné
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !selectedItem) return;
    if (Number.isFinite(selectedItem.latitude) && Number.isFinite(selectedItem.longitude)) {
      mapInstanceRef.current.panTo([selectedItem.latitude, selectedItem.longitude], {
        animate: true,
      });
    }
  }, [selectedItem, mapReady]);

  // Géolocalisation de l'utilisateur
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("La géolocalisation n'est pas prise en charge par votre navigateur.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        onUserLocationChange?.({ latitude, longitude });

        if (mapInstanceRef.current) {
          const L = (window as any).L;
          const map = mapInstanceRef.current;

          // Marqueur position utilisateur (Point bleu vibrant avec radar)
          if (userMarkerRef.current) userMarkerRef.current.remove();

          const userIconHtml = `
            <div class="relative flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center">
              <span class="absolute size-8 animate-ping rounded-full bg-blue-500/40"></span>
              <span class="absolute size-5 rounded-full bg-blue-500/30"></span>
              <span class="relative size-3.5 rounded-full border-2 border-white bg-blue-600 shadow-md"></span>
            </div>
          `;

          const userIcon = L.divIcon({
            className: "user-location-pin",
            html: userIconHtml,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          });

          userMarkerRef.current = L.marker([latitude, longitude], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);

          map.setView([latitude, longitude], 14, { animate: true });
        }
      },
      (error) => {
        setLocating(false);
        console.warn("Erreur géolocalisation:", error.message);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  const handleFitAll = () => {
    if (!mapInstanceRef.current || items.length === 0) return;
    const L = (window as any).L;
    if (!L) return;
    const bounds = L.latLngBounds([]);
    items.forEach((item) => {
      if (Number.isFinite(item.latitude) && Number.isFinite(item.longitude)) {
        bounds.extend([item.latitude, item.longitude]);
      }
    });
    if (userLocation) bounds.extend([userLocation.latitude, userLocation.longitude]);
    mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  };

  const zoomIn = () => mapInstanceRef.current?.zoomIn();
  const zoomOut = () => mapInstanceRef.current?.zoomOut();

  return (
    <div className={`relative overflow-hidden rounded-[2rem] border border-black/[.08] bg-[#f2f4f2] shadow-sm ${className}`}>
      {/* Conteneur Leaflet */}
      <div ref={mapContainerRef} className="size-full min-h-[540px]" />

      {/* En-tête / Badge info */}
      <div className="pointer-events-none absolute left-4 top-4 z-[400] flex items-center gap-2">
        <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-black/5 bg-white/95 px-3.5 py-2 text-xs font-semibold text-ink shadow-md backdrop-blur-md">
          <MapPin size={14} className="text-moss" />
          <span>Paris · {items.length} adresses</span>
        </div>
      </div>

      {/* Contrôles interactifs de la carte (Zoom + Me localiser) */}
      <div className="absolute right-4 top-4 z-[400] flex flex-col gap-2">
        <button
          type="button"
          onClick={handleLocateMe}
          title="Ma position (Me géolocaliser)"
          className={`grid size-10 place-items-center rounded-2xl border border-black/5 bg-white shadow-md transition hover:bg-cream ${
            userLocation ? "text-blue-600 ring-2 ring-blue-500/30" : "text-ink/75"
          }`}
        >
          <Crosshair size={18} className={locating ? "animate-spin text-blue-600" : ""} />
        </button>

        <button
          type="button"
          onClick={handleFitAll}
          title="Recadrer la carte"
          className="grid size-10 place-items-center rounded-2xl border border-black/5 bg-white text-ink/75 shadow-md transition hover:bg-cream"
        >
          <Navigation size={16} />
        </button>

        <div className="flex flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-md">
          <button
            type="button"
            onClick={zoomIn}
            className="grid size-10 place-items-center text-sm font-bold text-ink/75 transition hover:bg-cream"
          >
            +
          </button>
          <div className="h-px bg-black/5" />
          <button
            type="button"
            onClick={zoomOut}
            className="grid size-10 place-items-center text-sm font-bold text-ink/75 transition hover:bg-cream"
          >
            -
          </button>
        </div>
      </div>

      {/* Fiche d'information flottante lorsqu'une adresse est cliquée */}
      {selectedItem && (
        <div className="absolute bottom-4 left-4 right-4 z-[400] overflow-hidden rounded-2xl border border-black/10 bg-white/98 p-4 shadow-2xl backdrop-blur-xl transition-all sm:left-6 sm:right-6">
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="absolute right-3.5 top-3.5 grid size-7 place-items-center rounded-full bg-cream text-ink/45 hover:text-ink"
          >
            <X size={14} />
          </button>

          <div className="flex items-start gap-3.5">
            {selectedItem.image && (
              <img
                src={assetPath(selectedItem.image)}
                alt=""
                className="size-16 shrink-0 rounded-xl object-cover shadow-sm"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-semibold text-ink">{selectedItem.name}</h3>
                {selectedItem.kosherType && (
                  <span className="shrink-0 rounded-full bg-sage px-2 py-0.5 text-[9px] font-bold text-moss">
                    {selectedItem.kosherType}
                  </span>
                )}
              </div>
              <p className="mt-0.5 truncate text-xs text-ink/50">
                {selectedItem.address || "Paris"}
                {selectedItem.distanceKm !== undefined && ` · ${selectedItem.distanceKm} km`}
              </p>
              <p className="mt-0.5 truncate text-[11px] font-medium text-moss">
                {selectedItem.specialty || selectedItem.cuisine}
              </p>
            </div>
          </div>

          <div className="mt-3.5 flex items-center gap-2 border-t border-black/5 pt-3">
            {selectedItem.address && (
              <>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${selectedItem.name} ${selectedItem.address}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-cream py-2 text-[11px] font-semibold text-ink hover:bg-black/5"
                >
                  <MapPin size={12} /> Maps
                </a>
                <a
                  href={`https://waze.com/ul?ll=${selectedItem.latitude},${selectedItem.longitude}&navigate=yes`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-cream py-2 text-[11px] font-semibold text-ink hover:bg-black/5"
                >
                  <Navigation size={12} /> Waze
                </a>
              </>
            )}
            {selectedItem.phone && (
              <a
                href={`tel:${selectedItem.phone.replace(/\s/g, "")}`}
                className="grid size-8 place-items-center rounded-xl bg-cream text-ink hover:bg-black/5"
                title="Appeler"
              >
                <Phone size={13} />
              </a>
            )}
            {onOpenDetail && (
              <button
                type="button"
                onClick={() => onOpenDetail(selectedItem)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-ink py-2 text-[11px] font-semibold text-white hover:bg-ink/90"
              >
                Fiche <ArrowRight size={12} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
