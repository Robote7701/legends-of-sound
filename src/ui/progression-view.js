import { el } from './dom.js';
import { artistArtwork } from './artist-artwork.js';
import { RARITIES } from '../domain/config.js';
import { duplicatePlan, recyclingQuote, recycleCards, GOALS, goalProgress, claimGoal } from '../domain/progression.js';

export function recyclingView(catalog,getSave,mutate) {
  const root=el('section'), status=el('p','','notice'); status.setAttribute('role','status');
  const search=el('input');search.type='search';search.placeholder='Rechercher dans vos cartes…';search.setAttribute('aria-label','Rechercher une carte à recycler');
  const grid=el('div','','recycling-grid'), actions=el('div','','actions'), preview=el('p','','recycling-preview'),quick=el('div','','recycling-quick');
  let plan={},busy=false;
  const auto=el('button','Sélectionner tous les doublons','secondary'),confirm=el('button','Valider le recyclage');
  auto.onclick=()=>{plan=duplicatePlan(getSave(),catalog.artists);draw();};
  async function runRecycle(selection){
    if(busy)return;
    const save=getSave();
    try {
      const quote=recyclingQuote(save,catalog.artists,selection);
      if(!globalThis.confirm('Recycler définitivement '+quote.count+' exemplaire(s) pour '+quote.credits+' SC ?\nSolde après : '+(save.credits+quote.credits)+' SC.'))return;
      busy=true;draw();await mutate(current=>recycleCards(current,catalog.artists,selection),save.revision);plan={};status.textContent=quote.count+' exemplaire(s) recyclé(s) · +'+quote.credits+' SC';
    }catch(error){status.textContent=error.message;}finally{busy=false;draw();}
  }
  confirm.onclick=()=>runRecycle(structuredClone(plan));
  const advanced=el('details','','recycling-advanced');advanced.append(el('summary','Sélection manuelle · quantités par artiste'),el('p','En mode manuel, vous pouvez retirer le dernier exemplaire d’une carte non protégée.'),search,preview,actions,grid);
  search.oninput=draw;actions.append(auto,confirm);root.append(el('p','Recyclez vos doublons en un geste. Un exemplaire de chaque artiste est conservé ; les favoris et les cartes verrouillées sont exclus.'),quick,status,advanced);
  function draw(){
    const save=getSave();grid.replaceChildren();quick.replaceChildren();auto.disabled=busy||!save;confirm.disabled=busy||!save;
    if(!save){status.textContent='Sauvegarde indisponible.';return;}
    function quickButton(rarity,label){
      const selection=duplicatePlan(save,catalog.artists,rarity),count=Object.values(selection).reduce((sum,n)=>sum+n,0),credits=count?recyclingQuote(save,catalog.artists,selection).credits:0;
      const button=el('button','','recycle-quick-button'+(rarity?' rarity-'+rarity:' recycle-all'));button.dataset.rarity=rarity||'all';button.disabled=busy||!count;
      button.append(el('span',label),el('strong',count+' doublon(s)'),el('b','+'+credits+' SC'),el('small',count?'Recycler →':'Aucun doublon recyclable'));
      button.onclick=()=>runRecycle(selection);quick.append(button);
    }
    for(const [rarity,config]of Object.entries(RARITIES).reverse())quickButton(rarity,config.label);
    quickButton(undefined,'Toutes les raretés');
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
  const toolbar=el('div','','goal-toolbar'),filter=el('select');filter.setAttribute('aria-label','Filtrer les objectifs');for(const [value,label]of [['all','Tous les objectifs'],['ready','Récompenses disponibles'],['progress','En cours'],['claimed','Déjà récupérés']])filter.append(new Option(label,value));filter.onchange=draw;toolbar.append(el('strong',GOALS.length+' objectifs · récompenses en SC'),filter);
  function draw(){root.replaceChildren(toolbar,status);const save=getSave();if(!save){status.textContent='Sauvegarde indisponible.';return;}
    let shown=0;
    for(const goal of GOALS){
      const value=goalProgress(save,catalog.artists,goal),claimed=(save.claimedGoals||[]).includes(goal.id),panel=el('article','','panel goal-panel'),progress=el('progress');progress.max=goal.target;progress.value=Math.min(value,goal.target);progress.setAttribute('aria-label',goal.description);
      if(filter.value==='ready'&&(claimed||value<goal.target)||filter.value==='progress'&&(claimed||value>=goal.target)||filter.value==='claimed'&&!claimed)continue;
      shown++;
      const button=el('button',claimed?'Récompense récupérée':value<goal.target?'Objectif en cours':'Récupérer '+goal.credits+' SC');button.disabled=busy||claimed||value<goal.target;
      button.onclick=async()=>{if(busy)return;busy=true;draw();try{await mutate(current=>claimGoal(current,catalog.artists,goal.id),save.revision);status.textContent='+'+goal.credits+' Sound Credits !';}catch(error){status.textContent=error.message;}finally{busy=false;draw();}};
      panel.append(el('span','+'+goal.credits+' SC','goal-reward'),el('h2',goal.name),el('p',goal.description),progress,el('p',Math.min(value,goal.target)+' / '+goal.target),button);root.append(panel);
    }
    if(!shown)root.append(el('p','Aucun objectif dans cette catégorie.'));
  }draw();return root;
}
