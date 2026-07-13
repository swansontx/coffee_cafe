import Parser from 'rss-parser';
import { isRelevant } from '../normalize.js';

const parser = new Parser({ timeout: 15000 });

// Craigslist supports RSS on any search page by appending &format=rss.
// Category codes below are best-guess (office/commercial = "off",
// business/commercial for sale = "bfs") - VERIFY these still match the
// live site before relying on this (visit portland.craigslist.org, run the
// search manually via the site's category filters, and confirm the URL).
// We deliberately don't pass a `query=` term to Craigslist itself - its
// search only ANDs terms, so a single query can't express "cafe OR coffee OR
// restaurant OR ...". Instead we pull the whole category feed and filter
// client-side with the shared RELEVANCE_KEYWORDS list (see normalize.js).
const RENT_FEED_URL = 'https://portland.craigslist.org/search/off?format=rss';
const BUSINESS_FEED_URL = 'https://portland.craigslist.org/search/bfs?format=rss';

async function scrapeFeed(feedUrl, source, category) {
  const feed = await parser.parseURL(feedUrl);
  const listings = [];
  for (const item of feed.items || []) {
    const text = `${item.title || ''} ${item.contentSnippet || ''}`;
    if (!isRelevant(text)) continue;
    if (!item.link || !item.title) continue;
    listings.push({
      source,
      category,
      title: item.title,
      url: item.link,
      address: null, // Craigslist usually embeds neighborhood in the title, e.g. "(SE Portland)"
      priceText: text,
      sqftText: text,
      descriptionText: item.contentSnippet || '',
    });
  }
  return listings;
}

export async function scrapeCraigslistRent() {
  return scrapeFeed(RENT_FEED_URL, 'craigslist-rent', 'lease');
}

export async function scrapeCraigslistBusiness() {
  return scrapeFeed(BUSINESS_FEED_URL, 'craigslist-business', 'business_for_sale');
}
