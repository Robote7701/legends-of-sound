# Plan d’implémentation v0.1

## Analyse initiale

Dépôt initial : un README minimal et un commit initial, aucun code ni dépendance. Arbre de travail propre. Aucune consigne AGENTS.md détectée dans le dépôt ou ses ancêtres.

## Phase 1 — Fondations

Architecture ES modules, configurations déclaratives, navigation des rubriques, stockage versionné, validation, import/export et tests Node. Serveur local sans dépendance et CI de validation. Catalogue vide et fonctionnalités de jeu désactivées explicitement. Publication Pages manuelle uniquement après validation.

Critères : tests de sauvegarde et configurations passants, erreurs non destructives, navigation et ressources compatibles avec un sous-répertoire.

## Phase 2 — Catalogue

Étendre à 1 500 artistes et groupes internationaux ; conserver leurs identifiants internes permanents. Construire l’importateur avec User-Agent identifiable, limite MusicBrainz d’au plus une requête par seconde, cache, reprise, backoff et revue manuelle des homonymes. Vérifier les identités, genres et scènes, documenter les sources par champ et les informations manquantes. Attribuer les raretés selon une politique éditoriale expliquée ; vérifier la disponibilité des quatre raretés dans chaque booster. Composer les noms des 1 500 artistes en visuels typographiques originaux adaptés aux genres, sans photo ni logo externe. Enregistrer null pour les informations inconnues. Ajouter la validation complète des 1 500 entrées et les tests de provenance.

## Phase 3 — Moteur du jeu

Développer les fonctions pures de recharge par horodatage, devis tickets/crédits, confirmation du coût, tirages indépendants, paiement et obtention persistés en une transaction avant révélation. Recycler avec devis et confirmation, protection des favoris/verrous et conservation du dernier exemplaire en automatique. Collection avec recherche, filtres et tris. Tester les limites, probabilités, interruptions et doubles validations. Ajouter les tests navigateur d’ouverture et navigation.

## Phase 4 — Interface premium

Développer la direction artistique originale, cartes typographiques, animations individuelles et légendaires, récapitulatifs de boosters et de sessions multiples, accélération et réduction des animations. Compléter les fiches factuelles et la direction typographique. Tester clavier, mobile et performances sur Android.

## Phase 5 — Validation

Exécuter les tests complets, auditer les 1 500 identités et sources, vérifier export/import et intégrité des collections, tester le sous-répertoire Pages, optimiser puis préparer une publication soumise à validation. Ne pas inclure de combats en v0.1.

## Décisions transverses

Pas de framework, de backend, de paiement ni de dépendance de production. IDs pérennes sans lien avec l’ordre d’affichage, la rareté ou le nom. Les futures éditions ajoutent des cartes sans réattribuer les IDs. Les variantes et événements auront leurs propres configurations et migrations explicites ; aucune migration silencieuse d’une version inconnue. Le moteur ne dépendra pas du DOM. Les services d’import restent hors du navigateur. Les vues supplémentaires pourront être extraites de l’interface initiale au fur et à mesure des phases.
