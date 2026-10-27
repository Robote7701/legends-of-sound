import { GAME, RARITIES } from './config.js';
import { recharge } from './boosters.js';
import { matchesBooster } from '../catalog/catalog.js';
export function collectionStatistics(state,catalog){
  const summarize=artists=>({available:artists.length,owned:artists.filter(a=>state.collection[a.id]).length,copies:artists.reduce((sum,a)=>sum+(state.collection[a.id]?.count||0),0)});
  const total=summarize(catalog.artists);
  return {...total,duplicates:total.copies-total.owned,missing:total.available-total.owned,
    types:Object.fromEntries(['solo','group'].map(type=>[type,summarize(catalog.artists.filter(a=>a.type===type))])),
    rarities:Object.fromEntries(Object.keys(RARITIES).map(rarity=>[rarity,summarize(catalog.artists.filter(a=>a.rarity===rarity))])),
    boosters:catalog.boosters.map(booster=>({id:booster.id,name:booster.name,...summarize(catalog.artists.filter(a=>matchesBooster(a,booster)))}))};
}
export function debugGrant(state,kind,amount,now=Date.now()){
  if(!['credits','tickets'].includes(kind)||!Number.isSafeInteger(amount)||amount<1||amount>1000000)throw Error('Ajout invalide : entier entre 1 et 1 000 000.');
  const next=recharge(state,now);
  if(kind==='credits'){if(!Number.isSafeInteger(next.credits+amount))throw Error('Solde trop élevé.');next.credits+=amount;}
  else next.tickets=Math.min(GAME.maxTickets,next.tickets+amount);
  return next;
}
