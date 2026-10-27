export const normalizeName = name => name.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
export function claimValues(entity, property) {
  const claims = (entity.claims?.[property] || []).filter(claim => claim.rank !== 'deprecated' && claim.mainsnak.snaktype === 'value');
  const preferred = claims.filter(claim => claim.rank === 'preferred');
  return (preferred.length ? preferred : claims).map(claim => claim.mainsnak.datavalue.value);
}

export function verifyIdentity(candidate, entity, artist) {
  if (!entity?.id || !artist?.id) return { verified: false, reason: 'Identité absente' };
  const declaredMbid = claimValues(entity, 'P434').includes(artist.id);
  const reviewedMbid = candidate.mbid === artist.id && candidate.identityReview?.source === 'https://musicbrainz.org/artist/' + artist.id && !!candidate.identityReview?.reason;
  if (!declaredMbid && !reviewedMbid) return { verified: false, reason: 'MBID absent de Wikidata et sans revue documentée' };
  const expectedType = candidate.type === 'group' ? ['Group', 'Orchestra', 'Choir'] : ['Person', 'Character'];
  if (!expectedType.includes(artist.type)) return { verified: false, reason: 'Type MusicBrainz différent : ' + artist.type };
  const reciprocal = (artist.relations || []).some(r => r.type === 'wikidata' && r.url?.resource?.replace('http:', 'https:') === 'https://www.wikidata.org/wiki/' + entity.id);
  const names = [artist.name, artist['sort-name'], ...(artist.aliases || []).map(a => a.name), ...Object.values(entity.labels || {}).map(l => l.value)];
  const nameMatch = names.some(name => typeof name === 'string' && normalizeName(name) === normalizeName(candidate.name));
  // Never use popularity or a search score to pick a homonym.
  if (!nameMatch) return { verified: false, reason: 'Nom non concordant : ' + artist.name };
  if (!reciprocal) return { verified: false, reason: 'Lien réciproque Wikidata manquant', nameMatch };
  return { verified: true, method: declaredMbid ? 'reciprocal-musicbrainz-wikidata-and-name-type' : 'reviewed-mbid-and-reciprocal-wikidata-name-type', nameMatch, reciprocal, declaredMbid,
    returnedName: artist.name, returnedType: artist.type, reciprocalUrl: 'https://www.wikidata.org/wiki/' + entity.id, review: candidate.identityReview || null };
}

export function makeCard(candidate, entity, response, verification) {
  const artist = response.data;
  const sourceUrl = 'https://musicbrainz.org/artist/' + artist.id;
  const wikidataUrl = 'https://www.wikidata.org/wiki/' + entity.id;
  const virtual = artist.type === 'Character';
  const lifespan = artist['life-span'] || {};
  const descriptions = entity.descriptions || {};
  const knownFor = descriptions.fr?.value || descriptions.en?.value || null;
  const members = candidate.type === 'group' ? (artist.relations || []).filter(r => r.type === 'member of band' && r.direction === 'backward' && r.artist)
    .map(r => ({ name: r.artist.name, mbid: r.artist.id, begin: r.begin || null, end: r.end || null, ended: !!r.ended })) : [];
  return {
    id: candidate.id, editionId: 'origins-01', mbid: artist.id, wikidataId: entity.id,
    name: artist.name, displayName: candidate.name, type: candidate.type, entityType: artist.type,
    genres: candidate.genres, rarity: candidate.rarity,
    ...(candidate.rarityReview ? { rarityReview: candidate.rarityReview } : {}),
    aliases: [...new Set((artist.aliases || []).map(a => a.name))],
    country: artist.country || null, area: artist.area?.name || null,
    birthDate: candidate.type === 'solo' && !virtual ? lifespan.begin || null : null,
    deathDate: candidate.type === 'solo' && !virtual && lifespan.ended ? lifespan.end || null : null,
    formationDate: candidate.type === 'group' ? lifespan.begin || null : null,
    careerStart: null, nationality: null,
    members: members.length ? members.filter(m => !m.ended) : null,
    formerMembers: members.length ? members.filter(m => m.ended) : null,
    notableAlbums: null, knownTracks: null, awards: null, biography: null,
    knownFor, knownForLanguage: descriptions.fr ? 'fr' : descriptions.en ? 'en' : null,
    portrait: null,
    provenance: {
      musicbrainz: { url: sourceUrl, apiUrl: response.url, verifiedAt: response.fetchedAt, verification },
      wikidata: { url: wikidataUrl, revision: entity.lastrevid || null },
      classification: { kind: 'editorial', source: 'data/candidates.json', policy: 'docs/editorial-policy.md', ...(candidate.genreSelection ? { genres: candidate.genreSelection } : {}) },
    },
    sources: {
      identity: { url: sourceUrl, license: 'CC0-1.0', accessedAt: response.fetchedAt },
      aliases: { url: sourceUrl, license: 'CC0-1.0' },
      country: { url: sourceUrl, meaning: 'MusicBrainz country association; not nationality', license: 'CC0-1.0' },
      dates: { url: sourceUrl, license: 'CC0-1.0' },
      members: { url: sourceUrl, license: 'CC0-1.0', exhaustive: false },
      knownFor: { url: wikidataUrl, field: 'description', license: 'CC0-1.0' },
    },
  };
}
