export type PricingMode = "tickets" | "dollars";

export interface CurrencyConfig {
  readonly code: string;
  readonly symbol: string;
  readonly locale: string;
  readonly ticketPrice: number;
}

const USD: CurrencyConfig = { code: "USD", symbol: "$", locale: "en-US", ticketPrice: 0.25 };

export const SUPPORTED_CURRENCIES: Readonly<Record<string, CurrencyConfig>> = {
  usd: USD,
  cad: { code: "CAD", symbol: "CA$", locale: "en-CA", ticketPrice: 0.3 },
  gbp: { code: "GBP", symbol: "£", locale: "en-GB", ticketPrice: 0.2 },
};

export const TICKET_PRICE = 0.25;

const getCurrency = (currency: string): CurrencyConfig =>
  SUPPORTED_CURRENCIES[currency] ?? USD;

const toDollars = (tickets: number, currency: string = "usd"): string => {
  const config = getCurrency(currency);
  const amount = tickets * config.ticketPrice;
  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: config.code,
  }).format(amount);
};

export const formatPrice = (
  tickets: number,
  mode: PricingMode,
  currency: string = "usd",
): string =>
  mode === "dollars"
    ? toDollars(tickets, currency)
    : `${tickets} credit${tickets === 1 ? "" : "s"}`;

export const formatBalance = (
  balance: number,
  mode: PricingMode,
  currency: string = "usd",
): string =>
  mode === "dollars"
    ? toDollars(balance, currency)
    : `${balance} credit${balance === 1 ? "" : "s"}`;
