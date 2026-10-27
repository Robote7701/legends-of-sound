import test from 'node:test';
import assert from 'node:assert/strict';
import {collectionStatistics,debugGrant} from '../src/domain/statistics.js';
import {createSave,validateSave} from '../src/state/schema.js';
const artists=[{id:'los-a',type:'solo',rarity:'rare',editionId:'origins-01',genres:['rap','pop']},{id:'los-b',type:'group',rarity:'epic',editionId:'origins-01',genres:['rock']}];
test('statistiques : artistes distincts, exemplaires, doublons et univers multigenres',()=>{
 const save=createSave(1000);save.collection={'los-a':{count:3,firstObtainedAt:1000,lastObtainedAt:1000}};
 const stats=collectionStatistics(save,{artists,boosters:[{id:'rap',name:'RAP',editionId:'origins-01',filter:{genresAny:['rap']}},{id:'pop',name:'POP',editionId:'origins-01',filter:{genresAny:['pop']}}]});
 assert.equal(stats.owned,1);assert.equal(stats.copies,3);assert.equal(stats.duplicates,2);assert.equal(stats.missing,1);assert.equal(stats.types.solo.owned,1);assert.equal(stats.types.group.owned,0);assert.equal(stats.rarities.rare.copies,3);assert.ok(stats.boosters.every(b=>b.owned===1));
});
test('debug : crédits sûrs, tickets plafonnés, collection et statistiques inchangées',()=>{
 const save=createSave(1000);save.tickets=2;
 const credits=debugGrant(save,'credits',1000,1000);assert.equal(credits.credits,1500);assert.equal(save.credits,500);
 const full=debugGrant(credits,'tickets',10,1000);assert.equal(full.tickets,10);assert.deepEqual(full.collection,save.collection);assert.deepEqual(full.stats,save.stats);validateSave(full);
 for(const amount of [0,-1,1.5,1000001,NaN])assert.throws(()=>debugGrant(save,'credits',amount));
 assert.throws(()=>debugGrant(save,'wrong',1));assert.throws(()=>debugGrant({...save,credits:Number.MAX_SAFE_INTEGER},'credits',1));
});
