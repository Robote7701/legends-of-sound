import { el } from './dom.js';
import { loadEvidence } from '../services/evidence.js';
function sourceLink(text, url) {
  try {
    if (!['https:', 'http:'].includes(new URL(url).protocol)) return null;
    const link = el('a', text); link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer'; return link;
  } catch { return null; }
}
export function evidenceView(artist) {
  const details = el('details', '', 'evidence-details');
  const summary = el('summary', 'Sources des éléments de carrière');
  const body = el('div'); details.append(summary, body);
  let loaded = false, loading = false;
  details.addEventListener('toggle', async () => {
    if (!details.open || loaded || loading) return;
    loading = true; body.replaceChildren(el('p', 'Chargement des sources…', 'muted'));
    try {
      const proof = await loadEvidence(artist);
      body.replaceChildren();
      const sections = [['Distinctions', 'P166', proof.awards], ['Œuvres notables', 'P800', proof.notableWorks], ['Genres dans la source', 'P136', proof.genres], ['Début d’activité', 'P2031', proof.careerStart ? [{ ...proof.careerStart, name: proof.careerStart.value }] : []]];
      for (const [title, property, rows] of sections) {
        if (!rows.length) continue;
        const list = el('ul');
        for (const row of rows) {
          const item = el('li', row.name + ' · ');
          item.append(sourceLink('Wikidata', proof.source.url + '#' + property));
          const urls = [...new Set((row.references || []).flatMap(ref => (ref.snaks?.P854 || []).map(snak => snak.datavalue?.value)).filter(url => typeof url === 'string'))];
          for (const [index, url] of urls.entries()) { const link = sourceLink('Source ' + (index + 1), url); if (link) item.append(document.createTextNode(' · '), link); }
          list.append(item);
        }
        body.append(el('h4', title), list);
      }
      if (!body.childNodes.length) body.append(el('p', 'Aucun élément de carrière supplémentaire disponible dans cette source.', 'muted'));
      loaded = true;
    } catch (error) { body.replaceChildren(el('p', error.message + ' Refermez puis rouvrez cette rubrique pour réessayer.', 'notice error')); }
    finally { loading = false; }
  });
  return details;
}
