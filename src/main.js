import { el, download } from './ui/dom.js';
import { loadCatalog } from './services/data.js';
import { SaveStore, withSaveLock } from './state/storage.js';
import { parseSave } from './state/schema.js';
import { GAME, RARITIES } from './domain/config.js';
import { boosterAvailability } from './catalog/catalog.js';
import { catalogView } from './ui/catalog-view.js';
const main = document.querySelector('main');
let catalog, store, save, saveError;
function heading(title, description) { main.append(el('div', 'LEGENDS OF SOUND / ORIGINS', 'eyebrow'), el('h1', title), el('p', description, 'muted')); }
function message(text, error = false) { const n = el('p', text, 'notice' + (error ? ' error' : '')); n.setAttribute('role', error ? 'alert' : 'status'); main.append(n); return n; }
function wallet() { document.querySelector('#wallet').textContent = save ? save.tickets + '/10 tickets · ' + save.credits + ' SC' : 'Sauvegarde indisponible'; }
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
    heading('La musique devient collection.', 'Les voix qui vous accompagnent. Les groupes qui vous marquent. Bientôt, cinq cartes pour découvrir une nouvelle histoire.');
    message(catalog.artists.length + ' identités vérifiées dans ORIGINS. Les ouvertures et le moteur économique seront activés en Phase 3 ; aucun ticket ni crédit ne peut encore être dépensé.');
    const grid = el('div', '', 'grid');
    for (const booster of catalog.boosters) {
      const availability = boosterAvailability(catalog.artists, booster);
      const panel = el('article', '', 'panel pack'); panel.style.setProperty('--pack', booster.color);
      const button = el('button', 'Ouvertures — Phase 3'); button.disabled = true;
      panel.append(el('span', 'ORIGINS / 5 CARTES', 'tag'), el('h2', booster.name), el('p', booster.description, 'muted'), el('p', availability.count + ' cartes vérifiées'), button, el('p', availability.available ? 'Les quatre raretés sont représentées.' : 'Raretés indisponibles : ' + availability.missingRarities.map(r => RARITIES[r].label).join(', '), 'muted'));
      grid.append(panel);
    }
    main.append(grid, el('p', 'Probabilités cibles par carte, lorsque toutes les raretés seront disponibles : légendaire 4 %, épique 16 %, rare 35 %, commune 45 %.'));
  } else if (route === 'collection') {
    heading('Votre discothèque de légendes.', 'ÉDITION 01 — ORIGINS');
    const count = save ? Object.keys(save.collection).length : 0;
    main.append(el('h2', count + ' carte(s) possédée(s) · objectif de l’édition : ' + catalog.editions.reduce((sum, edition) => sum + edition.targetCardCount, 0)));
    const provisional = catalog.artists.filter(a => a.rarityReview?.status === 'pending').length;
    if (provisional) message('Classement à revoir ensemble : ' + provisional + ' nouvelles cartes ont une rareté provisoire. Les raretés des cartes initiales sont conservées pour comparaison.');
    main.append(el('p', catalog.artists.length + ' identités vérifiées. Explorez le catalogue et les sources ; consulter une fiche ne donne pas la carte.', 'muted'), catalogView(catalog, save));
  } else if (route === 'recycling') {
    heading('Atelier de recyclage.', 'Donnez une seconde vie à vos doublons.');
    message('Disponible en Phase 3 avec le moteur du jeu. Aucun recyclage n’est actuellement possible.');
    main.append(el('p', 'Valeurs prévues : commune 10 SC · rare 25 SC · épique 60 SC · légendaire 150 SC.'));
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
