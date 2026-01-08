/**
 * Safe numeric formatters for table columns
 * Prevents TypeError when values are null, undefined, or non-numeric
 */

/**
 * Format a value as currency with safe number conversion
 * @param {any} value - The value to format
 * @param {string} symbol - Currency symbol (default: '$')
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted currency string or "-" if invalid
 */
export const formatCurrency = (value, symbol = '$', decimals = 2) => {
  const num = Number(value)
  return Number.isFinite(num) ? `${symbol}${num.toFixed(decimals)}` : '-'
}

/**
 * Format a value as a number with decimal places
 * @param {any} value - The value to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted number string or "-" if invalid
 */
export const formatNumber = (value, decimals = 2) => {
  const num = Number(value)
  return Number.isFinite(num) ? num.toFixed(decimals) : '-'
}

/**
 * Format a value as a percentage
 * @param {any} value - The value to format
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted percentage string or "-" if invalid
 */
export const formatPercentage = (value, decimals = 1) => {
  const num = Number(value)
  return Number.isFinite(num) ? `${num.toFixed(decimals)}%` : '-'
}

