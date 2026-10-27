import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {rarityProposal} from '../src/domain/rarity-review.js';
const read=async name=>JSON.parse(await readFile(new URL('../data/'+name+'.json',import.meta.url),'utf8'));
test('revue des 1500 fiches : sources conservées, preuves non inventées et décisions motivées',async()=>{
 const artists=await read('artists'),report=await read('rarity-review'),decisions=await read('rarity-decisions');
 assert.equal(report.entries.length,artists.length);assert.equal(new Set(report.entries.map(e=>e.id)).size,artists.length);
 for(const artist of artists){const proposal=rarityProposal(artist),entry=report.entries.find(e=>e.id===artist.id);assert.deepEqual(entry,proposal);assert.ok(proposal.evidence.every(award=>artist.awards.includes(award)));assert.equal(proposal.sources[1],artist.provenance.wikidata.url);}
 for(const decision of decisions.entries){const artist=artists.find(a=>a.id===decision.id);assert.equal(artist.rarity,decision.decision);assert.equal(artist.rarityReview.reason,decision.note);assert.equal(artist.rarityReview.status,'reviewed');}
});
test('absence de distinction et pays ne classent pas automatiquement un artiste',()=>{
 const artist={id:'los-test',name:'Test',rarity:'common',country:'FR',awards:null,provenance:{musicbrainz:{url:'mb'},wikidata:{url:'wd'}}};
 assert.equal(rarityProposal(artist).proposed,null);assert.equal(rarityProposal({...artist,country:'US'}).proposed,null);
 assert.equal(rarityProposal({...artist,awards:['Oscar du meilleur acteur']}).proposed,null);
});
