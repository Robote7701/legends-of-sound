# LEGENDS OF SOUND

TCG musical gratuit, statique et indépendant de Velvet Collection. Sound Credits fictifs, sans achat, conversion ou transfert.

## État — Catalogue et ouvertures

ORIGINS comprend **1 500 artistes et groupes identifiés sur MusicBrainz**, avec contrôle croisé Wikidata, genres et raretés éditoriaux, neuf boosters, fiches sourcées et explorateur du catalogue. Les champs inconnus restent null. Les notices courtes Wikidata ne sont pas des biographies complètes.

Les neuf boosters sont jouables en x1, x3, x5 et x10. Les tickets se rechargent hors ligne (un toutes les cinq minutes, maximum dix). Les Sound Credits complètent les tickets après confirmation. Les gains, paiements et statistiques sont enregistrés ensemble avant toute révélation. La dernière ouverture peut être revue sans paiement, même après rechargement. Le recyclage reste à développer. Consulter une fiche ne donne pas la carte. Les 1 500 cartes utilisent des compositions typographiques originales adaptées aux genres : aucune photo, illustration externe ou logo d’artiste. Les champs sans données sont masqués.

## Démarrer et tester

Node.js 22 ou supérieur. Aucune dépendance à installer, aucun build.

Sous PowerShell, si la politique système bloque npm.ps1, utiliser npm.cmd à la place de npm (sans changer la politique d’exécution).

~~~sh
npm run dev
npm test
npm run check:catalog
~~~

Ouvrir http://127.0.0.1:4173. Utiliser HTTP, pas file://. Le serveur écoute uniquement sur la machine locale ; PORT permet de changer le port. La CI vérifie les tests et le catalogue complet, sans déploiement.

Tests navigateur : http://127.0.0.1:4173/tests/browser.html. Contrôles de navigation, catalogue, recherche, fiches, pagination, accès clavier et responsive, exécutés séparément de la CI Node.

Tests d’ouverture avec écriture : démarrer un serveur séparé sur le port 4176 (PowerShell : `$env:PORT='4176'; npm.cmd run dev`), puis ouvrir http://127.0.0.1:4176/tests/openings.html. Le test exige une origine de test vierge et refuse de modifier un stockage préexistant. Il supprime uniquement sa propre partie de test à la fin et ne touche pas la partie du port 4173. Contrôles x1/x3/x5/x10, annulation, paiement mixte, doubles clics, interruption/reprise, quota de stockage et devis devenu obsolète.

## Ouvrir des boosters

Chaque booster contient cinq tirages indépendants avec doublons possibles. Le moteur choisit d’abord la rareté (4/16/35/45 %), puis une carte uniformément dans cette rareté et le filtre du booster. Une rareté absente bloque le booster. Le nombre de cartes communes provisoires ne modifie pas ces probabilités ; les classements restent à revoir.

Le devis affiche tickets utilisés, SC dépensés et solde après paiement. Les paiements en crédits nécessitent une confirmation ; un changement de sauvegarde ou de coût annule le devis. Web Locks et écriture locale atomique protègent le paiement et les gains. Une erreur de stockage ne produit pas de paiement partiel. Le compteur repose sur l’horodatage persisté, pas sur le temps pendant lequel la page reste ouverte.

La révélation propose une ouverture du paquet, cinq cartes individuelles, un effet légendaire, un bilan par booster et un récapitulatif de session. Révélation rapide, saut des animations, fermeture et préférences de réduction des mouvements sont pris en charge. Le champ optionnel lastOpening garde les résultats du dernier achat pour les revoir, sans migration ni suppression des sauvegardes existantes.

Les neuf boosters ont des pochettes verticales à scellés crantés et reflets métallisés. Chaque thème utilise une illustration SVG originale autour d’un vinyle : guitare, batterie, micro, fréquences électroniques, etc. Le même composant sert à la sélection et à l’ouverture ; le scellé se détache avant la révélation. Aucun fichier graphique externe ni portrait n’est nécessaire. Les compositions sont définies dans [booster-artwork.js](./src/ui/booster-artwork.js) et leur mise en scène dans [opening.css](./assets/css/opening.css).

