import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ApiClient, writeJSON } from './lib/api-client.js';
import { claimValues } from './lib/identity.js';
import { validatePortrait } from '../src/catalog/portraits.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const artists = JSON.parse(await readFile(path.join(root, 'data/artists.json'), 'utf8'));
const entities = new Map();
let cachedFiles = [];
try { cachedFiles = await readdir(path.join(root, '.cache/api')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
for (const file of cachedFiles.filter(name => name.endsWith('.json'))) {
  const cached = JSON.parse(await readFile(path.join(root, '.cache/api', file), 'utf8'));
  for (const entity of Object.values(cached.data.entities || {})) if (entity.id) entities.set(entity.id, entity);
}
const api = new ApiClient(path.join(root, '.cache/api'));
// A fresh clone has the verified catalog but no private API cache.
const missing = [...new Set(artists.map(a => a.wikidataId))].filter(id => !entities.has(id));
for (let offset = 0; offset < missing.length; offset += 40) {
  const url = new URL('https://www.wikidata.org/w/api.php');
  url.search = new URLSearchParams({ action: 'wbgetentities', ids: missing.slice(offset, offset + 40).join('|'), props: 'claims', format: 'json' });
  const response = await api.get(url.href);
  for (const entity of Object.values(response.data.entities || {})) if (entity.id) entities.set(entity.id, entity);
}
const suggestions = artists.map(a => ({ id: a.id, name: a.displayName, wikidataId: a.wikidataId, fileName: claimValues(entities.get(a.wikidataId) || {}, 'P18')[0] || null }));
for (let offset = 0; offset < suggestions.length; offset += 40) {
  const chunk = suggestions.slice(offset, offset + 40).filter(s => s.fileName);
  if (!chunk.length) continue;
  const url = new URL('https://commons.wikimedia.org/w/api.php');
  url.search = new URLSearchParams({ action: 'query', format: 'json', titles: chunk.map(s => 'File:' + s.fileName).join('|'), prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: '600' });
  try {
    const response = await api.get(url.href);
    for (const page of Object.values(response.data.query?.pages || {})) {
      const suggestion = chunk.find(s => ('File:' + s.fileName).replaceAll('_', ' ') === page.title.replaceAll('_', ' '));
      if (!suggestion) continue;
      const info = page.imageinfo?.[0], meta = info?.extmetadata || {};
      Object.assign(suggestion, { imageUrl: info?.thumburl || info?.url || null, sourceUrl: info?.descriptionurl || null,
        photographerHtml: meta.Artist?.value || null, license: meta.LicenseShortName?.value || null,
        licenseUrl: meta.LicenseUrl?.value || null, restrictions: meta.Restrictions?.value || null,
        identityReviewed: false, rightsReviewed: false, published: false });
    }
  } catch (e) { console.error('Recherche Commons en attente : ' + e.message); }
  console.log('Portraits proposés : ' + Math.min(offset + 40, suggestions.length) + '/' + suggestions.length);
}
await writeJSON(path.join(root, 'data/portrait-candidates.json'), suggestions);
if (process.argv.includes('--apply-reviewed')) {
  const reviewed = JSON.parse(await readFile(path.join(root, 'data/portraits-reviewed.json'), 'utf8'));
  if (!Array.isArray(reviewed) || new Set(reviewed.map(p => p.id)).size !== reviewed.length) throw new Error('Manifeste de portraits invalide.');
  for (const portrait of reviewed) {
    if (!artists.some(a => a.id === portrait.id)) throw new Error('Carte inconnue : ' + portrait.id);
    validatePortrait(portrait);
  }
  for (const artist of artists) {
    const reviewedPortrait = reviewed.find(p => p.id === artist.id);
    if (reviewedPortrait) { const { id, ...portrait } = reviewedPortrait; artist.portrait = portrait; }
  }
  await writeJSON(path.join(root, 'data/artists.json'), artists);
  const reportPath = path.join(root, 'data/import-report.json');
  try {
    const report = JSON.parse(await readFile(reportPath, 'utf8'));
    report.missing.portrait = artists.filter(a => !a.portrait).map(a => a.id);
    report.portraits = { reviewed: reviewed.length, photos: reviewed.filter(p => p.mediaType !== 'illustration').length, illustrations: reviewed.filter(p => p.mediaType === 'illustration').length, updatedAt: new Date().toISOString() };
    await writeJSON(reportPath, report);
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
}
