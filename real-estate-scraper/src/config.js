import 'dotenv/config';

export const CRITERIA = {
  // Lease budget: listings priced above LEASE_BUDGET_MONTHLY * BUDGET_SLACK are dropped.
  leaseBudgetMonthly: Number(process.env.LEASE_BUDGET_MONTHLY) || 4000,
  // Business-for-sale budget: same slack rule applied to total asking price.
  businessBudgetTotal: Number(process.env.BUSINESS_BUDGET_TOTAL) || 200000,
  // Multiply the budget by this to get the actual cutoff - keeps near-misses visible
  // instead of silently dropping a listing that's 5% over.
  budgetSlack: 1.25,

  sqftMin: Number(process.env.SQFT_MIN) || 900,
  sqftMax: Number(process.env.SQFT_MAX) || 1800,

  // No neighborhood filter (open to anywhere in Portland metro) - see CAFE_SPACE_FINDER_PLAN.md.
};

// Listings are kept only if the title/description mentions at least one of these -
// Craigslist and the broker sites list all commercial space, not just food/cafe space.
export const RELEVANCE_KEYWORDS = [
  'cafe', 'café', 'coffee', 'espresso', 'restaurant', 'bakery', 'deli',
  'food service', 'commercial kitchen', 'kitchen', 'bistro', 'eatery',
  'food truck', 'catering', 'bar and grill', 'brewery', 'coffee shop',
  'coffee house', 'tea house', 'tea shop',
];

// Presence of any of these in the listing text is a decent signal the space
// already has food-service infrastructure. Absence doesn't mean "no" - it's
// "unknown", since most listings don't itemize equipment.
export const KITCHEN_SIGNAL_KEYWORDS = [
  'hood', 'grease trap', 'grease interceptor', 'walk-in cooler', 'walk-in',
  'type i hood', 'type ii hood', '3-compartment sink', 'commercial kitchen',
  'ansul', 'turnkey restaurant', 'turnkey kitchen',
];

export const EMAIL = {
  smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
  smtpPort: Number(process.env.SMTP_PORT) || 465,
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  to: process.env.DIGEST_TO,
  from: process.env.DIGEST_FROM || process.env.SMTP_USER,
};

export const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

export const FETCH_TIMEOUT_MS = 15000;
