import Link from "next/link";
import { ArrowLeft, FileText, Scale, ShieldAlert, Sparkles } from "lucide-react";

export const metadata = {
  title: "Conditions Générales d'Utilisation (CGU) | Libertyk",
  description: "Conditions Générales d'Utilisation de la plateforme Libertyk - Annuaire et guide de référence des établissements cachers en France.",
};

export default function CGUPage() {
  return (
    <div className="min-h-screen bg-[#fcfbfa] text-ink pb-24 pt-12">
      <div className="page-shell max-w-4xl mx-auto space-y-12">
        {/* Navigation retour */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-ink/60 hover:text-ink transition"
        >
          <ArrowLeft size={16} /> Retour à l&apos;accueil
        </Link>

        {/* En-tête */}
        <div className="rounded-[2.5rem] bg-white border border-black/5 p-8 sm:p-12 shadow-sm space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#f6ecd9] text-[#8f6424] text-xs font-extrabold uppercase tracking-wider">
            <Scale size={14} /> Cadre Juridique 2026
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-ink">
            Conditions Générales d&apos;Utilisation (CGU)
          </h1>
          <p className="text-sm sm:text-base text-ink/65 leading-relaxed">
            Dernière mise à jour : 1er Janvier 2026. En vigueur pour l&apos;ensemble des visiteurs et utilisateurs inscrits sur la plateforme <strong>Libertyk</strong>.
          </p>
        </div>

        {/* Contenu textuel juridique */}
        <div className="rounded-[2.5rem] bg-white border border-black/5 p-8 sm:p-12 shadow-sm space-y-10 text-sm leading-relaxed text-ink/80">
          {/* Article 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-ink tracking-tight flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-xl bg-ink text-white text-xs">1</span>
              Objet de la Plateforme Libertyk
            </h2>
            <p>
              La plateforme <strong>Libertyk</strong> (accessible via le site web, applications mobiles et services associés, éditée par LIBERTYK SAS – Steven Ohayon, Avenue de Flandre, 75019 Paris) est un guide numérique et un annuaire d&apos;information dédié aux établissements et services cachers en France et en Europe (restaurants, salons de thé, boulangeries, traiteurs, boucheries, boutiques et prestataires spécialisés).
            </p>
            <p>
              Libertyk a pour vocation exclusive de faciliter la découverte, la mise en relation, la consultation d&apos;avis et l&apos;accès à l&apos;information (horaires, géolocalisation, certifications religieuses, plateformes de livraison partenaires telles que Deliveroo ou Uber Eats). Libertyk agit en qualité de simple intermédiaire technique et éditeur de contenus d&apos;information.
            </p>
          </section>

          {/* Article 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-ink tracking-tight flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-xl bg-ink text-white text-xs">2</span>
              Accès au Service et Comptes Utilisateurs
            </h2>
            <p>
              L&apos;accès à la consultation générale des fiches d&apos;établissements est libre et gratuit. Toutefois, certaines fonctionnalités avancées (notamment l&apos;enregistrement et la synchronisation de <strong>Favoris</strong>, la rédaction d&apos;avis certifiés, la personnalisation des alertes d&apos;horaires de Chabbat) requièrent la création d&apos;un compte personnel par adresse email et mot de passe sécurisé.
            </p>
            <p>
              L&apos;utilisateur s&apos;engage à fournir des informations exactes et à préserver la confidentialité de ses identifiants. Toute action effectuée depuis un compte connecté est réputée avoir été initiée par le titulaire du compte.
            </p>
          </section>

          {/* Article 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-ink tracking-tight flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-xl bg-ink text-white text-xs">3</span>
              Responsabilités des Utilisateurs et Avis
            </h2>
            <p>
              Les utilisateurs ont la faculté de publier des avis, commentaires et notes sur les établissements référencés. L&apos;utilisateur garantit que ses contributions respectent les lois en vigueur et ne contiennent aucun propos injurieux, diffamatoire, discriminatoire, trompeur ou portant atteinte à l&apos;ordre public.
            </p>
            <p>
              Libertyk se réserve le droit de modérer, refuser ou supprimer tout commentaire non conforme, ainsi que de suspendre l&apos;accès à tout utilisateur contrevenant à ces obligations.
            </p>
          </section>

          {/* Article 4 */}
          <section className="space-y-3 bg-[#fdfbf7] p-6 rounded-2xl border border-black/5">
            <h2 className="text-xl font-extrabold text-ink tracking-tight flex items-center gap-2">
              <ShieldAlert className="text-amber-600" size={20} />
              4. Clause de Non-Responsabilité (Cacherout, Horaires & Prix)
            </h2>
            <p className="font-semibold text-ink">
              Clause essentielle relative aux statuts religieux et informations commerciales :
            </p>
            <ul className="list-disc pl-5 space-y-2 text-ink/75">
              <li>
                <strong>Cacherout & Certifications :</strong> Les informations relatives aux surveillances rabbiniques (Beth Din de Paris, Consistoire, Loubavitch Chabad, Rav Rottenberg, Rav Katz, etc.) sont collectées à titre purement indicatif selon les données déclaratives des professionnels et les registres officiels. Les décisions de certification et de retrait de Téoudah relèvent de la compétence exclusive et souveraine des autorités rabbiniques tierces. L&apos;utilisateur est invité à vérifier la validité du certificat directement auprès du commerce ou de l&apos;autorité compétente.
              </li>
              <li>
                <strong>Horaires & Tarifs :</strong> Les horaires d&apos;ouverture, menus, prix, options de livraison ou fermetures exceptionnelles (notamment veilles de fêtes et Chabbat) sont fournis à titre d&apos;information et peuvent être modifiés sans préavis par les commerçants.
              </li>
              <li>
                Libertyk ne saurait être tenue pour responsable des éventuels litiges, intoxications, annulations de réservations, changements de carte ou divergences de certification entre un utilisateur et un établissement référencé.
              </li>
            </ul>
          </section>

          {/* Article 5 */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-ink tracking-tight flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-xl bg-ink text-white text-xs">5</span>
              Propriété Intellectuelle et Base de Données
            </h2>
            <p>
              L&apos;ensemble des éléments constituant la plateforme Libertyk (textes, graphismes, logotypes, interfaces graphiques, algorithmes de filtrage, structure de la base de données, code source, photographies originales) est protégé par les dispositions du Code de la propriété intellectuelle français et les traités internationaux.
            </p>
            <p>
              Conformément à l&apos;article L. 341-1 du Code de la propriété intellectuelle, Libertyk est producteur de sa base de données d&apos;établissements. Toute extraction, reproduction, réutilisation substantielle, scraping non autorisé ou réindexation à des fins commerciales sans accord préalable écrit est formellement interdite et passible de poursuites judiciaires.
            </p>
          </section>

          {/* Article 6 */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-ink tracking-tight flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-xl bg-ink text-white text-xs">6</span>
              Liens Hypertextes & Services Tiers (Uber Eats, Deliveroo, Maps)
            </h2>
            <p>
              La plateforme comporte des liens vers des sites tiers et des services partenaires (Google Maps, Uber Eats, Deliveroo, plateformes de réservation). Libertyk n&apos;exerce aucun contrôle sur ces services tiers et décline toute responsabilité quant à leur contenu, leur politique de confidentialité ou l&apos;exécution des commandes passées via ces canaux externes.
            </p>
          </section>

          {/* Article 7 */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-ink tracking-tight flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-xl bg-ink text-white text-xs">7</span>
              Droit Applicable et Juridiction Compétente
            </h2>
            <p>
              Les présentes CGU sont régies et interprétées selon le droit français. En cas de contestation ou litige relatif à leur validité, interprétation ou exécution, les parties s&apos;engagent à rechercher une solution amiable préalablement à toute action judiciaire. À défaut d&apos;accord amiable, les tribunaux compétents du ressort de la Cour d&apos;Appel de Paris seront seuls compétents.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
