export const GAME = Object.freeze({
  storageKey: 'legends-of-sound-v1', schemaVersion: 1,
  welcomeCredits: 500, maxTickets: 10, rechargeMs: 5 * 60 * 1000,
  boosterCost: 100, cardsPerBooster: 5,
  openingCounts: Object.freeze([1, 3, 5, 10]),
});
export const RARITIES = Object.freeze({
  legendary: Object.freeze({ label: 'Légendaire', probability: 0.04, recycle: 150 }),
  epic: Object.freeze({ label: 'Épique', probability: 0.16, recycle: 60 }),
  rare: Object.freeze({ label: 'Rare', probability: 0.35, recycle: 25 }),
  common: Object.freeze({ label: 'Commune', probability: 0.45, recycle: 10 }),
});
