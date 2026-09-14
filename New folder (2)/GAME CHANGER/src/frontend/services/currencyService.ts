const CURRENCY_STORAGE_KEY = "morphcart:currency";
const CURRENCY_EVENT_NAME = "morphcart:currency-updated";

export const exchangeRates: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  INR: 83.2
};

export const currencySymbols: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  INR: "₹"
};

export function readCurrency(defaultCurrency = "USD"): string {
  if (typeof window === "undefined") {
    return defaultCurrency;
  }

  try {
    const raw = window.localStorage.getItem(CURRENCY_STORAGE_KEY);
    return raw && exchangeRates[raw] ? raw : defaultCurrency;
  } catch {
    return defaultCurrency;
  }
}

export function writeCurrency(currency: string) {
  if (typeof window === "undefined") {
    return;
  }

  if (exchangeRates[currency]) {
    window.localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
    window.dispatchEvent(new Event(CURRENCY_EVENT_NAME));
  }
}

export function convertPrice(amountInUSD: number, targetCurrency: string): number {
  const rate = exchangeRates[targetCurrency] || 1.0;
  return amountInUSD * rate;
}

export function formatPrice(amountInUSD: number, targetCurrency: string): string {
  const converted = convertPrice(amountInUSD, targetCurrency);
  const symbol = currencySymbols[targetCurrency] || targetCurrency;
  
  return `${symbol}${converted.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

export const currencyUpdateEvent = CURRENCY_EVENT_NAME;
