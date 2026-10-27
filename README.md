# LEGENDS OF SOUND

TCG musical gratuit, statique et indépendant de Velvet Collection. Sound Credits fictifs, sans valeur monétaire, achat ni transfert.

## État — Phase 1 réalisée

Fondations de la version 0.1 : navigation responsive, neuf configurations de boosters, édition ORIGINS, sauvegarde locale versionnée, export/import validé, tests et CI. **Le catalogue est vide volontairement.** Aucune identité, biographie ou photographie n’a été inventée. Les ouvertures et le recyclage restent désactivés jusqu’aux phases correspondantes. Les probabilités affichées sont des cibles, pas des probabilités actives.

## Démarrer

Node.js 22 ou supérieur. Aucune dépendance à installer ; aucun build.

~~~sh
npm run dev
~~~

Ouvrir http://127.0.0.1:4173. Le serveur écoute uniquement sur la machine locale. Utiliser HTTP, pas une ouverture directe en file://, pour les modules et JSON. PORT permet de changer le port.

~~~sh
npm test
npm run check:catalog
node scripts/validate-catalog.js --complete
~~~

La dernière commande doit échouer tant que les 500 identités ne sont pas prêtes. La CI vérifie les fondations à chaque push et PR ; elle ne publie rien.

## Architecture

- [data/](./data/) : catalogue, éditions et filtres déclaratifs de boosters.
- [src/catalog/](./src/catalog/) : validation et éligibilité des cartes.
- [src/domain/config.js](./src/domain/config.js) : probabilités, économie et limites configurables.
- [src/state/](./src/state/) : schéma, validation et persistance.
- [src/services/](./src/services/) : chargement des JSON relatifs aux modules.
- [src/ui/](./src/ui/) : primitives DOM et export de fichiers.
- [src/main.js](./src/main.js) : interface de fondations et navigation par fragments.
- [assets/css/](./assets/css/) : présentation responsive, focus clavier et réduction des animations.
- [scripts/](./scripts/) : serveur local et validation de catalogue.
- [tests/](./tests/) : tests Node natifs sans dépendance.
- [docs/implementation-plan.md](./docs/implementation-plan.md) : phases et critères de livraison.
- [docs/catalog-contract.md](./docs/catalog-contract.md) : contrat du futur catalogue et droits.

## Sauvegarde

Clé exclusive : legends-of-sound-v1. Version de schéma indépendante de la version du jeu. Une nouvelle partie reçoit 500 SC et dix tickets. La Phase 1 conserve l’horodatage ; la recharge et les transactions de jeu seront développées en Phase 3.

Les champs persistés comprennent crédits, tickets, horodatages, exemplaires, premières/dernières acquisitions, favoris, verrous et statistiques. La progression est dérivée de la collection, sans compteur divergent. Les identifiants inconnus du catalogue courant sont préservés pour les futures éditions.

Les lectures corrompues, les versions futures et les erreurs localStorage sont signalées ; aucune réinitialisation automatique. Export brut disponible en cas de données illisibles. L’import demande confirmation et conserve la sauvegarde précédente sous legends-of-sound-v1-before-import. Un échec de copie annule l’import. Aucun bouton ne vide la collection.

Les écritures applicatives utilisent Web Locks et une comparaison de la version chargée ; un conflit oblige à recharger. Sans Web Locks, l’application refuse les écritures. GitHub Pages et localhost sont des contextes compatibles dans les navigateurs modernes. Une écriture localStorage atomique précède toute mise à jour mémoire. Ce stockage reste local, modifiable par son propriétaire et ne constitue pas un système anti-triche. Exporter régulièrement ; ne pas éditer simultanément la collection sur plusieurs appareils.

## Catalogue et importation (Phase 2)

[data/artists.json](./data/artists.json) est vide ; [data/editions.json](./data/editions.json) déclare une cible de 500, jamais 500 cartes déjà présentes. Les boosters exigent au moins une carte de chaque rareté pour être disponibles. ASIA WAVE repose sur les genres j-pop, k-pop, j-rock et vocaloid, indépendamment du pays.

L’importateur MusicBrainz/Commons n’est pas encore implémenté : aucun appel API ni téléchargement de photographie en Phase 1. Le contrat et la procédure prévus figurent dans [docs/catalog-contract.md](./docs/catalog-contract.md). Ne pas remplir le catalogue avec des UUID ou des artistes fictifs pour faire passer les tests. La validation syntaxique d’un MBID ne vérifie pas son identité ; une revue de la source est indispensable.

## GitHub Pages — publication uniquement après validation

Aucun workflow de déploiement automatique n’est installé. Après validation explicite de la publication :

1. Exécuter les tests, vérifier le catalogue selon la phase et tester le site dans un sous-répertoire.
2. Pousser la branche validée sur GitHub.
3. Dans Settings → Pages, sélectionner Deploy from a branch, la branche validée, puis / (root).
4. Vérifier l’URL https://UTILISATEUR.github.io/legends-of-sound/ et le chargement des modules et JSON.

[.nojekyll](./.nojekyll) désactive le traitement Jekyll. Aucun chemin d’application ne commence par / ; les fragments permettent de recharger les rubriques sans configuration serveur. Aucun secret ou clé API ne doit être ajouté au navigateur ou au dépôt.

## Vérification navigateur

Lancer le serveur puis ouvrir http://127.0.0.1:4173/tests/browser.html : dix assertions automatiques contrôlent les six rubriques, les boosters désactivés, le lien d’accès au contenu et les largeurs de 390 et 1100 px. Ce test navigateur est exécuté manuellement et ne fait pas partie de la CI Node.

Pour les contrôles complémentaires, parcourir les six rubriques au clavier et sur une largeur de 390 px. Vérifier neuf boosters indisponibles, 500 SC et dix tickets, export puis import avec confirmation, refus d’un JSON invalide, persistance après rechargement. Dans un profil de test, injecter un JSON corrompu et vérifier que la sauvegarde brute reste exportable et n’est pas écrasée. La navigation et les sauvegardes font partie de la Phase 1 ; les tests navigateur d’ouverture seront ajoutés avec le moteur en Phase 3.
