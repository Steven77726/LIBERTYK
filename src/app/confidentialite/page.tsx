import Link from "next/link";
import { ArrowLeft, CheckCircle2, Cookie, Database, Lock, ShieldCheck, UserCheck } from "lucide-react";

export const metadata = {
  title: "Politique de Confidentialité & RGPD | Libertyk",
  description: "Politique de protection des données personnelles et gestion des cookies conforme au Règlement Général sur la Protection des Données (RGPD) et à la CNIL.",
};

export default function ConfidentialitePage() {
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
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-moss text-xs font-extrabold uppercase tracking-wider">
            <ShieldCheck size={14} /> Conformité RGPD & CNIL 2026
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-ink">
            Politique de Confidentialité
          </h1>
          <p className="text-sm sm:text-base text-ink/65 leading-relaxed">
            La protection de votre vie privée et de vos données personnelles est une priorité absolue pour <strong>Libertyk</strong>. Ce document détaille nos engagements conformément au Règlement Général sur la Protection des Données (RGPD - Règlement UE 2016/679) et à la loi Informatique et Libertés modifiée.
          </p>
        </div>

        {/* Contenu textuel */}
        <div className="rounded-[2.5rem] bg-white border border-black/5 p-8 sm:p-12 shadow-sm space-y-10 text-sm leading-relaxed text-ink/80">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-ink tracking-tight flex items-center gap-2">
              <Database className="text-moss" size={20} />
              1. Données Personnelles Collectées
            </h2>
            <p>Dans le cadre de votre utilisation de la plateforme, nous pouvons collecter les catégories de données suivantes :</p>
            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              <div className="rounded-2xl bg-cream/60 p-4 border border-black/5">
                <h3 className="font-bold text-ink text-xs uppercase tracking-wider">Pour les Utilisateurs Particuliers</h3>
                <ul className="mt-2 list-disc pl-4 space-y-1 text-xs text-ink/75">
                  <li>Identité : Prénom, Nom.</li>
                  <li>Contact : Adresse email vérifiée, numéro de téléphone (optionnel).</li>
                  <li>Sécurité : Mot de passe chiffré (hash bcrypt).</li>
                  <li>Préférences : Liste des adresses en Favoris, ville sélectionnée pour les horaires de Chabbat.</li>
                </ul>
              </div>
              <div className="rounded-2xl bg-cream/60 p-4 border border-black/5">
                <h3 className="font-bold text-ink text-xs uppercase tracking-wider">Pour les Professionnels Référencés</h3>
                <ul className="mt-2 list-disc pl-4 space-y-1 text-xs text-ink/75">
                  <li>Informations d&apos;établissement : Nom commercial, enseigne, adresse postale, téléphone professionnel.</li>
                  <li>Certificat de Cacherout : Nom de l&apos;organisme de tutelle et validité de la Téoudah.</li>
                  <li>Facturation : Raison sociale, SIREN, TVA intracommunautaire (pour abonnements payants).</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-ink tracking-tight flex items-center gap-2">
              <Lock className="text-moss" size={20} />
              2. Finalités et Bases Légales du Traitement
            </h2>
            <p>Vos données sont exclusivement traitées pour des finalités licites et proportionnées :</p>
            <ul className="list-disc pl-5 space-y-1.5 text-ink/75">
              <li><strong>Création et gestion de votre compte utilisateur :</strong> Base légale = Exécution contractuelle (CGU). Permet la sauvegarde de vos favoris et la personnalisation de votre espace.</li>
              <li><strong>Envoi d&apos;alertes d&apos;horaires de Chabbat et fêtes :</strong> Base légale = Consentement de l&apos;utilisateur (révocable à tout moment).</li>
              <li><strong>Mise en relation et réservations :</strong> Base légale = Exécution du service demandé.</li>
              <li><strong>Sécurité et prévention de la fraude :</strong> Base légale = Intérêt légitime de l&apos;éditeur à sécuriser ses infrastructures.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-ink tracking-tight flex items-center gap-2">
              <ShieldCheck className="text-moss" size={20} />
              3. Durée de Conservation des Données
            </h2>
            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left text-xs border border-black/10 rounded-2xl overflow-hidden">
                <thead className="bg-cream text-ink font-bold">
                  <tr>
                    <th className="p-3 border-b border-black/10">Type de Données</th>
                    <th className="p-3 border-b border-black/10">Durée de Conservation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 text-ink/70">
                  <tr>
                    <td className="p-3 font-semibold text-ink">Compte utilisateur actif</td>
                    <td className="p-3">Tant que le compte reste actif, puis suppression immédiate sur demande.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-ink">Comptes inactifs</td>
                    <td className="p-3">Suppression après 3 ans d&apos;inactivité totale.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-ink">Données de facturation B2B</td>
                    <td className="p-3">10 ans (obligation légale comptable et fiscale - Code de commerce).</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-ink">Logs techniques & sécurité</td>
                    <td className="p-3">12 mois maximum (recommandation CNIL).</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-ink tracking-tight flex items-center gap-2">
              <UserCheck className="text-moss" size={20} />
              4. Vos Droits (Accès, Rectification, Suppression, Portabilité)
            </h2>
            <p>Conformément aux articles 15 à 22 du RGPD, vous disposez des droits suivants sur vos données :</p>
            <ul className="list-disc pl-5 space-y-1 text-ink/75">
              <li><strong>Droit d&apos;accès et de communication :</strong> Vous pouvez obtenir une copie intégrale de vos données.</li>
              <li><strong>Droit de rectification :</strong> Modification de vos données inexactes ou incomplètes depuis votre espace personnel ou par demande.</li>
              <li><strong>Droit à l&apos;effacement (&quot;Droit à l&apos;oubli&quot;) :</strong> Suppression définitive de votre compte et de vos données associées.</li>
              <li><strong>Droit d&apos;opposition et retrait du consentement :</strong> Vous pouvez vous désinscrire de tout email promotionnel ou alerte Chabbat en 1 clic via le lien de désinscription.</li>
              <li><strong>Droit à la portabilité :</strong> Export de vos favoris et données au format JSON structuré.</li>
            </ul>
            <p className="pt-2">
              Pour exercer ces droits, adressez votre demande accompagnée d&apos;un justificatif d&apos;identité par email à <a href="mailto:dpo@libertyk.com" className="font-bold text-moss underline">dpo@libertyk.com</a> ou par courrier postal à <strong>LIBERTYK SAS – Steven Ohayon, Avenue de Flandre, 75019 Paris</strong>. Nous nous engageons à vous répondre dans un délai maximal d&apos;un (1) mois.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-ink tracking-tight flex items-center gap-2">
              <Cookie className="text-moss" size={20} />
              5. Gestion des Cookies et Traceurs (Directives CNIL)
            </h2>
            <p>
              Libertyk utilise uniquement des cookies strictement nécessaires au fonctionnement technique de la plateforme (maintien de la session connectée, mémorisation des préférences de navigation) ainsi que des outils de mesure d&apos;audience anonymisés.
            </p>
            <p>
              Aucun cookie publicitaire tiers n&apos;est déposé sans votre accord préalable explicite. Vous pouvez à tout moment modifier vos préférences relatives aux cookies dans les paramètres de votre navigateur.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
