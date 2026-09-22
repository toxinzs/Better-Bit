import { Character } from "../types";
import { CarListing, HomeListing } from "../data/assets";

const CAR_RESALE_RATE = 0.65; // depreciation on resale
const HOME_DOWN_PAYMENT_RATE = 0.2;
const MORTGAGE_YEARS = 15;
const CAR_UPKEEP = 600; // per year

export function buyCar(c: Character, listing: CarListing): boolean {
  if (c.money < listing.price) return false;
  c.money -= listing.price;
  c.car = { name: listing.name, value: listing.price };
  c.yearLog.push(`You bought a ${listing.name}. -$${listing.price.toLocaleString()}`);
  return true;
}

export function sellCar(c: Character): void {
  if (!c.car) return;
  const proceeds = Math.round(c.car.value * CAR_RESALE_RATE);
  c.money += proceeds;
  c.yearLog.push(`You sold your ${c.car.name}. +$${proceeds.toLocaleString()}`);
  c.car = null;
}

export function buyHome(c: Character, listing: HomeListing): boolean {
  const downPayment = Math.round(listing.price * HOME_DOWN_PAYMENT_RATE);
  if (c.money < downPayment) return false;
  c.money -= downPayment;
  const loan = listing.price - downPayment;
  c.home = {
    name: listing.name,
    value: listing.price,
    mortgageBalance: loan,
    yearlyPayment: Math.round(loan / MORTGAGE_YEARS),
  };
  c.yearLog.push(`You bought a ${listing.name}. Down payment: $${downPayment.toLocaleString()}`);
  return true;
}

export function sellHome(c: Character): void {
  if (!c.home) return;
  const equity = c.home.value - c.home.mortgageBalance;
  c.money += Math.max(0, equity);
  c.yearLog.push(`You sold your ${c.home.name}.`);
  c.home = null;
}

export function netWorth(c: Character): number {
  const carValue = c.car?.value ?? 0;
  const homeEquity = c.home ? c.home.value - c.home.mortgageBalance : 0;
  const debt = (c.loans ?? []).reduce((sum, l) => sum + l.balance, 0);
  return c.money + carValue + homeEquity - debt;
}

// Mortgage payments and car upkeep can push money negative - there's no
// bankruptcy/foreclosure system yet, so overspending on assets carries a
// real, visible consequence (a negative balance) rather than being
// silently clamped at zero.
export function tickAssets(c: Character): void {
  if (c.home && c.home.mortgageBalance > 0) {
    const payment = Math.min(c.home.yearlyPayment, c.home.mortgageBalance);
    c.money -= payment;
    c.home.mortgageBalance -= payment;
    if (c.home.mortgageBalance <= 0) {
      c.home.mortgageBalance = 0;
      c.yearLog.push(`You paid off your ${c.home.name}!`);
    }
  }
  if (c.car) {
    c.money -= CAR_UPKEEP;
  }
}
