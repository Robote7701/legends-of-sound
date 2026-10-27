import { GAME, RARITIES } from './config.js';
import { matchesBooster } from '../catalog/catalog.js';

export function recharge(state, now = Date.now()) {
  const next = structuredClone(state);
  const time = Math.max(now, next.ticketUpdatedAt);
  if (next.tickets === GAME.maxTickets) next.ticketUpdatedAt = time;
  else {
    const earned = Math.floor((time - next.ticketUpdatedAt) / GAME.rechargeMs);
    next.tickets = Math.min(GAME.maxTickets, next.tickets + earned);
    next.ticketUpdatedAt = next.tickets === GAME.maxTickets ? time : next.ticketUpdatedAt + earned * GAME.rechargeMs;
  }
  return next;
}
export function nextTicketIn(state, now = Date.now()) {
  const current = recharge(state, now);
  return current.tickets === GAME.maxTickets ? 0 : Math.max(0, current.ticketUpdatedAt + GAME.rechargeMs - now);
}
export function quoteOpening(state, count, now = Date.now()) {
  if (!GAME.openingCounts.includes(count)) throw new Error('Nombre de boosters invalide.');
  const current = recharge(state, now);
  const tickets = Math.min(count, current.tickets), credits = (count - tickets) * GAME.boosterCost;
  return { count, tickets, credits, balance: current.credits - credits, affordable: current.credits >= credits };
}
export function randomFloat() {
  return crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
}
function random(rng) {
  const value = rng();
  if (!Number.isFinite(value) || value < 0 || value >= 1) throw new Error('Générateur de tirage invalide.');
  return value;
}
export function openingPools(artists, booster) {
  const eligible = artists.filter(card => matchesBooster(card, booster));
  const pools = Object.fromEntries(Object.keys(RARITIES).map(r => [r, eligible.filter(card => card.rarity === r)]));
  if (Object.values(pools).some(pool => !pool.length)) throw new Error('Ouverture indisponible : une rareté manque dans ce booster.');
  return pools;
}
export function drawCard(pools, rng = randomFloat) {
  const roll = random(rng); let threshold = 0;
  for (const [rarity, config] of Object.entries(RARITIES)) {
    threshold += config.probability;
    if (roll < threshold) {
      const pool = pools[rarity];
      return pool[Math.floor(random(rng) * pool.length)];
    }
  }
  throw new Error('Configuration de probabilités invalide.');
}
export function openBoosters(state, artists, booster, count, { now = Date.now(), rng = randomFloat, id = crypto.randomUUID(), approvedCredits = 0 } = {}) {
  const next = recharge(state, now), payment = quoteOpening(next, count, now);
  if (!payment.affordable) throw new Error('Sound Credits insuffisants.');
  if (payment.credits !== approvedCredits) throw new Error('Le coût a changé. Vérifiez le nouveau paiement.');
  const pools = openingPools(artists, booster), cards = [];
  for (let i = 0; i < count * GAME.cardsPerBooster; i++) {
    const card = drawCard(pools, rng), previous = next.collection[card.id];
    cards.push({ id: card.id, isNew: !previous });
    next.collection[card.id] = { count: (previous?.count || 0) + 1, firstObtainedAt: previous?.firstObtainedAt ?? now, lastObtainedAt: Math.max(previous?.lastObtainedAt || 0, now) };
  }
  next.tickets -= payment.tickets; next.credits -= payment.credits;
  next.stats.boostersOpened += count; next.stats.cardsObtained += cards.length; next.stats.creditsSpent += payment.credits;
  next.lastOpening = { id, boosterId: booster.id, openedAt: now, count, payment, cards };
  return next;
}
