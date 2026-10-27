import { readFile, readdir, mkdir } from 'node:fs/promises';
import { ApiClient, writeJSON } from './lib/api-client.js';
import { normalizeName, claimValues, verifyIdentity, makeCard } from './lib/identity.js';
import { validateCatalog, boosterAvailability } from '../src/catalog/catalog.js';

const read = async path => JSON.parse(await readFile(path, 'utf8'));
const input = process.argv.find(arg => arg.startsWith('--candidates='))?.slice(13);
if (!input) throw new Error('Utiliser --candidates=fichier.json [--count=50] [--apply]');
const count = Number(process.argv.find(arg => arg.startsWith('--count='))?.slice(8) || 50);
if (!Number.isSafeInteger(count) || count < 1 || count > 1000) throw new Error('Nombre demandé invalide (1–1000).');
if (!input.endsWith('.json')) throw new Error('La liste doit être un fichier JSON.');
const manifestPath = input.replace(/\.json$/, '-verified.json');
try {
  await readFile(manifestPath);
  throw new Error('Ce lot a déjà été appliqué. Utiliser une nouvelle liste pour préserver son manifeste.');
} catch (error) { if (error.code !== 'ENOENT') throw error; }
const selections = await read(input);
if (!Array.isArray(selections) || selections.some(a => !a || typeof a.name !== 'string' || !a.name.trim() || !['solo','group'].includes(a.type) || !Array.isArray(a.genres) || !a.genres.length || a.genres.some(g=>typeof g!=='string'||!g))) throw new Error('Liste de candidats invalide.');
const artists = await read('data/artists.json');
const candidates = await read('data/candidates.json');
const editions = await read('data/editions.json');
const retired = await read('data/retired-identifiers.json');
const boosters = await read('data/boosters.json');
const api = new ApiClient('.cache/api');
await mkdir('.cache/api', { recursive: true });
const entities = new Map();
for (const file of await readdir('.cache/api')) {
  if (!file.endsWith('.json')) continue;
  const cached = await read('.cache/api/' + file);
  for (const entity of Object.values(cached.data.entities || {})) {
    if (entity.labels && entity.claims?.P434 && (!entities.has(entity.id) || entity.lastrevid > entities.get(entity.id).lastrevid)) entities.set(entity.id, entity);
  }
}
let nextId = Math.max(...[...artists, ...candidates, ...retired].map(a => Number(a.id.slice(4)))) + 1;
const usedMbids = new Set([...artists, ...retired].map(a => a.mbid));
const usedIds = new Set([...artists, ...retired].map(a => a.wikidataId));
const usedNames = new Set(artists.flatMap(a => [a.name, a.displayName, ...(a.aliases || [])]).map(normalizeName));
const accepted = [], rejected = [];
for (const selection of selections) {
  if (accepted.length === count) break;
  if (usedNames.has(normalizeName(selection.name))) { rejected.push({ name: selection.name, reason: 'Déjà présent' }); continue; }
  try {
    let matches = [...entities.values()].filter(e => !usedIds.has(e.id) && Object.values(e.labels).some(l => normalizeName(l.value) === normalizeName(selection.name)));
    if (!matches.length) {
      const search = await api.get('https://www.wikidata.org/w/api.php?' + new URLSearchParams({ action: 'wbsearchentities', search: selection.name, language: 'en', type: 'item', format: 'json', limit: '10' }));
      const ids = (search.data.search || []).map(e => e.id).filter(id => !usedIds.has(id));
      if (ids.length) {
        const response = await api.get('https://www.wikidata.org/w/api.php?' + new URLSearchParams({ action: 'wbgetentities', ids: ids.join('|'), props: 'labels|descriptions|claims', languages: 'fr|en', format: 'json' }));
        const exactSearchIds = new Set((search.data.search || []).filter(e => normalizeName(e.label || '') === normalizeName(selection.name) || normalizeName(e.match?.text || '') === normalizeName(selection.name)).map(e => e.id));
        matches = Object.values(response.data.entities || {}).filter(e => e.claims?.P434 && (exactSearchIds.has(e.id) || Object.values(e.labels || {}).some(l => normalizeName(l.value) === normalizeName(selection.name))));
      }
    }
    const verified = [];
    for (const entity of matches) {
      const mbids = [...new Set(claimValues(entity, 'P434'))];
      if (mbids.length !== 1 || usedMbids.has(mbids[0])) continue;
      const response = await api.get('https://musicbrainz.org/ws/2/artist/' + mbids[0] + '?inc=aliases+url-rels+artist-rels&fmt=json');
      const candidate = { ...selection, wikidataId: entity.id, rarity: 'common', rarityReview: { status: 'pending', reason: 'Rareté provisoire : revue éditoriale à effectuer ; aucune mesure du talent.' }, genreSelection: { kind: 'editorial', source: input } };
      const verification = verifyIdentity(candidate, entity, response.data);
      if (verification.verified) verified.push({ candidate, entity, response, verification });
    }
    if (verified.length !== 1) throw new Error('Correspondance vérifiée non unique : ' + verified.length);
    const { candidate, entity, response, verification } = verified[0];
    candidate.id = 'los-' + String(nextId++).padStart(6, '0');
    const card = makeCard(candidate, entity, response, verification);
    accepted.push({ candidate, card }); usedMbids.add(card.mbid); usedIds.add(card.wikidataId); usedNames.add(normalizeName(card.displayName));
    console.log(accepted.length + '/' + count + ' · ' + card.displayName + ' · ' + card.mbid);
  } catch (error) { rejected.push({ name: selection.name, reason: error.message }); console.log('Écarté : ' + selection.name + ' · ' + error.message); }
  await writeJSON('.cache/catalog-addition-report.json', { accepted, rejected });
}
if (accepted.length !== count) throw new Error('Seulement ' + accepted.length + ' identités vérifiées. Aucune modification du catalogue.');
const expanded = [...artists, ...accepted.map(a => a.card)];
const updatedEditions = structuredClone(editions);
updatedEditions.find(e => e.id === 'origins-01').targetCardCount += count;
validateCatalog(expanded, updatedEditions, { requireComplete: true, retiredIdentifiers: retired });
for (const booster of boosters) if (!boosterAvailability(expanded, booster).available) throw new Error('Booster incomplet : ' + booster.id);
if (process.argv.includes('--apply')) {
  await writeJSON('.cache/before-catalog-batch.json', { artists, candidates, editions });
  await writeJSON('data/artists.json', expanded);
  await writeJSON('data/candidates.json', [...candidates, ...accepted.map(a => a.candidate)]);
  await writeJSON('data/editions.json', updatedEditions);
  await writeJSON(manifestPath, accepted.map(({ card }) => ({ id: card.id, name: card.displayName, mbid: card.mbid, wikidataId: card.wikidataId, sources: [card.provenance.musicbrainz.url, card.provenance.wikidata.url] })));
}
console.log(count + ' ajouts vérifiés ; total ' + expanded.length + (process.argv.includes('--apply') ? ' · enregistré' : ' · aperçu uniquement'));
