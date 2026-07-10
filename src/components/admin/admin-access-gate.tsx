"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldCheck, X } from "lucide-react";

export const ADMIN_SESSION_KEY = "liberty-admin-session";
const ADMIN_ACCESS_CODE = "0519";

export function hasAdminSession() {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(ADMIN_SESSION_KEY) === "granted";
}

export function openAdminAccessModal() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("liberty:open-admin-access"));
}

export function AdminAccessGate() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const listener = () => {
      setError("");
      setCode("");
      setOpen(true);
    };
    window.addEventListener("liberty:open-admin-access", listener);
    if (window.sessionStorage.getItem("liberty-admin-open-modal") === "1") {
      window.sessionStorage.removeItem("liberty-admin-open-modal");
      listener();
    }
    return () => window.removeEventListener("liberty:open-admin-access", listener);
  }, []);

  useEffect(() => {
    if (pathname === "/admin" && !hasAdminSession()) {
      setOpen(true);
      router.replace("/");
    }
  }, [pathname, router]);

  const close = () => {
    setOpen(false);
    setCode("");
    setError("");
    setShowCode(false);
  };

  const validate = () => {
    if (code.trim() !== ADMIN_ACCESS_CODE) {
      setError("Code incorrect");
      setCode("");
      return;
    }

    window.sessionStorage.setItem(ADMIN_SESSION_KEY, "granted");
    close();
    router.push("/admin");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-ink/35 px-4 backdrop-blur-md">
      <button className="absolute inset-0 cursor-default" aria-label="Annuler l’accès administrateur" onClick={close} />
      <div className="relative w-full max-w-md rounded-[2rem] border border-white/70 bg-cream p-6 shadow-[0_35px_110px_rgba(0,0,0,.28)]">
        <button onClick={close} className="absolute right-4 top-4 grid size-9 place-items-center rounded-full bg-white text-ink/45 shadow-sm" aria-label="Fermer">
          <X size={17} />
        </button>
        <span className="grid size-12 place-items-center rounded-2xl bg-ink text-white">
          <ShieldCheck size={22} />
        </span>
        <h2 className="mt-5 text-2xl font-semibold tracking-[-.04em]">Accès administrateur</h2>
        <p className="mt-2 text-sm leading-6 text-ink/48">Entrez votre code d’accès pour ouvrir le Dashboard Liberty.</p>

        <label className="mt-6 block">
          <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[.16em] text-ink/35">Code d’accès</span>
          <span className="flex items-center rounded-2xl border border-black/10 bg-white px-4 py-3 focus-within:border-moss/40 focus-within:ring-4 focus-within:ring-moss/10">
            <input
              autoFocus
              value={code}
              type={showCode ? "text" : "password"}
              inputMode="numeric"
              onChange={(event) => {
                setError("");
                setCode(event.target.value);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") validate();
                if (event.key === "Escape") close();
              }}
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold tracking-[.25em] outline-none"
            />
            <button type="button" onClick={() => setShowCode((value) => !value)} className="grid size-8 place-items-center rounded-full text-ink/40 hover:bg-cream" aria-label={showCode ? "Masquer le code" : "Afficher le code"}>
              {showCode ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </span>
        </label>

        {error && <p className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">{error}</p>}

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <button onClick={validate} className="rounded-2xl bg-ink px-5 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5">Valider</button>
          <button onClick={close} className="rounded-2xl bg-white px-5 py-3.5 text-sm font-semibold text-ink transition hover:-translate-y-0.5">Annuler</button>
        </div>
      </div>
    </div>
  );
}
