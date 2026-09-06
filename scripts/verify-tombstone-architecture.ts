import { localEstablishments } from "../src/data/establishments";
import { searchIndex } from "../src/data/search-index";
import {
  isEstablishmentTombstoned,
  filterTombstonedEstablishments,
} from "../src/lib/tombstones";
import { searchItems, getSearchSuggestions } from "../src/lib/search-engine";
import { searchEstablishments } from "../src/lib/search/search-service";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

async function run() {
  console.log("=== 1. AUDIT DES DONNÉES STATIQUES ===");

  // 1. Check localEstablishments
  const finkelLocal = localEstablishments.filter(
    (e) =>
      e.name.toLowerCase().includes("finkelsztajn") ||
      (e.slug && e.slug.includes("finkelsztajn")) ||
      (e.id && e.id.includes("finkelsztajn"))
  );
  assert(finkelLocal.length === 0, `localEstablishments contains 0 Finkelsztajn (found ${finkelLocal.length})`);

  const pitzmanLocal = localEstablishments.filter(
    (e) =>
      e.name.toLowerCase().includes("pitzman") ||
      (e.slug && e.slug.includes("pitzman")) ||
      (e.id && e.id.includes("pitzman"))
  );
  assert(pitzmanLocal.length === 0, `localEstablishments contains 0 Pitzman (found ${pitzmanLocal.length})`);

  // 2. Check searchIndex
  const finkelSearch = searchIndex.filter(
    (item) =>
      (item.title && item.title.toLowerCase().includes("finkelsztajn")) ||
      (item.href && item.href.toLowerCase().includes("finkelsztajn")) ||
      (item.id && item.id.toLowerCase().includes("finkelsztajn"))
  );
  assert(finkelSearch.length === 0, `searchIndex contains 0 Finkelsztajn (found ${finkelSearch.length})`);

  const pitzmanSearch = searchIndex.filter(
    (item) =>
      (item.title && item.title.toLowerCase().includes("pitzman")) ||
      (item.href && item.href.toLowerCase().includes("pitzman")) ||
      (item.id && item.id.toLowerCase().includes("pitzman"))
  );
  assert(pitzmanSearch.length === 0, `searchIndex contains 0 Pitzman (found ${pitzmanSearch.length})`);

  console.log("\n=== 2. TEST DU MOTEUR DE TOMBSTONES (EXCLUSION DÉFINITIVE) ===");

  // Test matching on permanent blacklist
  assert(isEstablishmentTombstoned({ id: "finkelsztajn" }), "Matches id 'finkelsztajn'");
  assert(isEstablishmentTombstoned({ name: "Maison Sacha Finkelsztajn" }), "Matches name 'Maison Sacha Finkelsztajn'");
  assert(isEstablishmentTombstoned({ slug: "sacha-finkelsztajn" }), "Matches slug 'sacha-finkelsztajn'");
  assert(isEstablishmentTombstoned({ id: "establishment-pitzman" }), "Matches prefixed id 'establishment-pitzman'");
  assert(isEstablishmentTombstoned({ address: "27 Rue des Rosiers, 75004 Paris" }), "Matches address '27 Rue des Rosiers'");

  // Test custom establishment tombstoning
  const dummyEstablishment = {
    id: "test-delete-999",
    name: "Restaurant Fantôme",
    slug: "restaurant-fantome",
    rubricId: "food",
    subrubricId: "food-restaurants",
    city: "Paris",
    address: "10 rue de test",
    badge: "Kacher",
    status: "Publié",
  };

  // Before tombstoning
  assert(!isEstablishmentTombstoned(dummyEstablishment), "Dummy establishment is not tombstoned initially");

  const dummyList = [dummyEstablishment, { id: "valid-1", name: "Le Bon Restaurant", rubricId: "food" }];
  const filteredListBefore = filterTombstonedEstablishments(dummyList);
  assert(filteredListBefore.length === 2, "filterTombstonedEstablishments keeps valid items before tombstone");

  // In-memory test of dynamic custom tombstone
  const customTombstones = new Set(["custom-deleted-item", "restaurant-fantome"]);
  assert(isEstablishmentTombstoned(dummyEstablishment, customTombstones), "Dummy establishment is tombstoned when added to custom set");

  const dummyListWithCustom = [dummyEstablishment, { id: "valid-1", name: "Le Bon Restaurant", rubricId: "food" }];
  const filteredWithCustom = dummyListWithCustom.filter((item) => !isEstablishmentTombstoned(item, customTombstones));
  assert(filteredWithCustom.length === 1 && filteredWithCustom[0].id === "valid-1", "Custom tombstoned item is filtered out");

  // In-memory test of filter with permanent tombstoned element
  const tombstonedItem = { id: "pitzman", name: "Pitzman", rubricId: "food" };
  const mixedList = [tombstonedItem, { id: "valid-2", name: "Le Grand Restaurant", rubricId: "food" }];
  const filteredMixed = filterTombstonedEstablishments(mixedList);
  assert(filteredMixed.length === 1 && filteredMixed[0].id === "valid-2", "filterTombstonedEstablishments eliminates permanent tombstoned item");

  // Search engine test
  const searchResults = searchItems(searchIndex, "Finkelsztajn");
  assert(searchResults.length === 0, "searchItems(searchIndex, 'Finkelsztajn') returns 0 results");

  const searchResultsPitzman = searchItems(searchIndex, "Pitzman");
  assert(searchResultsPitzman.length === 0, "searchItems(searchIndex, 'Pitzman') returns 0 results");

  // Search service test
  const establishmentsFinkel = await searchEstablishments("Finkelsztajn");
  assert(establishmentsFinkel.length === 0, "searchEstablishments('Finkelsztajn') returns 0 results");

  const establishmentsPitzman = await searchEstablishments("Pitzman");
  assert(establishmentsPitzman.length === 0, "searchEstablishments('Pitzman') returns 0 results");

  const suggestionsFinkel = getSearchSuggestions("Finkelsztajn");
  assert(suggestionsFinkel.length === 0, "getSearchSuggestions('Finkelsztajn') returns 0 results");

  const suggestionsPitzman = getSearchSuggestions("Pitzman");
  assert(suggestionsPitzman.length === 0, "getSearchSuggestions('Pitzman') returns 0 results");

  console.log("\n🎉 TOUS LES TESTS DE RECHERCHE, TOMBSTONES ET D'EXCLUSION SONT VALIDÉS !");
}

void run();
