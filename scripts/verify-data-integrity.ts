import { categories } from "../src/data/categories";
import { localEstablishments } from "../src/data/establishments";
import { getSupabaseBrowserClient } from "../src/lib/supabase/client";

export async function runDataIntegrityCheck() {
  console.log("🔍 === DÉBUT DE L AUDIT D INTÉGRITÉ LIBERTY K ===");
  let hasErrors = false;

  // 1. Vérification des visuels des rubriques
  console.log("\n📸 1. Audit des visuels et rubriques :");
  categories.forEach((cat) => {
    if (!cat.image || cat.image.trim() === "") {
      console.error("❌ ERREUR: La rubrique " + cat.label + " n a pas d image !");
      hasErrors = true;
    } else {
      console.log("✅ Rubrique [" + cat.label + "] : Image OK (" + cat.image.slice(0, 60) + "...)");
    }
  });

  // 2. Vérification de la présence des fiches clés dans les sous-rubriques
  console.log("\n🍰 2. Audit des sous-rubriques clés & fiches :");
  const keySubrubrics = [
    { sub: "food-patisseries", min: 3, label: "Pâtisseries" },
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
    console.log("🎉 AUDIT RÉUSSI : 100% des visuels et données sont intègres et sécurisés !");
  }
}

runDataIntegrityCheck();
