# LEGENDS OF SOUND

TCG musical gratuit, statique et indépendant de Velvet Collection. Sound Credits fictifs, sans achat, conversion ou transfert.

## État — Phase 2

ORIGINS comprend **500 artistes et groupes identifiés sur MusicBrainz**, avec contrôle croisé Wikidata, genres et raretés éditoriaux, neuf boosters, fiches sourcées et explorateur du catalogue. Les champs inconnus restent null. Les notices courtes Wikidata ne sont pas des biographies complètes.

Les ouvertures, la recharge active et le recyclage restent désactivés jusqu’à la Phase 3. Consulter une fiche ne donne pas la carte. Les 50 légendaires disposent de visuels revus, servis localement : 48 photos et deux illustrations identifiées (Teresa Teng et Hatsune Miku). Les autres propositions restent en attente ; aucune photographie n’est publiée automatiquement. Les champs de fiche sans données sont masqués, sans modifier les valeurs null du catalogue.

## Démarrer et tester

Node.js 22 ou supérieur. Aucune dépendance à installer, aucun build.

Sous PowerShell, si la politique système bloque npm.ps1, utiliser npm.cmd à la place de npm (sans changer la politique d’exécution).

~~~sh
npm run dev
npm test
npm run check:catalog
~~~

Ouvrir http://127.0.0.1:4173. Utiliser HTTP, pas file://. Le serveur écoute uniquement sur la machine locale ; PORT permet de changer le port. La CI vérifie les tests et le catalogue complet, sans déploiement.

Tests navigateur : http://127.0.0.1:4173/tests/browser.html. Contrôles de navigation, catalogue, recherche, fiches, pagination, accès clavier et responsive, exécutés séparément de la CI Node. Les tests d’ouverture seront ajoutés en Phase 3.

## Architecture

- [data/](./data/) : catalogue, registre permanent des candidats, éditions, boosters, rapports et propositions de portraits.
- [src/catalog/](./src/catalog/) : validation, filtres, âge et contrôle des portraits.
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

# Rechercher des propositions Commons sans publier de photo
npm run import:portraits

# Appliquer uniquement le manifeste revu manuellement
npm run import:portraits -- --apply-reviewed
~~~

--publish ne pousse rien sur GitHub et ne publie pas de site. Il refuse un catalogue différent de 500 entrées, une identité non résolue, une rareté manquante dans un booster et la réattribution d’un ID existant. --limit=10 permet une prévisualisation partielle sans modifier le catalogue publié.

[candidates.json](./data/candidates.json) est le registre éditorial : conserver ses IDs. Les liens interwiki et P434 Wikidata permettent de trouver les MBID, puis les fiches sont consultées sur l’API officielle MusicBrainz avec aliases, url-rels et artist-rels. Nom/alias, type et lien retour vers la même entité Wikidata sont obligatoires. Les cas à plusieurs MBID sont documentés dans identitySelection ou identityReview ; aucun homonyme incertain n’est choisi selon sa popularité.

Un seul import à la fois. User-Agent identifié, départs espacés d’au moins 1 150 ms, trois réponses au maximum en vol, timeout, Retry-After et backoff. Le cache local ignoré par Git contient les réponses réussies avec URL et date ; relancer reprend les données déjà obtenues. [import-report.json](./data/import-report.json) expose les décisions, exceptions, catégories et champs manquants. Aucun secret nécessaire.

[editorial-policy.md](./docs/editorial-policy.md) explique sélection, genres et raretés. Les tags et votes communautaires MusicBrainz ne sont pas copiés. Identités centrales MusicBrainz et données structurées Wikidata : CC0, avec sources par carte. Aucune biographie Wikipédia copiée.

## Sélection manuelle des portraits

[portrait-candidates.json](./data/portrait-candidates.json) rassemble des propositions P18/Commons non publiées : fichier, source, auteur en métadonnées brutes, licence et restrictions disponibles. Aucune proposition n’est affichée comme portrait dans les cartes. Les métadonnées absentes ne valent pas permission.

Après contrôle visuel de l’identité, des licences et restrictions, ajouter une entrée dans le tableau [portraits-reviewed.json](./data/portraits-reviewed.json). Champs obligatoires : id existant, imageUrl HTTPS sur upload.wikimedia.org, sourceUrl HTTPS sur commons.wikimedia.org, photographer en texte sans HTML, license, licenseUrl, modifications, identityVerifiedAt et rightsReviewedAt (dates ISO réelles), identityVerification et rightsReview (notes concrètes de revue).

Licences prises en charge : CC0-1.0, Public-domain, CC-BY-2.0/3.0/4.0, CC-BY-SA-2.0/2.5/3.0/3.0-NL/4.0. CC BY-ND refusée. Exception précisément limitée à l’illustration officielle de Hatsune Miku : CC-BY-NC-3.0, image et page d’autorisation Piapro exactes, attribution Crypton et usage exclusivement non commercial. Cette exception ne vaut pas autorisation générale pour d’autres images NC.

Les assets locaux dans [assets/images/artists/](./assets/images/artists/) conservent chacun leur licence source, indépendamment du code. Le manifeste contient leurs empreintes SHA-256, auteurs, titres, sources, références de revue et modifications de présentation. Les crédits apparaissent dans les fiches et dans Crédits. Le visuel Miku ne doit pas être réutilisé dans un usage commercial. Si l’identité ou les droits restent incertains, conserver portrait:null. Ne jamais inscrire une revue qui n’a pas eu lieu.

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

[Plan des cinq phases](./docs/implementation-plan.md). Phase 3 : transactions, tickets, tirages, collection jouable et recyclage. Phase 4 : expérience premium d’ouverture. Phase 5 : validation finale avant publication. Aucun combat en v0.1.
