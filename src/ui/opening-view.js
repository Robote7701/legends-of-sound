import { el } from './dom.js';
import { artistArtwork } from './artist-artwork.js';
import { showArtist } from './catalog-view.js';
import { RARITIES } from '../domain/config.js';
import { boosterArtwork } from './booster-artwork.js';
import { openingAudio } from './opening-audio.js';

export function showOpening(batch, catalog, opener, save) {
  const dialog = el('dialog', '', 'opening-dialog');
  const title = el('h2'); title.id = 'opening-title'; dialog.setAttribute('aria-labelledby', title.id);
  const close = el('button', 'Fermer', 'secondary'); close.onclick = () => {dialog.close();cleanup();};
  const audio=openingAudio(), sound=el('button','Son : désactivé','secondary opening-audio');sound.setAttribute('aria-pressed','false');sound.onclick=()=>{const enabled=audio.toggle();sound.textContent=enabled?'Son : activé':'Son : désactivé';sound.setAttribute('aria-pressed',String(enabled));};
  const info = el('p', 'Toutes les cartes sont déjà enregistrées. Paiement : ' + batch.payment.tickets + ' ticket(s) + ' + batch.payment.credits + ' SC · solde après cette ouverture : ' + batch.payment.balance + ' SC.', 'muted');
  const stage = el('div', '', 'opening-stage');
  const actions = el('div', '', 'actions');
  const status = el('p', '', 'opening-status'); status.setAttribute('aria-live', 'polite');
  let pack = 0, revealed = 0, finished = false;
  let cancelReveal=()=>{};
  const index = new Map(catalog.artists.map(a => [a.id, a]));
  const cards = [];
  const ranks = ['common', 'rare', 'epic', 'legendary'];
  for (let i = 0; i < batch.cards.length; i += 5) cards.push(...batch.cards.slice(i, i + 5).map(result => ({ ...result, artist: index.get(result.id) })).sort((a,b) => ranks.indexOf(a.artist?.rarity) - ranks.indexOf(b.artist?.rarity)));
  function cardNode(result, reveal = true, advance) {
    const artist = result.artist;
    const button = el('button', '', 'artist-card rarity-' + (artist?.rarity || 'common'));
    if (!artist) { button.textContent = result.id; return button; }
    button.append(artistArtwork(artist), el('span', RARITIES[artist.rarity].label, 'rarity-label'), el('strong', artist.displayName || artist.name), el('span', result.isNew ? 'NOUVELLE DÉCOUVERTE' : 'DOUBLON', 'result-badge'));
    const badges=el('span','','opening-card-badges');
    if(result.isNew)badges.append(el('span','NEW','opening-new-badge'));
    if(save?.favorites.includes(artist.id))badges.append(el('span','♥ Dans vos favoris','opening-favorite-badge'));
    if(badges.children.length)button.append(badges);
    if (reveal) button.classList.add('card-reveal');
    button.onclick = reveal ? advance : () => showArtist(artist, button);
    if (reveal) button.setAttribute('aria-label', (artist.displayName || artist.name) + ' · ' + RARITIES[artist.rarity].label + ' · Continuer la révélation');
    return button;
  }
  function summary() {
    cancelReveal();
    finished = true; title.textContent = 'Votre session · ' + batch.count + ' booster(s)';
    stage.className = 'opening-stage opening-summary'; stage.replaceChildren(...cards.map(result => cardNode(result, false)));
    const unique = new Set(cards.map(c => c.id)).size, discoveries = cards.filter(c => c.isNew).length;
    const scoreboard=el('div','','session-scoreboard');scoreboard.append(el('strong',discoveries+' nouveautés'),el('span',(cards.length-discoveries)+' doublon(s)'));
    const best=[...cards].sort((a,b)=>ranks.indexOf(b.artist?.rarity)-ranks.indexOf(a.artist?.rarity))[0];
    if(best?.artist){scoreboard.append(el('span','Meilleure carte : '+(best.artist.displayName||best.artist.name)+' · '+RARITIES[best.artist.rarity].label,'best-label'));const bestNode=stage.children[cards.indexOf(best)];bestNode?.classList.add('session-best');}
    if(save){const progress=el('progress','','summary-progress'),owned=Object.keys(save.collection).length;progress.max=catalog.artists.length;progress.value=owned;progress.setAttribute('aria-label','Progression de la collection');scoreboard.append(el('span','Votre collection : '+owned+' / '+catalog.artists.length),progress);}
    stage.prepend(scoreboard);
    status.textContent = cards.length + ' cartes · ' + unique + ' identités · ' + discoveries + ' découverte(s) · ' + (cards.length - discoveries) + ' doublon(s)';
    const totals = Object.entries(RARITIES).map(([key, value]) => value.label + ' : ' + cards.filter(c => c.artist?.rarity === key).length).join(' · ');
    actions.replaceChildren(el('p', totals));
    const done = el('button', 'Voir ma collection'); done.onclick = () => { dialog.close(); location.hash = '#collection'; }; actions.append(done);
  }
  function draw() {
    cancelReveal();
    const packIndex = pack; let tearing = false;
    let pending=null;
    cancelReveal=()=>{if(pending){clearTimeout(pending.timer);pending=null;}};
    title.textContent = 'Booster ' + (pack + 1) + ' / ' + batch.count;
    const booster = catalog.boosters.find(b => b.id === batch.boosterId);
    stage.className = 'opening-stage awaiting-pack'; stage.style.setProperty('--pack', booster?.color || '#d9ff65'); stage.replaceChildren(); actions.replaceChildren();
    const packVisual = boosterArtwork(booster || { id: 'all-stars', name: 'ORIGINS' }, true);
    const instruction = el('p', 'DÉCHIREZ LE SCELLÉ · DÉCOUVREZ LE SON', 'tear-instruction');
    const strip = el('div', '', 'reveal-grid spotlight-grid');
    const atmosphere = el('div', '', 'reveal-atmosphere'); atmosphere.setAttribute('aria-hidden','true');
    const announcement = el('div', '', 'reveal-announcement');
    const trail = el('div', '', 'reveal-trail'); trail.setAttribute('aria-label','Progression du paquet');
    const hint = el('p', '', 'reveal-hint');
    const next = el('button', 'Révéler la prochaine carte');
    function reveal(instant=false) {
      if(pending){pending.finish();return;}
      if (finished || revealed >= 5) return;
      const focusCard = document.activeElement === packVisual || strip.contains(document.activeElement);
      packVisual.remove();
      instruction.remove(); stage.classList.remove('awaiting-pack');
      const result = cards[pack * 5 + revealed];
      function present() {
      if(!dialog.open||finished||pack!==packIndex)return;
      revealed++;
      const rarity = result.artist?.rarity || 'common';
      if(!instant)audio.play(rarity);
      stage.className = 'opening-stage concert-reveal rarity-' + rarity;
      announcement.replaceChildren(el('span', 'CARTE ' + revealed + ' / 5', 'reveal-counter'), el('strong', RARITIES[rarity].label, 'reveal-rarity'));
      const sparks = el('div', '', 'reveal-sparks');
      for (let i=0;i<16;i++) { const spark = el('i'); spark.style.setProperty('--spark',i); sparks.append(spark); }
      atmosphere.replaceChildren(el('div','','reveal-halo'), sparks);
      const card = cardNode(result, true, () => next.onclick());
      // Une seule carte interactive sur scène ; les gains précédents restent au récapitulatif.
      for (const previous of strip.children) { previous.hidden = true; previous.tabIndex = -1; }
      strip.append(card);
      trail.replaceChildren(...cards.slice(pack*5,pack*5+5).map((gain,i) => { const pip = el('span', i < revealed ? '✦' : '○', i < revealed ? 'revealed rarity-' + (gain.artist?.rarity || 'common') : ''); pip.setAttribute('aria-label','Carte ' + (i+1) + (i<revealed ? ' révélée' : ' à découvrir')); return pip; }));
      hint.textContent = revealed < 5 ? 'CLIQUEZ SUR LA CARTE POUR DÉCOUVRIR LA SUIVANTE' : 'PAQUET COMPLET · CLIQUEZ POUR CONTINUER';
      if (focusCard) card.focus({preventScroll:true});
      status.textContent = result.artist ? RARITIES[result.artist.rarity].label + ' · ' + result.artist.displayName + (result.isNew ? ' · nouvelle découverte' : ' · doublon') : 'Carte enregistrée';
      if (revealed === 5) {
        const gains = cards.slice(pack * 5, pack * 5 + 5);
        status.textContent = 'Booster complet · ' + gains.filter(c => c.isNew).length + ' découverte(s) · ' + gains.filter(c => c.artist?.rarity === 'legendary').length + ' légendaire(s)';
        next.textContent = pack + 1 < batch.count ? 'Booster suivant →' : 'Voir le récapitulatif';
        next.onclick = () => { if (pack + 1 < batch.count) { pack++; revealed = 0; draw(); } else summary(); };
      }
      }
      if(instant||matchMedia('(prefers-reduced-motion: reduce)').matches){present();return;}
      for(const previous of strip.children){previous.hidden=true;previous.tabIndex=-1;}
      const rarity=result.artist?.rarity||'common';stage.className='opening-stage concert-reveal rarity-'+rarity;
      const back=el('button','','card-suspense');back.setAttribute('aria-label','Retourner la carte maintenant');back.append(el('strong','LEGENDS\nOF SOUND'));
      strip.append(back);announcement.replaceChildren(el('span','CARTE '+(revealed+1)+' / 5','reveal-counter'),el('strong','ÉCOUTEZ…','reveal-rarity'));hint.textContent='LE SON PREND FORME…';
      status.textContent='Carte face cachée · retournez-la ou attendez la révélation.';
      const finish=()=>{if(!pending)return;clearTimeout(pending.timer);pending=null;back.remove();present();};
      pending={finish,timer:setTimeout(finish,rarity==='legendary'?1250:rarity==='epic'?850:400)};back.onclick=finish;if(focusCard)back.focus({preventScroll:true});
    }
    packVisual.onclick = () => {
      if (tearing) return;
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) { reveal(); return; }
      tearing = true; audio.play('tear');packVisual.classList.add('pack-unsealing');
      instruction.textContent = 'LAISSEZ LA MUSIQUE ENTRER…';
      setTimeout(() => { if (dialog.open && !finished && pack === packIndex && revealed === 0) reveal(); }, 850);
    };
    next.onclick = () => reveal();
    const fast = el('button', 'Révéler les cinq cartes', 'secondary'); fast.onclick = () => { while (revealed < 5) reveal(true); };
    const skip = el('button', 'Tout révéler / ignorer les animations', 'secondary'); skip.onclick = summary;
    stage.append(packVisual, instruction, atmosphere, announcement, strip, trail, hint); actions.append(next, fast, skip); status.textContent = 'Cliquez sur la pochette pour ouvrir votre booster.';
  }
  dialog.append(close, sound, title, info, stage, status, actions);
  function cleanup(){if(!dialog.isConnected)return;cancelReveal();audio.close();dialog.remove();opener?.focus();}
  dialog.addEventListener('close', cleanup, { once: true });
  document.body.append(dialog); draw(); dialog.showModal();
}
