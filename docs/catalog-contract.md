# Contrat du catalogue — Phase 2

ORIGINS comprend exactement 500 cartes, une par identité musicale. Les IDs los-000001 à los-000500 sont permanents et ne doivent jamais être réattribués après publication du catalogue.

## Identité

id, mbid, wikidataId, editionId, name officiel MusicBrainz, displayName éditorial, type solo/group et entityType MusicBrainz. Hatsune Miku est un Character, rangé dans solo pour le jeu sans naissance humaine inventée. Le ratio solo/group reste indicatif et suit les types MusicBrainz.

Vérification croisée : propriété P434 Wikidata, consultation officielle MusicBrainz, concordance de nom/alias et type, puis lien retour vers la même entité Wikidata. Les exceptions à P434 sont documentées dans le registre et exigent toujours les autres contrôles. Ce protocole ne constitue pas un audit humain de chaque champ biographique du fournisseur.

## Classification et détails

genres et rarity sont des décisions éditoriales explicites. [Politique éditoriale](./editorial-policy.md). Aucun pays n’ouvre un booster automatiquement ; les quatre raretés sont obligatoires avant toute ouverture.

aliases contient des noms d’indexation, pas nécessairement tous des pseudonymes artistiques. country et area correspondent à l’association MusicBrainz, pas à une nationalité. birthDate/deathDate s’appliquent aux Person, formationDate aux groupes. Les membres et anciens membres viennent de relations disponibles et sont présentés comme une liste partielle.

nationality, careerStart, notableAlbums, knownTracks, awards et biography restent null si non documentés. knownFor reprend une notice structurée Wikidata, français sinon anglais, avec langue et source. Cette notice courte ne remplace pas une biographie détaillée.

provenance conserve URL, date de récupération, révision Wikidata, méthode et résultat du contrôle. sources indique la provenance par catégorie et licence. Identités centrales MusicBrainz et données structurées Wikidata : CC0. Aucun tag, vote ou annotation supplémentaire MusicBrainz importé. Aucun nombre de chansons originales déduit d’un compteur d’enregistrements.

## Portraits

portrait reste null avant revue. Champs requis sinon : imageUrl, sourceUrl, photographer, license, licenseUrl, modifications, identityVerifiedAt, rightsReviewedAt, identityVerification, rightsReview. Les droits inconnus, licences ND et images hors Commons sont refusés.

[portrait-candidates.json](../data/portrait-candidates.json) est distinct des images autorisées. [portraits-reviewed.json](../data/portraits-reviewed.json) contient les sélections revues explicitement. Les métadonnées automatiques ne remplacent pas la vérification des licences, restrictions et sujets.

## Importation

Cache hors Git, reprise, User-Agent identifié, départs de requêtes espacés d’au moins 1 150 ms et backoff. Le rapport expose les exceptions et champs manquants. --publish écrit seulement les JSON locaux, sans déployer GitHub Pages, et refuse réattributions d’identités, nombre différent de 500 ou raretés manquantes.
