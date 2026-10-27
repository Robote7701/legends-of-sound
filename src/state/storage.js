import { GAME } from '../domain/config.js';
import { createSave, parseSave, serializeSave, validateSave } from './schema.js';
export class SaveStore {
  constructor(storage) { this.storage = storage; this.raw = undefined; this.state = null; }
  load(now = Date.now()) {
    // Read/parse errors propagate. Never replace a broken or future save with defaults.
    const raw = this.storage.getItem(GAME.storageKey);
    const state = raw === null ? createSave(now) : parseSave(raw);
    this.raw = raw; this.state = state;
    return structuredClone(state);
  }
  commit(next, now = Date.now()) {
    if (!this.state) throw new Error('Sauvegarde non chargée.');
    if (this.storage.getItem(GAME.storageKey) !== this.raw) throw new Error('La sauvegarde a changé dans un autre onglet. Rechargez la page.');
    const state = validateSave({ ...next, revision: this.state.revision + 1, updatedAt: Math.max(now, this.state.createdAt) });
    const raw = serializeSave(state);
    // setItem is atomic: memory advances only after durable storage succeeds.
    this.storage.setItem(GAME.storageKey, raw);
    this.raw = raw; this.state = state;
    return structuredClone(state);
  }
  export() { if (!this.state) throw new Error('Sauvegarde indisponible.'); return serializeSave(this.state); }
  import(raw) {
    const next = parseSave(raw);
    if (!this.state) throw new Error('Sauvegarde indisponible. Exportez les données brutes avant toute restauration.');
    // Keep an exact backup before replacing an existing collection; a quota failure aborts.
    if (this.storage.getItem(GAME.storageKey) !== this.raw) throw new Error('Conflit entre onglets. Rechargez la page.');
    this.storage.setItem(GAME.storageKey + '-before-import', this.export());
    return this.commit(next);
  }
}
// Web Locks serialize application writes across tabs. Without them the app stays read-only.
export async function withSaveLock(operation) {
  if (!globalThis.navigator?.locks) throw new Error('Ce navigateur ne permet pas une écriture sûre. Utilisez un navigateur moderne.');
  return navigator.locks.request(GAME.storageKey, operation);
}
