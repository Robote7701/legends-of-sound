import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const cwd = fileURLToPath(new URL('../', import.meta.url));
const run = (...args) => spawnSync(process.execPath, ['scripts/add-catalog-batch.js', ...args], { cwd, encoding: 'utf8', timeout: 5000 });

test('un lot publié ne peut pas être réappliqué ou remplacer son manifeste', async()=>{
  const manifest = new URL('../data/artist-additions/expansion-50-verified.json', import.meta.url);
  const before = await readFile(manifest, 'utf8');
  const result = run('--candidates=data/artist-additions/expansion-50.json', '--apply');
  assert.notEqual(result.status,0);
  assert.match(result.stderr,/déjà été appliqué/);
  assert.equal(await readFile(manifest,'utf8'),before);
});

test('un nombre de cartes invalide est refusé avant tout import',()=>{
  for(const count of ['0','-1','1.5','1001','NaN']){
    const result=run('--candidates=data/artist-additions/expansion-100.json','--count='+count);
    assert.notEqual(result.status,0);
    assert.match(result.stderr,/Nombre demandé invalide/);
  }
});
