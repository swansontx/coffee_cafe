import db from '../database.js';
import { randomUUID } from 'crypto';
import { calculateBrewMetrics } from '../utils/calculations.js';

/**
 * Create a new brew session
 */
export function createBrewSession(brewData) {
  const id = randomUUID();

  // Calculate extraction metrics
  const metrics = calculateBrewMetrics(brewData);

  const {
    coffee_id,
    method,
    dose,
    yield: yieldGrams,
    brew_time,
    tds,
    grind_setting,
    water_temp,
    rating,
    notes,
    // Espresso specific
    pre_infusion_time,
    pre_infusion_pressure,
    full_pressure,
    // Batch specific
    water_volume,
    // Pourover specific
    bloom_time,
    bloom_water
  } = brewData;

  const stmt = db.prepare(`
    INSERT INTO brew_sessions (
      id, coffee_id, method, dose, yield, brew_time, tds,
      grind_setting, water_temp, rating, notes,
      pre_infusion_time, pre_infusion_pressure, full_pressure,
      water_volume, bloom_time, bloom_water,
      extraction_yield, brew_ratio
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id, coffee_id, method, dose, yieldGrams, brew_time, tds,
    grind_setting, water_temp, rating, notes,
    pre_infusion_time, pre_infusion_pressure, full_pressure,
    water_volume, bloom_time, bloom_water,
    metrics.extraction_yield, metrics.brew_ratio
  );

  return getBrewSessionById(id);
}

/**
 * Get brew session by ID
 */
export function getBrewSessionById(id) {
  const brew = db.prepare(`
    SELECT
      bs.*,
      c.roaster,
      c.name as coffee_name
    FROM brew_sessions bs
    LEFT JOIN coffees c ON bs.coffee_id = c.id
    WHERE bs.id = ?
  `).get(id);

  return brew;
}

/**
 * Get all brew sessions with optional filtering
 */
export function getAllBrewSessions(filters = {}) {
  let query = `
    SELECT
      bs.*,
      c.roaster,
      c.name as coffee_name
    FROM brew_sessions bs
    LEFT JOIN coffees c ON bs.coffee_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (filters.coffee_id) {
    query += ' AND bs.coffee_id = ?';
    params.push(filters.coffee_id);
  }

  if (filters.method) {
    query += ' AND bs.method = ?';
    params.push(filters.method);
  }

  if (filters.start_date) {
    query += ' AND bs.timestamp >= ?';
    params.push(filters.start_date);
  }

  if (filters.end_date) {
    query += ' AND bs.timestamp <= ?';
    params.push(filters.end_date);
  }

  // Default to last 100 brews
  const limit = filters.limit || 100;
  query += ' ORDER BY bs.timestamp DESC LIMIT ?';
  params.push(limit);

  return db.prepare(query).all(...params);
}

/**
 * Get brew sessions for a specific coffee
 */
export function getBrewSessionsByCoffee(coffeeId) {
  return getAllBrewSessions({ coffee_id: coffeeId });
}

/**
 * Get last brew for a coffee (for auto-populate)
 */
export function getLastBrewForCoffee(coffeeId, method = null) {
  let query = `
    SELECT * FROM brew_sessions
    WHERE coffee_id = ?
  `;
  const params = [coffeeId];

  if (method) {
    query += ' AND method = ?';
    params.push(method);
  }

  query += ' ORDER BY timestamp DESC LIMIT 1';

  return db.prepare(query).get(...params);
}

/**
 * Update brew session
 */
export function updateBrewSession(id, updates) {
  const currentBrew = getBrewSessionById(id);
  if (!currentBrew) return null;

  // Merge updates with current data
  const updatedData = { ...currentBrew, ...updates };

  // Recalculate metrics
  const metrics = calculateBrewMetrics(updatedData);

  const fields = [];
  const values = [];

  const allowedFields = [
    'dose', 'yield', 'brew_time', 'tds', 'grind_setting',
    'water_temp', 'rating', 'notes', 'pre_infusion_time',
    'pre_infusion_pressure', 'full_pressure', 'water_volume',
    'bloom_time', 'bloom_water'
  ];

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }

  // Always update calculated fields
  fields.push('extraction_yield = ?', 'brew_ratio = ?');
  values.push(metrics.extraction_yield, metrics.brew_ratio);

  values.push(id);

  const stmt = db.prepare(`
    UPDATE brew_sessions
    SET ${fields.join(', ')}
    WHERE id = ?
  `);

  stmt.run(...values);

  return getBrewSessionById(id);
}

/**
 * Delete brew session
 */
export function deleteBrewSession(id) {
  const stmt = db.prepare('DELETE FROM brew_sessions WHERE id = ?');
  stmt.run(id);
  return { success: true };
}

/**
 * Get analytics data for SCA chart
 */
export function getAnalyticsData(filters = {}) {
  let query = `
    SELECT
      bs.id,
      bs.method,
      bs.tds,
      bs.extraction_yield,
      bs.rating,
      bs.timestamp,
      c.name as coffee_name,
      c.roaster
    FROM brew_sessions bs
    LEFT JOIN coffees c ON bs.coffee_id = c.id
    WHERE bs.extraction_yield IS NOT NULL
  `;
  const params = [];

  if (filters.method) {
    query += ' AND bs.method = ?';
    params.push(filters.method);
  }

  if (filters.coffee_id) {
    query += ' AND bs.coffee_id = ?';
    params.push(filters.coffee_id);
  }

  if (filters.start_date) {
    query += ' AND bs.timestamp >= ?';
    params.push(filters.start_date);
  }

  if (filters.end_date) {
    query += ' AND bs.timestamp <= ?';
    params.push(filters.end_date);
  }

  query += ' ORDER BY bs.timestamp DESC';

  return db.prepare(query).all(...params);
}
