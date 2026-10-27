import { el } from './dom.js';

// Illustrations vectorielles originales. Aucun portrait, logo ou visuel externe.
const scenes = {
  'all-stars': ['THE HEADLINERS', '#f2a448', '<path d="m160 82 17 35 39 6-28 28 7 40-35-19-35 19 7-40-28-28 39-6Z"/><path d="m53 224 9 18 20 3-15 14 4 20-18-10-18 10 4-20-15-14 20-3Zm215-56 7 15 17 2-12 12 3 17-15-8-15 8 3-17-12-12 17-2Z"/><path class="scene-line" d="m24 172 31 13m232 127-30-14M78 73l20 25m157-34-21 32"/>'],
  groups: ['LOUDER TOGETHER', '#e76649', '<g class="scene-line"><path d="M30 247h260M57 247v-78m-13 0h26m-13 14 28 18m178 46v-78m-13 0h26m-13 14-28 18M95 248v-46m130 46v-46"/><circle cx="160" cy="218" r="42"/><circle cx="160" cy="218" r="31"/><path d="m124 183-17-29m89 29 17-29m-91 8H79m119 0h43M97 162v84m126-84v84"/></g><path d="m154 197 20 21-20 21Z"/>'],
  solo: ['ONE VOICE. INFINITE ECHO.', '#6b53c6', '<g transform="rotate(25 160 177)"><rect x="133" y="79" width="54" height="104" rx="27"/><path class="scene-line" d="M119 141v16a41 41 0 0 0 82 0v-16m-41 57v65m-28 0h56M143 104h34m-34 16h34m-34 16h34m-34 16h34"/></g><path class="scene-line" d="M51 126q-23 51 0 102m218-102q23 51 0 102M34 102q-36 75 0 150m252-150q36 75 0 150"/>'],
  'rock-metal': ['TURN IT UP TO ELEVEN', '#842c25', '<path d="m206 43 21 10-19 40-14-6Z"/><path class="scene-line" d="m201 84-69 119m79-112-68 120"/><path d="M139 176c-23-8-28 13-39 14-13 2-16-13-26-8-18 11-17 32-3 42-33 26-10 69 21 66 29-3 40-20 36-38 23-3 39-24 26-40-10-11-20-8-15-36Z"/><path class="scene-line" d="m91 256 53-91m-64 77 25 14"/><path d="m250 131-30 45h22l-25 52 51-65h-23l27-32ZM57 78l-23 34h17l-19 40 39-50H54l20-24Z"/>'],
  electronic: ['AFTER DARK FREQUENCIES', '#7736e7', '<g class="scene-line"><path d="m40 245 120-66 120 66M26 267l134-75 134 75M12 289l148-83 148 83M78 282l82-90 82 90m-131 12 49-102 49 102M37 105h38V71h38v34h38V71h38v34h38V71h38v34h26"/><circle cx="160" cy="164" r="59"/><circle cx="160" cy="164" r="43"/></g><path d="m150 143 32 21-32 21Z"/>'],
  'pop-rnb': ['FEEL EVERY NOTE', '#a33378', '<path d="M160 245c-18-16-88-65-88-106 0-43 55-57 88-16 33-41 88-27 88 16 0 41-70 90-88 106Z"/><path class="scene-line" d="m56 83 8 17 19 3-14 13 4 19-17-9-17 9 4-19-14-13 19-3Zm210 125 7 15 17 2-12 12 3 17-15-8-15 8 3-17-12-12 17-2ZM229 67v37m-18-18h36M74 260v30m-15-15h30"/>'],
  'hip-hop': ['FROM THE BLOCK TO THE WORLD', '#c05f29', '<g class="scene-line"><path d="M22 285v-78h34v-30h28v108m152 0V165h25v26h35v94M38 225v9m0 16v9m33-60v12m181-25v12m25 16v12"/></g><g transform="rotate(-24 160 168)"><rect x="133" y="78" width="54" height="94" rx="25"/><path class="scene-line" d="m143 94 34 49m-34-32 29 43m-20-68 25 37m-40 39-8 43h62l-8-43m-35 43v72m25-72v72m-35 0h45"/></g><path d="m78 97 8-29 20 16 19-16 6 29Z"/>'],
  'asia-wave': ['A NEW WAVE IS RISING', '#b448bc', '<circle cx="208" cy="112" r="49"/><path class="scene-line" d="M20 248q38-53 76-5t76 0 76 0 76-5M10 269q38-53 76-5t76 0 76 0 76-5M0 290q38-53 76-5t76 0 76 0 76-5M52 107l16-17 16 17-16 17Zm43 60 10-11 11 11-11 11Z"/><path d="m150 110 17 25 30 7-25 18-7 30-18-25-30-7 25-18Z"/>'],
  'roots-groove': ['DEEP ROOTS. GOOD VIBRATIONS.', '#b97930', '<path class="scene-line" d="M179 78v100c0 27 37 21 37 0v-32h30v36c0 67-97 68-97 0V78Zm-30 17h30m-30 17h30m-30 17h30m37 23h30M82 100v69m0-54 29-10v52"/><ellipse cx="70" cy="171" rx="16" ry="10"/><ellipse cx="99" cy="159" rx="16" ry="10"/><path class="scene-line" d="M38 252q25-26 50 0t50 0 50 0 50 0 50 0M38 272q25-26 50 0t50 0 50 0 50 0 50 0"/>'],
};

