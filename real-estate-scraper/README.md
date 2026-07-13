# Cafe Space Finder

Scrapes Portland-metro commercial listings for cafe/food space to lease and
existing cafe/food businesses for sale, and emails a daily digest of new
matches. See `../CAFE_SPACE_FINDER_PLAN.md` for the full project plan and
the 12-source tier breakdown.

This must run somewhere with normal internet access - it will not work
inside a network-restricted sandbox. It's meant to run on a Mac mini (or
any always-on machine) via a daily scheduled job.

## 1. Setup

```bash
cd real-estate-scraper
npm install
cp .env.example .env
```

Edit `.env`:
- `SMTP_USER` / `SMTP_PASS`: a Gmail address + an **App Password** (not your
  regular password). Generate one at
  https://myaccount.google.com/apppasswords - requires 2-Step Verification
  to be enabled on that Google account first. If you'd rather not enable
  that, swap in any other SMTP provider (e.g. a free-tier Resend/SendGrid
  API key) - just change `SMTP_HOST`/`SMTP_PORT` accordingly, the mailer
  code doesn't care as long as it's SMTP.
- `DIGEST_TO`: where the alert email goes (defaults to travis.what@gmail.com
  in the example).

Budget/size criteria live in `src/config.js` (currently: lease <~$4,000/mo
or business purchase <~$200,000, 900-1,800 sqft, Portland metro, no
neighborhood filter) - see `CRITERIA` at the top of that file to adjust.

## 2. Test it

```bash
npm run scrape:dry
```

This runs every configured adapter and prints what the digest email *would*
contain, without sending anything or requiring `.env` to be filled in for
SMTP. Expect the 6 Tier 3 broker adapters to fail on first run (see below) -
that's expected until they're wired up.

## 3. Finish wiring the Tier 3 broker sites

`src/sites/tier3Configs.js` lists 6 Portland-area commercial/business
brokers (Kidder Mathews, Capacity Commercial, Norris & Stevens, SVN
Portland, Transworld Business Advisors, We Sell Restaurants). Each entry's
URL is a best guess and `selectors` is `null` - they were written without
internet access to verify against the live sites, so the runner skips them
(loudly, in the failure log) rather than silently scraping nothing or
scraping garbage.

For each site:
```bash
npm run inspect -- kidder-mathews
```
This fetches the page and prints candidate repeating-element CSS classes to
help you find the right selectors fast. Then edit the matching entry in
`src/sites/tier3Configs.js`:

```js
{
  name: 'kidder-mathews',
  ...
  selectors: {
    item: '.property-card',       // repeats once per listing
    title: '.property-card__title',
    link: 'a',                    // relative to item, or omit to use item's own href
    address: '.property-card__address',
    price: '.property-card__price',
    sqft: '.property-card__sqft',
    description: '.property-card__summary', // optional
  },
  verified: true,
},
```
Re-run `npm run scrape:dry` and confirm real listings show up for that
source. If a site returns a bot-block/CAPTCHA page instead of real content
(the inspect tool prints the first 2000 chars of body text so you can tell),
don't try to fight it - leave it disabled and note it, that's an explicit
non-goal (see `../CAFE_SPACE_FINDER_PLAN.md` Section 6).

Craigslist (Tier 2, `src/sites/craigslist.js`) uses RSS and should work out
of the box, but the category codes (`off` for commercial rentals, `bfs` for
business-for-sale) are also best-guess - if `npm run scrape:dry` shows 403s
or 0 results for craigslist-rent/craigslist-business, visit
portland.craigslist.org, run the equivalent search manually through the
site's own category picker, and correct the feed URLs at the top of that
file.

## 4. Set up Tier 1 (no code - saved search alerts)

These platforms already have built-in saved-search email alerts - use them
instead of scraping. Step-by-step, copy-paste-ready criteria for each of
the 5 sites (LoopNet, Crexi, BizBuySell, BizQuest, CommercialCafe) are in
[`TIER1_SAVED_SEARCHES.md`](TIER1_SAVED_SEARCHES.md).

## 5. Schedule it

A `launchd` job template is in `deploy/com.travis.cafefinder.plist`, set to
run daily at 7am (catches up automatically if the Mac was asleep at that
time).

```bash
# Edit the two /path/to/coffee_cafe placeholders in the plist first, then:
cp deploy/com.travis.cafefinder.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.travis.cafefinder.plist

# To check it's registered:
launchctl list | grep cafefinder

# To run it immediately (don't wait for 7am) to test end-to-end, including email send:
launchctl start com.travis.cafefinder

# Logs land at real-estate-scraper/data/scrape.log
```

To stop/remove it later:
```bash
launchctl unload ~/Library/LaunchAgents/com.travis.cafefinder.plist
rm ~/Library/LaunchAgents/com.travis.cafefinder.plist
```

## How it works

- `src/config.js` - search criteria (budget, sqft, keywords)
- `src/sites/*` - one adapter per source, each returns raw listings in a
  shared shape
- `src/normalize.js` - parses price/sqft text, applies relevance/budget/size
  filters
- `src/db.js` - local SQLite store (`data/listings.db`, gitignored) tracking
  which listings are new/notified/stale so we only alert once per listing
  and can flag when one disappears and later reappears
- `src/runner.js` - orchestrates all adapters, tolerant of individual
  source failures, builds and sends the digest
- `src/mailer.js` - plain SMTP digest email (not the Gmail MCP connector -
  that only exists inside Claude sessions and has no send capability, see
  `../CAFE_SPACE_FINDER_PLAN.md` Section 5)
