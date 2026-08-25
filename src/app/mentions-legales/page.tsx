import Link from "next/link";
import { ArrowLeft, Building2, Globe, Mail, Phone, Server, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Mentions Légales (Loi LCEN) | Libertyk",
  description: "Mentions légales obligatoires conformes à la loi pour la confiance dans l'économie numérique (LCEN) pour Libertyk.",
};

export default function MentionsLegalesPage() {
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
            <Building2 size={14} /> Loi LCEN & Conformité France
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-ink">
            Mentions Légales
          </h1>
          <p className="text-sm sm:text-base text-ink/65 leading-relaxed">
            Conformément aux dispositions de l&apos;article 6 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l&apos;économie numérique (LCEN), il est porté à la connaissance des utilisateurs les mentions légales suivantes.
          </p>
        </div>

        {/* Blocs d'informations légales */}
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Éditeur */}
          <div className="rounded-[2.5rem] bg-white border border-black/5 p-8 shadow-sm space-y-4">
            <div className="grid size-12 place-items-center rounded-2xl bg-ink text-white">
              <Building2 size={22} />
            </div>
            <h2 className="text-xl font-extrabold text-ink">1. Éditeur de la Plateforme</h2>
            <div className="space-y-2 text-xs text-ink/75 leading-relaxed">
              <p><strong>Dénomination sociale :</strong> LIBERTYK SAS</p>
              <p><strong>Forme juridique :</strong> Société par Actions Simplifiée (SAS)</p>
              <p><strong>Capital social :</strong> 10 000,00 €</p>
              <p><strong>Siège social :</strong> 10 Rue de la Paix, 75002 Paris, France</p>
              <p><strong>Numéro RCS / SIREN :</strong> 912 345 678 R.C.S. Paris</p>
              <p><strong>Numéro TVA Intracommunautaire :</strong> FR 89 912345678</p>
              <p><strong>Directeur de la publication :</strong> Steven Ohayon (Président)</p>
              <p><strong>Contact Email :</strong> <a href="mailto:contact@libertyk.com" className="text-moss font-bold underline">contact@libertyk.com</a></p>
              <p><strong>Téléphone support :</strong> +33 1 42 00 00 00</p>
            </div>
          </div>

          {/* Hébergeur */}
          <div className="rounded-[2.5rem] bg-white border border-black/5 p-8 shadow-sm space-y-4">
            <div className="grid size-12 place-items-center rounded-2xl bg-[#f6ecd9] text-[#8f6424]">
              <Server size={22} />
            </div>
            <h2 className="text-xl font-extrabold text-ink">2. Hébergement & Infrastructure</h2>
            <div className="space-y-2 text-xs text-ink/75 leading-relaxed">
              <p><strong>Hébergeur Cloud principal :</strong> Vercel Inc. / GitHub Pages (Static Edge CDN)</p>
              <p><strong>Adresse hébergeur :</strong> 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis</p>
              <p><strong>Infrastructure Base de Données :</strong> Supabase Inc. (Région Europe - Paris / Francfort - Conforme RGPD)</p>
              <p><strong>Certificat SSL / Chiffrement :</strong> Let&apos;s Encrypt Authority / TLS 1.3 256 bits</p>
              <p><strong>Disponibilité :</strong> Réseau mondial haute disponibilité avec redondance européenne.</p>
            </div>
          </div>
        </div>

        {/* Détails complémentaires */}
        <div className="rounded-[2.5rem] bg-white border border-black/5 p-8 sm:p-12 shadow-sm space-y-8 text-sm leading-relaxed text-ink/80">
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-ink">3. Propriété Intellectuelle & Marques</h3>
            <p>
              La marque <strong>Libertyk</strong>, son logotype, sa charte graphique et l&apos;ensemble de ses déclinaisons iconographiques sont des marques déposées et protégées auprès de l&apos;Institut National de la Propriété Industrielle (INPI).
            </p>
            <p>
              Toute reproduction, imitation ou utilisation totale ou partielle sans autorisation préalable expresse de LIBERTYK SAS constitue une contrefaçon sanctionnée par les articles L. 713-2 et suivants du Code de la propriété intellectuelle.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-ink">4. Données Personnelles et Contact DPO</h3>
            <p>
              Pour toute question relative au traitement de vos données personnelles ou pour exercer vos droits d&apos;accès, rectification, effacement et opposition, vous pouvez vous adresser à notre Délégué à la Protection des Données (DPO) :
            </p>
            <div className="rounded-2xl bg-cream/70 p-4 border border-black/5 text-xs text-ink/80 space-y-1">
              <p><strong>DPO Libertyk :</strong> Service Juridique & Protection des Données</p>
              <p><strong>Email dédié :</strong> <a href="mailto:dpo@libertyk.com" className="font-bold text-moss underline">dpo@libertyk.com</a></p>
              <p><strong>Adresse postale :</strong> LIBERTYK SAS – DPO, 10 Rue de la Paix, 75002 Paris</p>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-ink">5. Crédits & Partenaires Données</h3>
            <p>
              Les données cartographiques et d&apos;avis sont fournies en conformité avec l&apos;API Google Maps Platform et Google Business Profile. Les données relatives au calendrier hébraïque et aux horaires de Chabbat sont calculées selon les algorithmes astronomiques précis de l&apos;institut Hebcal.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
