import { GAME } from '../domain/config.js';
const integer = value => Number.isSafeInteger(value) && value >= 0;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const safeId = id => /^los-[a-z0-9-]+$/.test(id);
export function createSave(now = Date.now()) {
  return { version: GAME.schemaVersion, revision: 0, createdAt: now, updatedAt: now,
    credits: GAME.welcomeCredits, tickets: GAME.maxTickets, ticketUpdatedAt: now,
    collection: {}, favorites: [], locked: [],
    stats: { boostersOpened: 0, cardsObtained: 0, cardsRecycled: 0, creditsSpent: 0 },
  };
}
export function validateSave(save) {
  if (!object(save) || save.version !== GAME.schemaVersion) throw new Error('Version de sauvegarde incompatible. Le fichier original est conservé.');
  for (const key of ['revision', 'createdAt', 'updatedAt', 'credits', 'tickets', 'ticketUpdatedAt']) {
    if (!integer(save[key])) throw new Error('Valeur de sauvegarde invalide : ' + key);
  }
  if (save.tickets > GAME.maxTickets || save.updatedAt < save.createdAt || !object(save.collection) || !object(save.stats)) throw new Error('Sauvegarde incohérente.');
  for (const [id, entry] of Object.entries(save.collection)) {
    if (!safeId(id) || !object(entry) || !integer(entry.count) || entry.count < 1 || !integer(entry.firstObtainedAt) || !integer(entry.lastObtainedAt) || entry.lastObtainedAt < entry.firstObtainedAt) throw new Error('Collection invalide.');
  }
  for (const key of ['favorites', 'locked']) {
    if (!Array.isArray(save[key]) || new Set(save[key]).size !== save[key].length || !save[key].every(id => typeof id === 'string' && safeId(id) && Object.hasOwn(save.collection, id))) throw new Error('Favoris ou verrous invalides.');
  }
  for (const key of ['boostersOpened', 'cardsObtained', 'cardsRecycled', 'creditsSpent']) if (!integer(save.stats[key])) throw new Error('Statistiques invalides.');
  return structuredClone(save);
}
export function parseSave(raw) {
  if (typeof raw !== 'string' || raw.length > 10_000_000) throw new Error('Fichier de sauvegarde invalide ou trop volumineux.');
  return validateSave(JSON.parse(raw));
}
export function serializeSave(save) { return JSON.stringify(validateSave(save), null, 2); }
