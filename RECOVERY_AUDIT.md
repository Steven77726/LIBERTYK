# Audit de récupération LibertyKosher

Date de l’audit : 6 juillet 2026

## Historique Git contrôlé

- `a1011be` — ajout d’un unique fichier `index.html` statique (159 230 octets).
- `e432134` — suppression de cet unique fichier `index.html`.
- `8c45d58` — publication du projet Next.js complet et du build GitHub Pages.

L’ancien `index.html` a été conservé sans être réactivé dans
`archive/pre-update-index.html`. Il ne contenait pas de données supplémentaires par
rapport aux sources Next.js récupérables.

## Objets Git locaux récupérés

Tous les arbres et blobs Git inaccessibles ont été inspectés. Ils correspondent aux
étapes intermédiaires du projet actuel : ajout des pages Food, Restaurants, Brunch,
Vin & Spiritueux, Shopping, agents IA et export GitHub Pages.

Aucun objet récupérable ne contient :

- de FAQ ;
- de schéma `FAQPage` ou de données structurées Schema.org ;
- de catalogue supplémentaire pour les bars, glaciers, salons de thé,
  pâtisseries ou boulangeries ;
- de coordonnées GPS vérifiées différentes de celles générées dans le projet ;
- de fiches SEO supplémentaires ;
- de sites internet ou descriptions supplémentaires pour les restaurants.

## Données actuellement préservées

- 21 restaurants : 20 lignes du fichier Excel source et Khan.
- 8 brunchs avec spécialités, certifications, services, prix, filtres et sources.
- 15 catégories principales.
- 10 sous-catégories Food et 12 cuisines.
- 4 activités Vin & Spiritueux.
- La fiche Azamra.
- 22 images locales dans `public/images`.
- Les systèmes de recherche, filtres, réservation, favoris, avis, recommandations,
  badges et panneaux latéraux.
- 37 pages statiques générées pour GitHub Pages.

Le fichier Excel source a été sauvegardé dans
`data-sources/libertykosher-restaurants-paris.xlsx`.

## Éléments non récupérables

Les éléments suivants n’existent dans aucun commit, objet Git local, archive ou
fichier d’import retrouvé :

- fiches individuelles de bars, glaciers, salons de thé, pâtisseries et
  boulangeries ;
- FAQ et pages SEO dédiées qui ne figurent pas dans les sources actuelles ;
- coordonnées GPS vérifiées, sites internet et descriptions absents du fichier
  Excel ;
- anciens favoris utilisateurs ou avis persistés en base de données.

Ces éléments ne peuvent pas être reconstitués fidèlement sans une autre sauvegarde
ou source de données. Ils ne doivent pas être inventés.

## Fichiers restaurés ou ajoutés

- `archive/pre-update-index.html` — ancien fichier supprimé, conservé comme archive.
- `data-sources/libertykosher-restaurants-paris.xlsx` — source restaurants originale.
- `RECOVERY_AUDIT.md` — présent rapport.

## Fichiers fonctionnels modifiés

Aucun fichier de code, de données actives, de navigation ou de design n’a été
écrasé pendant cette récupération.
