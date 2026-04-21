import db from '../database.js';
import { randomUUID } from 'crypto';
import { getInventoryById, getRemainingLbs, BURN_RATES } from './inventory.js';

export function getPlannerForWeeks(weekStartDates) {
  if (!weekStartDates || weekStartDates.length === 0) return [];

  const placeholders = weekStartDates.map(() => '?').join(', ');
  const rows = db.prepare(`
    SELECT * FROM program_planner
    WHERE week_start_date IN (${placeholders})
    ORDER BY week_start_date, program
  `).all(...weekStartDates);

  return rows.map(row => enrichPlannerRow(row));
}

export function getPlannerEntry(weekStartDate, program) {
  const row = db.prepare(`
    SELECT * FROM program_planner
    WHERE week_start_date = ? AND program = ?
  `).get(weekStartDate, program);
  return row ? enrichPlannerRow(row) : null;
}

export function upsertPlannerEntry(weekStartDate, program, inventoryId, featuredBurnRate = null) {
  const existing = getPlannerEntry(weekStartDate, program);

  if (existing) {
    db.prepare(`
      UPDATE program_planner
      SET inventory_id = ?, featured_burn_rate = ?, updated_at = CURRENT_TIMESTAMP
      WHERE week_start_date = ? AND program = ?
    `).run(inventoryId ?? null, featuredBurnRate ?? null, weekStartDate, program);
  } else {
    db.prepare(`
      INSERT INTO program_planner (id, week_start_date, program, inventory_id, featured_burn_rate)
      VALUES (?, ?, ?, ?, ?)
    `).run(randomUUID(), weekStartDate, program, inventoryId ?? null, featuredBurnRate ?? null);
  }

  return getPlannerEntry(weekStartDate, program);
}

export function clearPlannerEntry(weekStartDate, program) {
  db.prepare(`
    DELETE FROM program_planner WHERE week_start_date = ? AND program = ?
  `).run(weekStartDate, program);
}

function enrichPlannerRow(row) {
  if (!row.inventory_id) {
    return { ...row, inventory: null, lbs_at_week_start: null, lbs_at_week_end: null };
  }

  const item = getInventoryById(row.inventory_id);
  if (!item) {
    return { ...row, inventory: null, lbs_at_week_start: null, lbs_at_week_end: null };
  }

  const burnRate = row.program === 'featured_espresso'
    ? (row.featured_burn_rate ?? 2)
    : BURN_RATES[row.program];

  const lbs_at_week_start = getRemainingLbs(
    row.inventory_id,
    row.program,
    row.week_start_date,
    row.featured_burn_rate
  );

  const lbs_at_week_end = lbs_at_week_start != null && burnRate != null
    ? Math.max(0, Math.round((lbs_at_week_start - burnRate) * 10) / 10)
    : null;

  return { ...row, inventory: item, lbs_at_week_start, lbs_at_week_end };
}

// Build a full 4-week planner grid for all programs
export function getFullPlannerGrid(weekStartDates) {
  const programs = ['house_espresso', 'featured_espresso', 'batch_drip', 'pour_over'];
  const entries = getPlannerForWeeks(weekStartDates);

  const grid = {};
  for (const program of programs) {
    grid[program] = {};
    for (const week of weekStartDates) {
      const entry = entries.find(e => e.program === program && e.week_start_date === week);
      grid[program][week] = entry ?? null;
    }
  }

  return grid;
}
