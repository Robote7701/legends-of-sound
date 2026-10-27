import test from 'node:test';
import assert from 'node:assert/strict';
import { wikidataDate, extractEvidence } from '../scripts/lib/evidence.js';
import { normalizeGenre } from '../scripts/lib/genres.js';
test('normalisation musicale : genres spécifiques avant les termes génériques',()=>{
 assert.deepEqual(normalizeGenre('rhythm and blues'),['rnb']);
 assert.deepEqual(normalizeGenre('synth-pop'),['pop','electronic']);
 assert.deepEqual(normalizeGenre('French hip-hop'),['rap','hip-hop']);
 assert.deepEqual(normalizeGenre('J-pop'),['j-pop','pop']);
 assert.deepEqual(normalizeGenre('country music'),['world']);
 assert.deepEqual(normalizeGenre('genre inconnu'),[]);
});
test('dates Wikidata : respecter la précision, sans inventer de jour ou convertir un siècle',()=>{
 assert.equal(wikidataDate({time:'+1982-00-00T00:00:00Z',precision:9}),'1982');
 assert.equal(wikidataDate({time:'+1982-03-00T00:00:00Z',precision:10}),'1982-03');
 assert.equal(wikidataDate({time:'+1982-03-05T00:00:00Z',precision:11}),'1982-03-05');
 assert.equal(wikidataDate({time:'+1900-00-00T00:00:00Z',precision:7}),null);
 assert.equal(wikidataDate(null),null);
});
test('preuves de carrière : libellés sourcés, références conservées et données absentes non inventées',()=>{
 const statement=(id,rank='normal')=>({id:'Q1$statement',rank,mainsnak:{snaktype:'value',datavalue:{value:{id}}},references:[{hash:'source',snaks:{P854:[{datavalue:{value:'https://example.test/source'}}]}}]});
 const entity={id:'Q1',lastrevid:123,claims:{P166:[statement('Q2'),statement('Q3','deprecated'),statement('Q4')],P800:[statement('Q5')]}};
 const proof=extractEvidence(entity,new Map([['Q2','Prix documenté'],['Q3','Prix retiré'],['Q5','Œuvre documentée']]),'2026-10-27');
 assert.equal(proof.awards.length,1);assert.equal(proof.awards[0].name,'Prix documenté');
 assert.equal(proof.awards[0].references[0].hash,'source');
 assert.equal(proof.notableWorks[0].name,'Œuvre documentée');
 assert.equal(proof.careerStart,null);assert.equal(proof.source.revision,123);
 assert.deepEqual(extractEvidence({id:'Q1'},new Map(),'2026-10-27').awards,[]);
});
