import { GAME, RARITIES } from './config.js';
import { recharge } from './boosters.js';

export function toggleMark(state, artists, kind, id) {
  if (!['favorites','locked','wishlist'].includes(kind) || !artists.some(a=>a.id===id)) throw Error('Carte ou sélection invalide.');
  if (kind !== 'wishlist' && !state.collection[id]) throw Error('Cette carte doit être possédée.');
  const next=structuredClone(state), values=new Set(next[kind] || []);
  if (values.has(id)) values.delete(id); else values.add(id);
  next[kind]=[...values]; return next;
}
export function duplicatePlan(state, artists) {
  return Object.fromEntries(artists.filter(a=>state.collection[a.id]?.count>1 && !state.favorites.includes(a.id) && !state.locked.includes(a.id)).map(a=>[a.id,state.collection[a.id].count-1]));
}
export function recyclingQuote(state, artists, plan) {
  if (!plan || typeof plan!=='object' || Array.isArray(plan)) throw Error('Sélection invalide.');
  const index=new Map(artists.map(a=>[a.id,a])); let count=0, credits=0;
  for (const [id,quantity] of Object.entries(plan)) {
    const artist=index.get(id), owned=state.collection[id];
    if (!artist || !owned || !Number.isSafeInteger(quantity) || quantity<1 || quantity>owned.count) throw Error('Quantité à recycler invalide.');
    if (state.favorites.includes(id) || state.locked.includes(id)) throw Error('Carte favorite ou verrouillée : recyclage protégé.');
    count+=quantity; credits+=quantity*RARITIES[artist.rarity].recycle;
  }
  if (!count || !Number.isSafeInteger(state.credits+credits)) throw Error('Recyclage vide ou solde invalide.');
  return {count,credits};
}
export function recycleCards(state, artists, plan) {
  const quote=recyclingQuote(state,artists,plan), next=structuredClone(state);
  for (const [id,quantity] of Object.entries(plan)) { next.collection[id].count-=quantity; if(!next.collection[id].count) delete next.collection[id]; }
  next.credits+=quote.credits; next.stats.cardsRecycled+=quote.count; return next;
}
export const GOALS=Object.freeze([
  {id:'discover-10',name:'Première scène',description:'Collectionner 10 artistes différents',target:10,tickets:1},
  {id:'discover-50',name:'La discothèque prend vie',description:'Collectionner 50 artistes différents',target:50,tickets:2},
  {id:'discover-100',name:'Cent voix',description:'Collectionner 100 artistes différents',target:100,tickets:3},
  {id:'rap-20',name:'Au micro',description:'Collectionner 20 artistes rap, hip-hop ou trap',target:20,tickets:2,genres:['rap','hip-hop','trap']},
  {id:'rock-groups-10',name:'Backstage',description:'Collectionner 10 groupes rock ou metal',target:10,tickets:2,genres:['rock','metal','punk','hard-rock','alternative-rock'],type:'group'},
  {id:'legendary-1',name:'Une légende dans la salle',description:'Posséder une carte légendaire',target:1,tickets:1,rarity:'legendary'},
]);
export function goalProgress(state,artists,goal) {
  return artists.filter(a=>state.collection[a.id] && (!goal.type||a.type===goal.type) && (!goal.rarity||a.rarity===goal.rarity) && (!goal.genres||a.genres.some(g=>goal.genres.includes(g)))).length;
}
export function claimGoal(state,artists,id,now=Date.now()) {
  const goal=GOALS.find(g=>g.id===id);
  if (!goal || (state.claimedGoals||[]).includes(id) || goalProgress(state,artists,goal)<goal.target) throw Error('Objectif non disponible ou déjà récupéré.');
  const next=recharge(state,now);
  if(next.tickets+goal.tickets>GAME.maxTickets)throw Error('Ouvrez des boosters pour libérer '+goal.tickets+' place(s) dans la réserve. La récompense reste disponible.');
  next.tickets+=goal.tickets; next.claimedGoals=[...(next.claimedGoals||[]),id]; return next;
}
