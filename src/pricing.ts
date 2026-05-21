import type { CurrencyConfig } from "./types";

export type PricingMode = "tickets" | "dollars" | "mixed";

const USD_FALLBACK: CurrencyConfig = {
  code: "USD",
  symbol: "$",
  locale: "en-US",
  ticketPrice: 0.25,
};

const toDollars = (tickets: number, config: CurrencyConfig): string => {
  const amount = tickets * config.ticketPrice;
  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: config.code,
  }).format(amount);
};

export const formatPrice = (
  tickets: number,
  mode: PricingMode,
  currencyConfig?: CurrencyConfig,
): string => {
  const config = currencyConfig ?? USD_FALLBACK;
  const ticketLabel = `${tickets} ticket${tickets === 1 ? "" : "s"}`;
  if (mode === "tickets") return ticketLabel;
  if (mode === "dollars") return toDollars(tickets, config);
  // mixed
  return `${ticketLabel} (${toDollars(tickets, config)})`;
};
