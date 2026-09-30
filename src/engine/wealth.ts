import { Character, Rental, WorldState } from "../types";
import { changeStat } from "./stats";
import { clamp } from "./util";
import { hasActiveCondition } from "./worldState";
import { cityOf, cityCost, livingIndex, noteIncome, inflation } from "./where";
import { getRegion } from "../data/regions";
import { sellHome } from "./assets";

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

// ------------------------------------------------------------------ savings

export function savingsRate(c: Character, world: WorldState): number {
  const tier = getRegion(c.originRegion).costOfLivingTier;
  const base = tier === "low" ? 0.045 : tier === "high" ? 0.022 : 0.02;
  const mood = hasActiveCondition(world, "boom") ? 0.008 : hasActiveCondition(world, "recession") ? -0.012 : 0;
  return Math.max(0.002, base + mood);
}

// idle cash earns a little, up to a limit
export function tickSavings(c: Character, world: WorldState): void {
  if (c.money <= 0) return;
  const cap = 150000 * livingIndex(c.originRegion);
  const interest = Math.round(Math.min(c.money, cap) * savingsRate(c, world));
  if (interest < 25) return;
  c.money += interest;
  c.yearLog.push(`Your savings earned ${money(interest)} in interest.`);
}

// ------------------------------------------------------------------ rental property

export type RentalListing = { key: string; name: string; price: number; yield: number; blurb: string };

const RENTAL_BASE: { key: string; name: string; price: number; yield: number; blurb: string }[] = [
  { key: "flat", name: "Studio flat", price: 90000, yield: 0.062, blurb: "Small, always in demand." },
  { key: "twobed", name: "Two-bed apartment", price: 170000, yield: 0.055, blurb: "Popular with couples and sharers." },
  { key: "house", name: "Terraced house", price: 280000, yield: 0.05, blurb: "Families stay for years." },
  { key: "block", name: "Small apartment block", price: 620000, yield: 0.058, blurb: "Six units, six rent cheques, six sets of problems." },
];

export function rentalListings(c: Character): RentalListing[] {
  const city = cityOf(c);
  return RENTAL_BASE.map((r) => ({ ...r, name: `${r.name}, ${city.name}`, price: Math.round((r.price * cityCost(c) * livingIndex(c.originRegion) * inflation(c)) / 500) * 500 }));
}

export function buyRental(c: Character, listing: RentalListing): boolean {
  if (c.age < 21 || c.inJail || c.money < listing.price) return false;
  c.money -= listing.price;
  (c.rentals ??= []).push({ name: listing.name, value: listing.price, rent: Math.round(listing.price * listing.yield), since: c.age });
  c.yearLog.push(`You bought a rental property: ${listing.name}. -${money(listing.price)}`);
  return true;
}

export function sellRental(c: Character, index: number): boolean {
  const r = (c.rentals ?? [])[index];
  if (!r) return false;
  const proceeds = Math.round(r.value * 0.97);
  c.money += proceeds;
  c.rentals = (c.rentals ?? []).filter((_, i) => i !== index);
  c.yearLog.push(`You sold ${r.name} for ${money(proceeds)}.`);
  return true;
}

export const rentalsValue = (c: Character): number => (c.rentals ?? []).reduce((s, r) => s + r.value, 0);

export function tickRentals(c: Character, world: WorldState): void {
  const list = c.rentals ?? [];
  if (list.length === 0) return;
  const mood = hasActiveCondition(world, "boom") ? 0.03 : hasActiveCondition(world, "recession") ? -0.05 : 0;
  let net = 0;
  for (const r of list) {
    r.value = Math.round(r.value * (1 + 0.03 + mood + (Math.random() * 0.1 - 0.05)));
    const vacant = Math.random() < 0.12;
    r.vacantYears = vacant ? (r.vacantYears ?? 0) + 1 : 0;
    const gross = vacant ? 0 : Math.round(r.value * (r.rent / Math.max(1, r.value / 1.03)));
    const upkeep = Math.round(r.value * 0.012);
    net += gross - upkeep;
    r.rent = Math.round(r.value * 0.055);
  }
  const tax = net > 0 ? Math.round(net * 0.25) : 0;
  c.money += net - tax;
  if (net > 0) noteIncome(c, net - tax, tax);
  c.yearLog.push(`Your rental propert${list.length === 1 ? "y" : "ies"} ${net >= 0 ? `brought in ${money(net - tax)} after tax and upkeep` : `cost you ${money(-net)} this year`}.`);
}

// ------------------------------------------------------------------ bankruptcy

export const debtTotal = (c: Character): number => (c.loans ?? []).reduce((s, l) => s + Math.max(0, l.balance), 0);

export function bankruptcyCheck(c: Character): { ok: boolean; reason?: string } {
  if (c.age < 18) return { ok: false, reason: "You need to be an adult." };
  if (c.bankruptAge !== undefined && c.age - c.bankruptAge < 7) return { ok: false, reason: "You've already been through it. You can't again for seven years." };
  const owed = (c.loans ?? []).filter((l) => l.kind !== "student").reduce((s, l) => s + Math.max(0, l.balance), 0);
  if (owed < 3000 * livingIndex(c.originRegion) && c.money >= 0) return { ok: false, reason: "You don't owe enough to justify it." };
  if (owed <= 0 && c.money >= 0) return { ok: false, reason: "You have no debts to clear." };
  return { ok: true };
}

export function declareBankruptcy(c: Character): boolean {
  if (!bankruptcyCheck(c).ok) return false;
  const cleared = (c.loans ?? []).filter((l) => l.kind !== "student").reduce((s, l) => s + Math.max(0, l.balance), 0);
  c.loans = (c.loans ?? []).filter((l) => l.kind === "student");
  if (c.money < 0) c.money = 0;
  const lost: string[] = [];
  if (c.car) { lost.push(c.car.name); c.car = null; }
  if ((c.rentals ?? []).length) { lost.push(`${c.rentals!.length} rental propert${c.rentals!.length === 1 ? "y" : "ies"}`); c.rentals = []; }
  if (c.portfolio?.length) { lost.push("your investments"); c.portfolio = []; }
  if (c.home && c.home.mortgageBalance > c.home.value * 0.9) { const n = c.home.name; sellHome(c); lost.push(n); }
  c.bankruptAge = c.age;
  c.creditScore = 300;
  changeStat(c, "happiness", -14, "Bankruptcy");
  c.stress = clamp((c.stress ?? 25) + 10);
  c.yearLog.push(`You declared bankruptcy. ${money(cleared)} of debt was wiped out${lost.length ? `, and you lost ${lost.join(", ")}` : ""}. Your credit is ruined for years.`);
  c.fullLog.push({ age: c.age, text: "You declared bankruptcy." });
  return true;
}
