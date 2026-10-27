import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { GAME, RARITIES } from '../src/domain/config.js';
import { createSave, validateSave, parseSave, serializeSave } from '../src/state/schema.js';
import { SaveStore } from '../src/state/storage.js';
import { validateCatalog, validateBoosters, matchesBooster, boosterAvailability } from '../src/catalog/catalog.js';
const json = async name => JSON.parse(await readFile(new URL('../data/' + name + '.json', import.meta.url)));
const editions = await json('editions'), boosters = await json('boosters'), artists = await json('artists');
function memory() { const data = new Map(); return { data, getItem: k => data.get(k) ?? null, setItem(k, v) { data.set(k, v); } }; }
function setup() { const storage = memory(), store = new SaveStore(storage); store.load(100); store.commit(store.state,100); return { storage, store }; }
test('configuration : 9 boosters uniques, 500 cartes cibles, probabilités totalisant 100 %', () => {
  assert.equal(boosters.length, 9); assert.equal(editions[0].targetCardCount, 500);
  validateBoosters(boosters, editions); validateCatalog(artists, editions);
  assert.equal(Object.values(RARITIES).reduce((n,r)=>n+r.probability,0),1);
  assert.equal(GAME.maxTickets,10); assert.equal(GAME.rechargeMs,300000);
});
test('catalogue vide déclaré en préparation, validation complète refusée', () => {
  assert.equal(artists.length,0); assert.throws(()=>validateCatalog(artists,editions,{requireComplete:true}));
  for(const b of boosters) { assert.equal(boosterAvailability(artists,b).available,false); assert.equal(boosterAvailability(artists,b).missingRarities.length,4); }
});
test('genres de scène explicites : ASIA WAVE ne filtre pas par nationalité', () => {
  const wave = boosters.find(b=>b.id==='asia-wave');
  assert.equal(matchesBooster({editionId:'origins-01',country:'JP',genres:['jazz']},wave),false);
  assert.equal(matchesBooster({editionId:'origins-01',country:'US',genres:['j-pop']},wave),true);
  assert.equal(matchesBooster({editionId:'future',genres:['j-pop']},wave),false);
  assert.equal(matchesBooster({editionId:'origins-01',type:'solo',genres:['rock']},boosters.find(b=>b.id==='groups')),false);
});
test('refuse les erreurs de filtres plutôt que de les ignorer',()=>{
  assert.throws(()=>validateBoosters([{...boosters[0],filter:{country:['JP']}}],editions));
  assert.throws(()=>validateBoosters([...boosters,boosters[0]],editions));
});
test('refuse identifiants et MBID mal formés',()=>{
  assert.throws(()=>validateCatalog([{id:'bad'}],editions));
  assert.throws(()=>validateCatalog([{id:'los-1',mbid:'not-a-uuid'}],editions));
});
test('nouvelle sauvegarde : bonus unique, dix tickets, collection vide',()=>{
  const s=createSave(100); assert.equal(s.credits,500); assert.equal(s.tickets,10); assert.deepEqual(s.collection,{}); assert.equal(s.ticketUpdatedAt,100);
  const {store}=setup(); assert.equal(store.load().credits,500); assert.equal(store.load().createdAt,100);
});
test('aller-retour JSON conserve collection, favoris, verrous et statistiques',()=>{
  const s=createSave(100); s.collection['los-000001']={count:2,firstObtainedAt:100,lastObtainedAt:200}; s.favorites=['los-000001']; s.locked=['los-000001']; s.stats.cardsObtained=2;
  assert.deepEqual(parseSave(serializeSave(s)),s);
});
test('refuse JSON cassé, versions futures et valeurs invalides',()=>{
  assert.throws(()=>parseSave('{')); assert.throws(()=>parseSave('null'));
  for(const patch of [{version:2},{credits:-1},{tickets:11},{credits:1.5},{ticketUpdatedAt:Infinity},{collection:[]},{favorites:['los-inexistant']},{stats:{}}]) assert.throws(()=>validateSave({...createSave(100),...patch}));
  assert.throws(()=>validateSave({...createSave(100),collection:{'__bad__':{count:1}}}));
});
test('chargement corrompu ou futur : aucun écrasement',()=>{
  for(const raw of ['{bad',JSON.stringify({...createSave(100),version:9})]) {
    const storage=memory(); storage.setItem(GAME.storageKey,raw); const store=new SaveStore(storage);
    assert.throws(()=>store.load()); assert.equal(storage.getItem(GAME.storageKey),raw); assert.throws(()=>store.commit(createSave(100)));
  }
});
test('panne de lecture : aucune initialisation silencieuse',()=>{
  const store=new SaveStore({getItem(){throw new Error('denied');}}); assert.throws(()=>store.load(),/denied/); assert.equal(store.state,null);
});
test('panne écriture : état mémoire et sauvegarde précédente inchangés',()=>{
  const {store,storage}=setup(), before=store.export(), disk=storage.getItem(GAME.storageKey);
  storage.setItem=()=>{throw new Error('quota');}; assert.throws(()=>store.commit({...store.state,credits:999}),/quota/);
  assert.equal(store.export(),before); assert.equal(storage.getItem(GAME.storageKey),disk);
});
test('conflit entre onglets : le second ne remplace pas le premier',()=>{
  const {storage,store}=setup(), other=new SaveStore(storage); other.load();
  store.commit({...store.state,credits:400}); assert.throws(()=>other.commit({...other.state,credits:300}),/autre onglet/);
  assert.equal(other.load().credits,400);
});
test('import valide : sauvegarde précédente conservée et état durable',()=>{
  const {store,storage}=setup(), before=store.export(), incoming=createSave(200); incoming.credits=42;
  store.import(serializeSave(incoming)); assert.equal(storage.getItem(GAME.storageKey+'-before-import'),before);
  assert.equal(new SaveStore(storage).load().credits,42);
});
test('import invalide et quota de copie : aucune perte de collection',()=>{
  const {store,storage}=setup(), before=store.export(); assert.throws(()=>store.import('{}')); assert.equal(store.export(),before);
  storage.setItem=()=>{throw new Error('quota');}; assert.throws(()=>store.import(serializeSave(createSave(200)))); assert.equal(store.export(),before);
});
test('état retourné isolé et révision persistée après interruption',()=>{
  const {store,storage}=setup(); const copy=store.load(); copy.credits=0; assert.equal(store.state.credits,500);
  const next=structuredClone(store.state); next.collection['los-000001']={count:1,firstObtainedAt:100,lastObtainedAt:100}; store.commit(next);
  const reloaded=new SaveStore(storage).load(); assert.equal(reloaded.collection['los-000001'].count,1); assert.equal(reloaded.revision,2);
});
test('chemins statiques relatifs et modules existants', async()=>{
  const html=await readFile(new URL('../index.html',import.meta.url),'utf8'); assert.ok(html.includes('src="./src/main.js"')); assert.ok(html.includes('href="./assets/css/main.css"'));
  const service=await readFile(new URL('../src/services/data.js',import.meta.url),'utf8'); assert.match(service,/import.meta.url/);
});
