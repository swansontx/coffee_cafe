import db from '../database.js';
import { randomUUID } from 'crypto';

export const BURN_RATES = {
  house_espresso: 13.6,
  featured_espresso: null, // variable — set per planner entry
  batch_drip: 3.4,
  pour_over: 0.5
};

export const PROGRAM_LABELS = {
  house_espresso: 'House Espresso',
  featured_espresso: 'Featured Espresso',
  batch_drip: 'Batch Drip',
  pour_over: 'Pour Over'
};

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function daysBetween(dateA, dateB) {
  const a = new Date(dateA);
  const b = new Date(dateB);
  return Math.floor((b - a) / (1000 * 60 * 60 * 24));
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function computeBrewingFields(item) {
  const todayStr = today();

  const brew_ready_date = item.roast_date && item.min_rest_days != null
    ? addDays(item.roast_date, item.min_rest_days)
    : null;

  // Status
  let status = 'Ordered';
  if (item.actual_end_date) {
    status = 'Finished';
  } else if (item.activated_date) {
    status = 'Active';
  } else if (item.arrival_date) {
    if (brew_ready_date && brew_ready_date > todayStr) {
      status = 'Resting';
    } else {
      status = 'Ready';
    }
  } else if (item.in_transit) {
    status = 'In Transit';
  }

  // Estimated end date based on primary program burn rate
  let est_end_date = null;
  if (item.activated_date && item.allocated_lbs_primary && item.primary_program) {
    const burnRate = BURN_RATES[item.primary_program];
    if (burnRate) {
      const weeksOfCoverage = item.allocated_lbs_primary / burnRate;
      const daysOfCoverage = Math.round(weeksOfCoverage * 7);
      est_end_date = addDays(item.activated_date, daysOfCoverage);
    }
  }

  return { brew_ready_date, est_end_date, status };
}

function computeRetailFields(item) {
  const todayStr = today();

  const freshness_cutoff_date = item.roast_date && item.freshness_window_days
    ? addDays(item.roast_date, item.freshness_window_days)
    : null;

  const days_until_cutoff = freshness_cutoff_date
    ? daysBetween(todayStr, freshness_cutoff_date)
    : null;

  const weeks_of_supply = item.bags_on_hand != null && item.weekly_sell_rate
    ? Math.round((item.bags_on_hand / item.weekly_sell_rate) * 10) / 10
    : null;

  let freshness_status = null;
  if (days_until_cutoff != null) {
    if (days_until_cutoff < 0) freshness_status = 'Expired';
    else if (days_until_cutoff <= 7) freshness_status = 'Urgent';
    else if (days_until_cutoff <= 14) freshness_status = 'Watch';
    else freshness_status = 'OK';
  }

  const margin_per_bag = item.retail_price_per_bag != null && item.cost_per_package != null
    ? Math.round((item.retail_price_per_bag - item.cost_per_package) * 100) / 100
    : null;

  return { freshness_cutoff_date, days_until_cutoff, weeks_of_supply, freshness_status, margin_per_bag };
}

function enrichItem(item) {
  const total_lbs_oz = item.package_size != null && item.package_count != null
    ? Math.round(item.package_size * item.package_count * 100) / 100
    : null;

  const total_cost = item.cost_per_package != null && item.package_count != null
    ? Math.round(item.cost_per_package * item.package_count * 100) / 100
    : null;

  const computed = item.type === 'brewing'
    ? computeBrewingFields(item)
    : computeRetailFields(item);

  return { ...item, total_lbs_oz, total_cost, ...computed };
}

export function getAllInventory(filters = {}) {
  let query = 'SELECT * FROM inventory';
  const params = [];
  const conditions = [];

  if (filters.type) {
    conditions.push('type = ?');
    params.push(filters.type);
  }
  if (filters.program) {
    conditions.push('(primary_program = ? OR secondary_program = ?)');
    params.push(filters.program, filters.program);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY created_at DESC';

  return db.prepare(query).all(...params).map(enrichItem);
}

export function getInventoryById(id) {
  const item = db.prepare('SELECT * FROM inventory WHERE id = ?').get(id);
  return item ? enrichItem(item) : null;
}

export function createInventory(data) {
  const id = randomUUID();
  const {
    type, roaster, coffee_name, origin_process, roast_date,
    package_size, package_count, order_date, cost_per_package,
    primary_program, secondary_program, allocated_lbs_primary, allocated_lbs_secondary,
    min_rest_days, arrival_date, in_transit, activated_date, actual_end_date,
    bags_on_hand, weekly_sell_rate, retail_price_per_bag, freshness_window_days
  } = data;

  db.prepare(`
    INSERT INTO inventory (
      id, type, roaster, coffee_name, origin_process, roast_date,
      package_size, package_count, order_date, cost_per_package,
      primary_program, secondary_program, allocated_lbs_primary, allocated_lbs_secondary,
      min_rest_days, arrival_date, in_transit, activated_date, actual_end_date,
      bags_on_hand, weekly_sell_rate, retail_price_per_bag, freshness_window_days
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?
    )
  `).run(
    id, type, roaster, coffee_name, origin_process ?? null, roast_date ?? null,
    package_size ?? null, package_count ?? 1, order_date ?? null, cost_per_package ?? null,
    primary_program ?? null, secondary_program ?? null,
    allocated_lbs_primary ?? null, allocated_lbs_secondary ?? null,
    min_rest_days ?? null, arrival_date ?? null, in_transit ? 1 : 0,
    activated_date ?? null, actual_end_date ?? null,
    bags_on_hand ?? null, weekly_sell_rate ?? null,
    retail_price_per_bag ?? null, freshness_window_days ?? 56
  );

  return getInventoryById(id);
}

export function updateInventory(id, data) {
  const allowedFields = [
    'roaster', 'coffee_name', 'origin_process', 'roast_date',
    'package_size', 'package_count', 'order_date', 'cost_per_package',
    'primary_program', 'secondary_program', 'allocated_lbs_primary', 'allocated_lbs_secondary',
    'min_rest_days', 'arrival_date', 'in_transit', 'activated_date', 'actual_end_date',
    'bags_on_hand', 'weekly_sell_rate', 'retail_price_per_bag', 'freshness_window_days'
  ];

  const fields = [];
  const values = [];

  for (const [key, value] of Object.entries(data)) {
    if (allowedFields.includes(key)) {
      fields.push(`${key} = ?`);
      values.push(value === undefined ? null : value);
    }
  }

  if (fields.length === 0) return getInventoryById(id);

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  db.prepare(`UPDATE inventory SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getInventoryById(id);
}

export function deleteInventory(id) {
  db.prepare('DELETE FROM inventory WHERE id = ?').run(id);
}

// Returns all brewing items available for a given program on a given week start date.
// "Available" = brew_ready_date <= weekStart AND estimated remaining lbs > 0
export function getAvailableForProgram(program, weekStartDate, featuredBurnRate = null) {
  const items = db.prepare(`
    SELECT * FROM inventory
    WHERE type = 'brewing'
      AND actual_end_date IS NULL
      AND (primary_program = ? OR secondary_program = ?)
  `).all(program, program);

  return items
    .map(enrichItem)
    .filter(item => {
      if (item.brew_ready_date && item.brew_ready_date > weekStartDate) return false;

      const isPrimary = item.primary_program === program;
      const allocatedLbs = isPrimary ? item.allocated_lbs_primary : item.allocated_lbs_secondary;
      if (!allocatedLbs) return false;

      const burnRate = program === 'featured_espresso'
        ? (featuredBurnRate ?? 2)
        : BURN_RATES[program];

      if (!burnRate) return true; // can't estimate, show it

      // Estimate lbs remaining at start of this week
      let lbsRemaining = allocatedLbs;
      if (item.activated_date && item.activated_date <= weekStartDate) {
        const weeksActive = Math.floor(daysBetween(item.activated_date, weekStartDate) / 7);
        lbsRemaining = Math.max(0, allocatedLbs - burnRate * weeksActive);
      }

      return lbsRemaining > 0;
    })
    .map(item => {
      const isPrimary = item.primary_program === program;
      const allocatedLbs = isPrimary ? item.allocated_lbs_primary : item.allocated_lbs_secondary;
      const burnRate = program === 'featured_espresso'
        ? (featuredBurnRate ?? 2)
        : BURN_RATES[program];

      let lbs_at_week_start = allocatedLbs;
      if (item.activated_date && item.activated_date <= weekStartDate && burnRate) {
        const weeksActive = Math.floor(daysBetween(item.activated_date, weekStartDate) / 7);
        lbs_at_week_start = Math.max(0, allocatedLbs - burnRate * weeksActive);
      }

      const lbs_at_week_end = burnRate
        ? Math.max(0, lbs_at_week_start - burnRate)
        : lbs_at_week_start;

      return {
        ...item,
        lbs_at_week_start: Math.round(lbs_at_week_start * 10) / 10,
        lbs_at_week_end: Math.round(lbs_at_week_end * 10) / 10
      };
    });
}

// Compute remaining lbs for a specific inventory item at the start of a given week
export function getRemainingLbs(inventoryId, program, weekStartDate, featuredBurnRate = null) {
  const item = getInventoryById(inventoryId);
  if (!item) return null;

  const isPrimary = item.primary_program === program;
  const allocatedLbs = isPrimary ? item.allocated_lbs_primary : item.allocated_lbs_secondary;
  if (!allocatedLbs) return null;

  const burnRate = program === 'featured_espresso'
    ? (featuredBurnRate ?? 2)
    : BURN_RATES[program];

  if (!burnRate) return allocatedLbs;

  if (item.activated_date && item.activated_date <= weekStartDate) {
    const weeksActive = Math.floor(daysBetween(item.activated_date, weekStartDate) / 7);
    return Math.max(0, Math.round((allocatedLbs - burnRate * weeksActive) * 10) / 10);
  }

  return allocatedLbs;
}
