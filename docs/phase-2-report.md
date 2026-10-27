# Catalogue ORIGINS — bilan du 27 octobre 2026

## Résultat

500 identités distinctes : 303 solos et 197 groupes. 500 IDs internes permanents, 500 MBID distincts consultés sur l’API MusicBrainz et 500 entités Wikidata distinctes. Aucun cas en attente dans le rapport final. Les types suivent les fournisseurs, notamment pour Tame Impala, Parov Stelar et Burning Spear.

Le contrôle combine noms/alias, types et liens croisés entre MusicBrainz et Wikidata. Les MBID multiples correspondant à des noms civils, anciens groupes ou projets annexes ont été traités explicitement dans le registre. Le cas Wizkid utilise un MBID revu sur MusicBrainz avec lien retour Wikidata, car le P434 disponible sur Wikidata était déprécié. Il ne s’agit pas d’un audit humain de chaque champ biographique.

La sélection couvre 43 codes de pays/territoires associés par MusicBrainz ; ce n’est pas un décompte de nationalités. 494 notices descriptives Wikidata sont disponibles en français et six en anglais. Les champs facultatifs non enrichis — biographies, albums marquants, titres connus, récompenses, début de carrière, nationalité — restent explicitement null. Les relations de membres sont partielles.

## Raretés et boosters

50 légendaires, 140 épiques, 169 rares et 141 communes. Cette distribution éditoriale est indépendante des probabilités cibles par tirage (4 %, 16 %, 35 %, 45 %).

| Booster | Identités éligibles | Quatre raretés |
|---|---:|---|
| ALL STARS | 500 | Oui |
| GROUPES | 197 | Oui |
| SOLO | 303 | Oui |
| ROCK & METAL | 134 | Oui |
| ELECTRONIC | 71 | Oui |
| POP & R&B | 157 | Oui |
| HIP-HOP | 61 | Oui |
| ASIA WAVE | 65 | Oui |
| ROOTS & GROOVE | 63 | Oui |

Les artistes peuvent apparaître dans plusieurs boosters, sans duplication de carte. Les filtres musicaux sont indépendants du pays.

## Importation et direction artistique

Importateur Node sans dépendance : cache avec horodatages, reprise, contrôle des identités ambiguës, limitation des requêtes et backoff. Les écritures JSON sont atomiques.

La direction artistique a été remplacée à la demande du porteur du projet : les 500 cartes utilisent des compositions typographiques des noms, neuf familles de styles et des palettes stables par ID. Les anciens portraits, illustrations, manifestes et importateur photo ont été retirés. Aucun ID ni donnée de sauvegarde modifié. Les champs sans données restent masqués.

## Interface et vérifications

Explorateur paginé (40 cartes par page), recherche par nom/alias avec priorité au nom exact, filtres solo/groupe, genre, rareté et booster. Fiches accessibles par dialogue, sources cliquables, âge calculé uniquement avec des dates complètes, visuels typographiques et champs absents masqués.

- npm.cmd test : 33 tests réussis, dont couverture typographique des 500 cartes et classification indépendante du pays.
- npm.cmd run check:catalog : catalogue complet accepté, tous les boosters disposent des quatre raretés.
- Suite navigateur : 24 assertions réussies sur le serveur local après remplacement des portraits.
- Contrôle des 500 compositions à 390 px : aucun nom hors cadre ou chevauchant les bandeaux.
- Contrôles navigateur : navigation, recherche sans accent, ordre nom exact/alias, fiche Queen et MBID réel, restitution du focus, pagination et absence de débordement à 390 et 1 100 px.

Les ouvertures, tickets actifs, paiements et recyclages restent désactivés en attente de la Phase 3. La CI GitHub n’a pas été exécutée à distance et aucun site n’a été déployé. Aucun test sur appareil Android physique n’a été effectué.

## Références du dépôt

[Catalogue](../data/artists.json), [registre permanent](../data/candidates.json), [rapport d’import détaillé](../data/import-report.json), [politique éditoriale](./editorial-policy.md), [contrat de données](./catalog-contract.md), [README](../README.md).
