import { readFile, readdir } from 'node:fs/promises';
import { ApiClient, writeJSON } from './lib/api-client.js';
import { claimValues, verifyIdentity, makeCard } from './lib/identity.js';
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const api=new ApiClient('.cache/api');
const original=await read('data/artists.json');
if(original.length!==500)throw new Error('Ce script étend le catalogue initial de 500 cartes une seule fois.');
const originalIds=new Set(original.map(a=>a.wikidataId));
const originalMbids=new Set(original.map(a=>a.mbid));
const discovery=await read('.cache/discovery.json');
const priorities=await read('data/expansion-priorities.json');
for(const priority of priorities)discovery.unshift({...priority,scene:'rap-priority',queryUrl:'https://www.wikidata.org/wiki/'+priority.wikidataId});
const entities=new Map();
const ids=[...new Set(discovery.map(r=>r.wikidataId))];
for(const file of await readdir('.cache/api')){
 if(!file.endsWith('.json'))continue;
 const response=await read('.cache/api/'+file);
 for(const entity of Object.values(response.data.entities||{}))if(entity.labels&&entity.claims?.P434&&(!entities.has(entity.id)||(entities.get(entity.id).lastrevid||0)<(entity.lastrevid||0)))entities.set(entity.id,entity);
}
const missingIds=ids.filter(id=>!entities.has(id));
for(let offset=0;offset<missingIds.length;offset+=40){
 const response=await api.get('https://www.wikidata.org/w/api.php?'+new URLSearchParams({action:'wbgetentities',ids:missingIds.slice(offset,offset+40).join('|'),props:'labels|descriptions|claims|sitelinks/urls',languages:'fr|en',format:'json'}));
 for(const entity of Object.values(response.data.entities||{}))if(entity.id)entities.set(entity.id,entity);
 console.log('Notices Wikidata complémentaires',Math.min(offset+40,missingIds.length),'/',missingIds.length);
}
// La sélection équilibre les familles et renforce explicitement le rap francophone.
const quotas={'rap-francophone':130,'hip-hop':120,'rap-fr':40,'rap-priority':20,rock:110,metal:75,electronic:65,pop:75,rnb:30,jazz:45,blues:20,reggae:25,punk:25,house:15,techno:15,funk:15,'j-pop':65,'k-pop':45,world:65};
const genresById={Q11401:'hip-hop',Q6010:'rap',Q11399:'rock',Q38848:'metal',Q9778:'electronic',Q37073:'pop',Q45981:'rnb',Q8341:'jazz',Q9759:'blues',Q9794:'reggae',Q3071:'punk',Q20502:'house',Q170611:'techno',Q164444:'funk',Q131578:'j-pop',Q213665:'k-pop',Q208239:'latin',Q9764:'world',Q25099840:'afrobeats',Q1062400:'chanson',Q512410:'qawwali',Q973150:'mandopop',Q202930:'reggaeton',Q388296:'afrobeat'};
let journal;
try{journal=await read('.cache/expansion-progress.json');}catch(e){if(e.code!=='ENOENT')throw e;journal={accepted:[],rejected:[],completedScenes:[]};}
const accepted=journal.accepted,rejected=journal.rejected;
const retired=await read('data/retired-identifiers.json');
let nextId=Math.max(500,journal.nextId?journal.nextId-1:500,...accepted.map(r=>Number(r.card.id.slice(4))),...retired.map(r=>Number(r.id.slice(4))))+1;
for(const entry of retired){
 const index=accepted.findIndex(r=>r.card.id===entry.id);
 if(index>=0){const [removed]=accepted.splice(index,1);rejected.push({id:entry.id,wikidataId:entry.wikidataId,scene:removed.scene,reason:entry.reason});}
}
const seen=new Set([...originalIds,...accepted.map(r=>r.card.wikidataId),...rejected.map(r=>r.wikidataId)]);
for(const entry of retired)seen.add(entry.wikidataId);
const usedMbids=new Set([...originalMbids,...accepted.map(r=>r.card.mbid)]);
let attempted=0;
let checkpoint=Promise.resolve();
function saveProgress(){const snapshot=structuredClone(journal);checkpoint=checkpoint.then(()=>writeJSON('.cache/expansion-progress.json',snapshot));return checkpoint;}
for(const [scene,baseQuota]of Object.entries(quotas)){
 const quota=scene==='world'?Math.max(baseQuota,1000-accepted.filter(r=>r.scene!=='world').length):baseQuota;
 let count=accepted.filter(r=>r.scene===scene).length;
 if(journal.completedScenes.includes(scene)&&count>=quota)continue;
 const rows=discovery.filter(r=>r.scene===scene);let cursor=0;
 async function worker(){while(cursor<rows.length&&accepted.length<1000&&count<quota){
  const row=rows[cursor++];
  if(seen.has(row.wikidataId))continue;
  seen.add(row.wikidataId);
  const entity=entities.get(row.wikidataId);
  try{
   if(scene==='rap-francophone'&&!claimValues(entity,'P27').some(v=>['Q142','Q31','Q16','Q39','Q1028','Q262','Q1041','Q971','Q974','Q1008','Q965'].includes(v.id)))continue;
   const mbids=row.mbid?[row.mbid]:[...new Set(claimValues(entity,'P434'))];
   if(mbids.length!==1)throw new Error('Identifiants MusicBrainz multiples ou absents : revue nécessaire');
   if(usedMbids.has(mbids[0]))throw new Error('Identité MusicBrainz déjà présente');
   const response=await api.get('https://musicbrainz.org/ws/2/artist/'+mbids[0]+'?inc=aliases+url-rels+artist-rels&fmt=json');
   const name=row.name||entity.labels?.fr?.value||entity.labels?.en?.value||entity.labels?.mul?.value||response.data.name;
   if(!name)throw new Error('Nom documenté absent');
   const type=['Group','Orchestra','Choir'].includes(response.data.type)?'group':['Person','Character'].includes(response.data.type)?'solo':null;
   if(!type)throw new Error('Type MusicBrainz non pris en charge : '+response.data.type);
   const documentedGenres=claimValues(entity,'P136').map(v=>genresById[v.id]).filter(Boolean);
   const genres=[...new Set([...(['rap-francophone','rap-fr','rap-priority'].includes(scene)?['rap','hip-hop']:scene==='world'?[]:[scene]),...documentedGenres])];
   if(!genres.length)throw new Error('Genre musical sans correspondance documentée');
   const candidate={id:'los-'+String(501+accepted.length).padStart(6,'0'),name,wikidataId:entity.id,wikipediaTitle:entity.sitelinks?.enwiki?.title||null,type,genres,rarity:'common',rarityReview:{status:'pending',reason:'Valeur provisoire avant la revue éditoriale du catalogue étendu.'},genreSelection:{source:'https://www.wikidata.org/wiki/'+entity.id,properties:['P136'],discoveryScene:scene,queryUrl:row.queryUrl}};
   if(row.mbid){candidate.mbid=row.mbid;candidate.identitySelection=row.identitySelection;}
   if(scene==='rap-priority')candidate.genreSelection={kind:'editorial',source:'data/expansion-priorities.json',discoveryScene:scene};
   const verification=verifyIdentity(candidate,entity,response.data);
   if(!verification.verified)throw new Error(verification.reason);
   if(usedMbids.has(response.data.id))throw new Error('Identité MusicBrainz déjà présente');
   if(accepted.length>=1000||count>=quota)continue;
   candidate.id='los-'+String(nextId++).padStart(6,'0');journal.nextId=nextId;
   const card=makeCard(candidate,entity,response,verification);
   card.rarityReview=candidate.rarityReview;
   card.provenance.classification.genres={kind:scene==='rap-priority'?'editorial':'mapped-wikidata-genres',source:candidate.genreSelection.source,property:scene==='rap-priority'?null:'P136',revision:entity.lastrevid||null};
   accepted.push({scene,candidate,card});usedMbids.add(card.mbid);count++;
   console.log('Vérifiées',accepted.length,'/1000 —',name,'('+scene+')');
  }catch(e){rejected.push({wikidataId:row.wikidataId,scene,reason:e.message});console.log('Écarté',row.wikidataId,e.message);}
  attempted++;
  if(attempted%5===0)await saveProgress();
 }}
 // Trois réponses en vol ; départs limités par le même ApiClient à 1 150 ms.
 await Promise.all([worker(),worker(),worker()]);
 if(!journal.completedScenes.includes(scene))journal.completedScenes.push(scene);
 await saveProgress();
 console.log('Famille',scene,count,'/',quota);
}
await saveProgress();
console.log('TOTAL',accepted.length,'nouvelles identités vérifiées ;',rejected.length,'écartées.');
