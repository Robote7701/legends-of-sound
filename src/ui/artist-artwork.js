import { el } from './dom.js';
import { artDirection } from '../catalog/art-direction.js';

export function artistArtwork(artist) {
  const art = artDirection(artist);
  const holder = el('div', '', `artist-art type-art style-${art.style} composition-${art.variant}`);
  holder.setAttribute('aria-hidden', 'true'); // Le nom accessible figure déjà sur la carte ou la fiche.
  holder.style.setProperty('--paper', art.color);
  holder.style.setProperty('--type-scale', art.scale.toFixed(2));
  const top = el('span', '', 'type-top');
  top.append(el('span', 'LOS / 01'), el('span', artist.id.replace('los-', 'N° ')));
  holder.append(top, el('span', '', 'type-motif'), el('span', art.name, 'type-name'), el('span', art.label, 'type-caption'));
  const bottom = el('span', '', 'type-bottom');
  bottom.append(el('span', art.genre), el('span', artist.type === 'group' ? 'GROUPE' : 'SOLO'));
  holder.append(bottom);
  return holder;
}
