import { el } from './dom.js';
import { artistArtwork } from './artist-artwork.js';
import { showArtist } from './catalog-view.js';
import { RARITIES } from '../domain/config.js';

export function showOpening(batch, catalog, opener) {
  const dialog = el('dialog', '', 'opening-dialog');
  const title = el('h2'); title.id = 'opening-title'; dialog.setAttribute('aria-labelledby', title.id);
  const close = el('button', 'Fermer', 'secondary'); close.onclick = () => dialog.close();
  const info = el('p', 'Toutes les cartes sont déjà enregistrées. Paiement : ' + batch.payment.tickets + ' ticket(s) + ' + batch.payment.credits + ' SC · solde après cette ouverture : ' + batch.payment.balance + ' SC.', 'muted');
  const stage = el('div', '', 'opening-stage');
  const actions = el('div', '', 'actions');
  const status = el('p', '', 'opening-status'); status.setAttribute('aria-live', 'polite');
  let pack = 0, revealed = 0, finished = false;
  const index = new Map(catalog.artists.map(a => [a.id, a]));
  const cards = batch.cards.map(result => ({ ...result, artist: index.get(result.id) }));
  function cardNode(result, reveal = true) {
    const artist = result.artist;
    const button = el('button', '', 'artist-card rarity-' + (artist?.rarity || 'common'));
    if (!artist) { button.textContent = result.id; return button; }
    button.append(artistArtwork(artist), el('span', RARITIES[artist.rarity].label, 'rarity-label'), el('strong', artist.displayName || artist.name), el('span', result.isNew ? 'NOUVELLE DÉCOUVERTE' : 'DOUBLON', 'result-badge'));
    if (reveal) button.classList.add('card-reveal');
    button.onclick = () => showArtist(artist, button);
    return button;
  }
  function summary() {
    finished = true; title.textContent = 'Votre session · ' + batch.count + ' booster(s)';
    stage.className = 'opening-stage opening-summary'; stage.replaceChildren(...cards.map(result => cardNode(result, false)));
    const unique = new Set(cards.map(c => c.id)).size, discoveries = cards.filter(c => c.isNew).length;
    status.textContent = cards.length + ' cartes · ' + unique + ' identités · ' + discoveries + ' découverte(s) · ' + (cards.length - discoveries) + ' doublon(s)';
    const totals = Object.entries(RARITIES).map(([key, value]) => value.label + ' : ' + cards.filter(c => c.artist?.rarity === key).length).join(' · ');
    actions.replaceChildren(el('p', totals));
    const done = el('button', 'Voir ma collection'); done.onclick = () => { dialog.close(); location.hash = '#collection'; }; actions.append(done);
  }
  function draw() {
    const packIndex = pack; let tearing = false;
    title.textContent = 'Booster ' + (pack + 1) + ' / ' + batch.count;
    const booster = catalog.boosters.find(b => b.id === batch.boosterId);
    stage.className = 'opening-stage'; stage.replaceChildren(); actions.replaceChildren();
    const packVisual = el('button', '', 'sealed-pack'); packVisual.style.setProperty('--pack', booster?.color || '#b9a1ff');
    packVisual.append(el('span', 'LEGENDS OF SOUND'), el('strong', booster?.name || 'ORIGINS'), el('span', '5 CARTES / ORIGINS'), el('span', 'Déchirer le booster ↗'));
    const strip = el('div', '', 'reveal-grid');
    const next = el('button', 'Révéler la prochaine carte');
    function reveal() {
      if (finished || revealed >= 5) return;
      packVisual.remove();
      const result = cards[pack * 5 + revealed]; revealed++;
      strip.append(cardNode(result));
      status.textContent = result.artist ? RARITIES[result.artist.rarity].label + ' · ' + result.artist.displayName + (result.isNew ? ' · nouvelle découverte' : ' · doublon') : 'Carte enregistrée';
      if (revealed === 5) {
        const gains = cards.slice(pack * 5, pack * 5 + 5);
        status.textContent = 'Booster complet · ' + gains.filter(c => c.isNew).length + ' découverte(s) · ' + gains.filter(c => c.artist?.rarity === 'legendary').length + ' légendaire(s)';
        next.textContent = pack + 1 < batch.count ? 'Booster suivant →' : 'Voir le récapitulatif';
        next.onclick = () => { if (pack + 1 < batch.count) { pack++; revealed = 0; draw(); } else summary(); };
      }
    }
    packVisual.onclick = () => {
      if (tearing) return;
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) { reveal(); return; }
      tearing = true; packVisual.classList.add('pack-unsealing');
      setTimeout(() => { if (dialog.open && !finished && pack === packIndex && revealed === 0) reveal(); }, 400);
    };
    next.onclick = reveal;
    const fast = el('button', 'Révéler les cinq cartes', 'secondary'); fast.onclick = () => { while (revealed < 5) reveal(); };
    const skip = el('button', 'Tout révéler / ignorer les animations', 'secondary'); skip.onclick = summary;
    stage.append(packVisual, strip); actions.append(next, fast, skip); status.textContent = 'Choisissez le booster ou révélez les cartes directement.';
  }
  dialog.append(close, title, info, stage, status, actions);
  dialog.addEventListener('close', () => { dialog.remove(); opener?.focus(); }, { once: true });
  document.body.append(dialog); draw(); dialog.showModal();
}
