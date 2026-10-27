import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { recharge, nextTicketIn, quoteOpening, openingPools, drawCard, openBoosters } from '../src/domain/boosters.js';
import { createSave, parseSave, serializeSave } from '../src/state/schema.js';
import { SaveStore } from '../src/state/storage.js';
import { GAME } from '../src/domain/config.js';
import { matchesBooster } from '../src/catalog/catalog.js';
const read = async name => JSON.parse(await readFile(new URL('../data/'+name+'.json',import.meta.url)));
const artists=await read('artists'),boosters=await read('boosters'),all=boosters[0];
const state=(tickets=10,credits=500)=>({...createSave(1000),tickets,credits});
const options={now:1000,rng:()=>0,id:'test-batch'};
test('recharge fermée, fractions conservées et plafond sans tickets en réserve',()=>{
 const initial=state(2);
 const refreshed=recharge(initial,1000+GAME.rechargeMs*2+90000);
 assert.equal(refreshed.tickets,4);assert.equal(nextTicketIn(refreshed,1000+GAME.rechargeMs*2+90000),210000);
 const full=recharge(initial,1000+GAME.rechargeMs*20);assert.equal(full.tickets,10);assert.equal(nextTicketIn(full),0);
 const spent=openBoosters(full,artists,all,1,{...options,now:full.ticketUpdatedAt});
 assert.equal(recharge(spent,full.ticketUpdatedAt+GAME.rechargeMs-1).tickets,9);
 assert.equal(recharge(spent,full.ticketUpdatedAt+GAME.rechargeMs).tickets,10);
 assert.equal(initial.tickets,2);
});
test('horloge reculée : aucun crédit de recharge ni déplacement du point de recharge',()=>{
 const initial=state(0);assert.equal(recharge(initial,0).ticketUpdatedAt,1000);assert.equal(recharge(initial,0).tickets,0);
});
test('devis tickets, SC et paiement mixte : priorité aux tickets',()=>{
 assert.deepEqual(quoteOpening(state(2),5,1000),{count:5,tickets:2,credits:300,balance:200,affordable:true});
 assert.equal(quoteOpening(state(),10,1000).credits,0);
 assert.equal(quoteOpening(state(0),5,1000).balance,0);
 assert.equal(quoteOpening(state(0),10,1000).affordable,false);
 for(const count of [0,2,4,11,1.5])assert.throws(()=>quoteOpening(state(),count));
});
test('confirmation exacte obligatoire pour toute dépense en SC, aucun solde négatif',()=>{
 assert.throws(()=>openBoosters(state(0),artists,all,1,options),/coût/);
 assert.throws(()=>openBoosters(state(0,99),artists,all,1,{...options,approvedCredits:100}),/insuffisants/);
 const next=openBoosters(state(2),artists,all,5,{...options,approvedCredits:300});
 assert.equal(next.tickets,0);assert.equal(next.credits,200);assert.equal(next.stats.creditsSpent,300);assert.equal(next.stats.boostersOpened,5);assert.equal(next.stats.cardsObtained,25);
});
test('tous les boosters respectent leurs filtres et les bornes de probabilité par carte',()=>{
 for(const booster of boosters){
  const pools=openingPools(artists,booster);
  for(const [roll,rarity]of [[0,'legendary'],[.039999,'legendary'],[.04,'epic'],[.19999,'epic'],[.2,'rare'],[.54999,'rare'],[.55,'common'],[.999999,'common']]){
   let i=0;const card=drawCard(pools,()=>i++%2===0?roll:.5);
   assert.equal(card.rarity,rarity);assert.ok(matchesBooster(card,booster));
  }
 }
 assert.throws(()=>openingPools(artists.filter(a=>a.rarity!=='legendary'),all),/rareté/);
});
test('fréquences exactes sur un balayage uniforme de 10 000 tirages',()=>{
 const pools=openingPools(artists,all),counts={legendary:0,epic:0,rare:0,common:0};
 for(let i=0;i<10000;i++){let j=0;const card=drawCard(pools,()=>j++===0?(i+.5)/10000:.5);counts[card.rarity]++;}
 assert.deepEqual(counts,{legendary:400,epic:1600,rare:3500,common:4500});
 for(const value of [-1,1,NaN,Infinity])assert.throws(()=>drawCard(pools,()=>value));
});
test('cinq identités distinctes par paquet, doublons entre paquets et sauvegarde compatible',()=>{
 for(const count of GAME.openingCounts){
  const initial=state(),next=openBoosters(initial,artists,all,count,options);
  assert.equal(next.lastOpening.cards.length,count*5);assert.equal(Object.keys(next.collection).length,5);
  assert.equal(next.lastOpening.cards.filter(c=>c.isNew).length,5);
  assert.equal(Object.values(next.collection)[0].count,count);assert.deepEqual(initial.collection,{});
  for(let i=0;i<count;i++)assert.equal(new Set(next.lastOpening.cards.slice(i*5,i*5+5).map(c=>c.id)).size,5);
  assert.deepEqual(parseSave(serializeSave(next)),next);
 }
});
test('tous les thèmes : exclusion sans boucle et révélation croissante, même après épuisement d’une rareté',()=>{
 const rank={common:0,rare:1,epic:2,legendary:3},index=new Map(artists.map(a=>[a.id,a]));
 for(const booster of boosters){
  const next=openBoosters(state(),artists,booster,10,options);
  for(let i=0;i<10;i++){
   const cards=next.lastOpening.cards.slice(i*5,i*5+5).map(c=>index.get(c.id));
   assert.equal(new Set(cards.map(c=>c.id)).size,5);assert.ok(cards.every(c=>matchesBooster(c,booster)));
   assert.deepEqual(cards.map(c=>rank[c.rarity]),cards.map(c=>rank[c.rarity]).sort((a,b)=>a-b));
  }
 }
 const electronic=boosters.find(b=>b.id==='electronic');
 const cards=openBoosters(state(),artists,electronic,1,options).lastOpening.cards.map(c=>index.get(c.id));
 assert.equal(cards.filter(c=>c.rarity==='legendary').length,4);assert.equal(cards[0].rarity,'epic');
});
test('cartes persistées avant la révélation et échec de stockage sans paiement ni gain partiel',()=>{
 const data=new Map();let fail=false;
 const storage={getItem:k=>data.get(k)??null,setItem(k,v){if(fail)throw Error('Quota');data.set(k,v);}};
 const store=new SaveStore(storage);store.load(1000);store.commit(store.state,1000);
 const before=store.export(),next=openBoosters(store.state,artists,all,3,options);
 fail=true;assert.throws(()=>store.commit(next,1000),/Quota/);assert.equal(store.export(),before);
 fail=false;store.commit(next,1000);
 const restored=new SaveStore(storage).load(1000);
 assert.equal(restored.lastOpening.cards.length,15);assert.equal(restored.stats.cardsObtained,15);assert.equal(restored.tickets,7);
 assert.throws(()=>parseSave(JSON.stringify({...restored,lastOpening:{...restored.lastOpening,cards:[]}})));
});
