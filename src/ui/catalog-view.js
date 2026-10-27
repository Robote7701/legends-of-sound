import { el } from './dom.js';
import { artistArtwork } from './artist-artwork.js';
import { RARITIES } from '../domain/config.js';
import { ageAt, filterArtists } from '../catalog/details.js';

function link(text, url) {
  const node = el('a', text); node.href = url; node.target = '_blank'; node.rel = 'noopener noreferrer'; return node;
}
export function showArtist(artist, opener) {
  const dialog = el('dialog', '', 'artist-dialog');
  const close = el('button', 'Fermer ×', 'secondary close-dialog');
  close.onclick = () => dialog.close();
  const heading = el('h2', artist.displayName || artist.name); heading.id = 'artist-dialog-title';
  dialog.setAttribute('aria-labelledby', heading.id);
  dialog.append(close, artistArtwork(artist), el('div', RARITIES[artist.rarity].label + ' / ' + artist.id, 'eyebrow'), heading);
  if (artist.name !== artist.displayName) dialog.append(el('p', 'Nom MusicBrainz : ' + artist.name, 'muted'));
  const table = el('dl', '', 'facts');
  const fact = (label, value) => {
    if (value !== null && value !== undefined && value !== '') table.append(el('dt', label), el('dd', String(value)));
  };
  fact('Type', artist.entityType === 'Character' ? 'Artiste virtuel / personnage Vocaloid' : artist.type === 'group' ? 'Groupe' : 'Artiste solo');
  fact('Genres (classement éditorial)', artist.genres.join(' · '));
  fact('Pays associé par MusicBrainz', artist.country ? artist.country + (artist.area ? ' — ' + artist.area : '') : null);
  fact('Nationalité', artist.nationality);
  if (artist.type === 'group') {
    fact('Formation', artist.formationDate);
    fact('Membres documentés (liste partielle)', artist.members?.map(m => m.name).join(', ') || null);
    fact('Anciens membres documentés (liste partielle)', artist.formerMembers?.map(m => m.name).join(', ') || null);
  } else {
    fact('Naissance', artist.birthDate); fact('Décès', artist.deathDate);
    const age = ageAt(artist.birthDate, artist.deathDate);
    fact(artist.deathDate ? 'Âge au décès' : 'Âge calculé', age === null ? null : age + ' ans');
    fact('Début de carrière', artist.careerStart);
  }
  fact('Pseudonymes et autres noms indexés', artist.aliases.length ? artist.aliases.slice(0, 15).join(' · ') : null);
  fact('Albums marquants', artist.notableAlbums?.join(' · ') || null);
  fact('Titres connus', artist.knownTracks?.join(' · ') || null);
  fact('Récompenses', artist.awards?.join(' · ') || null);
  dialog.append(table);
  if (artist.knownFor) dialog.append(el('h3', 'POURQUOI EST-IL CÉLÈBRE ?'), el('p', artist.knownFor));
  if (artist.biography) dialog.append(el('h3', 'Biographie'), el('p', artist.biography));
  dialog.append(el('h3', 'Sources & crédits'), link('MusicBrainz — identité et données CC0', artist.provenance.musicbrainz.url), el('br'), link('Wikidata — notice descriptive CC0', artist.provenance.wikidata.url));
  dialog.append(el('p', 'Identité croisée vérifiée le ' + artist.provenance.musicbrainz.verifiedAt.slice(0, 10) + '. Les genres et raretés sont des choix éditoriaux, sans mesure du talent.', 'muted'));
  dialog.addEventListener('close', () => { dialog.remove(); opener?.focus(); }, { once: true });
  dialog.addEventListener('click', event => { if (event.target === dialog) { const box = dialog.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close(); } });
  document.body.append(dialog); dialog.showModal();
}

export function catalogView(catalog, save) {
  const root = el('section');
  const controls = el('form', '', 'catalog-controls'); controls.onsubmit = event => event.preventDefault();
  const searchLabel = el('label', 'Rechercher un artiste');
  const search = el('input'); search.type = 'search'; search.placeholder = 'Nom ou pseudonyme…'; searchLabel.append(search); controls.append(searchLabel);
  const initialRarity = new URLSearchParams(location.hash.split('?')[1] || '').get('rarity') || '';
  const filters = { search: '', type: '', rarity: Object.hasOwn(RARITIES, initialRarity) ? initialRarity : '', genre: '', booster: '' };
  function select(labelText, key, values) {
    const label = el('label', labelText), input = el('select'); input.append(new Option('Tous', ''));
    for (const [value, text] of values) input.append(new Option(text, value));
    input.value = filters[key];
    input.onchange = () => { filters[key] = input.value; page = 0; draw(); }; label.append(input); controls.append(label);
  }
  select('Type', 'type', [['solo', 'Solo'], ['group', 'Groupe']]);
  select('Rareté', 'rarity', Object.entries(RARITIES).map(([key, value]) => [key, value.label]));
  select('Genre', 'genre', [...new Set(catalog.artists.flatMap(a => a.genres))].sort().map(g => [g, g]));
  select('Booster', 'booster', catalog.boosters.map(b => [b.id, b.name]));
  const count = el('p', '', 'muted'); count.setAttribute('role', 'status');
  const grid = el('div', '', 'artist-grid');
  const pagination = el('div', '', 'actions pagination');
  let page = 0;
  search.oninput = () => { filters.search = search.value; page = 0; draw(); };
  function draw() {
    const matches = filterArtists(catalog.artists, filters, catalog.boosters);
    const pages = Math.max(1, Math.ceil(matches.length / 40));
    grid.replaceChildren(); pagination.replaceChildren();
    count.textContent = matches.length + ' artiste(s) · page ' + (page + 1) + '/' + pages;
    if (!matches.length) grid.append(el('p', 'Aucun artiste ne correspond à ces filtres.'));
    for (const artist of matches.slice(page * 40, (page + 1) * 40)) {
      const card = el('button', '', 'artist-card rarity-' + artist.rarity);
      const owned = save?.collection[artist.id]?.count || 0;
      card.setAttribute('aria-label', (artist.displayName || artist.name) + ' — ouvrir la fiche');
      card.append(artistArtwork(artist), el('span', RARITIES[artist.rarity].label, 'rarity-label'), el('strong', artist.displayName || artist.name), el('span', artist.genres.slice(0, 3).join(' / '), 'card-genres'), el('span', owned ? 'Possédée ×' + owned : 'Non découverte', 'owned-label'));
      card.onclick = () => showArtist(artist, card); grid.append(card);
    }
    const previous = el('button', '← Précédent', 'secondary'); previous.disabled = page === 0;
    previous.onclick = () => { page--; draw(); root.scrollIntoView({ block: 'start' }); };
    const next = el('button', 'Suivant →', 'secondary'); next.disabled = page + 1 >= pages;
    next.onclick = () => { page++; draw(); root.scrollIntoView({ block: 'start' }); };
    pagination.append(previous, el('span', (page + 1) + ' / ' + pages), next);
  }
  root.append(controls, count, grid, pagination); draw(); return root;
}
