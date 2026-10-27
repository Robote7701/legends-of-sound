const cache = new Map();
export async function loadEvidence(artist) {
  const shard = artist.careerEvidence?.shard;
  if (!/^[a-z0-9-]+\.json$/.test(shard || '')) throw new Error('Référence de source invalide.');
  if (!cache.has(shard)) {
    const request = fetch(new URL('../../data/evidence/' + shard, import.meta.url)).then(async response => {
      if (!response.ok) throw new Error('Sources temporairement indisponibles.');
      return response.json();
    }).catch(error => { cache.delete(shard); throw error; });
    cache.set(shard, request);
  }
  const evidence = (await cache.get(shard))[artist.id];
  if (!evidence || evidence.source?.url !== artist.careerEvidence.source.url) throw new Error('Sources incohérentes pour cette carte.');
  return evidence;
}
