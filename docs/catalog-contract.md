# Contrat du catalogue — préparation Phase 2

Une carte représente un artiste ou groupe unique par édition. Le catalogue doit contenir exactement 500 entrées vérifiées pour ORIGINS avant son passage à ready. En préparation, zéro entrée est un état valide et explicitement affiché.

## Champs

- id : identifiant permanent, par exemple le format los- suivi d’un numéro stable ; ne jamais réattribuer un identifiant retiré.
- mbid : UUID MusicBrainz vérifié humainement contre l’identité recherchée ; unicité par édition à faire évoluer explicitement pour les éditions futures.
- editionId : origins-01 pour la première édition.
- name : nom officiel ; type : solo ou group ; genres : liste de codes musicaux normalisés.
- rarity : common, rare, epic ou legendary ; jugement éditorial de notoriété et influence, pas mesure du talent.
- provenance.musicbrainz : url et verifiedAt ; conserver le candidat, le résultat et la décision de vérification dans le rapport d’import.
- aliases, country, birthDate, careerStart, formationDate, members, formerMembers, notableAlbums, knownTracks, awards, biography, knownFor : valeurs sourcées ou null. Distinguer nationalité, pays de naissance, pays de formation et scène.
- sources : références par champ, URL et date de consultation. Ne jamais déduire un nombre de chansons originales du nombre d’enregistrements MusicBrainz.
- portrait : null par défaut, sinon imageUrl, sourceUrl, photographer, license, licenseUrl, modifications, identityVerifiedAt et rightsReviewedAt.

Les champs supplémentaires sont réservés à l’enrichissement ; la validation actuelle est un socle, pas un audit complet des licences. Tout portrait doit rester null tant que la revue manuelle n’est pas terminée. L’interface de Phase 1 ne publie aucun portrait.

## Importateur à réaliser

Charger des candidats, rechercher MusicBrainz, présenter les homonymes sans choisir une correspondance incertaine. Utiliser un cache local hors Git, journaliser chaque décision et reprendre après interruption. Limiter les requêtes, respecter Retry-After, le User-Agent et les conditions des sources. Proposer des images Commons en quarantaine ; importer un manifeste de portraits revu manuellement. Aucune clé API côté navigateur.

Valider identité, attribution, licence autorisant l’usage envisagé, recadrage éventuel et restrictions documentées. Refuser les droits inconnus et les photos promotionnelles sans permission ; ne pas modifier les CC BY-ND. Préférer un remplacement graphique si les droits ne sont pas clairs. Générer un rapport des données manquantes, des correspondances en attente, des licences et de la couverture de raretés de chaque booster.
