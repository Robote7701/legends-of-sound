import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { validatePortrait } from '../src/catalog/portraits.js';
const root = new URL('../', import.meta.url);
const artists = JSON.parse(await readFile(new URL('data/artists.json', root)));
const reviewed = JSON.parse(await readFile(new URL('data/portraits-reviewed.json', root)));

test('50 visuels de légendaires : fichiers locaux identiques aux assets revus, crédits et licences conservés', async () => {
  assert.equal(reviewed.length, 50);
  assert.equal(new Set(reviewed.map(p => p.id)).size, 50);
  for (const artist of artists) {
    if (artist.rarity !== 'legendary') { assert.equal(artist.portrait, null); continue; }
    const { id, ...portrait } = reviewed.find(p => p.id === artist.id);
    assert.deepEqual(artist.portrait, portrait);
    validatePortrait(portrait);
    const bytes = await readFile(new URL(portrait.localPath, root));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), portrait.assetSha256, id);
    assert.ok(bytes.length > 1000);
    assert.ok(portrait.title && portrait.photographer && portrait.sourceUrl && portrait.licenseUrl);
  }
});

test('les illustrations sont identifiées et Miku conserve son attribution et la condition non commerciale', () => {
  const miku = artists.find(a => a.displayName === 'Hatsune Miku').portrait;
  assert.equal(miku.mediaType, 'illustration');
  assert.equal(miku.license, 'CC-BY-NC-3.0');
  assert.equal(miku.nonCommercialOnly, true);
  assert.match(miku.attribution, /Crypton Future Media/);
  assert.throws(() => validatePortrait({ ...miku, nonCommercialOnly: false }));
  assert.throws(() => validatePortrait({ ...miku, imageUrl: 'https://example.com/unverified.jpg' }));
  assert.throws(() => validatePortrait({ ...miku, localPath: 'assets/images/artists/../../private.jpg' }));
  assert.equal(artists.find(a => a.displayName === 'Teresa Teng').portrait.mediaType, 'illustration');
});
