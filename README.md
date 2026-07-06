# Liberty Kosher

Application Next.js moderne centralisant l’univers juif et casher.

## Développement local

```bash
npm install
npm run dev
```

Ouvrez ensuite [http://localhost:3000](http://localhost:3000).

## Version statique pour GitHub Pages

```bash
npm install
npm run export
```

La commande produit le site complet dans `docs/`. Le fichier d’entrée est
`docs/index.html`. Le dossier est prêt à être publié avec GitHub Pages :

1. Envoyez tout le projet sur GitHub.
2. Ouvrez **Settings → Pages** dans le dépôt.
3. Choisissez **Deploy from a branch**, votre branche principale et le dossier `/docs`.

Ne publiez pas uniquement `index.html` : les dossiers `_next/` et `images/` sont
nécessaires au fonctionnement de l’application.

N’ouvrez pas `docs/index.html` directement avec une URL `file://` : les chemins
GitHub Pages utilisent `/LIBERTYK/` et nécessitent un serveur HTTP.

Le projet utilise actuellement des données fictives et ne se connecte à aucune base
de données.
