# Extension ORIGINS à 1 500 cartes — 27 octobre 2026

## Résultat

1 500 identités musicales distinctes : 1 165 personnes/projets solo et 335 groupes, selon les types MusicBrainz. Chaque carte possède un MBID unique dans l’édition, un identifiant Wikidata et une preuve de concordance avec lien retour MusicBrainz. La sélection a privilégié des notices documentées ; elle comporte aussi des membres de groupes et des artistes exerçant d’autres métiers. Ce n’est pas un classement de popularité musicale.

Les 500 identifiants, MBID, types, noms affichés, genres et raretés initiaux ont été conservés. Les sauvegardes utilisent la même clé et n’ont pas été réinitialisées. Un participant parlé sans activité musicale suffisamment établie a été retiré de la présélection ; son identifiant reste réservé dans [le registre des IDs retirés](../data/retired-identifiers.json). Les IDs ne constituent pas une numérotation continue des cartes.

Les propositions ambiguës, liens retour absents et échecs réseau sont consignés parmi les exclusions du [rapport d’import](../data/import-report.json). Les cas exclus ne sont pas publiés comme cartes vérifiées. Le choix du MBID musical de Booba est documenté par le qualificatif de nom Wikidata dans [la sélection prioritaire rap](../data/expansion-priorities.json).

## Données de carrière

- Distinctions disponibles sur 835 fiches, propriété Wikidata P166.
- Début d’activité disponible sur 1 428 fiches, propriété P2031 et précision de date respectée.
- Œuvres notables disponibles sur 265 fiches, propriété P800.
- Genres d’origine, déclarations et références conservés dans 30 lots locaux de 50 fiches.

Les œuvres notables ne sont pas automatiquement des albums ou des chansons. Les récompenses ne sont pas toutes musicales. Les listes sont partielles ; leur absence ne mesure pas l’influence. Les descriptions restent des notices courtes Wikidata, sans biographie inventée. Les champs non enrichis restent null.

Le catalogue principal pèse environ 7,45 Mo non compressés. Les références détaillées, environ 11 Mo répartis en 30 lots, sont chargées seulement lorsque le joueur ouvre la rubrique correspondante dans une fiche. Aucune API musicale n’est appelée par le navigateur. Aucun portrait ou téléchargement de police.

## Classement à revoir ensuite

Les 500 raretés initiales restent inchangées. Les 1 000 nouvelles cartes utilisent une valeur commune provisoire avec statut pending, signalée dans la collection et les fiches. L’édition compte donc temporairement 50 légendaires, 140 épiques, 169 rares et 1 141 communes, dont 1 000 provisoires. Ces effectifs ne définissent pas les probabilités de tirage.

Les genres des nouveaux ajouts sont normalisés dans la taxonomie du jeu, avec provenance et libellés d’origine conservés. La priorité de recherche ne prétend pas définir le genre principal d’un artiste. Les genres et raretés restent des décisions éditoriales à examiner ; les éléments sourcés apportent un support à la revue, sans score automatique.

| Booster | Cartes éligibles |
|---|---:|
| ALL STARS | 1 500 |
| GROUPES | 335 |
| SOLO | 1 165 |
| ROCK & METAL | 481 |
| ELECTRONIC | 261 |
| POP & R&B | 686 |
| HIP-HOP | 402 |
| ASIA WAVE | 195 |
| ROOTS & GROOVE | 258 |

Chaque booster dispose toujours des quatre raretés. Les catégories se recoupent ; une identité n’est pas dupliquée dans le catalogue. Rap français, francophone et américain ont reçu une sélection complémentaire explicite.

## Vérifications

- 39 tests Node réussis : identités, conservation des 500 IDs initiaux, MBID, données sourcées, dates, genres, raretés disponibles, sauvegardes et refus de réattribution d’un ID retiré.
- Contrôle complet du catalogue accepté : 1 500 cartes, neuf boosters cohérents.
- 25 contrôles navigateur réussis en local, puis 25 sous le préfixe /legends-of-sound/ : navigation, recherche, filtres, fiches, références chargées à la demande, clavier, pagination et responsive.
- Contrôle des 1 500 compositions à 390 px : aucun nom hors cadre ou chevauchant les bandeaux, aucune image artiste et aucun débordement global.
- Comparaison avec la version précédente : les 500 classifications initiales sont inchangées.

La révision des raretés vient ensuite. Les ouvertures et l’économie restent en attente de la Phase 3. Aucun déploiement distant, aucune publication GitHub Pages et aucun test sur appareil Android physique n’ont été effectués.
