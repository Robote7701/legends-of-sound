import test from 'node:test';
import assert from 'node:assert/strict';
import {createSave,parseSave,serializeSave,validateSave} from '../src/state/schema.js';
import {toggleMark,duplicatePlan,recyclingQuote,recycleCards,claimGoal,GOALS} from '../src/domain/progression.js';
const artists=Array.from({length:20},(_,i)=>({id:'los-test-'+i,rarity:i===0?'legendary':'common',genres:['rap'],type:'solo'}));
function state(){const save=createSave(1000);save.tickets=5;for(const artist of artists)save.collection[artist.id]={count:3,firstObtainedAt:1000,lastObtainedAt:1000};return save;}
test('favoris, verrous et souhaits : persistance, exclusion et cartes inconnues',()=>{
 let save=state();save=toggleMark(save,artists,'favorites',artists[0].id);save=toggleMark(save,artists,'locked',artists[1].id);save=toggleMark(save,artists,'wishlist',artists[2].id);
 assert.deepEqual(parseSave(serializeSave(save)),save);assert.equal(Object.keys(duplicatePlan(save,artists)).length,18);
 assert.throws(()=>toggleMark(save,artists,'favorites','los-nope'));
 delete save.collection[artists[3].id];assert.throws(()=>toggleMark(save,artists,'locked',artists[3].id));
 assert.equal(toggleMark(save,artists,'wishlist',artists[3].id).wishlist.length,2);
 assert.equal(toggleMark(save,artists,'favorites',artists[0].id).favorites.length,0);
});
test('recyclage automatique : un exemplaire conservé, protégées intactes, crédits et statistiques atomiques',()=>{
 const save=state();save.favorites=[artists[0].id];save.locked=[artists[1].id];
 const plan=duplicatePlan(save,artists),next=recycleCards(save,artists,plan);
 assert.equal(next.credits,860);assert.equal(next.stats.cardsRecycled,36);assert.equal(next.collection[artists[0].id].count,3);assert.equal(next.collection[artists[1].id].count,3);
 assert.ok(artists.slice(2).every(a=>next.collection[a.id].count===1));assert.equal(save.credits,500);assert.equal(save.collection[artists[2].id].count,3);validateSave(next);
});
test('recyclage individuel : dernier exemplaire, quantités strictes et protection favoris/verrous',()=>{
 const save=state(),id=artists[0].id;
 assert.deepEqual(recyclingQuote(save,artists,{[id]:2}),{count:2,credits:300});
 const next=recycleCards(save,artists,{[id]:3});assert.equal(next.collection[id],undefined);assert.equal(next.credits,950);
 for(const quantity of [0,-1,4,1.5,'1',NaN])assert.throws(()=>recycleCards(save,artists,{[id]:quantity}));
 assert.throws(()=>recycleCards(save,artists,{}));assert.throws(()=>recycleCards(next,artists,{[id]:1}));
 for(const kind of ['favorites','locked']){const protectedSave=structuredClone(save);protectedSave[kind]=[id];assert.throws(()=>recycleCards(protectedSave,artists,{[id]:1}));}
});
test('objectifs : crédits une seule fois, sans modifier les tickets même à réserve pleine',()=>{
 const save=state(),goal=GOALS.find(g=>g.id==='rap-20'),next=claimGoal(save,artists,goal.id,1000);
 assert.equal(next.tickets,5);assert.equal(next.credits,700);assert.deepEqual(next.claimedGoals,[goal.id]);assert.equal(save.tickets,5);
 assert.throws(()=>claimGoal(next,artists,goal.id,1000));assert.throws(()=>claimGoal(createSave(1000),artists,goal.id,1000));
 const full=state();full.tickets=10;assert.equal(claimGoal(full,artists,goal.id).credits,700);assert.deepEqual(full.claimedGoals,[]);
 assert.deepEqual(parseSave(serializeSave(next)),next);
});
test('50 objectifs uniques, récompenses en SC, paliers statistiques et exclusion par rareté au recyclage',()=>{
 assert.equal(GOALS.length,50);assert.equal(new Set(GOALS.map(g=>g.id)).size,50);assert.ok(GOALS.every(g=>Number.isSafeInteger(g.credits)&&g.credits>0&&!g.tickets));
 const save=state();save.favorites=[artists[0].id];
 assert.deepEqual(duplicatePlan(save,artists,'legendary'),{});
 const common=duplicatePlan(save,artists,'common');assert.equal(Object.keys(common).length,19);assert.equal(recyclingQuote(save,artists,common).credits,380);
 assert.throws(()=>duplicatePlan(save,artists,'fake'));
 save.stats.boostersOpened=5;assert.equal(claimGoal(save,artists,'boostersOpened-5').credits,600);
 save.stats.cardsRecycled=10;assert.equal(claimGoal(save,artists,'cardsRecycled-10').credits,600);
 save.credits=Number.MAX_SAFE_INTEGER;assert.throws(()=>claimGoal(save,artists,'discover-10'),/Solde/);
});
test('compatibilité des anciennes sauvegardes et rejet des nouveaux champs malformés',()=>{
 const old=createSave(1000);delete old.wishlist;delete old.claimedGoals;assert.deepEqual(validateSave(old),old);
 for(const wishlist of [['los-ok','los-ok'],['wrong'],{},null])assert.throws(()=>validateSave({...old,wishlist}));
 for(const claimedGoals of [['same','same'],['bad id'],null])assert.throws(()=>validateSave({...old,claimedGoals}));
});