## Architecture

- [data/](./data/) : catalogue, registre permanent des candidats, éditions, boosters, rapports.
- [src/catalog/](./src/catalog/) : validation, filtres, âge et direction artistique par genre.
- [src/domain/config.js](./src/domain/config.js) : probabilités, économie et limites configurables.
- [src/state/](./src/state/) : schéma et persistance versionnée.
- [src/services/](./src/services/) : chargement des JSON relatifs aux modules.
- [src/ui/](./src/ui/) : explorateur, fiches et primitives DOM.
- [src/main.js](./src/main.js) : navigation et interface de sauvegarde.
- [assets/css/](./assets/css/) : cartes, responsive, focus clavier et réduction des animations.
- [scripts/](./scripts/) : serveur local, importateurs et contrôles.
- [tests/](./tests/) : tests Node natifs et suite navigateur.

## Importer et reprendre

~~~sh
# Prévisualisation et rapport ; reprise depuis le cache
npm run import:artists

# Écrire uniquement les JSON locaux du catalogue
npm run import:artists -- --publish

~~~

--publish ne pousse rien sur GitHub et ne publie pas de site. Il refuse un catalogue différent du nombre prévu par les éditions, une identité non résolue, une rareté manquante dans un booster et la réattribution d’un ID existant. --limit=10 permet une prévisualisation partielle sans modifier le catalogue publié.

[candidates.json](./data/candidates.json) est le registre éditorial : conserver ses IDs. Les liens interwiki et P434 Wikidata permettent de trouver les MBID, puis les fiches sont consultées sur l’API officielle MusicBrainz avec aliases, url-rels et artist-rels. Nom/alias, type et lien retour vers la même entité Wikidata sont obligatoires. Les cas à plusieurs MBID sont documentés dans identitySelection ou identityReview ; aucun homonyme incertain n’est choisi selon sa popularité.

Un seul import à la fois. User-Agent identifié, départs espacés d’au moins 1 150 ms, trois réponses au maximum en vol, timeout, Retry-After et backoff. Le cache local ignoré par Git contient les réponses réussies avec URL et date ; relancer reprend les données déjà obtenues. [import-report.json](./data/import-report.json) expose les décisions, exceptions, catégories et champs manquants. Aucun secret nécessaire.

[editorial-policy.md](./docs/editorial-policy.md) explique sélection, genres et raretés. Les tags et votes communautaires MusicBrainz ne sont pas copiés. Identités centrales MusicBrainz et données structurées Wikidata : CC0, avec sources par carte. Aucune biographie Wikipédia copiée.

## Identité typographique

Les noms deviennent les visuels des 1 500 cartes. Neuf familles graphiques suivent le premier genre reconnu : rock, métal, électronique, hip-hop, pop, Asia Wave, jazz/soul/blues, groove et musiques du monde. Aucune inférence par pays. Les artistes multigenres conservent tous leurs genres et leurs boosters.

[art-direction.js](./src/catalog/art-direction.js) définit les associations, palettes et variations stables par ID. [artist-artwork.js](./src/ui/artist-artwork.js) compose le texte et [artwork.css](./assets/css/artwork.css) définit les polices système et motifs CSS. Aucun téléchargement de police ou d’image. Le champ portrait reste null et le validateur refuse les portraits. L’importateur ne recherche plus de visuels. Les IDs et sauvegardes restent compatibles.

## Extension à 1 500 et enrichissement

[Bilan de l’extension et validations](./docs/catalog-expansion.md).

L’extension ajoute 1 000 identités vérifiées et conserve les 500 IDs et MBID initiaux. Les raretés des cartes initiales sont inchangées ; les nouvelles cartes ont une valeur commune **provisoire**, explicitement signalée, jusqu’à la revue éditoriale avec le porteur du projet. Le nombre de cartes par rareté ne définit pas les probabilités de tirage.

