// Tier 3: smaller Portland-area commercial brokers with no saved-search
// alert feature, so we scrape their public listings pages ourselves.
//
// IMPORTANT: this repo was built in a sandboxed environment with no
// internet access, so none of these URLs or selectors have been verified
// against the live sites. Each entry has `selectors: null` and must be
// completed before it'll do anything - the runner skips (and warns about)
// any config with no selectors instead of guessing wrong.
//
// To wire one up, from a machine with real internet:
//   npm run inspect -- <name>
// That dumps the page title, size, and candidate repeating-element
// selectors to help you find the right `item`/`title`/`link`/etc. CSS
// selectors quickly. Fill them in below, flip `verified` to true.

export const TIER3_SITES = [
  {
    name: 'kidder-mathews',
    category: 'lease',
    url: 'https://www.kiddermathews.com/properties/?market=portland-or&type=lease',
    baseUrl: 'https://www.kiddermathews.com',
    notes: 'Regional CRE brokerage with a Portland office. Confirm the properties-search URL and filters match the live site.',
    selectors: null,
    verified: false,
  },
  {
    name: 'capacity-commercial',
    category: 'lease',
    url: 'https://www.capacitycommercial.com/listings/',
    baseUrl: 'https://www.capacitycommercial.com',
    notes: 'Portland-based commercial brokerage. Confirm listings page URL - may be /properties/ instead of /listings/.',
    selectors: null,
    verified: false,
  },
  {
    name: 'norris-stevens',
    category: 'lease',
    url: 'https://www.norris-stevens.com/available-properties/',
    baseUrl: 'https://www.norris-stevens.com',
    notes: 'Portland commercial brokerage. Confirm the available-properties URL and whether retail/restaurant space has its own filter.',
    selectors: null,
    verified: false,
  },
  {
    name: 'svn-portland',
    category: 'lease',
    url: 'https://svn.com',
    baseUrl: 'https://svn.com',
    notes: 'SVN franchises are independently branded per market - find the actual Portland-area SVN office name/URL first (svn.com office directory), this is a placeholder.',
    selectors: null,
    verified: false,
  },
  {
    name: 'transworld-business-advisors',
    category: 'business_for_sale',
    url: 'https://www.tworld.com/offices/portland/businesses-for-sale/',
    baseUrl: 'https://www.tworld.com',
    notes: 'Confirm the Portland office slug matches tworld.com\'s current URL pattern.',
    selectors: null,
    verified: false,
  },
  {
    name: 'we-sell-restaurants',
    category: 'business_for_sale',
    url: 'https://www.wesellrestaurants.com/listings/?state=OR',
    baseUrl: 'https://www.wesellrestaurants.com',
    notes: 'Restaurant-specific brokerage with nationwide listings; confirm the OR/Portland filter param.',
    selectors: null,
    verified: false,
  },
];
