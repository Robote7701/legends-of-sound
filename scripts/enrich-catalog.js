import { readFile, readdir, mkdir } from 'node:fs/promises';
import { ApiClient, writeJSON } from './lib/api-client.js';
import { evidenceIds, extractEvidence } from './lib/evidence.js';
import { normalizedGenres } from './lib/genres.js';
import { validateCatalog, boosterAvailability } from '../src/catalog/catalog.js';
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const artists=await read('data/artists.json');
const candidates=await read('data/candidates.json');
const alreadyExpanded=artists.length===1500;
const expansion=alreadyExpanded?{accepted:[],rejected:[]}:await read('.cache/expansion-progress.json');
if(!alreadyExpanded&&expansion.accepted.length!==1000)throw new Error('Extension incomplète : '+expansion.accepted.length+'/1000.');
const cards=[...artists,...expansion.accepted.map(r=>r.card)];
const registry=[...candidates,...expansion.accepted.map(r=>r.candidate)];
if(new Set(cards.map(a=>a.id)).size!==1500||new Set(cards.map(a=>a.mbid)).size!==1500||new Set(cards.map(a=>a.wikidataId)).size!==1500)throw new Error('Identités dupliquées.');
const api=new ApiClient('.cache/api');
const entities=new Map();
const labels=new Map();
const wanted=new Set(cards.map(a=>a.wikidataId));
await mkdir('.cache/api',{recursive:true});
for(const file of await readdir('.cache/api')){
 if(!file.endsWith('.json'))continue;
 const response=await read('.cache/api/'+file);
 for(const [id,entity]of Object.entries(response.data.entities||{})){const label=entity.labels?.fr?.value||entity.labels?.en?.value||entity.labels?.mul?.value;if(label)labels.set(id,label);}
 for(const entity of Object.values(response.data.entities||{}))if(wanted.has(entity.id)&&entity.claims&&(!entities.has(entity.id)||entities.get(entity.id).fetchedAt<response.fetchedAt))entities.set(entity.id,{entity,fetchedAt:response.fetchedAt});
}
const missing=cards.filter(a=>!entities.has(a.wikidataId));
for(let offset=0;offset<missing.length;offset+=40){
 const response=await api.get('https://www.wikidata.org/w/api.php?'+new URLSearchParams({action:'wbgetentities',ids:missing.slice(offset,offset+40).map(a=>a.wikidataId).join('|'),props:'labels|descriptions|claims',languages:'fr|en',format:'json'}));
 for(const entity of Object.values(response.data.entities||{}))if(entity.id)entities.set(entity.id,{entity,fetchedAt:response.fetchedAt});
 console.log('Notices complémentaires',Math.min(offset+40,missing.length),'/',missing.length);
}
const ids=[...new Set([...entities.values()].flatMap(({entity})=>evidenceIds(entity)))].filter(id=>!labels.has(id));
for(let offset=0;offset<ids.length;offset+=40){
 const response=await api.get('https://www.wikidata.org/w/api.php?'+new URLSearchParams({action:'wbgetentities',ids:ids.slice(offset,offset+40).join('|'),props:'labels',languages:'fr|en|mul',format:'json'}));
 for(const [id,entity]of Object.entries(response.data.entities||{})){const label=entity.labels?.fr?.value||entity.labels?.en?.value||entity.labels?.mul?.value;if(label)labels.set(id,label);}
 console.log('Libellés sourcés',Math.min(offset+40,ids.length),'/',ids.length);
}
const evidenceShards=new Map();
for(const [index,card]of cards.entries()){
 const entry=entities.get(card.wikidataId);
 if(!entry)throw new Error('Notice absente : '+card.id);
 const evidence=extractEvidence(entry.entity,labels,entry.fetchedAt);
 const shard='origins-01-'+String(Math.floor(index/50)+1).padStart(3,'0')+'.json';
 if(!evidenceShards.has(shard))evidenceShards.set(shard,{});
 evidenceShards.get(shard)[card.id]=evidence;
 card.careerEvidence={source:evidence.source,shard};
 card.careerStart=evidence.careerStart?.value||null;
 card.awards=evidence.awards.length?evidence.awards.map(a=>a.name):null;
 card.notableWorks=evidence.notableWorks.length?evidence.notableWorks.map(a=>a.name):null;
 card.sources.careerEvidence=evidence.source;
 for(const [field,property]of Object.entries({awards:'P166',notableWorks:'P800',careerStart:'P2031'}))card.sources[field]={...evidence.source,property};
 if(card.rarityReview?.status==='pending'){
  const candidate=registry.find(c=>c.id===card.id);
  // Préférer le nom musical officiel en alphabet latin ; garder les formes
  // éditoriales lisibles pour les noms officiels dans d'autres écritures.
  if(/^[\p{Script=Latin}\p{N}\p{P}\p{Zs}\p{S}]+$/u.test(card.name))card.displayName=candidate.name=card.name;
  const normalized=normalizedGenres(evidence);
  if(normalized.length&&candidate?.genreSelection?.discoveryScene!=='rap-priority'){
   card.genres=normalized;
   candidate.genres=normalized;
   candidate.genreSelection={...candidate.genreSelection,mapping:'scripts/lib/genres.js'};
   card.provenance.classification.genres={kind:'editorial-normalization-of-wikidata-genres',source:card.careerEvidence.source.url,property:'P136',mapping:'scripts/lib/genres.js'};
  }
 }
}
const editions=(await read('data/editions.json')).map(e=>e.id==='origins-01'?{...e,targetCardCount:1500,status:'ready',rarityReviewStatus:'pending'}:e);
validateCatalog(cards,editions,{requireComplete:true,retiredIdentifiers:await read('data/retired-identifiers.json')});
const boosters=await read('data/boosters.json');
const report={generatedAt:new Date().toISOString(),candidates:registry.length,verified:cards.length,pending:[],
 decisions:cards.map(card=>({id:card.id,name:card.displayName,mbid:card.mbid,wikidataId:card.wikidataId,verification:card.provenance.musicbrainz.verification})),
 types:Object.fromEntries(['solo','group'].map(t=>[t,cards.filter(a=>a.type===t).length])),
 rarities:Object.fromEntries(['legendary','epic','rare','common'].map(r=>[r,cards.filter(a=>a.rarity===r).length])),
 rarityReview:{status:'pending',provisionalNewCards:1000,existingRaritiesUnchanged:true},
 boosters:boosters.map(b=>({id:b.id,...boosterAvailability(cards,b)})),
 enrichment:{awards:cards.filter(a=>a.awards).length,careerStart:cards.filter(a=>a.careerStart).length,notableWorks:cards.filter(a=>a.notableWorks).length},
 expansion:alreadyExpanded?(await read('data/import-report.json')).expansion:{acceptedByScene:Object.fromEntries([...new Set(expansion.accepted.map(r=>r.scene))].map(s=>[s,expansion.accepted.filter(r=>r.scene===s).length])),rejected:expansion.rejected},
 missing:Object.fromEntries(['biography','notableAlbums','knownTracks','awards','careerStart','nationality'].map(field=>[field,cards.filter(a=>a[field]===null).map(a=>a.id)])),
};
for(const [name,value]of Object.entries({artists:cards,candidates:registry,editions,'import-report':report}))await writeJSON('.cache/expanded-'+name+'.json',value);
for(const [shard,value]of evidenceShards)await writeJSON('.cache/expanded-evidence/'+shard,value);
console.log(JSON.stringify({verified:cards.length,enrichment:report.enrichment,types:report.types,scenes:report.expansion.acceptedByScene}));
// Les fichiers de production ne sont écrits qu'après validation de l'ensemble.
if(process.argv.includes('--apply')){
 for(const [shard,value]of evidenceShards)await writeJSON('data/evidence/'+shard,value);
 for(const [name,value]of Object.entries({artists:cards,candidates:registry,editions,'import-report':report}))await writeJSON('data/'+name+'.json',value);
 console.log('Catalogue local étendu ; aucun déploiement ni publication distante.');
}