Les distinctions (P166), œuvres notables (P800), genres documentés (P136) et débuts d’activité (P2031) sont extraits de Wikidata quand disponibles. careerEvidence renvoie à des lots locaux de 50 fiches contenant les références de chaque déclaration ; les listes restent partielles. Aucun compteur de popularité, aucune biographie ni récompense n’est inventé. L’absence d’une distinction dans Wikidata ne vaut pas absence de reconnaissance. Les œuvres notables ne sont pas automatiquement considérées comme des albums ou des chansons.

~~~sh
# Outil ponctuel depuis le catalogue initial de 500 cartes
npm run discover:artists
npm run expand:catalog
npm run enrich:catalog
# Appliquer uniquement après validation complète des 1 500 cartes locales
npm run enrich:catalog -- --apply
~~~

La découverte SPARQL constitue une présélection, pas une vérification. Chaque ajout exige un MBID Wikidata, un type MusicBrainz compatible et un lien retour MusicBrainz vers la même identité. Les correspondances multiples sont écartées, sauf sélection explicite documentée dans le registre. [expansion-priorities.json](./data/expansion-priorities.json) complète la recherche pour le rap français et américain. Les requêtes séparent rap, hip-hop et rap français ; le pays ne définit jamais un genre. La présélection francophone utilise une langue déclarée et des pays de sélection, sans prétendre documenter la langue de chaque chanson.

Le journal local ignoré .cache/expansion-progress.json permet la reprise. Le registre des identifiants retirés empêche leur réattribution ; les IDs peuvent donc présenter des trous. Les preuves détaillées sont chargées seulement à l’ouverture de la rubrique Sources dans une fiche. Les résultats exclus sont conservés dans le rapport. Le script d’extension refuse de repartir depuis un catalogue déjà étendu. L’importateur courant préserve les enrichissements sourcés lors d’une réimportation des identités. La prévisualisation écrit son rapport dans le cache et ne remplace pas le rapport publié.

## Sauvegarde

Clé exclusive : legends-of-sound-v1. Une nouvelle partie reçoit 500 SC et dix tickets. Persistance des crédits, tickets, horodatages, exemplaires, dates d’acquisition, favoris, verrous et statistiques. Progression dérivée de la collection. IDs inconnus du catalogue courant conservés pour les futures éditions.

JSON corrompu, version future et erreur localStorage : signalement sans réinitialisation automatique. Export brut disponible. L’import demande confirmation et conserve une copie sous legends-of-sound-v1-before-import ; un échec de copie l’annule. Web Locks et comparaison de l’état chargé protègent les écritures entre onglets. Sans Web Locks, aucune écriture. Une écriture atomique précède la mise à jour mémoire. Le stockage local ne constitue pas un système anti-triche ; exporter régulièrement avant de changer d’appareil ou d’effacer les données du navigateur.

## GitHub Pages — après validation explicite

Aucun workflow de déploiement automatique.

1. Exécuter tests, contrôle des sources/licences et vérification sous un sous-répertoire.
2. Après validation explicite, pousser la branche validée sur GitHub.
3. Settings → Pages → Deploy from a branch : branche validée, / (root).
4. Vérifier https://UTILISATEUR.github.io/legends-of-sound/ ainsi que les ressources, fiches et sauvegardes.

[.nojekyll](./.nojekyll) désactive Jekyll. Chemins relatifs et navigation par fragments compatibles avec un sous-répertoire. Aucune clé API dans Git ou le navigateur.

## Suite

[Plan des cinq phases](./docs/implementation-plan.md). Les transactions, tickets, tirages et révélations sont disponibles. Restent notamment le recyclage, les favoris/verrous dans l’interface et les tris supplémentaires. Phase 5 : validation finale avant publication. Aucun combat en v0.1.
