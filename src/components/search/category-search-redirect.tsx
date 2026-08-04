"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function CategorySearchRedirect({ label }: { label: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextQuery = query.trim() || label;
    router.push(`/?q=${encodeURIComponent(nextQuery)}#recherche`);
  };

  return (
    <form onSubmit={submit} className="mt-9 flex max-w-xl items-center rounded-2xl bg-white p-2 shadow-soft">
      <Search className="ml-3 text-ink/30" size={19} />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={`Rechercher dans ${label.toLowerCase()}...`}
        className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm outline-none"
        aria-label={`Rechercher dans ${label}`}
      />
      <button type="submit" className="rounded-xl bg-ink px-4 py-3 text-sm font-medium text-white">Rechercher</button>
    </form>
  );
}
