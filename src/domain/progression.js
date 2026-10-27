import { RARITIES } from './config.js';

export function toggleMark(state, artists, kind, id) {
  if (!['favorites','locked','wishlist'].includes(kind) || !artists.some(a=>a.id===id)) throw Error('Carte ou sélection invalide.');
  if (kind !== 'wishlist' && !state.collection[id]) throw Error('Cette carte doit être possédée.');
  const next=structuredClone(state), values=new Set(next[kind] || []);
  if (values.has(id)) values.delete(id); else values.add(id);
  next[kind]=[...values]; return next;
}
export function duplicatePlan(state, artists, rarity) {
  if(rarity!==undefined&&!Object.hasOwn(RARITIES,rarity))throw Error('Rareté invalide.');
  return Object.fromEntries(artists.filter(a=>(!rarity||a.rarity===rarity)&&state.collection[a.id]?.count>1 && !state.favorites.includes(a.id) && !state.locked.includes(a.id)).map(a=>[a.id,state.collection[a.id].count-1]));
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
  {id:'discover-10',name:'Première scène',description:'Collectionner 10 artistes différents',target:10,credits:100},
  {id:'discover-50',name:'La discothèque prend vie',description:'Collectionner 50 artistes différents',target:50,credits:200},
  {id:'discover-100',name:'Cent voix',description:'Collectionner 100 artistes différents',target:100,credits:300},
  {id:'rap-20',name:'Au micro',description:'Collectionner 20 artistes rap, hip-hop ou trap',target:20,credits:200,genres:['rap','hip-hop','trap']},
  {id:'rock-groups-10',name:'Backstage',description:'Collectionner 10 groupes rock ou metal',target:10,credits:200,genres:['rock','metal','punk','hard-rock','alternative-rock'],type:'group'},
  {id:'legendary-1',name:'Une légende dans la salle',description:'Posséder une carte légendaire',target:1,credits:100,rarity:'legendary'},
  ...[25,250,500,1000,1500].map((target,i)=>({id:'discover-'+target,name:'Discothèque · '+target,description:'Collectionner '+target+' artistes différents',target,credits:[150,500,750,1200,2000][i]})),
  ...[
    ['rap','Rap & hip-hop',['rap','hip-hop','trap'],[10,50,100]],
    ['rock','Rock & metal',['rock','metal','punk','hard-rock','alternative-rock'],[10,25,50]],
    ['electronic','Fréquences électroniques',['electronic','house','techno','synthwave','edm','ambient'],[10,25,50]],
    ['pop','Pop & R&B',['pop','rnb','soul'],[10,25,50]],
    ['asia','Asia Wave',['j-pop','j-rock','k-pop','vocaloid'],[10,25,50]],
    ['roots','Roots & Groove',['jazz','blues','funk','reggae'],[10,25,50]],
    ['world','Horizons du monde',['world','latin','afrobeats','afrobeat','filmi','chanson'],[10,25,50]],
  ].flatMap(([scene,name,genres,targets])=>targets.map((target,i)=>({id:scene+'-'+target,name:name+' · '+target,description:'Collectionner '+target+' artistes de cette scène',genres,target,credits:[100,200,350][i]}))),
  ...[['solo','Voix solo',[25,100,250]],['group','Groupes cultes',[10,50,100]]].flatMap(([type,name,targets])=>targets.map((target,i)=>({id:type+'-'+target,name:name+' · '+target,description:'Collectionner '+target+' '+(type==='solo'?'artistes solo':'groupes'),type,target,credits:[100,250,500][i]}))),
  ...[['rare',[10,50]],['epic',[5,25]],['legendary',[5,20]]].flatMap(([rarity,targets])=>targets.map((target,i)=>({id:rarity+'-'+target,name:RARITIES[rarity].label+' · '+target,description:'Posséder '+target+' artistes de rareté '+RARITIES[rarity].label,rarity,target,credits:[200,500][i]}))),
  ...[['boostersOpened','Ouvertures',[5,25,100]],['cardsRecycled','Seconde vie',[10,50,200]]].flatMap(([stat,name,targets])=>targets.map((target,i)=>({id:stat+'-'+target,name:name+' · '+target,description:(stat==='boostersOpened'?'Ouvrir '+target+' boosters':'Recycler '+target+' exemplaires'),stat,target,credits:[100,200,400][i]}))),
]);
export function goalProgress(state,artists,goal) {
  if(goal.stat)return state.stats[goal.stat]||0;
  return artists.filter(a=>state.collection[a.id] && (!goal.type||a.type===goal.type) && (!goal.rarity||a.rarity===goal.rarity) && (!goal.genres||a.genres.some(g=>goal.genres.includes(g)))).length;
}
export function claimGoal(state,artists,id) {
  const goal=GOALS.find(g=>g.id===id);
  if (!goal || (state.claimedGoals||[]).includes(id) || goalProgress(state,artists,goal)<goal.target) throw Error('Objectif non disponible ou déjà récupéré.');
  const next=structuredClone(state);
  if(!Number.isSafeInteger(next.credits+goal.credits))throw Error('Solde de crédits invalide.');
  next.credits+=goal.credits; next.claimedGoals=[...(next.claimedGoals||[]),id]; return next;
}
