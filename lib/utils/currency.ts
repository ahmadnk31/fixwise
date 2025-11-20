/**
 * Converts a price string or number to EUR format
 * Handles various input formats:
 * - "$50" or "$50.00" -> "€50.00"
 * - "50" or "50.00" -> "€50.00"
 * - 50 or 50.00 -> "€50.00"
 * - "50 USD" -> "€50.00" (assumes 1:1 for simplicity, can be extended with actual conversion)
 * 
 * @param price - Price as string (with or without currency symbol) or number
 * @param options - Formatting options
 * @returns Formatted price string in EUR
 */
export function convertToEUR(
  price: string | number | null | undefined,
  options: {
    showSymbol?: boolean
    decimals?: number
    exchangeRate?: number // USD to EUR exchange rate (default: 1.0 for 1:1, can be updated)
  } = {}
): string {
  const {
    showSymbol = true,
    decimals = 2,
    exchangeRate = 0.92, // Approximate USD to EUR rate (can be made dynamic)
  } = options

  // Handle null/undefined
  if (price === null || price === undefined) {
    return showSymbol ? "€0.00" : "0.00"
  }

  // If it's already a number, use it directly
  if (typeof price === "number") {
    const eurAmount = price * exchangeRate
    const formatted = eurAmount.toFixed(decimals)
    return showSymbol ? `€${formatted}` : formatted
  }

  // Handle string input
  let numericValue: number

  // Remove currency symbols and whitespace
  const cleaned = price
    .toString()
    .trim()
    .replace(/[$€£¥,]/g, "") // Remove common currency symbols
    .replace(/\s*(USD|EUR|GBP|JPY)\s*/gi, "") // Remove currency codes

  // Try to parse as number
  numericValue = parseFloat(cleaned)

  // If parsing failed, try to extract number from string
  if (isNaN(numericValue)) {
    const match = cleaned.match(/(\d+\.?\d*)/)
    if (match) {
      numericValue = parseFloat(match[1])
    } else {
      // If we can't extract a number, return the original or 0
      return showSymbol ? "€0.00" : "0.00"
    }
  }

  // Convert to EUR (assuming input is in USD if it had $ symbol)
  const isUSD = price.toString().includes("$") || price.toString().toUpperCase().includes("USD")
  const eurAmount = isUSD ? numericValue * exchangeRate : numericValue

  // Format with specified decimals
  const formatted = eurAmount.toFixed(decimals)

  return showSymbol ? `€${formatted}` : formatted
}

/**
 * Formats a number as EUR currency
 * @param amount - Numeric amount
 * @param options - Formatting options
 * @returns Formatted EUR string
 */
export function formatEUR(
  amount: number | null | undefined,
  options: {
    showSymbol?: boolean
    decimals?: number
  } = {}
): string {
  const { showSymbol = true, decimals = 2 } = options

  if (amount === null || amount === undefined || isNaN(amount)) {
    return showSymbol ? "€0.00" : "0.00"
  }

  const formatted = amount.toFixed(decimals)
  return showSymbol ? `€${formatted}` : formatted
}

/**
 * Extracts numeric value from a price string
 * @param price - Price string (e.g., "$50.00", "€45.50", "50 USD")
 * @returns Numeric value or 0 if parsing fails
 */
export function extractPriceValue(price: string | number | null | undefined): number {
  if (typeof price === "number") {
    return price
  }

  if (!price) {
    return 0
  }

  const cleaned = price
    .toString()
    .trim()
    .replace(/[$€£¥,]/g, "")
    .replace(/\s*(USD|EUR|GBP|JPY)\s*/gi, "")

  const numericValue = parseFloat(cleaned)
  return isNaN(numericValue) ? 0 : numericValue
}

