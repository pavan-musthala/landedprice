import { CurrencyOption } from '@/types';

// Cache exchange rates for 24 hours since the API updates daily
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface ExchangeRateCache {
  rates: Record<string, number>;
  timestamp: number;
  date: string;
}

interface CurrencyResponse {
  date: string;
  inr: {
    [currency: string]: number;
  };
}

let rateCache: ExchangeRateCache | null = null;

// List of supported currencies (we'll fetch this from the API)
export let supportedCurrencies: string[] = [];

// Function to fetch all available currencies
async function fetchSupportedCurrencies(): Promise<string[]> {
  try {
    const response = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies.json');
    if (!response.ok) throw new Error('Failed to fetch currencies list');
    const data = await response.json();
    return Object.keys(data.currencies || data);
  } catch (error) {
    console.error('Error fetching supported currencies:', error);
    // Fallback to basic currencies if API fails
    return ['usd', 'eur', 'inr', 'gbp', 'jpy', 'aud', 'cad', 'chf', 'cny', 'sgd'];
  }
}

// Function to fetch exchange rates with fallback
async function fetchExchangeRates(): Promise<CurrencyResponse> {
  const primaryUrl = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/inr.json';
  const fallbackUrl = 'https://latest.currency-api.pages.dev/v1/currencies/inr.json';

  try {
    let response = await fetch(primaryUrl);
    if (!response.ok) throw new Error('Primary CDN failed');
    const data = await response.json();
    return data;
  } catch (error) {
    console.warn('Primary CDN failed, trying fallback...', error);
    let response = await fetch(fallbackUrl);
    if (!response.ok) throw new Error('Both endpoints failed');
    const data = await response.json();
    return data;
  }
}

export async function getExchangeRates(): Promise<Record<string, number>> {
  // Initialize supported currencies if not already done
  if (supportedCurrencies.length === 0) {
    supportedCurrencies = await fetchSupportedCurrencies();
  }

  // Check if we have valid cached rates
  if (rateCache && Date.now() - rateCache.timestamp < CACHE_DURATION) {
    console.log('Using cached exchange rates:', rateCache.rates);
    return rateCache.rates;
  }

  try {
    const data = await fetchExchangeRates();
    console.log('Raw exchange rate data:', data);
    
    // Convert rates to our format (INR as base)
    const rates: Record<string, number> = {};
    
    // Add all currencies with their rates relative to INR
    if (data.inr) {
      Object.entries(data.inr).forEach(([currency, rate]) => {
        // The API returns rates in the format 1 INR = X [currency]
        // We need to convert this to 1 [currency] = X INR
        // For example, if rate is 0.011701774 (1 INR = 0.011701774 USD)
        // Then 1 USD = 1/0.011701774 = 85.45 INR
        rates[currency.toUpperCase()] = 1 / (rate as number);
        console.log(`Setting rate for ${currency.toUpperCase()}: ${1 / (rate as number)} (inverted from ${rate})`);
      });
    }

    // Update cache
    rateCache = {
      rates,
      timestamp: Date.now(),
      date: data.date
    };

    console.log('Final exchange rates:', rates);
    return rates;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    
    // Fallback to last cached rates if available
    if (rateCache) {
      console.warn('Using cached exchange rates due to API error:', rateCache.rates);
      return rateCache.rates;
    }

    // If no cache available, use fallback rates
    console.warn('Using fallback exchange rates due to API error');
    const fallbackRates = {
      INR: 1,
      USD: 83.0,  // 1 USD = 83 INR
      EUR: 90.0,  // 1 EUR = 90 INR
      GBP: 105.0, // 1 GBP = 105 INR
      JPY: 0.55,  // 1 JPY = 0.55 INR
      AUD: 54.0,  // 1 AUD = 54 INR
      CAD: 61.0,  // 1 CAD = 61 INR
      CHF: 94.0,  // 1 CHF = 94 INR
      CNY: 11.5,  // 1 CNY = 11.5 INR
      SGD: 62.0   // 1 SGD = 62 INR
    };
    console.log('Using fallback rates:', fallbackRates);
    return fallbackRates;
  }
}

// Function to convert amount from one currency to another
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  const rates = await getExchangeRates();
  
  // Convert to INR first (our base currency)
  const amountInINR = amount * rates[fromCurrency.toUpperCase()];
  
  // Then convert to target currency
  return amountInINR / rates[toCurrency.toUpperCase()];
}

// Function to format currency with symbol
export function formatCurrencyWithSymbol(
  amount: number,
  currency: string
): string {
  const symbols: Record<string, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    AUD: 'A$',
    CAD: 'C$',
    CHF: 'Fr',
    CNY: '¥',
    SGD: 'S$',
    // Add more currency symbols as needed
  };

  const symbol = symbols[currency.toUpperCase()] || currency.toUpperCase();
  
  return `${symbol}${amount.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  })}`;
}

// Function to get all supported currencies
export async function getSupportedCurrencies(): Promise<string[]> {
  if (supportedCurrencies.length === 0) {
    supportedCurrencies = await fetchSupportedCurrencies();
  }
  return supportedCurrencies.map(c => c.toUpperCase());
}

// Function to get the last update date of exchange rates
export function getLastUpdateDate(): string | null {
  return rateCache?.date || null;
} 