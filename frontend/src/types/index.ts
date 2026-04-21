export type InventoryType = 'brewing' | 'retail';

export type BrewingProgram =
  | 'house_espresso'
  | 'featured_espresso'
  | 'pour_over'
  | 'batch_drip';

export type BrewingStatus = 'Ordered' | 'In Transit' | 'Resting' | 'Ready' | 'Active' | 'Finished';

export type FreshnessStatus = 'OK' | 'Watch' | 'Urgent' | 'Expired';

export type CoverageStatus = 'Covered' | 'Low' | 'Out' | 'Not Brew-Ready';

export interface InventoryItem {
  id: string;
  type: InventoryType;

  // Identity
  roaster: string;
  coffee_name: string;
  origin_process?: string;
  roast_date?: string;
  package_size?: number;
  package_count?: number;

  // Order info
  order_date?: string;
  cost_per_package?: number;

  // Program assignment (brewing)
  primary_program?: BrewingProgram;
  secondary_program?: BrewingProgram;
  allocated_lbs_primary?: number;
  allocated_lbs_secondary?: number;

  // Rest window (brewing)
  min_rest_days?: number;

  // Status tracking (brewing)
  arrival_date?: string;
  in_transit?: number;
  activated_date?: string;
  actual_end_date?: string;

  // Retail fields
  bags_on_hand?: number;
  weekly_sell_rate?: number;
  retail_price_per_bag?: number;
  freshness_window_days?: number;

  created_at: string;
  updated_at: string;

  // Computed fields (brewing)
  brew_ready_date?: string;
  est_end_date?: string;
  status?: BrewingStatus;
  total_lbs_oz?: number;
  total_cost?: number;

  // Computed fields (retail)
  freshness_cutoff_date?: string;
  days_until_cutoff?: number;
  weeks_of_supply?: number;
  freshness_status?: FreshnessStatus;
  margin_per_bag?: number;

  // Planner availability extras
  lbs_at_week_start?: number;
  lbs_at_week_end?: number;
}

export interface PlannerEntry {
  id?: string;
  week_start_date: string;
  program: BrewingProgram;
  inventory_id?: string;
  featured_burn_rate?: number;
  inventory?: InventoryItem;
  lbs_at_week_start?: number;
  lbs_at_week_end?: number;
}

export type PlannerGrid = Record<BrewingProgram, Record<string, PlannerEntry | null>>;

export const PROGRAM_LABELS: Record<BrewingProgram, string> = {
  house_espresso: 'House Espresso',
  featured_espresso: 'Featured Espresso',
  batch_drip: 'Batch Drip',
  pour_over: 'Pour Over'
};

export const BURN_RATES: Record<BrewingProgram, number | null> = {
  house_espresso: 13.6,
  featured_espresso: null,
  batch_drip: 3.4,
  pour_over: 0.5
};

export const PROGRAMS: BrewingProgram[] = [
  'house_espresso',
  'featured_espresso',
  'batch_drip',
  'pour_over'
];
