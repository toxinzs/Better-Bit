import { Character, RegionKey } from "../types";
import { City, cityByKey, defaultCityFor } from "../data/cities";
import { getRegion } from "../data/regions";

// Pure lookups for "where does this person live" - no engine imports, so any
// module can use them without a cycle.

// how expensive the whole country is, relative to the US baseline
export function priceIndex(region: RegionKey | undefined): number {
  const tier = getRegion(region).costOfLivingTier;
  return tier === "low" ? 0.35 : tier === "high" ? 1.1 : 1;
}

// How much everyday life (rent, food, homes) costs relative to the US baseline.
// It follows what people in that country earn, so a typical wage stretches about
// as far everywhere; cheaper countries get a little extra slack on top.
export function livingIndex(region: RegionKey | undefined): number {
  const def = getRegion(region);
  return def.costOfLivingTier === "low" ? Math.max(0.26, def.jobMultiplier * 0.85) : def.jobMultiplier;
}

// Prices creep up about 2% a year through your working life; raises are sized
// to keep pace, and promotions are where real progress comes from.
export const inflation = (c: Character): number => Math.pow(1.02, Math.max(0, c.age - 20));

export function cityOf(c: Character): City {
  return cityByKey(c.residence?.city) ?? defaultCityFor(c.originRegion);
}

// pay in your city relative to the country's average
export const cityWage = (c: Character): number => cityOf(c).wage;
export const cityCost = (c: Character): number => cityOf(c).cost;
export const cityLabel = (c: Character): string => {
  const city = cityOf(c);
  return `${city.name}, ${getRegion(city.region).label}`;
};

// record this year's take-home and tax for the Budget screen
export function noteIncome(c: Character, net: number, tax: number): void {
  const b = c.budget && c.budget.age === c.age ? c.budget : (c.budget = { age: c.age, income: 0, tax: 0, rent: 0, living: 0, upkeep: 0 });
  b.income += net;
  b.tax += tax;
}
