import * as cheerio from 'cheerio';
import { fetchText, resolveUrl, clean } from '../fetchHtml.js';

/**
 * Config-driven scraper for a single listings page. `siteConfig.selectors`
 * uses CSS selectors relative to each matched `item`:
 *   { item, title, link, address, price, sqft, description }
 * `link` is optional - if omitted, the item element itself is used for href.
 */
export async function scrapeGenericSite(siteConfig) {
  if (!siteConfig.selectors) {
    throw new Error(`${siteConfig.name}: no selectors configured yet - run "npm run inspect -- ${siteConfig.name}" and fill in src/sites/tier3Configs.js`);
  }

  const html = await fetchText(siteConfig.url);
  const $ = cheerio.load(html);
  const listings = [];

  $(siteConfig.selectors.item).each((_, el) => {
    const $el = $(el);
    const pick = (sel) => (sel ? clean($el.find(sel).first().text()) : '');

    const title = pick(siteConfig.selectors.title);
    const linkEl = siteConfig.selectors.link ? $el.find(siteConfig.selectors.link).first() : $el;
    const url = resolveUrl(siteConfig.baseUrl, linkEl.attr('href'));
    if (!title || !url) return;

    listings.push({
      source: siteConfig.name,
      category: siteConfig.category,
      title,
      url,
      address: pick(siteConfig.selectors.address) || null,
      priceText: pick(siteConfig.selectors.price),
      sqftText: pick(siteConfig.selectors.sqft),
      descriptionText: pick(siteConfig.selectors.description),
    });
  });

  return listings;
}
