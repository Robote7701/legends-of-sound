import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateCatalog } from '../src/catalog/catalog.js';
const load = async file => JSON.parse(await readFile(new URL('../data/' + file, import.meta.url)));
const artists = await load('artists.json'), editions = await load('editions.json'), retired = await load('retired-identifiers.json');
test('les identifiants retirés ne sont jamais réattribués',()=>{
  for(const row of retired)assert.ok(!artists.some(a=>a.id===row.id));
  assert.throws(()=>validateCatalog([{...artists[0],id:retired[0].id}],editions.map(e=>({...e,status:'preparation'})),{retiredIdentifiers:retired}),/retiré/);
});
test('chaque fiche enrichie conserve ses preuves et ses références dans un lot local cohérent',async()=>{
  const shards = new Map();
  if(artists.length===1500)assert.ok(artists.every(a=>a.careerEvidence?.shard));
  for(const artist of artists){
    if(!artist.careerEvidence)continue;
    const name=artist.careerEvidence.shard;
    assert.match(name,/^origins-01-\d{3}\.json$/);
    if(!shards.has(name))shards.set(name,await load('evidence/'+name));
    const proof=shards.get(name)[artist.id];
    assert.equal(proof.source.url,artist.careerEvidence.source.url);
    assert.ok(proof.source.accessedAt);
    assert.deepEqual(proof.awards.length?proof.awards.map(a=>a.name):null,artist.awards);
    assert.deepEqual(proof.notableWorks.length?proof.notableWorks.map(a=>a.name):null,artist.notableWorks);
    assert.equal(proof.careerStart?.value||null,artist.careerStart);
    for(const row of [...proof.awards,...proof.notableWorks,...proof.genres])assert.ok(row.id&&row.name&&row.statementId&&Array.isArray(row.references));
  }
  if(artists.length===1500)assert.equal(shards.size,30);
});
