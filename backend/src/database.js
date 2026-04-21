import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../database/coffee_tracker.db');
const db = new Database(dbPath);

db.pragma('foreign_keys = ON');

export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('brewing', 'retail')),

      -- Identity
      roaster TEXT NOT NULL,
      coffee_name TEXT NOT NULL,
      origin_process TEXT,
      roast_date TEXT,
      package_size REAL,
      package_count INTEGER DEFAULT 1,

      -- Order info
      order_date TEXT,
      cost_per_package REAL,

      -- Program assignment (brewing only)
      primary_program TEXT CHECK(primary_program IN ('house_espresso', 'featured_espresso', 'pour_over', 'batch_drip', NULL)),
      secondary_program TEXT CHECK(secondary_program IN ('house_espresso', 'featured_espresso', 'pour_over', 'batch_drip', NULL)),
      allocated_lbs_primary REAL,
      allocated_lbs_secondary REAL,

      -- Rest window (brewing only)
      min_rest_days INTEGER,

      -- Status tracking (brewing only)
      arrival_date TEXT,
      in_transit INTEGER DEFAULT 0,
      activated_date TEXT,
      actual_end_date TEXT,

      -- Retail fields
      bags_on_hand INTEGER,
      weekly_sell_rate REAL,
      retail_price_per_bag REAL,
      freshness_window_days INTEGER DEFAULT 56,

      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS program_planner (
      id TEXT PRIMARY KEY,
      week_start_date TEXT NOT NULL,
      program TEXT NOT NULL CHECK(program IN ('house_espresso', 'featured_espresso', 'pour_over', 'batch_drip')),
      inventory_id TEXT REFERENCES inventory(id) ON DELETE SET NULL,
      featured_burn_rate REAL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(week_start_date, program)
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_inventory_type ON inventory(type);
    CREATE INDEX IF NOT EXISTS idx_inventory_primary_program ON inventory(primary_program);
    CREATE INDEX IF NOT EXISTS idx_planner_week ON program_planner(week_start_date);
  `);

  console.log('Database initialized successfully');
}

export default db;
