import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateCatalog, boosterAvailability, matchesBooster } from '../src/catalog/catalog.js';
const load = async name => JSON.parse(await readFile(new URL('../data/' + name + '.json', import.meta.url)));
const artists = await load('artists'), editions = await load('editions'), boosters = await load('boosters'), candidates = await load('candidates');

const target = editions.reduce((sum,e)=>sum+e.targetCardCount,0);
test('ORIGINS contient le nombre prévu d’identités permanentes vérifiées',()=>{
  assert.equal(artists.length,target); assert.equal(candidates.length,target);
  assert.equal(new Set(artists.map(a=>a.id)).size,target);
  assert.equal(new Set(artists.map(a=>a.mbid)).size,target);
  assert.equal(new Set(artists.map(a=>a.wikidataId)).size,target);
  validateCatalog(artists,editions,{requireComplete:true});
  for(const a of artists) { assert.ok(candidates.some(c=>c.id===a.id && c.name===a.displayName)); assert.ok(a.sources.identity.url.endsWith(a.mbid)); assert.equal(a.provenance.musicbrainz.verification.reciprocal,true); }
});
test('chaque booster contient les quatre raretés et respecte ses filtres',()=>{
  for(const b of boosters) { const availability=boosterAvailability(artists,b); assert.ok(availability.available,b.id); assert.deepEqual(availability.missingRarities,[]); assert.ok(availability.count>0); }
  const groups=boosters.find(b=>b.id==='groups'),solos=boosters.find(b=>b.id==='solo');
  assert.equal(artists.filter(a=>matchesBooster(a,groups)).length+artists.filter(a=>matchesBooster(a,solos)).length,target);
});
test('les références demandées sont présentes sans cartes alternatives en doublon',()=>{
  for(const name of ['Queen','Michael Jackson','Daft Punk','Rammstein','Linkin Park','Metallica','AC/DC','Nirvana','David Bowie','Prince','Eminem','Kendrick Lamar','Hatsune Miku','Reol','PinocchioP','Ado','YOASOBI','Atarashii Gakko!','bbno$','Jean-Jacques Goldman']) assert.equal(artists.filter(a=>a.displayName===name).length,1,name);
  const miku=artists.find(a=>a.displayName==='Hatsune Miku'); assert.equal(miku.entityType,'Character'); assert.equal(miku.birthDate,null);
});
test('le validateur refuse doublon de MBID, preuve absente et portrait externe',()=>{
  const first=artists[0];
  assert.throws(()=>validateCatalog([first,{...first,id:'los-another'}],editions));
  assert.throws(()=>validateCatalog([{...first,provenance:{musicbrainz:{url:first.provenance.musicbrainz.url,verifiedAt:'2026-10-27'}}}],editions));
  assert.throws(()=>validateCatalog([{...first,portrait:{imageUrl:'https://example.test/unreviewed.jpg'}}],editions));
});
test('les futures éditions peuvent réutiliser un artiste avec un nouvel ID',()=>{
  const first=artists[0];
  const future={...first,id:'los-future-000001',editionId:'future-02'};
  const configs=[{...editions[0],status:'preparation'},{id:'future-02',targetCardCount:1,status:'ready'}];
  assert.doesNotThrow(()=>validateCatalog([first,future],configs));
});

const initialIdentities = JSON.parse(await readFile(new URL('./fixtures/origins-initial-identities.json', import.meta.url)));
test('les 500 identités initiales gardent leur ID et leur MBID après extension',()=>{
  for(const initial of initialIdentities) assert.equal(artists.find(a=>a.id===initial.id)?.mbid,initial.mbid,initial.id);
});

test('les 50 ajouts sont vérifiés et préservent les 1501 identités précédentes',async()=>{
  const baseline = JSON.parse(await readFile(new URL('./fixtures/origins-before-expansion-50.json', import.meta.url)));
  const additions = await load('artist-additions/expansion-50-verified');
  assert.equal(additions.length,50);
  for(const previous of baseline) assert.equal(artists.find(a=>a.id===previous.id)?.mbid,previous.mbid,previous.id);
  const previousIds = new Set(baseline.map(a=>a.id));
  for(const addition of additions) {
    assert.ok(!previousIds.has(addition.id));
    const card = artists.find(a=>a.id===addition.id);
    assert.equal(card?.mbid,addition.mbid);
    assert.equal(card?.wikidataId,addition.wikidataId);
    assert.equal(card.provenance.musicbrainz.verification.verified,true);
    assert.equal(card.rarityReview.status,'pending');
  }
  assert.ok(additions.filter(a=>artists.find(c=>c.id===a.id).genres.includes('rap')).length>=15);
});

test('les 100 nouveaux artistes sont sourcés, distincts et compatibles avec la collection précédente',async()=>{
  const additions = await load('artist-additions/expansion-100-verified');
  const previous = await load('artist-additions/expansion-50-verified');
  const baseline = JSON.parse(await readFile(new URL('./fixtures/origins-before-expansion-50.json', import.meta.url)));
  assert.equal(additions.length,100);
  const previousIds = new Set([...baseline,...previous].map(a=>a.id));
  const added = additions.map(entry=>{
    const card=artists.find(a=>a.id===entry.id);
    assert.ok(card && !previousIds.has(entry.id));
    assert.equal(card.mbid,entry.mbid);
    assert.equal(card.wikidataId,entry.wikidataId);
    assert.equal(card.provenance.musicbrainz.verification.reciprocal,true);
    assert.ok(entry.sources.includes(card.provenance.musicbrainz.url));
    assert.ok(entry.sources.includes(card.provenance.wikidata.url));
    return card;
  });
  assert.equal(new Set(added.map(a=>a.mbid)).size,100);
  assert.ok(added.filter(a=>a.genres.includes('rap')).length>=15);
  assert.ok(new Set(added.flatMap(a=>a.genres)).size>=8);
  for(const a of previous) assert.equal(artists.find(c=>c.id===a.id)?.mbid,a.mbid);
});
