import { RARITIES } from '../domain/config.js';
const MBID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function validateCatalog(artists, editions, { requireComplete = false, retiredIdentifiers = [] } = {}) {
  if (!Array.isArray(artists) || !Array.isArray(editions)) throw new Error('Catalogue invalide.');
  const ids = new Set(), mbids = new Set();
  for (const card of artists) {
    if (retiredIdentifiers.some(entry => entry.id === card?.id)) throw new Error('Identifiant retiré : réattribution interdite.');
    if (!card || typeof card.id !== 'string' || !/^los-[a-z0-9-]+$/.test(card.id) || ids.has(card.id)) throw new Error('Identifiant de carte invalide ou dupliqué.');
    const identityKey = card.editionId + ':' + card.mbid?.toLowerCase();
    if (typeof card.mbid !== 'string' || !MBID.test(card.mbid) || mbids.has(identityKey)) throw new Error('MBID invalide ou dupliqué dans cette édition.');
    if (!editions.some(e => e.id === card.editionId) || !['solo', 'group'].includes(card.type) || !Object.hasOwn(RARITIES, card.rarity)) throw new Error('Classification invalide.');
    if (typeof card.name !== 'string' || !card.name.trim() || !Array.isArray(card.genres) || !card.genres.length || !card.genres.every(g => typeof g === 'string' && g.length > 0)) throw new Error('Nom ou genres manquants.');
    if (!card.provenance?.musicbrainz?.verifiedAt || card.provenance.musicbrainz.url !== 'https://musicbrainz.org/artist/' + card.mbid) throw new Error('Vérification MusicBrainz manquante.');
    const proof = card.provenance.musicbrainz.verification;
    if (!proof?.verified || !proof.nameMatch || !proof.reciprocal || proof.reciprocalUrl !== 'https://www.wikidata.org/wiki/' + card.wikidataId) throw new Error('Preuve de vérification croisée manquante.');
    if (card.portrait != null) throw new Error('Les cartes utilisent exclusivement des compositions typographiques.');
    ids.add(card.id); mbids.add(identityKey);
  }
  for (const edition of editions) {
    const count = artists.filter(a => a.editionId === edition.id).length;
    if (count > edition.targetCardCount || ((requireComplete || edition.status === 'ready') && count !== edition.targetCardCount)) throw new Error('Nombre de cartes incorrect pour ' + edition.id);
  }
  return artists;
}
export function matchesBooster(card, booster) {
  const f = booster.filter;
  return card.editionId === booster.editionId && (!f.types || f.types.includes(card.type)) && (!f.genresAny || card.genres.some(g => f.genresAny.includes(g)));
}
export function boosterAvailability(artists, booster) {
  const cards = artists.filter(card => matchesBooster(card, booster));
  const missingRarities = Object.keys(RARITIES).filter(r => !cards.some(c => c.rarity === r));
  return { count: cards.length, missingRarities, available: missingRarities.length === 0 };
}
export function validateBoosters(boosters, editions) {
  if (!Array.isArray(boosters) || !boosters.length) throw new Error('Boosters absents.');
  const ids = new Set();
  for (const b of boosters) {
    if (!b || typeof b.id !== 'string' || ids.has(b.id) || !editions.some(e => e.id === b.editionId) || typeof b.name !== 'string' || !b.filter || typeof b.filter !== 'object') throw new Error('Booster invalide.');
    if (Object.keys(b.filter).some(k => !['types', 'genresAny'].includes(k))) throw new Error('Filtre inconnu.');
    for (const [key, values] of Object.entries(b.filter)) {
      if (!Array.isArray(values) || !values.length || !values.every(v => typeof v === 'string' && v.length > 0)) throw new Error('Filtre invalide.');
      if (key === 'types' && values.some(v => !['solo', 'group'].includes(v))) throw new Error('Type invalide.');
    }
    ids.add(b.id);
  }
  return boosters;
}
