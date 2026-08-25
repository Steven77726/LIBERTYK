import Link from "next/link";
import { ArrowLeft, CreditCard, RefreshCw, Scale, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Conditions Générales de Vente (CGV) | Libertyk",
  description: "Conditions Générales de Vente régissant les services payants, abonnements professionnels et options de mise en avant sur Libertyk.",
};

export default function CGVPage() {
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
            <CreditCard size={14} /> Services Professionnels & Partenaires 2026
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-ink">
            Conditions Générales de Vente (CGV)
          </h1>
          <p className="text-sm sm:text-base text-ink/65 leading-relaxed">
            Dernière mise à jour : 1er Janvier 2026. Applicables aux services payants, options de visibilité premium et abonnements souscrits sur <strong>Libertyk</strong>.
          </p>
        </div>

        {/* Contenu textuel juridique */}
        <div className="rounded-[2.5rem] bg-white border border-black/5 p-8 sm:p-12 shadow-sm space-y-10 text-sm leading-relaxed text-ink/80">
          {/* Article 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-ink tracking-tight flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-xl bg-ink text-white text-xs">1</span>
              Champ d&apos;Application et Services Proposés
            </h2>
            <p>
              Les présentes Conditions Générales de Vente régissent l&apos;ensemble des relations contractuelles entre la société éditrice de <strong>Libertyk</strong> et tout professionnel ou établissement (restaurateur, commerçant, traiteur, organisateur d&apos;événements) souscrivant à des prestations payantes sur le site.
            </p>
            <p>Les services proposés incluent notamment :</p>
            <ul className="list-disc pl-5 space-y-1.5 text-ink/75">
              <li>L&apos;offre <strong>Libertyk Premium / Mise en Avant</strong> (badge vérifié, positionnement prioritaire dans les résultats de recherche et guides thématiques).</li>
              <li>L&apos;enrichissement de fiche établissement (galerie photos haute définition, intégration de liens Deliveroo & Uber Eats dédiés, bannières événementielles).</li>
              <li>Les campagnes d&apos;emailing ciblées et newsletters aux membres inscrits.</li>
            </ul>
          </section>

          {/* Article 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-ink tracking-tight flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-xl bg-ink text-white text-xs">2</span>
              Tarifs, Facturation et Modalités de Paiement
            </h2>
            <p>
              Les prix de nos offres sont indiqués en euros hors taxes (€ HT), soumis à la TVA française en vigueur (20%). Libertyk se réserve le droit de modifier ses tarifs à tout moment, étant entendu que les abonnements en cours demeurent soumis aux tarifs en vigueur au jour de la souscription initiale.
            </p>
            <p>
              Le règlement s&apos;effectue en ligne par carte bancaire sécurisée (protocole SSL / 3D-Secure) ou par prélèvement SEPA pour les contrats annuels. Une facture dématérialisée conforme aux normes fiscales est émise et mise à disposition dans l&apos;espace professionnel du client.
            </p>
          </section>

          {/* Article 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-ink tracking-tight flex items-center gap-2">
              <RefreshCw className="text-moss" size={18} />
              3. Durée, Renouvellement et Résiliation
            </h2>
            <p>
              Les abonnements professionnels sont conclus soit pour une durée mensuelle sans engagement, soit pour une durée annuelle ferme avec tacite reconduction.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-ink/75">
              <li><strong>Offre mensuelle :</strong> Résiliable à tout moment avec un préavis de 7 jours avant la date d&apos;échéance mensuelle depuis le tableau de bord professionnel ou par notification écrite.</li>
              <li><strong>Offre annuelle :</strong> Résiliable à l&apos;échéance anniversaire moyennant un préavis d&apos;un (1) mois avant la date de fin de contrat.</li>
            </ul>
          </section>

          {/* Article 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-ink tracking-tight flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-xl bg-ink text-white text-xs">4</span>
              Droit de Rétractation
            </h2>
            <p>
              Conformément à l&apos;article L. 221-18 du Code de la consommation, les clients consommateurs ou professionnels bénéficiant des dispositions de l&apos;article L. 221-3 (moins de 5 salariés et contrat hors du champ d&apos;activité principale) disposent d&apos;un délai de quatorze (14) jours calendaires pour exercer leur droit de rétractation à compter de la conclusion du contrat.
            </p>
            <p>
              En cas de demande expresse d&apos;exécution immédiate des prestations de visibilité avant l&apos;expiration du délai de rétractation, le client reconnaît expressément renoncer à son droit de rétractation dès lors que la prestation est pleinement exécutée.
            </p>
          </section>

          {/* Article 5 */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-ink tracking-tight flex items-center gap-2">
              <ShieldCheck className="text-moss" size={18} />
              5. Obligations et Garanties de Libertyk
            </h2>
            <p>
              Libertyk s&apos;engage à apporter tous les soins raisonnables à la fourniture de ses services et met en œuvre une obligation de moyens. Libertyk garantit une disponibilité de la plateforme 24h/24 et 7j/7, sous réserve des périodes d&apos;entretien programmé ou d&apos;incidents indépendants de sa volonté (force majeure, défaillance des réseaux de télécommunication ou d&apos;hébergement tiers).
            </p>
            <p>
              En aucun cas Libertyk ne garantit un volume chiffré de réservations, de ventes ou de commandes livrées, la plateforme assurant uniquement un service de diffusion et de visibilité auprès de son audience qualifiée.
            </p>
          </section>

          {/* Article 6 */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-ink tracking-tight flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-xl bg-ink text-white text-xs">6</span>
              Conformité Éthique et Respect de la Cacherout
            </h2>
            <p>
              Tout établissement souscrivant à une offre de mise en avant s&apos;engage sur l&apos;authenticité de sa certification de Cacherout en cours de validité. En cas de perte avérée, de retrait officiel de surveillance par l&apos;organisme de tutelle ou de fausse déclaration, Libertyk se réserve le droit de suspendre immédiatement et sans indemnité la mise en avant payante de l&apos;établissement concerné afin de préserver la confiance et la sécurité des fidèles et consommateurs.
            </p>
          </section>

          {/* Article 7 */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-ink tracking-tight flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-xl bg-ink text-white text-xs">7</span>
              Droit Applicable et Règlement des Différends
            </h2>
            <p>
              Les présentes CGV sont soumises à la loi française. En cas de différend entre professionnels concernant l&apos;exécution ou l&apos;interprétation du présent contrat, et à défaut de conciliation amiable préalable sous 30 jours, compétence exclusive est attribuée aux <strong>Tribunaux de Paris</strong>, nonobstant pluralité de défendeurs ou appel en garantie.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
