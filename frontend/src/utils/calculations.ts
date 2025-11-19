/**
 * Calculate extraction yield percentage
 * Formula: (TDS × Beverage Weight) / Coffee Dose × 100
 */
export function calculateExtractionYield(
  tds: number,
  beverageWeight: number,
  dose: number
): number | null {
  if (!tds || !beverageWeight || !dose || dose === 0) {
    return null;
  }

  const extraction = (tds * beverageWeight) / dose;
  return Math.round(extraction * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate brew ratio
 * Formula: Beverage Weight / Coffee Dose
 */
export function calculateBrewRatio(
  beverageWeight: number,
  dose: number
): string | null {
  if (!beverageWeight || !dose || dose === 0) {
    return null;
  }

  const ratio = beverageWeight / dose;
  return `1:${Math.round(ratio * 100) / 100}`;
}

/**
 * Get beverage weight from brew method and parameters
 */
export function getBeverageWeight(
  method: string,
  yieldGrams?: number,
  waterVolume?: number
): number | null {
  if (method === 'batch' && waterVolume) {
    // Convert liters to grams (1L water ≈ 1000g)
    return waterVolume * 1000;
  }

  return yieldGrams || null;
}

/**
 * Calculate all brew metrics in real-time
 */
export function calculateBrewMetrics(
  method: string,
  dose: number,
  tds: number,
  yieldGrams?: number,
  waterVolume?: number
): { extraction_yield: number | null; brew_ratio: string | null } {
  const beverageWeight = getBeverageWeight(method, yieldGrams, waterVolume);

  const extraction_yield = calculateExtractionYield(tds, beverageWeight || 0, dose);
  const brew_ratio = calculateBrewRatio(beverageWeight || 0, dose);

  return {
    extraction_yield,
    brew_ratio
  };
}

/**
 * Determine extraction quality based on SCA standards
 */
export function classifyExtraction(
  tds: number,
  extraction: number
): 'under' | 'ideal' | 'over' | 'strong' | 'weak' {
  // SCA ideal ranges (approximate)
  // TDS: 1.15% - 1.45% (for drip coffee)
  // Extraction: 18% - 22%

  if (extraction < 18) return 'under';
  if (extraction > 22) return 'over';

  if (tds < 1.15) return 'weak';
  if (tds > 1.45) return 'strong';

  return 'ideal';
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Format datetime for display
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

/**
 * Calculate days off roast
 */
export function calculateDaysOffRoast(roastDate: string): number {
  const roast = new Date(roastDate);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - roast.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}
