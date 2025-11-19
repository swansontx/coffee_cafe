import db from '../database.js';
import { randomUUID } from 'crypto';
import { calculateDaysOffRoast } from '../utils/calculations.js';

/**
 * Create a new coffee profile
 */
export function createCoffee(coffeeData) {
  const {
    roaster,
    name,
    origin,
    region,
    process,
    roast_date,
    roast_level,
    price_per_kg,
    notes,
    state = 'active'
  } = coffeeData;

  const id = randomUUID();

  const stmt = db.prepare(`
    INSERT INTO coffees (
      id, roaster, name, origin, region, process,
      roast_date, roast_level, price_per_kg, notes, state
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id, roaster, name, origin, region, process,
    roast_date, roast_level, price_per_kg, notes, state
  );

  return getCoffeeById(id);
}

/**
 * Get coffee by ID with calculated stats
 */
export function getCoffeeById(id) {
  const coffee = db.prepare(`
    SELECT * FROM coffees WHERE id = ?
  `).get(id);

  if (!coffee) return null;

  return enrichCoffeeData(coffee);
}

/**
 * Get all coffees with optional filtering
 */
export function getAllCoffees(filters = {}) {
  let query = 'SELECT * FROM coffees';
  const params = [];

  if (filters.state) {
    query += ' WHERE state = ?';
    params.push(filters.state);
  }

  query += ' ORDER BY roast_date DESC';

  const coffees = db.prepare(query).all(...params);

  return coffees.map(enrichCoffeeData);
}

/**
 * Update coffee profile
 */
export function updateCoffee(id, updates) {
  const fields = [];
  const values = [];

  const allowedFields = [
    'roaster', 'name', 'origin', 'region', 'process',
    'roast_date', 'roast_level', 'price_per_kg', 'notes', 'state'
  ];

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (fields.length === 0) {
    return getCoffeeById(id);
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  const stmt = db.prepare(`
    UPDATE coffees
    SET ${fields.join(', ')}
    WHERE id = ?
  `);

  stmt.run(...values);

  return getCoffeeById(id);
}

/**
 * Delete coffee (soft delete - archive it)
 */
export function archiveCoffee(id) {
  return updateCoffee(id, { state: 'archive' });
}

/**
 * Get coffee statistics from brew sessions
 */
export function getCoffeeStats(coffeeId) {
  const stats = db.prepare(`
    SELECT
      COUNT(*) as total_brews,
      AVG(extraction_yield) as avg_extraction,
      AVG(rating) as avg_rating,
      MIN(timestamp) as first_brew,
      MAX(timestamp) as last_brew
    FROM brew_sessions
    WHERE coffee_id = ?
  `).get(coffeeId);

  // Get best brew (highest rating, then highest extraction)
  const bestBrew = db.prepare(`
    SELECT id, method, extraction_yield, rating, timestamp
    FROM brew_sessions
    WHERE coffee_id = ?
    ORDER BY rating DESC, extraction_yield DESC
    LIMIT 1
  `).get(coffeeId);

  return {
    total_brews: stats.total_brews || 0,
    avg_extraction: stats.avg_extraction ? Math.round(stats.avg_extraction * 100) / 100 : null,
    avg_rating: stats.avg_rating ? Math.round(stats.avg_rating * 10) / 10 : null,
    first_brew: stats.first_brew,
    last_brew: stats.last_brew,
    best_brew: bestBrew
  };
}

/**
 * Enrich coffee data with calculated fields
 */
function enrichCoffeeData(coffee) {
  const daysOffRoast = calculateDaysOffRoast(coffee.roast_date);
  const stats = getCoffeeStats(coffee.id);

  return {
    ...coffee,
    days_off_roast: daysOffRoast,
    ...stats
  };
}

/**
 * Get unique roasters (for dropdown)
 */
export function getUniqueRoasters() {
  const roasters = db.prepare(`
    SELECT DISTINCT roaster
    FROM coffees
    ORDER BY roaster
  `).all();

  return roasters.map(r => r.roaster);
}
