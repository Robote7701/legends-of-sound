import { el } from './dom.js';
import { GAME, RARITIES } from '../domain/config.js';
import { quoteOpening } from '../domain/boosters.js';
import { boosterAvailability } from '../catalog/catalog.js';

export function boostersView(catalog, getSave, onOpen, onReplay) {
  let busy = false;
  const root = el('section'), grid = el('div', '', 'grid booster-grid');
  root.append(el('p', 'Cinq tirages indépendants par booster. Les doublons font partie de la collection. Les nouvelles raretés restent provisoires jusqu’à leur revue.', 'notice'));
  const replay = el('button', 'Revoir ma dernière ouverture', 'secondary'); replay.disabled = !getSave()?.lastOpening;
  replay.onclick = () => onReplay(replay); root.append(replay);
  for (const booster of catalog.boosters) {
    const available = boosterAvailability(catalog.artists, booster);
    const panel = el('article', '', 'panel pack'); panel.style.setProperty('--pack', booster.color);
    const visual = el('div', '', 'mini-pack'); visual.append(el('span', 'LOS / ORIGINS'), el('strong', booster.name), el('span', '5 CARTES'));
    const label = el('label', 'Quantité '), quantity = el('select'); quantity.setAttribute('aria-label', 'Nombre de boosters ' + booster.name);
    for (const count of GAME.openingCounts) quantity.append(new Option('×' + count, count)); label.append(quantity);
    const cost = el('p', '', 'payment-quote'); cost.setAttribute('aria-live', 'polite');
    const button = el('button', 'Ouvrir le booster');
    function update() {
      const save = getSave();
      if (!save) { button.disabled = true; cost.textContent = 'Sauvegarde indisponible.'; return; }
      const quote = quoteOpening(save, Number(quantity.value));
      const text = quote.tickets + ' ticket(s) + ' + quote.credits + ' SC · ' + (quote.affordable ? 'solde après : ' + quote.balance + ' SC' : 'il manque ' + (-quote.balance) + ' SC');
      if (cost.textContent !== text) cost.textContent = text;
      button.disabled = busy || !available.available || !quote.affordable;
      button.textContent = quote.affordable ? 'Ouvrir ×' + quantity.value : 'Crédits insuffisants';
    }
    quantity.onchange = update;
    button.onclick = async () => {
      if (busy) return;
      busy = true;
      for (const control of root.querySelectorAll('.pack button, select')) control.disabled = true;
      try { await onOpen(booster, Number(quantity.value), button); }
      finally {
        busy = false;
        for (const select of root.querySelectorAll('select')) { select.disabled = false; select.dispatchEvent(new Event('change')); }
        replay.disabled = !getSave()?.lastOpening;
      }
    };
    panel.append(visual, el('h2', booster.name), el('p', booster.description, 'muted'), el('p', available.count + ' cartes éligibles'), label, cost, button);
    if (!available.available) panel.append(el('p', 'Indisponible : ' + available.missingRarities.map(r => RARITIES[r].label).join(', '), 'error'));
    grid.append(panel); update();
  }
  root.append(grid, el('p', 'Par carte : légendaire 4 % · épique 16 % · rare 35 % · commune 45 %. Les tickets sont prioritaires. Tout paiement en SC nécessite votre confirmation.'));
  // Actualiser les devis après recharge, sans conserver de minuterie de page.
  root.addEventListener('wallet-tick', () => { for (const select of root.querySelectorAll('select')) select.dispatchEvent(new Event('change')); });
  return root;
}
