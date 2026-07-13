// Dev helper: fetches a Tier 3 site's listings page and prints clues about
// its structure so you can fill in src/sites/tier3Configs.js selectors.
// Usage: npm run inspect -- <site-name>   (e.g. npm run inspect -- kidder-mathews)
import * as cheerio from 'cheerio';
import { fetchText } from './fetchHtml.js';
import { TIER3_SITES } from './sites/tier3Configs.js';

const name = process.argv[2];
if (!name) {
  console.log('Usage: npm run inspect -- <site-name>');
  console.log('Available:', TIER3_SITES.map((s) => s.name).join(', '));
  process.exit(1);
}

const site = TIER3_SITES.find((s) => s.name === name);
if (!site) {
  console.error(`Unknown site "${name}". Available: ${TIER3_SITES.map((s) => s.name).join(', ')}`);
  process.exit(1);
}

console.log(`Fetching ${site.url} ...`);
const html = await fetchText(site.url);
const $ = cheerio.load(html);

console.log(`\nPage title: ${$('title').text()}`);
console.log(`HTML length: ${html.length} bytes\n`);

// Heuristic: count elements whose class/id hints at being a repeating listing card.
const hints = ['listing', 'property', 'card', 'result', 'item'];
const candidates = new Map();
$('[class]').each((_, el) => {
  const cls = $(el).attr('class') || '';
  for (const hint of hints) {
    if (cls.toLowerCase().includes(hint)) {
      const key = cls.trim().split(/\s+/).join('.');
      candidates.set(key, (candidates.get(key) || 0) + 1);
    }
  }
});

console.log('Candidate repeating-element classes (name: count) - look for one appearing once per listing:');
[...candidates.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 25)
  .forEach(([cls, count]) => console.log(`  ${count}\t.${cls}`));

console.log('\nFirst 2000 chars of body text (sanity check the page actually loaded real content, not a bot-block page):');
console.log($('body').text().replace(/\s+/g, ' ').trim().slice(0, 2000));
