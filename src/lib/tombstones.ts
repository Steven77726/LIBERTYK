/**
 * Universal Tombstone & Exclusion Registry for Liberty Kosher.
 * 
 * Provides a foolproof, single source of truth for completely excluding deleted
 * establishments across all data layers, search indices, category grids,
 * and fallback sources.
 */

export const TOMBSTONE_STORAGE_KEY = "liberty_excluded_establishments_v1";
export const TOMBSTONE_CHANGE_EVENT = "liberty-tombstones-changed";

/**
 * Permanent hardcoded blacklist of deleted establishments that should NEVER appear,
 * under any circumstances, even if legacy cache or static data attempts to inject them.
 */
export const PERMANENT_TOMBSTONES = [
  "pitzman",
  "pitzman-paris",
  "8-rue-pavee",
  "finkelsztajn",
  "sacha-finkelsztajn",
  "maison-sacha-finkelsztajn",
  "sacha finkelsztajn",
  "maison sacha finkelsztajn",
  "chijfinkelsztajnparis4e007",
  "27-rue-des-rosiers",
  "27 rue des rosiers",
];

export function normalizeTombstoneKey(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Returns the set of all permanent tombstone keys.
 */
export function getPermanentTombstoneSet(): Set<string> {
  const set = new Set<string>();
  PERMANENT_TOMBSTONES.forEach((item) => {
    set.add(normalizeTombstoneKey(item));
    set.add(item.toLowerCase().trim());
  });
  return set;
}

/**
 * Returns dynamic tombstones loaded from client-side localStorage.
 */
export function getDynamicTombstoneSet(): Set<string> {
  const set = new Set<string>();
  if (typeof window === "undefined") return set;

  try {
    // 1. Direct tombstones registry
    const rawDirect = window.localStorage.getItem(TOMBSTONE_STORAGE_KEY);
    if (rawDirect) {
      const parsed = JSON.parse(rawDirect);
      if (Array.isArray(parsed)) {
        parsed.forEach((item) => {
          if (typeof item === "string" && item.trim()) {
            set.add(normalizeTombstoneKey(item));
            set.add(item.toLowerCase().trim());
          }
        });
      }
    }

    // 2. Admin dashboard trash & hidden items
    const rawAdmin = window.localStorage.getItem("liberty-admin-dashboard-v1");
    if (rawAdmin) {
      const parsedAdmin = JSON.parse(rawAdmin) as {
        trash?: Array<{ entityType?: string; label?: string; payload?: { id?: string; name?: string; slug?: string } }>;
        establishments?: Array<{ id?: string; name?: string; slug?: string; status?: string; visible?: boolean; showPublicly?: boolean }>;
      };

      if (Array.isArray(parsedAdmin.trash)) {
        parsedAdmin.trash.forEach((t) => {
          if (t?.payload) {
            if (t.payload.id) {
              set.add(normalizeTombstoneKey(t.payload.id));
              set.add(t.payload.id.toLowerCase().trim());
            }
            if (t.payload.slug) {
              set.add(normalizeTombstoneKey(t.payload.slug));
              set.add(t.payload.slug.toLowerCase().trim());
            }
            if (t.payload.name) {
              set.add(normalizeTombstoneKey(t.payload.name));
              set.add(t.payload.name.toLowerCase().trim());
            }
          }
          if (t?.label) {
            set.add(normalizeTombstoneKey(t.label));
            set.add(t.label.toLowerCase().trim());
          }
        });
      }

      if (Array.isArray(parsedAdmin.establishments)) {
        parsedAdmin.establishments.forEach((est) => {
          if (est.status === "Masqué" || est.visible === false || est.showPublicly === false) {
            if (est.id) {
              set.add(normalizeTombstoneKey(est.id));
              set.add(est.id.toLowerCase().trim());
            }
            if (est.slug) {
              set.add(normalizeTombstoneKey(est.slug));
              set.add(est.slug.toLowerCase().trim());
            }
            if (est.name) {
              set.add(normalizeTombstoneKey(est.name));
              set.add(est.name.toLowerCase().trim());
            }
          }
        });
      }
    }
  } catch {
    // ignore storage access errors
  }

  return set;
}

/**
 * Returns the merged union of permanent and dynamic tombstones.
 */
export function getGlobalTombstoneSet(): Set<string> {
  const perm = getPermanentTombstoneSet();
  const dynamic = getDynamicTombstoneSet();
  dynamic.forEach((k) => perm.add(k));
  return perm;
}

export type IdentifiableEstablishment = {
  id?: string;
  databaseId?: string;
  slug?: string;
  name?: string;
  title?: string;
  external_id?: string | null;
  externalId?: string | null;
  address?: string | null;
  fullAddress?: string | null;
  href?: string | null;
};

/**
 * Tests whether a given candidate establishment or identifier string is tombstoned.
 */
export function isEstablishmentTombstoned(
  candidate: IdentifiableEstablishment | string | null | undefined,
  customTombstones?: Set<string>
): boolean {
  if (!candidate) return false;
  const tombstones = customTombstones ?? getGlobalTombstoneSet();

  if (typeof candidate === "string") {
    const raw = candidate.toLowerCase().trim();
    const norm = normalizeTombstoneKey(candidate);
    if (tombstones.has(raw) || tombstones.has(norm)) return true;
    for (const tomb of tombstones) {
      if (tomb && (raw.includes(tomb) || norm.includes(tomb) || tomb.includes(norm))) {
        return true;
      }
    }
    return false;
  }

  const keysToTest: string[] = [
    candidate.id,
    candidate.databaseId,
    candidate.slug,
    candidate.name,
    candidate.title,
    candidate.external_id ?? undefined,
    candidate.externalId ?? undefined,
    candidate.address ?? undefined,
    candidate.fullAddress ?? undefined,
  ].filter((v): v is string => Boolean(v && typeof v === "string" && v.trim()));

  for (const key of keysToTest) {
    const raw = key.toLowerCase().trim();
    const norm = normalizeTombstoneKey(key);
    if (tombstones.has(raw) || tombstones.has(norm)) return true;
    for (const tomb of tombstones) {
      if (tomb && (raw.includes(tomb) || norm.includes(tomb) || tomb.includes(norm))) {
        return true;
      }
    }
  }

  if (candidate.href) {
    const hrefNorm = normalizeTombstoneKey(candidate.href);
    for (const tomb of tombstones) {
      if (tomb && (candidate.href.toLowerCase().includes(tomb) || hrefNorm.includes(tomb))) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Registers an establishment into the dynamic tombstone exclusion list and persists it.
 */
export function addEstablishmentTombstone(candidate: IdentifiableEstablishment | string): void {
  if (typeof window === "undefined" || !candidate) return;

  try {
    const currentList: string[] = (() => {
      try {
        const raw = window.localStorage.getItem(TOMBSTONE_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    })();

    const newKeys: string[] = [];
    if (typeof candidate === "string") {
      newKeys.push(candidate.trim(), normalizeTombstoneKey(candidate));
    } else {
      if (candidate.id) newKeys.push(candidate.id, normalizeTombstoneKey(candidate.id));
      if (candidate.slug) newKeys.push(candidate.slug, normalizeTombstoneKey(candidate.slug));
      if (candidate.name) newKeys.push(candidate.name, normalizeTombstoneKey(candidate.name));
      if (candidate.title) newKeys.push(candidate.title, normalizeTombstoneKey(candidate.title));
      if (candidate.external_id) newKeys.push(candidate.external_id, normalizeTombstoneKey(candidate.external_id));
    }

    const merged = Array.from(new Set([...currentList, ...newKeys.filter(Boolean)]));
    window.localStorage.setItem(TOMBSTONE_STORAGE_KEY, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent(TOMBSTONE_CHANGE_EVENT, { detail: { added: candidate } }));
  } catch {
    // ignore
  }
}

/**
 * Removes an establishment from the dynamic tombstone exclusion list (for restore actions).
 */
export function removeEstablishmentTombstone(candidate: IdentifiableEstablishment | string): void {
  if (typeof window === "undefined" || !candidate) return;

  try {
    const currentList: string[] = (() => {
      try {
        const raw = window.localStorage.getItem(TOMBSTONE_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    })();

    const keysToRemove = new Set<string>();
    if (typeof candidate === "string") {
      keysToRemove.add(candidate.toLowerCase().trim());
      keysToRemove.add(normalizeTombstoneKey(candidate));
    } else {
      [candidate.id, candidate.slug, candidate.name, candidate.title, candidate.external_id].forEach((k) => {
        if (k) {
          keysToRemove.add(k.toLowerCase().trim());
          keysToRemove.add(normalizeTombstoneKey(k));
        }
      });
    }

    const filtered = currentList.filter((item) => !keysToRemove.has(item.toLowerCase().trim()) && !keysToRemove.has(normalizeTombstoneKey(item)));
    window.localStorage.setItem(TOMBSTONE_STORAGE_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new CustomEvent(TOMBSTONE_CHANGE_EVENT, { detail: { removed: candidate } }));
  } catch {
    // ignore
  }
}

/**
 * Filters any collection of establishments, stripping out all tombstoned items.
 */
export function filterTombstonedEstablishments<T extends IdentifiableEstablishment>(
  items: T[],
  customTombstones?: Set<string>
): T[] {
  if (!items || !items.length) return [];
  const tombstones = customTombstones ?? getGlobalTombstoneSet();
  return items.filter((item) => !isEstablishmentTombstoned(item, tombstones));
}

/**
 * Filters any search items collection, stripping out all tombstoned items.
 */
export function filterTombstonedSearchItems<T extends { id?: string; title?: string; subtitle?: string; href?: string }>(
  items: T[],
  customTombstones?: Set<string>
): T[] {
  if (!items || !items.length) return [];
  const tombstones = customTombstones ?? getGlobalTombstoneSet();
  return items.filter((item) => !isEstablishmentTombstoned({ id: item.id, name: item.title, title: item.title, href: item.href }, tombstones));
}
