# Politique éditoriale — ORIGINS

## Identité et sélection

1 500 entrées choisies pour couvrir plusieurs générations et scènes musicales : artistes solo, groupes, projets électroniques, artistes virtuels et producteurs Vocaloid. Les artistes peuvent appartenir à plusieurs boosters. La première sélection comportait 300 solos et 200 groupes ; le type final suit MusicBrainz, notamment pour les projets personnels comme Tame Impala. Le ratio est indicatif.

Le registre [candidates.json](../data/candidates.json) conserve les IDs définitifs. Un ID ne doit jamais être déplacé vers un autre artiste après publication du catalogue. Le MBID ne se déduit pas d’un nom : il est obtenu via Wikidata puis consulté sur l’API officielle MusicBrainz. Le candidat doit correspondre à un nom ou alias, au type attendu et à un lien MusicBrainz retournant vers la même entité Wikidata.

Quand Wikidata distingue plusieurs identités MusicBrainz pour d’anciens noms, personnes civiles ou sous-projets, la sélection du projet principal est documentée dans identitySelection ou identityReview. Une propriété P434 obsolète n’est jamais utilisée sans contrôle. Les résultats de recherche ne sont pas choisis d’après leur rang ou popularité. Le protocole est un contrôle croisé automatisé avec révision des exceptions, pas la prétention d’un audit humain de chaque champ biographique.

## Genres

Classement éditorial explicitement séparé des données d’identité. Les codes correspondent à des genres ou scènes musicales ; aucun pays n’ouvre automatiquement un booster. Les genres peuvent se cumuler et ne prétendent pas être exhaustifs. Le filtre ASIA WAVE contient j-pop, k-pop, j-rock et vocaloid : un artiste chinois, indien ou japonais n’y entre pas uniquement du fait de sa nationalité. Les tags communautaires MusicBrainz et leurs votes ne sont pas importés : ces données supplémentaires ont une licence différente des identités centrales.

## Extension de la sélection

L’extension utilise des genres Wikidata explicites, une sélection supplémentaire pour le rap et un contrôle croisé de chaque identité. Les descriptions et langues déclarées aident la présélection ; le nombre de liens interwiki sert à trouver des notices documentées et ne détermine aucune rareté. Un pays ou une langue parlée ne suffit pas à attribuer un genre, ni à déterminer la langue du répertoire. Les genres normalisés des nouveaux candidats conservent leur provenance ; la sélection prioritaire rap relève d’un choix éditorial explicite.

Les 500 raretés initiales ont été conservées pendant l’extension. La revue démarre avec quatre décisions motivées dans [rarity-decisions.json](../data/rarity-decisions.json) : Céline Dion, Ray Charles, Frank Sinatra et Bob Marley passent en légendaire. Les nouvelles valeurs communes non révisées sont provisoires et signalées. Un dossier couvre les 1 500 fiches, avec 412 suggestions documentaires ; ces suggestions ne sont pas appliquées automatiquement. Le manque de récompenses ne démontre pas une reconnaissance faible. Les listes de distinctions ou d’œuvres restent des éléments incomplets, jamais un score automatique de talent ou d’influence. L’atelier permet des brouillons justifiés et leur export ; les décisions appliquées sont vérifiées avant remplacement du catalogue.

## Raretés

Légendaire : influence historique ou reconnaissance internationale particulièrement durable, parfois dans une scène spécifique. Épique : figure majeure de son univers. Rare : présence établie et reconnue. Commune : profondeur de sélection et découverte, y compris des artistes très reconnus. Ce classement subjectif sert le jeu ; il ne mesure ni talent, ni qualité, ni valeur culturelle.

La distribution de cartes dans le catalogue est indépendante des taux initiaux de tirage : le moteur choisit d’abord une rareté à 4/16/35/45 %, puis une carte dans le sous-ensemble correspondant, sans répétition dans un même paquet. Une rareté épuisée dans le paquet est exclue et les taux restants sont renormalisés ; cette règle est affichée avant l’ouverture. Les doublons restent possibles entre paquets. Chaque booster doit disposer d’au moins une carte des quatre raretés. Les ouvertures sont actives ; les valeurs provisoires des nouvelles cartes restent signalées pendant la revue du classement.

## Informations manquantes

Pays MusicBrainz et nationalité restent distincts. Une date de formation n’est pas une naissance. La date initiale d’un personnage Vocaloid ne devient pas une naissance humaine. Les dates partielles ne permettent pas de calculer un âge précis. Les membres proviennent des relations MusicBrainz et sont explicitement présentés comme une liste partielle. Aucune fin de carrière ne se déduit d’un dernier enregistrement.

Les notices « Pourquoi est-il célèbre ? » utilisent les descriptions structurées Wikidata en français, sinon en anglais, sans inventer de succès ou récompense. Ce sont des notices d’identification courtes, pas des biographies complètes. Les biographies, albums marquants, titres, récompenses et débuts de carrière absents restent null. Les futurs enrichissements devront documenter leur propre source par champ. Aucun compteur d’enregistrements ne représente un nombre de chansons originales.

## Direction typographique

À la demande du porteur du projet, les portraits et illustrations sont remplacés par des compositions originales des noms. Les familles typographiques suivent les genres, jamais les nationalités. Les palettes et motifs sont définis localement en CSS, avec polices système et sans reproduire les logos des artistes. Aucun import de photographie.

Sources de référence : [MusicBrainz — API](https://musicbrainz.org/doc/MusicBrainz_API), [licences MusicBrainz](https://musicbrainz.org/doc/About/Data_License), [licence Wikidata](https://www.wikidata.org/wiki/Wikidata:Licensing).
