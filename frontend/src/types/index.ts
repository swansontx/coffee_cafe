export type CoffeeState = 'active' | 'archive' | 'incoming';

export type BrewMethod = 'espresso' | 'batch' | 'pourover';

export interface Coffee {
  id: string;
  roaster: string;
  name: string;
  origin?: string;
  region?: string;
  process?: string;
  roast_date: string;
  roast_level?: string;
  price_per_kg?: number;
  notes?: string;
  state: CoffeeState;
  created_at: string;
  updated_at: string;
  // Calculated fields
  days_off_roast?: number;
  total_brews?: number;
  avg_extraction?: number;
  avg_rating?: number;
  best_brew?: BestBrew;
}

export interface BestBrew {
  id: string;
  method: BrewMethod;
  extraction_yield: number;
  rating: number;
  timestamp: string;
}

export interface BrewSession {
  id: string;
  coffee_id: string;
  method: BrewMethod;
  timestamp: string;

  // Common parameters
  dose: number;
  yield?: number;
  brew_time?: number;
  tds: number;
  grind_setting?: number;
  water_temp?: number;
  rating?: number;
  notes?: string;

  // Espresso specific
  pre_infusion_time?: number;
  pre_infusion_pressure?: number;
  full_pressure?: number;

  // Batch brew specific
  water_volume?: number;

  // Pourover specific
  bloom_time?: number;
  bloom_water?: number;

  // Calculated fields
  extraction_yield?: number;
  brew_ratio?: string;

  // Joined data
  roaster?: string;
  coffee_name?: string;
}

export interface BrewFormData {
  coffee_id: string;
  method: BrewMethod;
  dose: number;
  yield?: number;
  brew_time?: number;
  tds: number;
  grind_setting?: number;
  water_temp?: number;
  rating?: number;
  notes?: string;
  pre_infusion_time?: number;
  pre_infusion_pressure?: number;
  full_pressure?: number;
  water_volume?: number;
  bloom_time?: number;
  bloom_water?: number;
}

export interface AnalyticsData {
  id: string;
  method: BrewMethod;
  tds: number;
  extraction_yield: number;
  rating: number;
  timestamp: string;
  coffee_name: string;
  roaster: string;
}
