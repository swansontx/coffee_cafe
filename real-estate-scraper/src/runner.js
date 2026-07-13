import { scrapeCraigslistRent, scrapeCraigslistBusiness } from './sites/craigslist.js';
import { scrapeGenericSite } from './sites/genericHtmlSite.js';
import { TIER3_SITES } from './sites/tier3Configs.js';
import { normalizeListing } from './normalize.js';
import { upsertListing, markStaleExcept, getNewListings, markNotified } from './db.js';
import { buildDigest, sendDigest } from './mailer.js';

const DRY_RUN = process.argv.includes('--dry-run');

// Each adapter is (name, category, fn) - fn resolves to an array of raw
// listing objects in the shape normalizeListing() expects.
const ADAPTERS = [
  { name: 'craigslist-rent', fn: scrapeCraigslistRent },
  { name: 'craigslist-business', fn: scrapeCraigslistBusiness },
  ...TIER3_SITES.map((site) => ({ name: site.name, fn: () => scrapeGenericSite(site) })),
];

async function run() {
  const failedSources = [];
  let matchedCount = 0;
  let seenRawCount = 0;

  for (const adapter of ADAPTERS) {
    const seenIds = [];
    try {
      const raw = await adapter.fn();
      seenRawCount += raw.length;
      for (const rawListing of raw) {
        const normalized = normalizeListing(rawListing);
        if (!normalized.relevant || !normalized.withinBudget || !normalized.withinSqft) continue;
        upsertListing(normalized);
        seenIds.push(normalized.id);
        matchedCount += 1;
      }
      markStaleExcept(adapter.name, seenIds);
      console.log(`[ok] ${adapter.name}: ${raw.length} raw, ${seenIds.length} matched criteria`);
    } catch (err) {
      failedSources.push({ source: adapter.name, error: err.message });
      console.error(`[fail] ${adapter.name}: ${err.message}`);
    }
  }

  const newListings = getNewListings();
  console.log(`\n${seenRawCount} raw listings scanned, ${matchedCount} matched criteria, ${newListings.length} are new.`);

  if (newListings.length === 0 && failedSources.length === 0) {
    console.log('Nothing new, nothing failed - no email sent.');
    return;
  }

  if (DRY_RUN) {
    console.log('\n--- DRY RUN: digest that would be sent ---\n');
    console.log(buildDigest(newListings, failedSources));
    return;
  }

  if (newListings.length > 0) {
    await sendDigest(newListings, failedSources);
    for (const l of newListings) markNotified(l.id);
    console.log(`Digest sent with ${newListings.length} new listing(s).`);
  } else {
    console.log(`No new listings, but ${failedSources.length} source(s) failed - not emailing just for that (check logs). Consider alerting yourself if failures persist across runs.`);
  }
}

run().catch((err) => {
  console.error('Runner crashed:', err);
  process.exit(1);
});
