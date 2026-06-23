/**
 * Domain Logic: Currency Precision
 * All INR amounts must be computed and stored as integer values in Paisa
 * (e.g., ₹500.50 = 50050) to ensure absolutely zero JS floating-point arithmetic errors.
 */

/**
 * Converts a floating point Rupee amount (e.g., from an input field) into an integer Paisa amount.
 * @param rupees Amount in rupees (e.g., 500.50)
 * @returns Amount in paisa (e.g., 50050)
 */
export function rupeesToPaisa(rupees: number | string): number {
  const num = typeof rupees === 'string' ? parseFloat(rupees) : rupees;
  if (isNaN(num)) return 0;
  // Multiply by 100 and round to avoid minor float precision issues during conversion
  return Math.round(num * 100);
}

/**
 * Converts an integer Paisa amount to a formatted Rupee string for the view layer.
 * @param paisa Amount in paisa (e.g., 50050)
 * @param includeSymbol Whether to include the ₹ symbol (default: true)
 * @returns Formatted string (e.g., "₹500.50")
 */
export function formatPaisaToRupees(paisa: number, includeSymbol: boolean = true): string {
  const rupees = paisa / 100;
  
  const formatter = new Intl.NumberFormat('en-IN', {
    style: includeSymbol ? 'currency' : 'decimal',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(rupees);
}

/**
 * Helper to get the raw float value for certain calculations if absolutely necessary,
 * though domain logic should prefer operating on paisa directly.
 */
export function paisaToRupeesFloat(paisa: number): number {
  return paisa / 100;
}
