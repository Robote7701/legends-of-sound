export function ageAt(birthDate, deathDate = null, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate || '')) return null;
  if (deathDate !== null && !/^\d{4}-\d{2}-\d{2}$/.test(deathDate)) return null;
  const birth = new Date(birthDate + 'T00:00:00Z');
  const end = deathDate ? new Date(deathDate + 'T00:00:00Z') : now;
  if (!Number.isFinite(birth.getTime()) || !Number.isFinite(end.getTime()) || end < birth) return null;
  if (birth.toISOString().slice(0, 10) !== birthDate || (deathDate && end.toISOString().slice(0, 10) !== deathDate)) return null;
  let age = end.getUTCFullYear() - birth.getUTCFullYear();
  if (end.getUTCMonth() < birth.getUTCMonth() || (end.getUTCMonth() === birth.getUTCMonth() && end.getUTCDate() < birth.getUTCDate())) age--;
  return age;
}

export function filterArtists(artists, filters, boosters) {
  const search = (filters.search || '').normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase('fr');
  const booster = boosters.find(b => b.id === filters.booster);
  return artists.filter(a => {
    const names = [a.name, a.displayName, ...a.aliases].join(' ').normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase('fr');
    return names.includes(search) && (!filters.type || a.type === filters.type) && (!filters.rarity || a.rarity === filters.rarity)
      && (!filters.genre || a.genres.includes(filters.genre))
      && (!booster || (a.editionId === booster.editionId && (!booster.filter.types || booster.filter.types.includes(a.type)) && (!booster.filter.genresAny || a.genres.some(g => booster.filter.genresAny.includes(g)))));
  }).sort((a, b) => {
    const exact = artist => [artist.name, artist.displayName].some(name => name.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase('fr') === search);
    return Number(exact(b)) - Number(exact(a)) || (a.displayName || a.name).localeCompare(b.displayName || b.name, 'fr');
  });
}
