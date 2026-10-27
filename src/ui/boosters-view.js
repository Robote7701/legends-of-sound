import { el } from './dom.js';
import { GAME, RARITIES } from '../domain/config.js';
import { quoteOpening, recharge, nextTicketIn } from '../domain/boosters.js';
import { boosterAvailability } from '../catalog/catalog.js';
import { boosterArtwork } from './booster-artwork.js';

export function boostersView(catalog, getSave, onOpen, onReplay) {
  let busy = false, selected = 0, count = 1;
  const priority = ['all-stars', 'rap', 'hip-hop'];
  const boosters = [...catalog.boosters].sort((a,b) => (priority.includes(a.id) ? priority.indexOf(a.id) : 3) - (priority.includes(b.id) ? priority.indexOf(b.id) : 3));
  const root = el('section', '', 'booster-lounge');
  const rechargeBar = el('div', '', 'free-boosters'), freeTitle = el('strong'), countdown = el('span'), progress = el('progress');
  progress.max = GAME.rechargeMs; progress.setAttribute('aria-label', 'Recharge du prochain ticket gratuit');
  const rechargeHeading = el('div', '', 'free-boosters-heading'); rechargeHeading.append(el('span', '✦ BOOSTERS GRATUITS'), freeTitle, countdown); rechargeBar.append(rechargeHeading, progress);
  const roulette = el('div', '', 'booster-roulette'); roulette.setAttribute('aria-label', 'Choisir un booster');
  const track = el('div', '', 'roulette-track');
  const tabs = el('div', '', 'booster-tabs'); tabs.setAttribute('role', 'group'); tabs.setAttribute('aria-label', 'Thèmes musicaux');
  const title = el('h2'), description = el('p', '', 'muted'), eligible = el('span', '', 'tag');
  const details = el('div', '', 'selected-booster'); details.setAttribute('aria-live', 'polite'); details.append(eligible, title, description);
  const cards = [], tabButtons = [];
  const previous = el('button', '←', 'roulette-arrow previous'), next = el('button', '→', 'roulette-arrow next');
  previous.setAttribute('aria-label', 'Booster précédent'); next.setAttribute('aria-label', 'Booster suivant');
  previous.onclick = () => select(selected - 1); next.onclick = () => select(selected + 1);
  boosters.forEach((booster, index) => {
    const card = el('article', '', 'pack roulette-item');
    const button = el('button', '', 'roulette-pick'); button.setAttribute('aria-label', 'Choisir ' + booster.name); button.append(boosterArtwork(booster)); button.onclick = () => select(index); card.append(button); track.append(card); cards.push(card);
    const tab = el('button', booster.name, 'booster-tab'); tab.onclick = () => select(index); tabs.append(tab); tabButtons.push(tab);
  });
  roulette.append(track, previous, next);
  roulette.tabIndex = 0;
  roulette.onkeydown = event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); select(selected + (event.key === 'ArrowLeft' ? -1 : 1)); } };
  let startX;
  roulette.addEventListener('touchstart', event => { startX = event.changedTouches[0].clientX; }, {passive:true});
  roulette.addEventListener('touchend', event => { const delta = event.changedTouches[0].clientX - startX; if (Math.abs(delta)>45) select(selected + (delta>0 ? -1 : 1)); }, {passive:true});
  const checkout = el('div', '', 'booster-checkout'), quantities = el('div', '', 'opening-counts'); quantities.setAttribute('role','group'); quantities.setAttribute('aria-label','Nombre de boosters');
  const quantityButtons = GAME.openingCounts.map(value => {
    const button = el('button', '×' + value, 'quantity-button'); button.dataset.count = value;
    button.onclick = () => { count = value; update(); }; quantities.append(button); return button;
  });
  const cost = el('p', '', 'payment-quote'); cost.setAttribute('aria-live','polite');
  const open = el('button', '', 'open-selected'); open.onclick = async () => {
    if (busy) return;
    busy = true; update();
    try { await onOpen(boosters[selected], count, open); }
    finally { busy = false; update(); }
  };
  const replay = el('button', 'Revoir ma dernière ouverture', 'secondary replay-opening'); replay.onclick = () => onReplay(replay);
  checkout.append(quantities, open, cost, replay);
  const rates = el('div', '', 'drop-rates'); rates.setAttribute('aria-label', 'Taux de drop par carte');
  for (const [key, rarity] of Object.entries(RARITIES).reverse()) { const rate = el('div', '', 'drop-rate rarity-' + key); rate.append(el('strong', Math.round(rarity.probability*100) + ' %'), el('span', rarity.label)); rates.append(rate); }
  root.append(rechargeBar, tabs, roulette, details, checkout, el('h3', 'LES TAUX DE DROP'), rates,
    el('p', '5 artistes différents par paquet, révélés de la commune vers la légendaire. Les doublons restent possibles entre paquets. Taux initiaux par tirage : si une rareté est épuisée dans le paquet, les taux restants sont renormalisés.', 'drop-explanation'),
    el('p', 'Tickets prioritaires · Dépense en SC après confirmation · Les nouvelles raretés restent provisoires.', 'muted'));
  function select(index) {
    if (busy) return;
    selected = (index + boosters.length) % boosters.length;
    track.style.setProperty('--selected', selected);
    cards.forEach((card,i) => { card.classList.toggle('is-selected', i===selected); card.querySelector('button').tabIndex = i===selected ? 0 : -1; });
    tabButtons.forEach((button,i) => button.setAttribute('aria-pressed', String(i===selected)));
    const booster = boosters[selected], availability = boosterAvailability(catalog.artists, booster);
    root.style.setProperty('--pack',booster.color); title.textContent = booster.name; description.textContent = booster.description;
    eligible.textContent = availability.count + ' ARTISTES · ÉDITION ORIGINS';
    update();
  }
  function update() {
    const save = getSave(), booster = boosters[selected], availability = boosterAvailability(catalog.artists, booster);
    if (save) {
      const now = Date.now(), current = recharge(save, now), remaining = nextTicketIn(save, now), seconds = Math.ceil(remaining / 1000);
      freeTitle.textContent = current.tickets + ' / ' + GAME.maxTickets + ' disponibles';
      countdown.textContent = remaining ? 'Prochain gratuit dans ' + Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2,'0') : 'Réserve pleine · Prêt à ouvrir';
      progress.value = remaining ? GAME.rechargeMs - remaining : GAME.rechargeMs;
    } else { freeTitle.textContent = 'Sauvegarde indisponible'; countdown.textContent = ''; progress.value = 0; }
    const quote = save ? quoteOpening(save,count) : null;
    const text = !quote ? 'Sauvegarde indisponible.' : quote.tickets + ' ticket(s) + ' + quote.credits + ' SC · ' + (quote.affordable ? 'solde après : ' + quote.balance + ' SC' : 'crédits insuffisants');
    if (cost.textContent !== text) cost.textContent = text;
    open.textContent = 'Ouvrir ' + count + ' booster' + (count>1 ? 's' : '') + ' ↗'; open.disabled = busy || !quote?.affordable || !availability.available;
    if (!availability.available) cost.textContent = 'Indisponible : raretés manquantes.';
    for (const button of quantityButtons) { button.disabled = busy; button.setAttribute('aria-pressed',String(Number(button.dataset.count)===count)); }
    for (const button of [...tabButtons, previous, next, ...cards.map(card=>card.querySelector('button'))]) button.disabled = busy;
    replay.disabled = busy || !save?.lastOpening;
  }
  root.addEventListener('wallet-tick', update); select(0);
  return root;
}
