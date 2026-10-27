import { createSave } from '../src/state/schema.js';
import { GAME } from '../src/domain/config.js';
const frame=document.querySelector('iframe'),output=document.querySelector('#results'),checks=[];
const assert=(ok,text)=>{if(!ok)throw Error(text);checks.push('OK — '+text);};
async function until(predicate){const end=Date.now()+8000;while(!predicate()){if(Date.now()>end)throw Error('Délai dépassé');await new Promise(r=>setTimeout(r,30));}}
let owned=false,sequence=0;
const saved=()=>JSON.parse(localStorage.getItem(GAME.storageKey));
async function load(tickets=10,credits=500,elapsed=0){
 const state=createSave(Date.now());state.tickets=tickets;state.credits=credits;state.ticketUpdatedAt-=elapsed;
 localStorage.setItem(GAME.storageKey,JSON.stringify(state));
 frame.src='../index.html?opening-test='+sequence+++'#boosters';
 await new Promise(resolve=>frame.onload=resolve);
 await until(()=>frame.contentDocument.querySelectorAll('.pack').length===10);
 return frame.contentDocument;
}
try{
 if(location.hostname!=='127.0.0.1'||!['4176','4177'].includes(location.port))throw Error('Refus : utiliser une origine de test isolée sur 127.0.0.1:4176 ou :4177.');
 if(localStorage.getItem(GAME.storageKey)!==null)throw Error('Stockage de test non vierge : utiliser un profil de test vide. Aucune donnée remplacée.');
 owned=true;
 let doc=await load();
 // Double validation : un seul paiement doit passer.
 frame.contentWindow.crypto.getRandomValues=array=>{array.fill(0);return array;};
 doc.querySelector('.open-selected').click();doc.querySelector('.open-selected').click();
 await until(()=>!!doc.querySelector('.opening-dialog[open]'));
 assert(saved().stats.boostersOpened===1&&saved().tickets===9,'Double clic : une seule ouverture');
 assert(saved().lastOpening.cards.length===5&&saved().stats.cardsObtained===5,'Les cinq gains sont sauvegardés avant la révélation');
 doc.querySelector('.sealed-pack').click();
 await until(()=>!!doc.querySelector('.card-reveal'));
 assert(doc.querySelector('.card-reveal.rarity-legendary'),'Révélation individuelle et effet légendaire');
 const skip=[...doc.querySelectorAll('.opening-dialog button')].find(b=>b.textContent.includes('Tout révéler'));skip.click();
 assert(doc.querySelectorAll('.opening-summary .artist-card').length===5,'Ignorer les animations conserve les cinq cartes');
 assert(new Set(saved().lastOpening.cards.map(c=>c.id)).size===5,'Cinq artistes distincts dans le paquet');
 doc=await load();
 doc.querySelector('[data-count="3"]').click();doc.querySelector('.open-selected').click();
 await until(()=>!!doc.querySelector('.opening-dialog[open]'));
 assert(saved().lastOpening.cards.length===15&&saved().tickets===7,'Ouverture x3 : quinze cartes et trois tickets');
 const before=localStorage.getItem(GAME.storageKey);
 frame.src='../index.html?interrupted#boosters';await new Promise(resolve=>frame.onload=resolve);
 await until(()=>frame.contentDocument.querySelectorAll('.pack').length===10);doc=frame.contentDocument;
 assert(localStorage.getItem(GAME.storageKey)===before,'Rechargement pendant l’animation : gains et paiement conservés');
 [...doc.querySelectorAll('main button')].find(b=>b.textContent.includes('Revoir')).click();
 assert(doc.querySelector('.opening-dialog[open]')&&localStorage.getItem(GAME.storageKey)===before,'Revoir une ouverture ne repaie pas');
 doc=await load(0);
 frame.contentWindow.confirm=()=>false;
 doc.querySelector('.open-selected').click();await new Promise(r=>setTimeout(r,80));
 assert(saved().credits===500&&saved().stats.boostersOpened===0&&!doc.querySelector('.opening-dialog'),'Annuler les crédits ne dépense rien');
 doc=await load(2);let confirmation='';
 frame.contentWindow.confirm=text=>{confirmation=text;return true;};
 doc.querySelector('[data-count="5"]').click();doc.querySelector('.open-selected').click();
 await until(()=>!!doc.querySelector('.opening-dialog[open]'));
 assert(saved().credits===200&&saved().tickets===0&&saved().lastOpening.cards.length===25,'Ouverture x5 : paiement mixte cohérent');
 assert(confirmation.includes('2 ticket(s)')&&confirmation.includes('300 SC')&&confirmation.includes('200 SC'),'Confirmation : tickets, coût et solde après paiement');
 doc=await load(0,1000);frame.contentWindow.confirm=()=>true;
 doc.querySelector('[data-count="10"]').click();doc.querySelector('.open-selected').click();
 await until(()=>!!doc.querySelector('.opening-dialog[open]'));
 assert(saved().credits===0&&saved().lastOpening.cards.length===50,'Ouverture x10 : cinquante cartes et solde nul autorisé');
 doc=await load(0,99);
 assert(doc.querySelector('.open-selected').disabled,'Solde insuffisant : ouverture bloquée');
 doc=await load(0,500,2*GAME.rechargeMs+1000);
 assert(doc.querySelector('#wallet').textContent.includes('2/10')&&doc.querySelector('#wallet').textContent.includes('prochain ticket'),'Recharge hors ligne et compte à rebours visibles');
 doc.querySelector('.open-selected').click();await until(()=>!!doc.querySelector('.opening-dialog[open]'));
 assert(saved().tickets===1&&saved().credits===500,'Les tickets rechargés sont dépensés avant les crédits');
 doc=await load();const originalSet=frame.contentWindow.Storage.prototype.setItem;
 frame.contentWindow.Storage.prototype.setItem=function(key,value){if(key===GAME.storageKey)throw new DOMException('Quota de test','QuotaExceededError');return originalSet.call(this,key,value);};
 doc.querySelector('.open-selected').click();await until(()=>!!doc.querySelector('.notice.error'));
 assert(saved().tickets===10&&saved().stats.cardsObtained===0&&!doc.querySelector('.opening-dialog'),'Panne de stockage : ni paiement ni cartes partiellement enregistrés');
 doc=await load(0);
 frame.contentWindow.confirm=()=>{const changed=saved();changed.credits=550;changed.revision++;localStorage.setItem(GAME.storageKey,JSON.stringify(changed));return true;};
 doc.querySelector('.open-selected').click();await until(()=>!!doc.querySelector('.notice.error'));
 assert(saved().credits===550&&saved().stats.boostersOpened===0,'Modification pendant la confirmation : ancien devis refusé');
 output.dataset.status='passed';
}catch(error){checks.push('ÉCHEC — '+error.message);output.dataset.status='failed';}
finally{if(owned){frame.src='about:blank';localStorage.removeItem(GAME.storageKey);}output.textContent=checks.join('\n')+'\n'+checks.filter(c=>c.startsWith('OK')).length+' contrôles réussis.';}
