/**
 * Calculate extraction yield percentage
 * Formula: (TDS × Beverage Weight) / Coffee Dose × 100
 *
 * @param {number} tds - Total Dissolved Solids (%)
 * @param {number} beverageWeight - Final beverage weight (grams)
 * @param {number} dose - Coffee dose (grams)
 * @returns {number} Extraction yield percentage
 */
export function calculateExtractionYield(tds, beverageWeight, dose) {
  if (!tds || !beverageWeight || !dose || dose === 0) {
    return null;
  }

  const extraction = (tds * beverageWeight) / dose;
  return Math.round(extraction * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate brew ratio
 * Formula: Beverage Weight / Coffee Dose
 *
 * @param {number} beverageWeight - Final beverage weight (grams)
 * @param {number} dose - Coffee dose (grams)
 * @returns {string} Brew ratio in format "1:X.XX"
 */
export function calculateBrewRatio(beverageWeight, dose) {
  if (!beverageWeight || !dose || dose === 0) {
    return null;
  }

  const ratio = beverageWeight / dose;
  return `1:${Math.round(ratio * 100) / 100}`;
}

/**
 * Calculate days off roast
 *
 * @param {string} roastDate - Roast date in ISO format
 * @returns {number} Days since roast
 */
export function calculateDaysOffRoast(roastDate) {
  if (!roastDate) return null;

  const roast = new Date(roastDate);
  const today = new Date();
  const diffTime = Math.abs(today - roast);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Validate TDS value
 * Typical range: 0.1% - 20%
 *
 * @param {number} tds - TDS percentage
 * @returns {boolean} Whether TDS is in valid range
 */
export function isValidTDS(tds) {
  return tds >= 0.1 && tds <= 20;
}

/**
 * Validate extraction yield
 * Typical range: 10% - 30%
 *
 * @param {number} extraction - Extraction yield percentage
 * @returns {boolean} Whether extraction is in valid range
 */
export function isValidExtraction(extraction) {
  return extraction >= 10 && extraction <= 30;
}

/**
 * Determine extraction quality based on SCA standards
 *
 * @param {number} tds - TDS percentage
 * @param {number} extraction - Extraction yield percentage
 * @returns {string} Quality classification: 'under', 'ideal', 'over', 'strong', 'weak'
 */
export function classifyExtraction(tds, extraction) {
  // SCA ideal ranges (approximate)
  // TDS: 1.15% - 1.35% (for drip coffee)
  // Extraction: 18% - 22%

  if (extraction < 18) return 'under';
  if (extraction > 22) return 'over';

  if (tds < 1.15) return 'weak';
  if (tds > 1.45) return 'strong';

  return 'ideal';
}

/**
 * Get beverage weight from brew method and parameters
 * For batch brew, use water volume; for espresso/pourover use yield
 *
 * @param {string} method - Brew method
 * @param {number} yield - Yield in grams (for espresso/pourover)
 * @param {number} waterVolume - Water volume in liters (for batch)
 * @returns {number} Beverage weight in grams
 */
export function getBeverageWeight(method, yieldGrams, waterVolume) {
  if (method === 'batch' && waterVolume) {
    // Convert liters to grams (1L water ≈ 1000g)
    return waterVolume * 1000;
  }

  return yieldGrams || null;
}

/**
 * Calculate all brew metrics
 *
 * @param {Object} brewData - Brew session data
 * @returns {Object} Object with extraction_yield and brew_ratio
 */
export function calculateBrewMetrics(brewData) {
  const { method, dose, yield: yieldGrams, water_volume, tds } = brewData;

  const beverageWeight = getBeverageWeight(method, yieldGrams, water_volume);

  const extraction_yield = calculateExtractionYield(tds, beverageWeight, dose);
  const brew_ratio = calculateBrewRatio(beverageWeight, dose);

  return {
    extraction_yield,
    brew_ratio
  };
}
