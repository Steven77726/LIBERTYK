import { categories } from "../src/data/categories";
import { localSubrubrics } from "../src/data/subrubrics";
import { localEstablishments } from "../src/data/establishments";

export async function runDataIntegrityCheck() {
  console.log("🔍 === DÉBUT DE L AUDIT D INTÉGRITÉ LIBERTY K ===");
  let hasErrors = false;

  // 1. Audit des rubriques et statut en sommeil
  console.log("\n📸 1. Audit des visuels et rubriques :");
  const dormantSlugs = ["voyages", "religion", "chauffeurs"];
  categories.forEach((cat) => {
    if (!cat.image || cat.image.trim() === "") {
      console.error("❌ ERREUR: La rubrique " + cat.label + " n a pas d image !");
      hasErrors = true;
    } else {
      const isDormantExpected = dormantSlugs.includes(cat.slug);
      if (isDormantExpected && !cat.isDormant) {
        console.error("❌ ERREUR: La rubrique " + cat.label + " devrait être marquée isDormant: true !");
        hasErrors = true;
      } else {
        console.log("✅ Rubrique [" + cat.label + "] : Image OK (" + cat.image.slice(0, 50) + "...) " + (cat.isDormant ? "[EN SOMMEIL]" : "[ACTIVE]"));
      }
    }
  });

  // 2. Audit des sous-rubriques Food (les 10 complètes)
  console.log("\n🍽️ 2. Audit des 10 sous-rubriques Food :");
  const expectedFoodSlugs = [
    "restaurants",
    "brunch",
    "salons-de-the",
    "patisseries",
    "traiteurs",
    "traiteur-chabbat",
    "fast-food",
    "street-food",
    "boulangeries",
    "glaciers",
  ];
  const foodSubs = localSubrubrics.filter((s) => s.rubricId === "food");
  expectedFoodSlugs.forEach((slug) => {
    const found = foodSubs.find((s) => s.slug === slug || s.slug.replace(/-/g, "") === slug.replace(/-/g, ""));
    if (!found) {
      console.error("❌ ERREUR: Sous-rubrique food manquante: " + slug);
      hasErrors = true;
    } else if (!found.image || found.image.trim() === "") {
      console.error("❌ ERREUR: Sous-rubrique food " + slug + " n a pas d image !");
      hasErrors = true;
    } else {
      console.log("✅ Food subrubric [" + found.name + "] (" + found.slug + ") : Image OK");
    }
  });

  // 3. Vérification de la présence des fiches clés dans les sous-rubriques
  console.log("\n🍰 3. Audit des sous-rubriques clés & fiches :");
  const keySubrubrics = [
    { sub: "food-patisseries", min: 1, label: "Pâtisseries (David Abitbol Paris...)" },
    { sub: "food-boulangeries", min: 1, label: "Boulangeries" },
    { sub: "food-traiteurs", min: 1, label: "Traiteurs" },
    { sub: "sorties-evenements", min: 1, label: "Sorties - Événements (Barbanegra / Gainsbar)" },
    { sub: "sorties-soirees-celibataires", min: 1, label: "Soirées célibataires (Lehayiim)" },
    { sub: "location-de-salle-salle-luxe", min: 1, label: "Location de salle (Chichi Paris)" },
    { sub: "soins-feminin-coiffure-maquillage", min: 1, label: "Soins féminin (Abigael Hassan)" },
    { sub: "mariage-decor", min: 1, label: "Mariage Décor (Kinor Decor)" },
  ];

  keySubrubrics.forEach(({ sub, min, label }) => {
    const count = localEstablishments.filter((e) => e.subrubricId === sub || (e.subrubricId || "").includes(sub)).length;
    if (count < min) {
      console.error("❌ ERREUR: Sous-rubrique " + label + " n a que " + count + " fiche(s) !");
      hasErrors = true;
    } else {
      console.log("✅ Sous-rubrique [" + label + "] : " + count + " fiche(s) présentes.");
    }
  });

  console.log("\n==================================================");
  if (hasErrors) {
    console.error("🚨 AUDIT ÉCHOUÉ : Des données ou visuels essentiels sont manquants !");
    process.exit(1);
  } else {
    console.log("🎉 AUDIT RÉUSSI : 100% des visuels et données sont intègres, dormances respectées et sécurisées !");
  }
}

runDataIntegrityCheck();