export function boosterArtwork(booster, interactive = false) {
  const [caption, ink, illustration] = booster.id === 'rap' ? ['WORDS HIT HARDER', '#8d3526', scenes['hip-hop'][2]] : scenes[booster.id] || scenes['all-stars'];
  const wrapper = el(interactive ? 'button' : 'div', '', 'booster-object' + (interactive ? ' sealed-pack' : ''));
  wrapper.style.setProperty('--pack', booster.color || '#d9ff65');
  wrapper.style.setProperty('--pack-ink', ink);
  if (interactive) { wrapper.type = 'button'; wrapper.setAttribute('aria-label', 'Déchirer le booster ' + booster.name); }
  else wrapper.setAttribute('aria-hidden', 'true');
  const top = el('span', '', 'foil-seal foil-top');
  const front = el('span', '', 'booster-front');
  front.append(el('span', 'LOS / MUSIC TRADING CARDS', 'pack-brand'), el('span', 'ÉDITION 01 — ORIGINS', 'pack-edition'), el('strong', booster.name, 'pack-name'));
  const art = el('span', '', 'pack-illustration');
  // Only static, locally authored paths enter the SVG. Artist data never enters markup.
  art.innerHTML = '<svg viewBox="0 0 320 320" xmlns="http://www.w3.org/2000/svg" focusable="false" aria-hidden="true"><g class="art-orbits"><circle cx="160" cy="165" r="128"/><circle cx="160" cy="165" r="114"/></g><g class="vinyl-record"><circle cx="160" cy="165" r="100" fill="#111017"/><g fill="none" stroke="#ffffff24" stroke-width="1">' + [91,85,79,73,67,61,55,49].map(r => '<circle cx="160" cy="165" r="'+r+'"/>').join('') + '</g><path d="M92 92a100 100 0 0 1 128 0l-37 47a40 40 0 0 0-46 0Z" fill="#ffffff0e"/><circle cx="160" cy="165" r="33" fill="currentColor"/><circle cx="160" cy="165" r="5" fill="#111017"/></g><g class="scene-art">' + illustration + '</g></svg>';
  front.append(art, el('span', caption, 'pack-caption'));
  const bottom = el('span', '', 'pack-bottom'); bottom.append(el('b', '5'), el('span', 'CARTES À\nCOLLECTIONNER'), el('span', 'VOL.\n01', 'pack-volume')); front.append(bottom);
  const seal = el('span', 'LEGENDS OF SOUND / ORIGINAL SERIES', 'foil-seal foil-bottom');
  wrapper.append(top, front, seal);
  return wrapper;
}
