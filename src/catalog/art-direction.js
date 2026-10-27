// Direction éditoriale, fondée sur les genres ; aucun logo ou portrait externe.
export const ART_STYLES = {
  rock: { label: 'AMPLIFIED', colors: ['#f05b3e', '#efb35c', '#b7c59b'] },
  metal: { label: 'HIGH VOLTAGE', colors: ['#b9b8cb', '#d6554d', '#bda5d4'] },
  electronic: { label: 'FREQUENCY', colors: ['#92f2b6', '#7ee6ef', '#b9a1ff'] },
  hiphop: { label: 'ON REPEAT', colors: ['#e9f16c', '#f2a866', '#c9a9ed'] },
  pop: { label: 'IN FULL COLOR', colors: ['#f3a0c5', '#beadf3', '#a8d9ed'] },
  asia: { label: 'NEW WAVE', colors: ['#a5e8e6', '#f6a5cc', '#c7b4fa'] },
  jazz: { label: 'DEEP LISTENING', colors: ['#e8c996', '#b9cec1', '#e9b3a5'] },
  groove: { label: 'FEEL THE GROOVE', colors: ['#e9be63', '#b7cc7d', '#ef9d78'] },
  world: { label: 'SOUND WITHOUT BORDERS', colors: ['#dfb598', '#c6cfaa', '#e5bd74'] },
};
const families = {
  rock: ['rock', 'punk', 'post-rock', 'j-rock'], metal: ['metal'],
  electronic: ['electronic', 'house', 'techno', 'synthwave', 'ambient', 'electro-swing'],
  hiphop: ['hip-hop', 'rap', 'trap'], pop: ['pop', 'rnb', 'dance-pop', 'turkish-pop', 'arabic-pop'],
  asia: ['j-pop', 'k-pop', 'vocaloid', 'cantopop', 'mandopop'],
  jazz: ['jazz', 'blues', 'soul', 'bossa-nova'],
  groove: ['funk', 'disco', 'reggae', 'dub', 'ska', 'afrobeat', 'afrobeats'],
  world: ['latin', 'world', 'chanson', 'classical', 'arabic-classical', 'corridos-tumbados', 'desert-blues', 'fado', 'filmi', 'flamenco-pop', 'hindustani-classical', 'isicathamiya', 'morna', 'mpb', 'qawwali', 'reggaeton', 'rumba', 'samba', 'son-cubano', 'tropicalia'],
};
export const GENRE_STYLES = Object.fromEntries(Object.entries(families).flatMap(([style, genres]) => genres.map(genre => [genre, style])));
export function artDirection(artist) {
  const genre = artist.genres.find(g => GENRE_STYLES[g]);
  const style = GENRE_STYLES[genre] || 'world';
  const seed = [...artist.id].reduce((hash, char) => (hash * 31 + char.codePointAt(0)) >>> 0, 0);
  const name = artist.displayName || artist.name;
  const longest = Math.max(...name.split(/\s+/u).map(word => [...word].length), 1);
  // Contraintes de largeur et de surface pour les noms courts à plusieurs mots.
  const scale = Math.min(32, 118 / longest, 300 / [...name].length);
  return { style, ...ART_STYLES[style], color: ART_STYLES[style].colors[seed % 3], variant: seed % 3, name, scale, genre: genre || artist.genres[0] };
}
