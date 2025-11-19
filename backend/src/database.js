import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../database/coffee_tracker.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
export function initializeDatabase() {
  // Coffees table
  db.exec(`
    CREATE TABLE IF NOT EXISTS coffees (
      id TEXT PRIMARY KEY,
      roaster TEXT NOT NULL,
      name TEXT NOT NULL,
      origin TEXT,
      region TEXT,
      process TEXT,
      roast_date TEXT NOT NULL,
      roast_level TEXT,
      price_per_kg REAL,
      notes TEXT,
      state TEXT DEFAULT 'active' CHECK(state IN ('active', 'archive', 'incoming')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Brew sessions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS brew_sessions (
      id TEXT PRIMARY KEY,
      coffee_id TEXT NOT NULL,
      method TEXT NOT NULL CHECK(method IN ('espresso', 'batch', 'pourover')),
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,

      -- Common parameters
      dose REAL NOT NULL,
      yield REAL,
      brew_time REAL,
      tds REAL NOT NULL,
      grind_setting REAL,
      water_temp REAL,
      rating INTEGER CHECK(rating BETWEEN 1 AND 5),
      notes TEXT,

      -- Espresso specific
      pre_infusion_time REAL,
      pre_infusion_pressure REAL,
      full_pressure REAL,

      -- Batch brew specific
      water_volume REAL,

      -- Pourover specific
      bloom_time REAL,
      bloom_water REAL,

      -- Calculated fields
      extraction_yield REAL,
      brew_ratio TEXT,

      created_at TEXT DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (coffee_id) REFERENCES coffees(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_brew_sessions_coffee_id ON brew_sessions(coffee_id);
    CREATE INDEX IF NOT EXISTS idx_brew_sessions_method ON brew_sessions(method);
    CREATE INDEX IF NOT EXISTS idx_brew_sessions_timestamp ON brew_sessions(timestamp);
    CREATE INDEX IF NOT EXISTS idx_coffees_state ON coffees(state);
  `);

  console.log('Database initialized successfully');
}

export default db;
