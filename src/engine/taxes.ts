import { Character, RegionKey } from "../types";
import { getRegion } from "../data/regions";
import { TAX } from "../data/economy";

// Income tax + social contributions, per country (data/economy.ts). Only
// wages and business profit are taxed here; investment windfalls and stock
// sale proceeds stay untouched, the same simplification the rest of the money
// system makes. A region's stateTaxRate is a flat local layer on top.

export type TaxBreakdown = { income: number; social: number; local: number; credit: number; total: number };

const jm = (region?: RegionKey) => Math.max(0.05, getRegion(region).jobMultiplier);

export function taxBreakdown(grossIncome: number, region?: RegionKey, credit = 0): TaxBreakdown {
  if (grossIncome <= 0) return { income: 0, social: 0, local: 0, credit: 0, total: 0 };
  const model = TAX[region ?? "us"];
  const scale = jm(region);
  const base = grossIncome / scale; // baseline dollars
  let income = 0;
  let last = 0;
  for (const b of model.brackets) {
    if (base <= last) break;
    income += (Math.min(base, b.upTo) - last) * b.rate;
    last = b.upTo;
  }
  const social = Math.min(base, model.socialCap) * model.social;
  income = Math.max(0, income - credit / scale);
  const local = base * getRegion(region).stateTaxRate;
  return { income: Math.round(income * scale), social: Math.round(social * scale), local: Math.round(local * scale), credit: Math.round(credit), total: Math.round((income + social + local) * scale) };
}

export function incomeTax(grossIncome: number, region?: RegionKey, credit = 0): number {
  return taxBreakdown(grossIncome, region, credit).total;
}

// what the tax office takes off for your children (in game dollars)
export function taxCredit(c: Character): number {
  const kids = c.relationships.filter((r) => r.alive && r.type === "child" && (r.bornOffset === undefined ? true : c.age - (-r.bornOffset) < 18)).length;
  const model = TAX[c.originRegion ?? "us"];
  return Math.round(Math.min(kids, 4) * model.childCredit * jm(c.originRegion));
}

export function takeHomePay(grossIncome: number, region?: RegionKey): number {
  return grossIncome - incomeTax(grossIncome, region);
}

export function effectiveTaxRate(grossIncome: number, region?: RegionKey): number {
  if (grossIncome <= 0) return 0;
  return incomeTax(grossIncome, region) / grossIncome;
}

// the rate on your next dollar
export function marginalRate(grossIncome: number, region?: RegionKey): number {
  const model = TAX[region ?? "us"];
  const base = grossIncome / jm(region);
  const bracket = model.brackets.find((b) => base <= b.upTo) ?? model.brackets[model.brackets.length - 1];
  return bracket.rate + (base < model.socialCap ? model.social : 0) + getRegion(region).stateTaxRate;
}
