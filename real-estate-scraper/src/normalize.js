import crypto from 'crypto';
import { RELEVANCE_KEYWORDS, KITCHEN_SIGNAL_KEYWORDS, CRITERIA } from './config.js';

export function stableId(source, url) {
  return crypto.createHash('sha1').update(`${source}:${url}`).digest('hex');
}

/** "$3,200/mo", "$3,200/month", "3200" -> { amount: 3200, unit: 'mo' } */
export function parseLeasePrice(text) {
  if (!text) return { amount: null, unit: 'mo' };
  const amount = firstNumber(text);
  const unit = /\/\s*(yr|year|sf|sqft)/i.test(text) ? 'sqft_yr' : 'mo';
  return { amount, unit };
}

/** "$185,000", "185000" -> { amount: 185000, unit: 'total' } */
export function parseBusinessPrice(text) {
  return { amount: firstNumber(text), unit: 'total' };
}

/** "1,350 SF", "1350 sq ft" -> 1350 */
export function parseSqft(text) {
  return firstNumber(text);
}

function firstNumber(text) {
  const match = String(text).replace(/,/g, '').match(/[\d]+(\.\d+)?/);
  return match ? Number(match[0]) : null;
}

export function isRelevant(text) {
  const lower = String(text || '').toLowerCase();
  return RELEVANCE_KEYWORDS.some((kw) => lower.includes(kw));
}

export function guessKitchenEquipped(text) {
  const lower = String(text || '').toLowerCase();
  return KITCHEN_SIGNAL_KEYWORDS.some((kw) => lower.includes(kw)) ? 'yes' : 'unknown';
}

/** True if a lease/business listing is within budget * slack. Missing price passes through (surface it, let a human judge). */
export function withinBudget(category, amount) {
  if (amount == null) return true;
  const ceiling =
    category === 'lease'
      ? CRITERIA.leaseBudgetMonthly * CRITERIA.budgetSlack
      : CRITERIA.businessBudgetTotal * CRITERIA.budgetSlack;
  return amount <= ceiling;
}

/** True if sqft is within [min, max] of CRITERIA, or unknown (surface it). */
export function withinSqftRange(sqft) {
  if (sqft == null) return true;
  return sqft >= CRITERIA.sqftMin && sqft <= CRITERIA.sqftMax;
}

/**
 * Turns a raw adapter result into the shape db.js expects.
 * Raw shape: { source, category, title, url, address, priceText, sqftText, descriptionText }
 */
export function normalizeListing(raw) {
  const { amount: price, unit: priceUnit } =
    raw.category === 'lease' ? parseLeasePrice(raw.priceText) : parseBusinessPrice(raw.priceText);
  const sqft = parseSqft(raw.sqftText);
  const combinedText = `${raw.title} ${raw.descriptionText || ''}`;

  return {
    id: stableId(raw.source, raw.url),
    source: raw.source,
    category: raw.category,
    title: raw.title,
    address: raw.address || null,
    sqft,
    price,
    priceUnit,
    kitchenEquipped: guessKitchenEquipped(combinedText),
    url: raw.url,
    relevant: isRelevant(combinedText),
    withinBudget: withinBudget(raw.category, price),
    withinSqft: withinSqftRange(sqft),
  };
}
