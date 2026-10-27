import { el, download } from './ui/dom.js';
import { loadCatalog } from './services/data.js';
import { SaveStore, withSaveLock } from './state/storage.js';
import { parseSave } from './state/schema.js';
import { GAME, RARITIES } from './domain/config.js';
import { recharge, nextTicketIn, quoteOpening, openBoosters } from './domain/boosters.js';
import { boostersView } from './ui/boosters-view.js';
import { showOpening } from './ui/opening-view.js';
import { catalogView } from './ui/catalog-view.js';
import { toggleMark } from './domain/progression.js';
import { recyclingView, goalsView } from './ui/progression-view.js';
import { rarityReviewView } from './ui/rarity-review-view.js';
const main = document.querySelector('main');
let catalog, store, save, saveError;
let opening = false;
let editing = false;
async function mutate(operation, revision) {
  if(editing||opening)throw Error('Une opération est déjà en cours.');
  editing=true;
  try {
    save=await withSaveLock(()=>{const current=store.load();if(revision!==undefined&&current.revision!==revision)throw Error('La collection a changé. Rechargez la page avant de confirmer.');return store.commit(operation(current));});
    wallet();return structuredClone(save);
  } catch(error) {try{save=store.load();}catch{save=null;}throw error;}
  finally{editing=false;}
}
function heading(title, description) { main.append(el('div', 'LEGENDS OF SOUND / ORIGINS', 'eyebrow'), el('h1', title), el('p', description, 'muted')); }
function message(text, error = false) { const n = el('p', text, 'notice' + (error ? ' error' : '')); n.setAttribute('role', error ? 'alert' : 'status'); main.append(n); return n; }
function wallet() {
  const node = document.querySelector('#wallet');
  if (!save) { node.textContent = 'Sauvegarde indisponible'; return; }
  const now = Date.now(), current = recharge(save, now), remaining = Math.ceil(nextTicketIn(save, now) / 1000);
  const timer = remaining ? ' · prochain ticket ' + Math.floor(remaining / 60) + ':' + String(remaining % 60).padStart(2, '0') : ' · recharge complète';
  node.textContent = current.tickets + '/10 tickets · ' + current.credits + ' SC' + timer;
}
async function purchaseOpening(booster, count, opener) {
  if (opening || editing || !save) return;
  opening = true;
  try {
    // Relire avant de présenter le devis ; ne jamais confirmer un ancien solde.
    save = store.load();
    const quote = quoteOpening(save, count);
    if (!quote.affordable) throw new Error('Sound Credits insuffisants.');
    const expectedRaw = store.raw;
    if (quote.credits && !confirm('Ouvrir ' + count + ' booster(s) ' + booster.name + ' ?\n' + quote.tickets + ' ticket(s) utilisés + ' + quote.credits + ' SC dépensés.\nCoût total : ' + quote.tickets + ' ticket(s) et ' + quote.credits + ' SC.\nSolde après paiement : ' + quote.balance + ' SC.')) return;
    save = await withSaveLock(() => {
      const current = store.load();
      if (store.raw !== expectedRaw) throw new Error('La sauvegarde a changé. Vérifiez le nouveau devis avant de recommencer.');
      const next = openBoosters(current, catalog.artists, booster, count, { approvedCredits: quote.credits });
      return store.commit(next);
    });
    wallet(); showOpening(save.lastOpening, catalog, opener, save);
  } catch (error) {
    try { save = store.load(); } catch (readError) { save = null; saveError = readError.message; }
    message(error.message, true);
  }
  finally { opening = false; wallet(); }
}

