import { validateCatalog, validateBoosters } from '../catalog/catalog.js';
export async function loadCatalog() {
  const names = ['artists', 'editions', 'boosters', 'retired-identifiers'];
  const [artists, editions, boosters, retiredIdentifiers] = await Promise.all(names.map(async name => {
    const response = await fetch(new URL('../../data/' + name + '.json', import.meta.url));
    if (!response.ok) throw new Error('Impossible de charger ' + name + ' (' + response.status + ').');
    return response.json();
  }));
  validateCatalog(artists, editions, { retiredIdentifiers });
  validateBoosters(boosters, editions);
  return { artists, editions, boosters };
}
