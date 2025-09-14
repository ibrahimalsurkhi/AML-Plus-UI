/**
 * Currency formatting utilities
 */

// List of valid ISO 4217 currency codes
const VALID_CURRENCY_CODES = [
  'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'SEK', 'NZD',
  'MXN', 'SGD', 'HKD', 'NOK', 'TRY', 'RUB', 'INR', 'BRL', 'ZAR', 'KRW',
  'AED', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR', 'JOD', 'LBP', 'EGP', 'ILS',
  'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'HRK', 'RSD', 'MKD', 'ALL', 'BAM',
  'UAH', 'BYN', 'MDL', 'GEL', 'AMD', 'AZN', 'KZT', 'UZS', 'KGS', 'TJS',
  'TMT', 'AFN', 'PKR', 'BDT', 'LKR', 'NPR', 'BTN', 'MVR', 'SCR', 'KMF',
  'DJF', 'ETB', 'SOS', 'TZS', 'UGX', 'KES', 'RWF', 'BIF', 'MWK', 'ZMW',
  'ZWL', 'BWP', 'SZL', 'LSL', 'NAD', 'MZN', 'AOA', 'XOF', 'XAF', 'XPF',
  'DZD', 'MAD', 'TND', 'LYD', 'SDG', 'SSP', 'ERN'
];

/**
 * Validates if a currency code is a valid ISO 4217 currency code
 * @param currencyCode - The currency code to validate
 * @returns true if valid, false otherwise
 */
export function isValidCurrencyCode(currencyCode: string): boolean {
  return VALID_CURRENCY_CODES.includes(currencyCode.toUpperCase());
}

/**
 * Formats an amount as currency with proper validation and fallback
 * @param amount - The amount to format
 * @param currencyCode - The currency code (optional, defaults to USD)
 * @param locale - The locale to use for formatting (optional, defaults to 'en-US')
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number, 
  currencyCode?: string, 
  locale: string = 'en-US'
): string {
  // Use the provided currency code or default to USD
  const currency = currencyCode || 'USD';
  
  // Validate the currency code and fallback to USD if invalid
  const validCurrency = isValidCurrencyCode(currency) 
    ? currency.toUpperCase() 
    : 'USD';
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: validCurrency
    }).format(amount);
  } catch (error) {
    // If formatting still fails, return a simple formatted number with currency symbol
    console.warn(`Failed to format currency ${validCurrency}:`, error);
    return `$${amount.toLocaleString(locale, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  }
}

/**
 * Formats an amount as currency with USD as the default currency
 * @param amount - The amount to format
 * @param locale - The locale to use for formatting (optional, defaults to 'en-US')
 * @returns Formatted currency string in USD
 */
export function formatCurrencyUSD(amount: number, locale: string = 'en-US'): string {
  return formatCurrency(amount, 'USD', locale);
}
