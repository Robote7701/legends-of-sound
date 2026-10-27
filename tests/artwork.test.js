import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { artDirection, ART_STYLES, GENRE_STYLES } from '../src/catalog/art-direction.js';
const artists = JSON.parse(await readFile(new URL('../data/artists.json', import.meta.url)));

test('toutes les cartes sont typographiques et chaque genre dispose d’une direction artistique', () => {
  for (const artist of artists) {
    assert.equal(artist.portrait, null);
    for (const genre of artist.genres) assert.ok(GENRE_STYLES[genre], genre);
    const art = artDirection(artist);
    assert.ok(ART_STYLES[art.style]);
    assert.equal(art.name, artist.displayName || artist.name);
    assert.ok(art.scale > 0 && art.scale <= 36);
    assert.deepEqual(artDirection(artist), art);
  }
});
test('le genre choisit le style sans inférence par pays, avec repli extensible', () => {
  const base = { id: 'los-test', name: 'Artiste', genres: ['metal', 'j-pop'], country: 'JP' };
  assert.equal(artDirection(base).style, 'metal');
  assert.deepEqual(artDirection(base), artDirection({ ...base, country: 'US' }));
  assert.equal(artDirection({ ...base, genres: ['vocaloid', 'electronic'] }).style, 'asia');
  assert.equal(artDirection({ ...base, genres: ['nouveau-genre'] }).style, 'world');
});
