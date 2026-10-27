import { readFile } from 'node:fs/promises';
import { ApiClient, writeJSON } from './lib/api-client.js';
const api = new ApiClient('.cache/api');
// Les genres sont des critères musicaux Wikidata, jamais des déductions du pays.
const scenes = [
  ['rap-francophone', ['Q11401', 'Q6010'], 400, '?item wdt:P1412 wd:Q150 .'],
  ['hip-hop', ['Q11401', 'Q6010'], 750, ''],
  ['rap-fr', ['Q138020'], 200, ''],
  ['rock', ['Q11399'], 350, ''], ['metal', ['Q38848'], 250, ''],
  ['electronic', ['Q9778'], 250, ''], ['pop', ['Q37073'], 300, ''],
  ['rnb', ['Q45981'], 180, ''], ['jazz', ['Q8341'], 200, ''],
  ['blues', ['Q9759'], 120, ''], ['reggae', ['Q9794'], 100, ''],
  ['punk', ['Q3071'], 120, ''], ['house', ['Q20502'], 100, ''],
  ['techno', ['Q170611'], 100, ''], ['funk', ['Q164444'], 100, ''],
  ['j-pop', ['Q131578'], 250, ''], ['k-pop', ['Q213665'], 180, ''],
  ['world', ['Q208239', 'Q9764', 'Q25099840', 'Q1062400', 'Q512410', 'Q973150', 'Q202930', 'Q388296'], 400, ''],
];
const rows = [];
for (const [scene, genres, limit, extra] of scenes) {
  const query = `SELECT DISTINCT ?item ?links WHERE { VALUES ?genre { ${genres.map(id=>'wd:'+id).join(' ')} } ?item wdt:P136 ?genre; wdt:P434 ?mbid; wikibase:sitelinks ?links . ${extra} } ORDER BY DESC(?links) ?item LIMIT ${limit}`;
  const url = 'https://query.wikidata.org/sparql?' + new URLSearchParams({ query, format: 'json' });
  try {
    const result = await api.get(url);
    for (const r of result.data.results.bindings) rows.push({ wikidataId: r.item.value.split('/').at(-1), scene, documentedLinks: Number(r.links.value), queryUrl: url, fetchedAt: result.fetchedAt });
    console.log(scene, result.data.results.bindings.length);
  } catch (e) { console.log(scene, e.message); }
  await writeJSON('.cache/discovery.json', rows);
}
const existing = JSON.parse(await readFile('data/artists.json', 'utf8'));
const known = new Set(existing.map(a=>a.wikidataId));
console.log('Nouvelles identités candidates :', new Set(rows.filter(r=>!known.has(r.wikidataId)).map(r=>r.wikidataId)).size);