function settings() {
  heading('Votre collection vous appartient.', 'Sauvegarde locale à ce navigateur. Exportez régulièrement votre collection avant de changer d’appareil ou d’effacer les données du site.');
  const actions = el('div', '', 'actions');
  const exportButton = el('button', 'Exporter la sauvegarde'); exportButton.disabled = !save;
  exportButton.onclick = () => download(store.export(), 'legends-of-sound-save.json');
  const rawButton = el('button', 'Exporter les données brutes', 'secondary');
  rawButton.onclick = () => { try { const raw = localStorage.getItem(GAME.storageKey); if (raw === null) throw new Error('Aucune donnée enregistrée.'); download(raw, 'legends-of-sound-recovery.json'); } catch(e) { message(e.message, true); } };
  const label = el('label', 'Importer un fichier JSON : '); const input = el('input'); input.type = 'file'; input.accept = '.json,application/json'; input.disabled = !save; label.append(input);
  input.onchange = async () => {
    const file = input.files[0]; if (!file) return;
    input.disabled = true;
    try {
      if (file.size > 10_000_000) throw new Error('Fichier trop volumineux.');
      const raw = await file.text(); const candidate = parseSave(raw);
      if (!confirm('Remplacer la collection locale par ce fichier (' + Object.keys(candidate.collection).length + ' cartes uniques, ' + candidate.credits + ' SC) ? Une copie locale de la sauvegarde actuelle sera conservée.')) return;
      save = await withSaveLock(() => store.import(raw)); wallet(); message('Sauvegarde importée et enregistrée.');
    } catch(e) { message(e.message, true); } finally { input.value = ''; input.disabled = !save; }
  };
  actions.append(exportButton, rawButton); main.append(actions, el('p', 'L’import remplace votre progression après confirmation. Une version inconnue ou un fichier invalide est refusé.'), label);
}
function render() {
  const route = location.hash.slice(1).split('?')[0] || 'boosters'; main.replaceChildren();
  for (const a of document.querySelectorAll('nav a')) { if (a.hash === '#' + route) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); }
  if (saveError) message('La sauvegarde n’a pas pu être chargée : ' + saveError + ' Aucune collection n’a été effacée. Consultez Sauvegarde pour exporter les données brutes.', true);
  if (!catalog) { heading('Chargement impossible.', 'Les données ne sont pas accessibles. Vérifiez la connexion puis rechargez la page.'); return; }
  document.querySelector('.edition small').textContent = catalog.artists.length + ' identités vérifiées · À vous de les découvrir';
  if (route === 'settings') { settings(); return; }
  if (route === 'boosters') {
    heading('La musique devient collection.', 'Choisissez votre scène. Ouvrez le booster. Découvrez vos cinq cartes.');
    main.append(boostersView(catalog, () => save, purchaseOpening, opener => { if (save?.lastOpening) showOpening(save.lastOpening, catalog, opener, save); }));
  } else if (route === 'collection') {
    heading('Votre discothèque de légendes.', 'ÉDITION 01 — ORIGINS');
    const count = save ? Object.keys(save.collection).length : 0;
    main.append(el('h2', count + ' carte(s) possédée(s) · objectif de l’édition : ' + catalog.editions.reduce((sum, edition) => sum + edition.targetCardCount, 0)));
    const provisional = catalog.artists.filter(a => a.rarityReview?.status === 'pending').length;
    if (provisional) message('Classement à revoir ensemble : ' + provisional + ' nouvelles cartes ont une rareté provisoire. Les premières corrections sont appliquées ; chaque nouvelle décision reste motivée par ses sources.');
    const reviewLink=el('a','Revoir les raretés et les sources','button secondary');reviewLink.href='#rarity-review';main.append(reviewLink);
    main.append(el('p', catalog.artists.length + ' identités vérifiées. Explorez le catalogue et les sources ; consulter une fiche ne donne pas la carte.', 'muted'), catalogView(catalog, save,(kind,id,revision)=>mutate(current=>toggleMark(current,catalog.artists,kind,id),revision)));
  } else if (route === 'recycling') {
    heading('Atelier de recyclage.', 'Donnez une seconde vie à vos doublons.');
    main.append(recyclingView(catalog,()=>save,mutate));
  } else if (route === 'goals') {
    heading('Chaque découverte compte.', '50 objectifs de collection, de découverte et de progression. Gagnez des Sound Credits, même lorsque votre réserve de tickets est pleine. Chaque récompense se récupère une seule fois.');
    main.append(goalsView(catalog,()=>save,mutate));
  } else if (route === 'rarity-review') {
    heading('Les légendes méritent une vraie revue.', 'Un atelier éditorial pour les '+catalog.artists.length+' artistes. Les brouillons ne changent pas les tirages tant qu’ils ne sont pas appliqués au catalogue.');
    main.append(rarityReviewView(catalog));
  } else if (route === 'statistics') {
    heading('Votre empreinte musicale.', 'Statistiques de votre sauvegarde locale.');
    if (save) { const grid = el('div', '', 'grid'); for (const [key,label] of [['boostersOpened','Boosters ouverts'],['cardsObtained','Cartes obtenues'],['cardsRecycled','Cartes recyclées']]) { const panel = el('section','','panel'); panel.append(el('h2',label),el('p',String(save.stats[key]))); grid.append(panel); } main.append(grid); }
  } else if (route === 'credits') {
    heading('Sources & crédits.', 'Des identités vérifiées. Une identité visuelle originale.');
    main.append(el('p', 'Identités, alias, dates et relations : MusicBrainz (données centrales CC0). Descriptions : Wikidata (CC0). Genres et raretés : classement éditorial Legends of Sound, sans mesure du talent.'));
    for (const [name, url] of [['MusicBrainz — sources et licences', 'https://musicbrainz.org/doc/About/Data_License'], ['Wikidata — licence CC0', 'https://www.wikidata.org/wiki/Wikidata:Licensing']]) { const link = el('a', name); link.href = url; main.append(link, el('br')); }
    main.append(el('p', 'Toutes les cartes utilisent des compositions typographiques originales : noms des artistes et groupes, motifs géométriques et palettes adaptées aux genres. Les polices sont celles du système ; aucun portrait, illustration externe ou logo d’artiste n’est chargé.'));
  } else { heading('Page introuvable.', 'Choisissez une rubrique dans la navigation.'); }
}
document.querySelector('.skip').addEventListener('click', event => { event.preventDefault(); main.focus(); });
window.addEventListener('hashchange', () => { render(); main.focus(); });
window.addEventListener('storage', event => { if (event.key === GAME.storageKey || event.key === null) { try { save = store.load(); saveError = null; } catch(e) { save = null; saveError = e.message; } wallet(); render(); } });
try { store = new SaveStore(localStorage); save = store.load(); if (store.raw === null) save = await withSaveLock(() => { store.load(); return store.raw === null ? store.commit(store.state) : structuredClone(store.state); }); } catch(e) { save = null; saveError = e.message; }
try { catalog = await loadCatalog(); } catch(e) { console.error(e); }
wallet(); render();
setInterval(() => { wallet(); document.querySelector('.booster-lounge')?.dispatchEvent(new Event('wallet-tick')); }, 1000);
