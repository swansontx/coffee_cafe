# Cafe Space & Business Finder — Project Plan

A monitoring system to find commercial space to lease **or** an existing
cafe/coffee business to take over in the Portland, OR metro, and email an
alert whenever something new matching our criteria shows up.

This is a planning document. It is meant to be handed to an agent/environment
that has full outbound internet access (this sandboxed dev environment does
not — see [Execution Environment](#7-execution-environment) below).

## 1. Target Criteria

| Dimension | Value | Status |
|---|---|---|
| Location | Portland, OR metro | confirmed |
| Size | ~1,200–1,500 sq ft | confirmed |
| Use case | Food-forward (not just a coffee/espresso bar) | confirmed |
| Deal type | Lease space **or** buy an existing cafe/food business | confirmed (both) |
| Budget | Modest: lease under ~$4k/mo, or business purchase under ~$200k | confirmed |
| Neighborhoods/submarkets | Open to anywhere in Portland metro — no geographic filter | confirmed |
| Timeline / urgency | Flexible — browsing seriously over next 3–6 months | confirmed |
| Kitchen requirement | No preference — surface listings regardless of kitchen status, note it when known | confirmed |

"More for food" is read here as: prioritize spaces already built out (or
easily buildable) for hot food service, not spaces limited to a coffee bar
setup. Kitchen status is a data field we capture and display, not a filter —
since there's no preference, we don't want to silently drop a listing just
because a site's listing text doesn't mention equipment.

**Practical budget implication**: "under ~$4k/mo" in Portland metro
generally rules out ground-floor Pearl/downtown core retail and points
toward inner SE/NE corridors, strip retail, and suburban space — but since
there's no neighborhood filter, we surface everything and let price do the
filtering. "Under ~$200k" for a business purchase is realistic for a small
independent cafe (roughly 1–2x SDE for a modest single-location shop) but
likely excludes larger multi-location or high-volume concepts — that's a
useful early signal on which listings are worth a second look.

## 2. Listing Data Model

Every listing we track normalizes to:

```
id (stable hash of source+url)
source              e.g. "loopnet", "craigslist-pdx"
category            "lease" | "business_for_sale"
title
address / neighborhood
sqft
price               rent ($/mo or $/sqft/yr) OR asking price (business sale)
kitchen_equipped     true | false | unknown
listing_url
broker_or_contact
first_seen_at
last_seen_at
status              "new" | "seen" | "stale" (no longer listed)
```

Stale detection matters as much as new-listing detection — a space that
disappears fast is a signal, and we don't want to alert on the same listing
twice just because it reappeared in a re-scrape.

## 3. Source Tiers

Scraping bot-protected marketplaces we don't need to fight is wasted effort.
Splitting sources by how they're best monitored:

### Tier 1 — Use their official saved-search alerts (no scraping)
These platforms already email you when something new matches. Log in, set a
saved search for Portland / 1,200–1,500 sqft / restaurant or retail-food /
"coffee shop" business category, and point the notification to a dedicated
Gmail label so alerts are easy to scan or auto-forward.
- **LoopNet** (lease + business opportunities)
- **Crexi** (lease)
- **BizBuySell** (business-for-sale, filter: Coffee & Tea Shops, Restaurants)
- **BizQuest** (business-for-sale, same filters)
- **CommercialCafe** (lease)

### Tier 2 — RSS, no scraping needed
- **Craigslist Portland** — both `/search/bfd` (commercial/office/retail for
  rent) and `/search/bfs` (business for sale) support `?format=rss` on any
  saved search URL. A tiny poller just fetches the feed on a schedule —
  no HTML parsing, no bot-detection risk.

### Tier 3 — Custom scraping (smaller sites, no alert/RSS feature)
Regional commercial brokers in Portland that list their own inventory and
don't offer saved-search alerts. Lower listing volume, generally lighter
bot-protection than the national marketplaces, but structure can change
without notice so scrapers here need to fail loudly, not silently.
- **Kidder Mathews** (Portland office listings)
- **Capacity Commercial Group**
- **Norris & Stevens**
- **SVN Portland**
- **Transworld Business Advisors** (Portland office — business-for-sale)
- **We Sell Restaurants** (restaurant-specific brokerage, has PDX listings)

That's 5 + 1 + 6 = 12 sources across the three tiers.

## 4. Alerting

- **Channel**: email to travis.what@gmail.com.
- **Tier 1**: arrives directly from the platform once saved searches are
  configured — a Gmail label/filter groups them.
- **Tier 2/3**: a runner script diffs new scrape results against a local
  store and sends a single digest email (not one email per listing) with
  everything new since the last run: title, price/rent, sqft, neighborhood,
  link, and why it matched.
- **Cadence**: given a flexible 3–6 month timeline, a daily digest (once
  per morning) is enough signal without being noisy — every-few-hours
  polling is more suited to the "ASAP" case. Recommend starting daily and
  tightening up later if you decide to move faster.
- **Price filter**: since budget is capped at ~$4k/mo lease or ~$200k
  business purchase, the digest should filter out anything priced well
  above that (e.g. >125% of ceiling) rather than surfacing everything —
  keeps the daily email short.

## 5. Architecture (Tier 2/3 implementation)

- Adapter-per-site pattern: each site is a small module returning normalized
  listings; a shared runner calls all adapters, diffs against a SQLite store
  (new table, separate from the coffee-tracker's `coffee_tracker.db`), and
  builds the digest.
- Craigslist (Tier 2): plain RSS fetch + parse — cheap, reliable, low risk.
- Broker sites (Tier 3): HTML fetch + cheerio where possible; Playwright
  only if a site requires JS rendering. No CAPTCHA-solving, no proxy
  rotation, no fingerprint spoofing — if a site actively blocks automated
  access, that adapter gets disabled and flagged rather than fought.
- Runner triggered on a schedule (cron/Routine) and sends the digest via
  whatever mail path the execution environment has (SMTP app password, or
  Gmail API/MCP if running inside a Claude session with Gmail access).

## 6. Legal/Ethical Notes

- Personal, non-commercial use (finding our own space), low frequency,
  normal user-agent, no evasion of blocks — this is the same category of
  activity as browser extensions like "Craigslist alert" tools.
- Prefer official alert/RSS mechanisms (Tiers 1–2) wherever they exist —
  covers 6 of the 12 sources with zero scraping risk.
- Tier 3 scrapers should back off / disable themselves on repeated failures
  rather than escalate access methods.

## 7. Execution Environment

This dev sandbox's network policy blocks general internet access (only
GitHub, npm, PyPI, and a few other allowlisted hosts are reachable) — so
scraper code built and run *here* cannot reach any of these sites, now or
on a schedule. To actually run this, one of:

- **Local machine** — a Node script + your OS's cron/launchd, run from your
  own laptop with normal internet access and an SMTP app password.
- **A Claude Code environment configured with "full network access"** —
  you'd provision one (this is done from the environment settings, not from
  inside a session) and I can build/test/schedule the scraper there,
  sending alerts via the Gmail MCP connector directly.

## 8. Resolved Criteria

| Question | Answer |
|---|---|
| Budget | Modest: lease <~$4k/mo, business purchase <~$200k |
| Neighborhoods | Open to anywhere in Portland metro |
| Timeline | Flexible (3–6 months) → daily digest cadence |
| Kitchen requirement | No preference — capture, don't filter |

### Still open
1. Any hard deal-breakers (no strip malls, must have on-street parking,
   must allow outdoor seating, no shared kitchen/commissary situations,
   etc.)? Default assumption if not answered: none — surface everything
   under budget.
2. Which execution path from Section 7 do you want to pursue — local
   machine, or a Claude Code environment with full network access?
   **This is the actual blocker for implementation** — everything else in
   this plan is ready to build.

## 9. Next Steps

1. **Now, no code needed**: set up Tier 1 saved searches (LoopNet, Crexi,
   BizBuySell, BizQuest, CommercialCafe) with these criteria — Portland
   metro, 1,200–1,500 sqft, restaurant/retail-food or "Coffee & Tea Shops"
   category, priced at/under budget — and create a Gmail label to collect
   them. I can create the label now; the saved searches themselves have to
   be set up by you logged into each site.
2. Once an execution path is picked (Section 8.2): stand up the Tier 2
   Craigslist RSS poller first (simplest, lowest risk).
3. Build Tier 3 adapters for the 6 broker sites.
4. Wire the runner to a daily schedule and the digest email, with the
   >125%-of-budget price filter applied.
