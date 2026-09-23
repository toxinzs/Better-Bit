import { RegionKey } from "../types";
import { getRegion } from "../data/regions";

// Simplified, flattened version of real progressive US federal brackets
// (single filer) - flavor-accurate, not a tax-prep tool. Only wages are
// taxed here; side hustles, investment windfalls, and stock sale proceeds
// stay untouched, same simplification the rest of the money system makes
// (e.g. the home mortgage carries no real amortization curve either).
// A region's stateTaxRate (src/data/regions.ts) layers a flat add-on on
// top of these federal-shaped brackets - some regions genuinely have none.
export type TaxBracket = {
  upTo: number; // Infinity for the top bracket
  rate: number;
};

export const TAX_BRACKETS: TaxBracket[] = [
  { upTo: 11000, rate: 0.1 },
  { upTo: 44725, rate: 0.12 },
  { upTo: 95375, rate: 0.22 },
  { upTo: 182100, rate: 0.24 },
  { upTo: 231250, rate: 0.32 },
  { upTo: 578125, rate: 0.35 },
  { upTo: Infinity, rate: 0.37 },
];

export function incomeTax(grossIncome: number, region?: RegionKey): number {
  let tax = 0;
  let lastCap = 0;
  for (const bracket of TAX_BRACKETS) {
    if (grossIncome <= lastCap) break;
    const taxableInBracket = Math.min(grossIncome, bracket.upTo) - lastCap;
    tax += taxableInBracket * bracket.rate;
    lastCap = bracket.upTo;
  }
  tax += grossIncome * getRegion(region).stateTaxRate;
  return Math.round(tax);
}

export function takeHomePay(grossIncome: number, region?: RegionKey): number {
  return grossIncome - incomeTax(grossIncome, region);
}

export function effectiveTaxRate(grossIncome: number, region?: RegionKey): number {
  if (grossIncome <= 0) return 0;
  return incomeTax(grossIncome, region) / grossIncome;
}
