import { claimValues } from './identity.js';

export function wikidataDate(value) {
  if (!value || !/^\+\d{4}-/.test(value.time || '') || value.precision < 9) return null;
  const date = value.time.slice(1, 11);
  return date.slice(0, value.precision === 9 ? 4 : value.precision === 10 ? 7 : 10);
}
export function evidenceIds(entity) {
  return ['P166', 'P800', 'P136'].flatMap(property => claimValues(entity, property).map(value => value.id).filter(Boolean));
}
export function extractEvidence(entity, labels, fetchedAt) {
  const statements = property => {
    const rows = (entity.claims?.[property] || []).filter(s => s.rank !== 'deprecated' && s.mainsnak?.snaktype === 'value');
    const preferred = rows.filter(s => s.rank === 'preferred');
    return preferred.length ? preferred : rows;
  };
  const reference = row => ({ statementId: row.id || null, references: row.references || [] });
  const items = property => statements(property).flatMap(row => {
    const id = row.mainsnak.datavalue?.value?.id;
    const name = labels.get(id);
    return id && name ? [{ id, name, ...reference(row) }] : [];
  });
  const dates = statements('P2031').flatMap(row => {
    const value = wikidataDate(row.mainsnak.datavalue?.value);
    return value ? [{ value, precision: row.mainsnak.datavalue.value.precision, ...reference(row) }] : [];
  }).sort((a,b)=>a.value.localeCompare(b.value));
  return {
    source: { url: 'https://www.wikidata.org/wiki/' + entity.id, revision: entity.lastrevid || null, accessedAt: fetchedAt, license: 'CC0-1.0' },
    awards: items('P166'), notableWorks: items('P800'), genres: items('P136'),
    careerStart: dates[0] || null,
  };
}
