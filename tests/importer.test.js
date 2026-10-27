import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { ApiClient } from '../scripts/lib/api-client.js';
import { claimValues, verifyIdentity, makeCard } from '../scripts/lib/identity.js';
import { ageAt, filterArtists } from '../src/catalog/details.js';
const mbid = '0383dadf-2a4e-4d10-a46a-e9e041da8eb3';
const candidate = { id:'los-000001',name:'Queen',type:'group',genres:['rock'],rarity:'legendary' };
const entity = { id:'Q15862', labels:{en:{value:'Queen'}}, descriptions:{fr:{value:'groupe de rock britannique'}}, claims:{P434:[{rank:'normal',mainsnak:{snaktype:'value',datavalue:{value:mbid}}}]} };
const artist = { id:mbid,name:'Queen',type:'Group',aliases:[],country:'GB','life-span':{begin:'1970-06-27'},relations:[{type:'wikidata',url:{resource:'https://www.wikidata.org/wiki/Q15862'}}] };

test('vérification : MBID, nom, type et lien réciproque obligatoires',()=>{
  assert.equal(verifyIdentity(candidate,entity,artist).verified,true);
  assert.equal(verifyIdentity({...candidate,name:'Autre homonyme'},entity,artist).verified,false);
  assert.equal(verifyIdentity(candidate,entity,{...artist,type:'Person'}).verified,false);
  assert.equal(verifyIdentity(candidate,entity,{...artist,relations:[]}).verified,false);
  assert.equal(verifyIdentity(candidate,{...entity,id:'Q123'},artist).verified,false);
});
test('respect du rang préféré et exclusion des identifiants dépréciés',()=>{
  const statement=(value,rank)=>({rank,mainsnak:{snaktype:'value',datavalue:{value}}});
  assert.deepEqual(claimValues({claims:{P434:[statement('ancien','deprecated'),statement('alias','normal'),statement('principal','preferred')]}},'P434'),['principal']);
});
test('pas de MBID inventé : une exception exige source documentée et retour Wikidata',()=>{
  const without={...entity,claims:{}};
  assert.equal(verifyIdentity(candidate,without,artist).verified,false);
  const reviewed={...candidate,mbid,identityReview:{source:'https://musicbrainz.org/artist/'+mbid,reason:'Contrôle explicite de la fiche principale'}};
  assert.equal(verifyIdentity(reviewed,without,artist).verified,true);
  assert.equal(verifyIdentity(reviewed,without,{...artist,relations:[]}).verified,false);
});
test('champs inconnus à null, dates de groupe distinctes d’une naissance',()=>{
  const card=makeCard(candidate,entity,{data:artist,url:'https://musicbrainz.org/ws/2/artist/'+mbid,fetchedAt:'2026-10-27T12:00:00Z'},verifyIdentity(candidate,entity,artist));
  assert.equal(card.birthDate,null); assert.equal(card.formationDate,'1970-06-27');
  for(const field of ['portrait','nationality','biography','notableAlbums','knownTracks','awards','careerStart']) assert.equal(card[field],null);
  assert.equal(card.knownFor,'groupe de rock britannique'); assert.equal(card.sources.knownFor.license,'CC0-1.0');
});
test('personnage Vocaloid : aucune naissance humaine dérivée',()=>{
  const card=makeCard({...candidate,type:'solo'},entity,{data:{...artist,type:'Character'},fetchedAt:'2026-10-27T12:00:00Z'},{});
  assert.equal(card.birthDate,null); assert.equal(card.formationDate,null);
});
test('âge calculé avec anniversaire, décès et dates incomplètes',()=>{
  assert.equal(ageAt('1980-10-28',null,new Date('2026-10-27')),45);
  assert.equal(ageAt('1980-10-27',null,new Date('2026-10-27')),46);
  assert.equal(ageAt('1980-01-01','2020-01-01'),40);
  assert.equal(ageAt('1980'),null); assert.equal(ageAt('1980-02-31'),null);
  assert.equal(ageAt('2000-01-01','1990-01-01'),null);
});
test('recherche accentuée, alias et intersection des filtres',()=>{
  const cards=[{...candidate,name:'Beyoncé',displayName:'Beyoncé',aliases:['Beyonce Knowles'],editionId:'origins-01',type:'solo',genres:['pop']},{...candidate,name:'Queen',displayName:'Queen',aliases:[],editionId:'origins-01'}];
  assert.equal(filterArtists(cards,{search:'beyonce'},[]).length,1);
  assert.equal(filterArtists(cards,{search:'knowles'},[]).length,1);
  assert.equal(filterArtists(cards,{type:'group',genre:'pop'},[]).length,0);
});
test('cache et reprise : la deuxième lecture ne refait aucun appel réseau',async t=>{
  const dir=await mkdtemp(path.join(os.tmpdir(),'los-api-')); t.after(()=>rm(dir,{recursive:true,force:true}));
  let calls=0; const fetchImpl=async()=>{calls++;return new Response(JSON.stringify({ok:true}));};
  const first=new ApiClient(dir,{fetchImpl,wait:async()=>{},interval:0});
  const result=await first.get('https://example.test/api');
  const second=new ApiClient(dir,{fetchImpl:()=>{throw new Error('Réseau interdit');}});
  assert.deepEqual(await second.get('https://example.test/api'),result); assert.equal(calls,1);
});
test('retry 503 et Retry-After, erreur permanente non mise en cache',async t=>{
  const dir=await mkdtemp(path.join(os.tmpdir(),'los-api-')); t.after(()=>rm(dir,{recursive:true,force:true}));
  const waits=[]; let calls=0;
  const client=new ApiClient(dir,{interval:0,wait:async ms=>waits.push(ms),fetchImpl:async()=>++calls===1?new Response('',{status:503,headers:{'Retry-After':'3'}}):new Response('{"ok":true}')});
  assert.equal((await client.get('https://example.test/retry')).data.ok,true); assert.ok(waits.includes(3000));
  const failure=new ApiClient(dir,{interval:0,wait:async()=>{},fetchImpl:async()=>new Response('',{status:404})});
  await assert.rejects(()=>failure.get('https://example.test/missing'),/HTTP 404/);
});
test('départs concurrents sérialisés : chaque requête réserve son propre créneau',async t=>{
  const dir=await mkdtemp(path.join(os.tmpdir(),'los-api-')); t.after(()=>rm(dir,{recursive:true,force:true}));
  const waits=[];
  const client=new ApiClient(dir,{interval:1150,wait:async ms=>waits.push(ms),fetchImpl:async()=>new Response('{}')});
  await Promise.all(['one','two','three'].map(n=>client.get('https://example.test/'+n)));
  assert.equal(waits.length,3); assert.ok(waits[1]>1000); assert.ok(waits[2]>1000);
});
