import { readFile } from 'node:fs/promises';
import { validateCatalog, validateBoosters, boosterAvailability } from '../src/catalog/catalog.js';
const read = async name => JSON.parse(await readFile(new URL('../data/' + name + '.json', import.meta.url), 'utf8'));
const artists = await read('artists'), editions = await read('editions'), boosters = await read('boosters');
validateCatalog(artists, editions, { requireComplete: process.argv.includes('--complete'), retiredIdentifiers: await read('retired-identifiers') });
validateBoosters(boosters, editions);
console.log(artists.length + ' carte(s) vérifiée(s) déclarée(s).');
for (const booster of boosters) console.log(booster.name, boosterAvailability(artists, booster));
