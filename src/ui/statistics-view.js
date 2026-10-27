import {el} from './dom.js';
import {RARITIES} from '../domain/config.js';
import {collectionStatistics,debugGrant} from '../domain/statistics.js';
export function statisticsView(catalog,save){
  const root=el('section');if(!save){root.append(el('p','Sauvegarde indisponible.'));return root;}
  const stats=collectionStatistics(save,catalog),overview=el('div','','stats-overview');
  for(const [label,value]of [['Artistes découverts',stats.owned+' / '+stats.available],['Exemplaires possédés',stats.copies],['Doublons disponibles',stats.duplicates],['Artistes manquants',stats.missing],['Boosters ouverts',save.stats.boostersOpened],['Cartes recyclées',save.stats.cardsRecycled],['Cartes obtenues au total',save.stats.cardsObtained],['SC dépensés',save.stats.creditsSpent]]){const card=el('article','','panel');card.append(el('span',label),el('strong',String(value)));overview.append(card);}root.append(overview);
  function table(title,rows,explanation){const section=el('section','','stats-breakdown'),heading=el('h2',title),list=el('div');section.append(heading);if(explanation)section.append(el('p',explanation,'muted'));
    for(const [label,stat,rarity]of rows){const row=el('div','','stats-row'+(rarity?' rarity-'+rarity:'')),progress=el('progress');progress.max=Math.max(1,stat.available);progress.value=stat.owned;progress.setAttribute('aria-label',label+' : '+stat.owned+' sur '+stat.available);row.append(el('strong',label),el('span',stat.owned+' / '+stat.available+' artistes · '+stat.copies+' exemplaire(s)'),progress);list.append(row);}section.append(list);root.append(section);}
  table('Par rareté',Object.entries(stats.rarities).map(([key,value])=>[RARITIES[key].label,value,key]));
  table('Solo et groupes',[['Artistes solo',stats.types.solo],['Groupes',stats.types.group]]);
  table('Par univers musical',stats.boosters.map(b=>[b.name,b]),'Un artiste multigenre peut compter dans plusieurs univers. Les totaux par univers ne s’additionnent pas.');
  return root;
}
export function debugView(getSave,mutate){
  const root=el('section'),status=el('p','','notice');status.setAttribute('role','status');let busy=false;
  const balances=el('p'),actions=el('div','','debug-actions');
  root.append(el('p','Outils de test pour votre partie locale : ces ajouts sont gratuits et enregistrés dans la sauvegarde. Les tickets restent limités à 10. Aucun paiement réel.'),balances,actions,status);
  function draw(){const save=getSave();balances.textContent=save?save.credits+' SC · '+save.tickets+' tickets enregistrés':'Sauvegarde indisponible';actions.replaceChildren();
    for(const [kind,amount,label]of [['credits',100,'+100 SC'],['credits',1000,'+1 000 SC'],['credits',10000,'+10 000 SC'],['tickets',1,'+1 booster gratuit'],['tickets',3,'+3 boosters gratuits'],['tickets',10,'Remplir les 10 tickets']]){const button=el('button',label,kind==='tickets'?'secondary':'');button.disabled=busy||!save;button.onclick=async()=>{if(busy)return;busy=true;draw();try{const next=await mutate(current=>debugGrant(current,kind,amount),save.revision);status.textContent=kind==='credits'?'Ajout enregistré : +'+amount+' SC.':'Réserve mise à jour : '+next.tickets+' / 10 tickets.';}catch(error){status.textContent=error.message;}finally{busy=false;draw();}};actions.append(button);}
  }draw();return root;
}
