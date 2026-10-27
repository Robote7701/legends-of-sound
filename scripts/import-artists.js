import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { ApiClient, writeJSON } from './lib/api-client.js';
import { claimValues, verifyIdentity, makeCard } from './lib/identity.js';
import { validateCatalog, boosterAvailability } from '../src/catalog/catalog.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = async name => JSON.parse(await readFile(path.join(root, name), 'utf8'));
const candidates = await read('data/candidates.json');
const editions = await read('data/editions.json');
const boosters = await read('data/boosters.json');
const api = new ApiClient(path.join(root, '.cache/api'));
const limit = Number(process.argv.find(a => a.startsWith('--limit='))?.split('=')[1] || candidates.length);
const selected = candidates.slice(0, limit);
const entitiesByTitle = new Map();
for (let offset = 0; offset < selected.length; offset += 40) {
  const chunk = selected.slice(offset, offset + 40);
  const url = new URL('https://www.wikidata.org/w/api.php');
  url.search = new URLSearchParams({ action: 'wbgetentities', sites: 'enwiki', titles: chunk.map(c => c.wikipediaTitle).join('|'), props: 'labels|descriptions|claims|sitelinks/urls', languages: 'en|fr', format: 'json' });
  const response = await api.get(url.href);
  for (const entity of Object.values(response.data.entities || {})) {
    if (entity.sitelinks?.enwiki?.title) entitiesByTitle.set(entity.sitelinks.enwiki.title, entity);
  }
}
const artists = [], pending = [], decisions = [];
let cursor = 0, processed = 0, progressWrites = Promise.resolve();
async function importCandidate(candidate) {
  try {
    let entity = entitiesByTitle.get(candidate.wikipediaTitle);
    if (candidate.wikidataId) {
      const response = await api.get('https://www.wikidata.org/w/api.php?' + new URLSearchParams({ action: 'wbgetentities', ids: candidate.wikidataId, props: 'labels|descriptions|claims|sitelinks/urls', languages: 'en|fr', format: 'json' }));
      entity = response.data.entities[candidate.wikidataId];
    }
    if (!entity) throw new Error('Titre Wikipédia non résolu : ' + candidate.wikipediaTitle);
    const mbids = candidate.mbid ? [candidate.mbid] : [...new Set(claimValues(entity, 'P434'))];
    if (mbids.length !== 1) throw new Error('MBID absent ou multiple sur ' + entity.id);
    const response = await api.get('https://musicbrainz.org/ws/2/artist/' + mbids[0] + '?inc=aliases+url-rels+artist-rels&fmt=json');
    const verification = verifyIdentity(candidate, entity, response.data);
    const decision = { id: candidate.id, name: candidate.name, mbid: mbids[0], wikidataId: entity.id, verification };
    decisions.push(decision);
    if (!verification.verified) throw new Error(verification.reason);
    artists.push(makeCard(candidate, entity, response, verification));
    console.log('[' + artists.length + '/' + selected.length + '] ' + candidate.name + ' ✓');
  } catch (error) {
    pending.push({ id: candidate.id, name: candidate.name, reason: error.message });
    console.log('À REVOIR : ' + candidate.name + ' — ' + error.message);
  }
  processed++;
  if (processed % 10 !== 0 && processed !== selected.length) return;
  const progress = structuredClone({ imported: artists.length, pending, decisions });
  progressWrites = progressWrites.then(() => writeJSON(path.join(root, '.cache/import-progress.json'), progress));
  await progressWrites;
}
// Up to three responses in flight, but all request starts (including retries) are
// serialized by the shared API client at >= 1150 ms intervals.
await Promise.all(Array.from({ length: 3 }, async () => {
  while (cursor < selected.length) await importCandidate(selected[cursor++]);
}));
artists.sort((a, b) => a.id.localeCompare(b.id));
decisions.sort((a, b) => a.id.localeCompare(b.id));
const existing = await read('data/artists.json');
for (const previous of existing) {
  const current = artists.find(a => a.id === previous.id && a.mbid === previous.mbid);
  if (current) current.portrait = previous.portrait;
}
validateCatalog(artists, editions.map(e => ({ ...e, status: 'preparation' })));
const missingFields = ['portrait', 'biography', 'notableAlbums', 'knownTracks', 'awards', 'careerStart', 'nationality'];
const report = {
  generatedAt: new Date().toISOString(), candidates: selected.length, verified: artists.length,
  pending, decisions,
  types: Object.fromEntries(['solo', 'group'].map(t => [t, artists.filter(a => a.type === t).length])),
  rarities: Object.fromEntries(['legendary', 'epic', 'rare', 'common'].map(r => [r, artists.filter(a => a.rarity === r).length])),
  boosters: boosters.map(b => ({ id: b.id, ...boosterAvailability(artists, b) })),
  missing: Object.fromEntries(missingFields.map(field => [field, artists.filter(a => a[field] === null).map(a => a.id)])),
};
await writeJSON(path.join(root, 'data/import-report.json'), report);
if (process.argv.includes('--publish')) {
  if (artists.length !== 500 || pending.length || report.boosters.some(b => !b.available)) throw new Error('Publication du catalogue refusée : identités ou raretés incomplètes.');
  for (const card of existing) {
    if (!artists.some(a => a.id === card.id && a.mbid === card.mbid)) throw new Error('Identité permanente modifiée : ' + card.id);
  }
  await writeJSON(path.join(root, 'data/artists.json'), artists);
  await writeJSON(path.join(root, 'data/editions.json'), editions.map(e => e.id === 'origins-01' ? { ...e, status: 'ready' } : e));
} else await writeJSON(path.join(root, '.cache/artists-preview.json'), artists);
console.log(JSON.stringify({ verified: artists.length, pending: pending.length, published: process.argv.includes('--publish') }));
