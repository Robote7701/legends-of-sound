import { el } from './dom.js';
import { artistArtwork } from './artist-artwork.js';
import { GAME, RARITIES } from '../domain/config.js';
import { duplicatePlan, recyclingQuote, recycleCards, GOALS, goalProgress, claimGoal } from '../domain/progression.js';
import { recharge } from '../domain/boosters.js';

export function recyclingView(catalog,getSave,mutate) {
  const root=el('section'), status=el('p','','notice'); status.setAttribute('role','status');
  const search=el('input');search.type='search';search.placeholder='Rechercher dans vos cartes…';search.setAttribute('aria-label','Rechercher une carte à recycler');
  const grid=el('div','','recycling-grid'), actions=el('div','','actions'), preview=el('p','','recycling-preview');
  let plan={},busy=false;
  const auto=el('button','Sélectionner tous les doublons','secondary'),confirm=el('button','Valider le recyclage');
  auto.onclick=()=>{plan=duplicatePlan(getSave(),catalog.artists);draw();};
  confirm.onclick=async()=>{
    if(busy)return;
    const save=getSave(), selection=structuredClone(plan);
    try {
      const quote=recyclingQuote(save,catalog.artists,selection);
      if(!globalThis.confirm('Recycler définitivement '+quote.count+' exemplaire(s) pour '+quote.credits+' SC ?\nSolde après : '+(save.credits+quote.credits)+' SC.'))return;
      busy=true;draw();await mutate(current=>recycleCards(current,catalog.artists,selection),save.revision);plan={};status.textContent=quote.count+' exemplaire(s) recyclé(s) · +'+quote.credits+' SC';
    }catch(error){status.textContent=error.message;}finally{busy=false;draw();}
  };
  search.oninput=draw;actions.append(auto,confirm);root.append(el('p','Les favoris et les cartes verrouillées sont protégés. La sélection automatique garde un exemplaire de chaque artiste. Le recyclage manuel peut retirer votre dernier exemplaire.'),search,preview,actions,status,grid);
  function draw(){
    const save=getSave();grid.replaceChildren();auto.disabled=busy||!save;confirm.disabled=busy||!save;
    if(!save){status.textContent='Sauvegarde indisponible.';return;}
    try{const quote=recyclingQuote(save,catalog.artists,plan);preview.textContent=quote.count+' carte(s) · +'+quote.credits+' SC · solde après : '+(save.credits+quote.credits)+' SC';}catch{preview.textContent='Sélectionnez les exemplaires à recycler.';confirm.disabled=true;}
    const artists=catalog.artists.filter(a=>save.collection[a.id]&&(a.displayName||a.name).toLocaleLowerCase().includes(search.value.toLocaleLowerCase()));
    if(!artists.length)grid.append(el('p','Aucune carte à afficher. Ouvrez des boosters pour commencer votre collection.'));
    for(const artist of artists){
      const owned=save.collection[artist.id].count,protectedCard=save.favorites.includes(artist.id)||save.locked.includes(artist.id),row=el('article','','recycling-row');
      row.append(artistArtwork(artist),el('strong',artist.displayName||artist.name),el('span','×'+owned+' · '+RARITIES[artist.rarity].recycle+' SC / exemplaire'));
      const input=el('input');input.type='number';input.min=0;input.max=owned;input.step=1;input.value=plan[artist.id]||0;input.disabled=busy||protectedCard;input.setAttribute('aria-label','Exemplaires à recycler · '+(artist.displayName||artist.name));
      input.onchange=()=>{const value=Number(input.value);if(Number.isSafeInteger(value)&&value>0)plan[artist.id]=value;else delete plan[artist.id];draw();};
      row.append(input);if(protectedCard)row.append(el('span','Protégée ♥ / ▣','tag'));grid.append(row);
    }
  }
  draw();return root;
}
export function goalsView(catalog,getSave,mutate){
  const root=el('section','','goals-grid'),status=el('p');status.setAttribute('role','status');let busy=false;
  function draw(){root.replaceChildren(status);const save=getSave();if(!save){status.textContent='Sauvegarde indisponible.';return;}
    for(const goal of GOALS){
      const value=goalProgress(save,catalog.artists,goal),claimed=(save.claimedGoals||[]).includes(goal.id),panel=el('article','','panel goal-panel'),progress=el('progress');progress.max=goal.target;progress.value=Math.min(value,goal.target);progress.setAttribute('aria-label',goal.description);
      const capacity=recharge(save).tickets+goal.tickets<=GAME.maxTickets,button=el('button',claimed?'Récompense récupérée':value<goal.target?'Objectif en cours':capacity?'Récupérer '+goal.tickets+' ticket(s)':'Libérez '+goal.tickets+' place(s) dans la réserve');button.disabled=busy||claimed||value<goal.target||!capacity;
      button.onclick=async()=>{if(busy)return;busy=true;draw();try{await mutate(current=>claimGoal(current,catalog.artists,goal.id),save.revision);status.textContent='+'+goal.tickets+' ticket(s) gratuit(s) !';}catch(error){status.textContent=error.message;}finally{busy=false;draw();}};
      panel.append(el('h2',goal.name),el('p',goal.description),progress,el('p',Math.min(value,goal.target)+' / '+goal.target+' · '+goal.tickets+' ticket(s)'),button);root.append(panel);
    }
  }draw();return root;
}
