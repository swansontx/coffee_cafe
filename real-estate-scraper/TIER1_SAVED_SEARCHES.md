# Tier 1 Saved Search Setup (LoopNet, Crexi, BizBuySell, BizQuest, CommercialCafe)

No code for these - each platform emails you directly when something new
matches. Same underlying criteria everywhere, restated per-platform because
the search UIs differ. Budget/size below already include the same ~25%
slack the scraper uses, so this stays consistent with the Tier 2/3 digest.

**Common criteria (copy-paste into whichever fields each site offers):**
- Location: `Portland, OR` metro, 20-25 mile radius (no specific
  neighborhood filter)
- Keywords: `cafe, coffee shop, coffee, espresso, restaurant, bakery, deli`
- Size: `900` - `1,800 SF`
- Kitchen/equipment: no filter - don't restrict on this, we want it surfaced
  either way
- Alert frequency: daily (pick "instant"/"as available" instead if you'd
  rather see things the moment they post)

---

## LoopNet (loopnet.com)

Covers both leased space and business-for-sale listings.

1. Go to loopnet.com → **For Lease**.
2. Property Type: **Retail** → check the **Restaurant** subtype if offered
   (otherwise leave Retail unchecked further and rely on keyword search).
3. Location: `Portland, OR`, radius 20-25 mi.
4. Size: min `900`, max `1,800` SF.
5. Rent: max `$4,000`/mo (LoopNet usually lets you filter by monthly or
   annual/SF rate - if annual/SF only, use `$32`/SF/yr as a rough
   equivalent for a ~1,200-1,500 SF space, then sanity-check by eye).
6. Keyword search box: `cafe OR coffee OR restaurant OR bakery`
7. Click **Save Search** (top of results) → name it "Cafe space PDX" →
   set email frequency to Daily.
8. Repeat the same search under **For Sale** with **Business for Sale**
   selected as the listing type (LoopNet surfaces BizBuySell-sourced
   business listings here too) - price ceiling `$200,000`.

## Crexi (crexi.com)

1. crexi.com → **Lease**.
2. Property Type: **Retail**, sub-type **Restaurant** if available.
3. Location: `Portland, OR`, radius 20-25 mi.
4. Size: `900` - `1,800 SF`.
5. Price: monthly rent max `$4,000` (Crexi may only show $/SF/yr - use
   `$32`/SF/yr as a rough equivalent, adjust by eye).
6. Add `cafe, coffee, restaurant, bakery` to the keyword/search field.
7. Click **Save Search** (usually a bookmark/bell icon on the results
   toolbar) → enable email notifications, Daily.

## BizBuySell (bizbuysell.com)

Business-for-sale only.

1. bizbuysell.com → **Search Businesses**.
2. Category: **Restaurants & Food** → sub-category **Coffee & Tea Shops**
   (run the search once with this narrow category, and once more with the
   broader **Restaurants** category so you don't miss a cafe-adjacent
   listing that got mis-categorized).
3. Location: `Portland, OR` (site usually lets you pick a metro area or a
   mile radius from a zip - use a Portland-area zip like `97205` with a
   20-25 mi radius).
4. Asking Price: max `$200,000`.
5. Run the search, then click **Save Search** / **Get Email Alerts** near
   the top of results, set to Daily (or Instant).

## BizQuest (bizquest.com)

Business-for-sale only, same idea as BizBuySell.

1. bizquest.com → **Search**.
2. Category: **Restaurants & Food** → **Coffee Shops** if listed as its own
   sub-category, otherwise **Restaurants**.
3. Location: `Portland, OR`.
4. Price: max `$200,000`.
5. Save the search (look for **Save This Search** / **Email Alerts** near
   the results list) → Daily.

## CommercialCafe (commercialcafe.com)

Lease listings, aggregated from multiple sources.

1. commercialcafe.com → search **Portland, OR**.
2. Property Type: **Retail** (filter to Restaurant if that subtype
   exists).
3. Size: `900` - `1,800 SF`.
4. Price: max `$4,000`/mo (or the $/SF/yr equivalent, `~$32`/SF/yr).
5. Save the search - CommercialCafe typically requires a free account to
   save searches and get alerts; sign up with travis.what@gmail.com if
   prompted.

---

## After setup

Optional but recommended: create a Gmail filter so these 5 platforms'
alert emails get a shared label (e.g. "Cafe Search") instead of mixing into
the inbox. In Gmail: **Settings → Filters and Blocked Addresses → Create a
new filter**, match `from:(loopnet.com OR crexi.com OR bizbuysell.com OR
bizquest.com OR commercialcafe.com)`, action: apply label "Cafe Search". I
can create the label itself now if you want - just the label, the filter
rule has to be set up in Gmail's settings UI since there's no API for it
available here.
