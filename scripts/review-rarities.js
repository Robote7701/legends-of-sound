import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {rarityProposal} from '../src/domain/rarity-review.js';
import {validateCatalog,boosterAvailability} from '../src/catalog/catalog.js';
const read=async path=>JSON.parse(await readFile(new URL('../'+path,import.meta.url),'utf8'));
let artists=await read('data/artists.json');
const input=process.argv.find(arg=>arg.startsWith('--apply='));
if(input){
 const report=JSON.parse(await readFile(input.slice(8),'utf8'));
 if(report.version!==1||!Array.isArray(report.entries))throw Error('Rapport invalide.');
 const index=new Map(artists.map(a=>[a.id,a])),seen=new Set();
 for(const entry of report.entries){
  if(seen.has(entry.id)||!index.has(entry.id))throw Error('Identifiant dupliqué ou inconnu.');seen.add(entry.id);
  if(entry.decision==null)continue;
  if(!['common','rare','epic','legendary'].includes(entry.decision)||typeof entry.note!=='string'||entry.note.trim().length<12)throw Error('Toute décision exige une rareté et une justification.');
  const artist=index.get(entry.id);artist.rarity=entry.decision;artist.rarityReview={status:'reviewed',reason:entry.note,reviewedAt:new Date().toISOString(),sources:rarityProposal(artist).sources};
 }
 validateCatalog(artists,await read('data/editions.json'),{retiredIdentifiers:await read('data/retired-identifiers.json')});
 for(const booster of await read('data/boosters.json'))if(!boosterAvailability(artists,booster).available)throw Error('Une décision rend un booster indisponible.');
 await mkdir(new URL('../.cache/',import.meta.url),{recursive:true});
 await writeFile(new URL('../.cache/artists-before-rarity-review-'+Date.now()+'.json',import.meta.url),await readFile(new URL('../data/artists.json',import.meta.url)));
 await writeFile(new URL('../data/artists.json',import.meta.url),JSON.stringify(artists,null,2)+'\n');
}
const entries=artists.map(rarityProposal),report={version:1,generatedAt:new Date().toISOString(),method:'Indicateurs documentaires pour revue humaine. Une absence de distinction ne justifie pas une rareté basse. Aucun quota par pays ou genre.',entries};
await writeFile(new URL('../data/rarity-review.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(entries.length+' fiches préparées ; '+entries.filter(e=>e.proposed).length+' propositions documentaires ; '+entries.filter(e=>e.status==='reviewed').length+' décisions éditoriales enregistrées.');
