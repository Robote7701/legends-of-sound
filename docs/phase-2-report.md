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

## Importation et photographies

Importateur Node sans dépendance : cache avec horodatages, reprise réellement utilisée après interruption, sélection des identités ambiguës documentée, limitation des départs de requêtes, backoff et respect de Retry-After. Les écritures JSON sont atomiques ; les verrous temporaires Windows/OneDrive sont réessayés sans suppression du fichier précédent.

479 propositions Commons disposent d’une image et de métadonnées de licence ; 21 fiches n’ont pas de proposition P18. **Aucun portrait n’est publié.** Les propositions restent dans un registre distinct, sans téléchargement d’images. L’application utilise des visuels originaux de remplacement. Le manifeste de portraits revus est vide ; une revue réelle de l’identité, des droits et des restrictions reste nécessaire avant publication d’une photo.

## Interface et vérifications

Explorateur paginé (40 cartes par page), recherche par nom/alias avec priorité au nom exact, filtres solo/groupe, genre, rareté et booster. Fiches accessibles par dialogue, sources cliquables, âge calculé uniquement avec des dates complètes, crédits conditionnels et champs manquants signalés.

- npm.cmd test : 32 tests réussis (Node.js 24.22.1).
- npm.cmd run check:catalog : catalogue complet accepté, tous les boosters disposent des quatre raretés.
- Suite navigateur : 19 assertions réussies sur le serveur local, puis 19 sur un proxy local sous /legends-of-sound/.
- Contrôles navigateur : navigation, recherche sans accent, ordre nom exact/alias, fiche Queen et MBID réel, restitution du focus, pagination et absence de débordement à 390 et 1 100 px.

Les ouvertures, tickets actifs, paiements et recyclages restent désactivés en attente de la Phase 3. La CI GitHub n’a pas été exécutée à distance et aucun site n’a été déployé. Aucun test sur appareil Android physique n’a été effectué.

## Références du dépôt

[Catalogue](../data/artists.json), [registre permanent](../data/candidates.json), [rapport d’import détaillé](../data/import-report.json), [propositions de portraits](../data/portrait-candidates.json), [politique éditoriale](./editorial-policy.md), [contrat de données](./catalog-contract.md), [README](../README.md).
