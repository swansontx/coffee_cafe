import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../data/listings.db');
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS listings (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('lease', 'business_for_sale')),
    title TEXT NOT NULL,
    address TEXT,
    sqft REAL,
    price REAL,
    price_unit TEXT,
    kitchen_equipped TEXT DEFAULT 'unknown' CHECK(kitchen_equipped IN ('yes', 'unknown')),
    url TEXT NOT NULL,
    first_seen_at TEXT DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TEXT DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'new' CHECK(status IN ('new', 'notified', 'stale'))
  )
`);

const upsertStmt = db.prepare(`
  INSERT INTO listings (id, source, category, title, address, sqft, price, price_unit, kitchen_equipped, url, last_seen_at)
  VALUES (@id, @source, @category, @title, @address, @sqft, @price, @priceUnit, @kitchenEquipped, @url, CURRENT_TIMESTAMP)
  ON CONFLICT(id) DO UPDATE SET
    last_seen_at = CURRENT_TIMESTAMP,
    price = excluded.price,
    price_unit = excluded.price_unit,
    -- a listing that went stale and reappeared is worth re-alerting on
    status = CASE WHEN listings.status = 'stale' THEN 'new' ELSE listings.status END
`);

const markStaleStmt = db.prepare(`
  UPDATE listings SET status = 'stale'
  WHERE source = ? AND id NOT IN (SELECT value FROM json_each(?)) AND status != 'stale'
`);

const markNotifiedStmt = db.prepare(`UPDATE listings SET status = 'notified' WHERE id = ?`);
const newListingsStmt = db.prepare(`SELECT * FROM listings WHERE status = 'new' ORDER BY source, price`);

/**
 * Insert or refresh a listing. A brand-new id gets status 'new'; a
 * previously-'stale' id that reappeared flips back to 'new' too (see
 * upsertStmt's ON CONFLICT clause) - either way, whether something counts
 * as "new for alerting" is decided by querying status via getNewListings(),
 * not by this call's return value.
 */
export function upsertListing(listing) {
  upsertStmt.run(listing);
}

/** Mark every listing from `source` not present in `seenIds` as stale. */
export function markStaleExcept(source, seenIds) {
  markStaleStmt.run(source, JSON.stringify(seenIds));
}

export function getNewListings() {
  return newListingsStmt.all();
}

export function markNotified(id) {
  markNotifiedStmt.run(id);
}

export default db;
