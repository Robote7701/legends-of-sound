import {el,download} from './dom.js';
import {RARITIES} from '../domain/config.js';
import {rarityProposal} from '../domain/rarity-review.js';
import {showArtist} from './catalog-view.js';
export function rarityReviewView(catalog){
 const root=el('section'),status=el('p','','notice'),search=el('input'),grid=el('div','','rarity-review-list'),navigation=el('div','','actions');let page=0,drafts={},writable=true;
 const key='legends-of-sound-rarity-drafts-v1',index=new Set(catalog.artists.map(a=>a.id));
 status.setAttribute('role','status');search.type='search';search.placeholder='Chercher un artiste à revoir';search.setAttribute('aria-label','Recherche dans la revue des raretés');
 try{const raw=localStorage.getItem(key);if(raw){const parsed=JSON.parse(raw);if(!parsed||Array.isArray(parsed)||typeof parsed!=='object'||!Object.entries(parsed).every(([id,v])=>index.has(id)&&v&&Object.hasOwn(RARITIES,v.decision)&&typeof v.note==='string'))throw Error('Brouillon invalide, original conservé.');drafts=parsed;}}catch(error){writable=false;status.textContent=error.message;}
 const exportButton=el('button','Exporter les décisions');exportButton.onclick=()=>download(JSON.stringify({version:1,entries:catalog.artists.map(a=>({...rarityProposal(a),decision:drafts[a.id]?.decision||null,note:drafts[a.id]?.note||''}))},null,2),'legends-rarity-decisions.json');
 root.append(el('p','Toutes les fiches sont à examiner avec leurs sources. Les suggestions utilisent quelques distinctions musicales documentées ; elles ne mesurent ni le talent ni la popularité. Les scènes peu récompensées demandent une lecture éditoriale. Les décisions sont des brouillons locaux : exportez-les pour mettre à jour le catalogue.'),search,exportButton,status,grid,navigation);
 function draw(){
  const artists=catalog.artists.filter(a=>(a.displayName||a.name).normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().includes(search.value.normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase()));
  grid.replaceChildren();navigation.replaceChildren();if(writable)status.textContent=artists.length+' fiches · '+Object.keys(drafts).length+' décision(s) en brouillon';
  for(const artist of artists.slice(page*30,page*30+30)){
   const proposal=rarityProposal(artist),row=el('article','','panel'),name=el('button',proposal.name,'secondary');name.onclick=()=>showArtist(artist,name);
   row.append(name,el('p','Actuelle : '+RARITIES[proposal.current].label+' · Suggestion : '+(proposal.proposed?RARITIES[proposal.proposed].label:'à examiner')),el('p',proposal.evidence.join(' · ')||proposal.reason,'muted'));
   if(proposal.status==='reviewed')row.append(el('p',proposal.reason,'notice'));
   const label=el('label','Décision '),select=el('select');select.append(new Option('Sans décision',''));for(const [key,r]of Object.entries(RARITIES))select.append(new Option(r.label,key));select.value=drafts[artist.id]?.decision||'';label.append(select);
   const note=el('textarea');note.placeholder='Justification éditoriale (12 caractères minimum)';note.setAttribute('aria-label','Justification · '+proposal.name);note.value=drafts[artist.id]?.note||'';
   const save=el('button','Enregistrer le brouillon');save.disabled=!writable;save.onclick=()=>{if(!select.value||note.value.trim().length<12){status.textContent='Choisissez une rareté et justifiez la décision.';return;}try{const next={...drafts,[artist.id]:{decision:select.value,note:note.value.trim()}};localStorage.setItem(key,JSON.stringify(next));drafts=next;status.textContent='Décision enregistrée pour '+proposal.name;}catch(error){status.textContent='Écriture impossible : '+error.message;}};
   row.append(label,note,save);grid.append(row);
  }
  const previous=el('button','← Précédent','secondary'),next=el('button','Suivant →','secondary');previous.disabled=page===0;next.disabled=(page+1)*30>=artists.length;previous.onclick=()=>{page--;draw();};next.onclick=()=>{page++;draw();};navigation.append(previous,el('span','Page '+(page+1)),next);
 }
 search.oninput=()=>{page=0;draw();};draw();return root;
}
