import { Character, Retirement, WorldState } from "../types";
import { clamp } from "./util";

const EARLY_WITHDRAWAL_AGE = 60;
const EARLY_WITHDRAWAL_PENALTY_RATE = 0.1;
const EMPLOYER_MATCH_RATE = 0.5; // employer matches 50% of what you put in...
const EMPLOYER_MATCH_CAP = 0.06; // ...up to 6% of gross salary

function ensureRetirement(c: Character): Retirement {
  if (!c.retirement) c.retirement = { balance: 0, contributionRate: 0 };
  return c.retirement;
}

export function retirementBalance(c: Character): number {
  return c.retirement?.balance ?? 0;
}

export function setContributionRate(c: Character, ratePercent: number): void {
  const retirement = ensureRetirement(c);
  retirement.contributionRate = clamp(ratePercent, 0, 50) / 100;
}

// Pre-tax, same as a real 401(k) - the contribution comes off gross income
// before tax is calculated, not after. Called from the income step in
// ageUp(), before incomeTax() runs on what's left.
export function applyContribution(
  c: Character,
  grossIncome: number,
): { contribution: number; employerMatch: number; taxableIncome: number } {
  const retirement = ensureRetirement(c);
  const contribution = Math.round(grossIncome * retirement.contributionRate);
  const matchedRate = Math.min(retirement.contributionRate, EMPLOYER_MATCH_CAP);
  const employerMatch = Math.round(grossIncome * matchedRate * EMPLOYER_MATCH_RATE);
  retirement.balance += contribution + employerMatch;
  return { contribution, employerMatch, taxableIncome: grossIncome - contribution };
}

// Growth is tied to the same simulated market everything else invests in -
// the average of this year's per-stock price change, applied to the whole
// balance, like a simple index fund. Must run after tickMarket() so
// prevPrice/price reflect this year's move.
export function tickRetirementGrowth(c: Character, world: WorldState): void {
  const retirement = c.retirement;
  if (!retirement || retirement.balance <= 0) return;
  const stocks = world.stocks ?? [];
  if (stocks.length === 0) return;
  const avgReturn =
    stocks.reduce((sum, s) => sum + (s.prevPrice > 0 ? (s.price - s.prevPrice) / s.prevPrice : 0), 0) / stocks.length;
  retirement.balance = Math.max(0, Math.round(retirement.balance * (1 + avgReturn)));
}

export function withdrawRetirement(c: Character, amount: number): boolean {
  const retirement = ensureRetirement(c);
  if (amount <= 0 || amount > retirement.balance) return false;
  const early = c.age < EARLY_WITHDRAWAL_AGE;
  const penalty = early ? Math.round(amount * EARLY_WITHDRAWAL_PENALTY_RATE) : 0;
  retirement.balance -= amount;
  c.money += amount - penalty;
  c.yearLog.push(
    early
      ? `You withdrew $${amount.toLocaleString()} from retirement early — a $${penalty.toLocaleString()} penalty took a bite out of it.`
      : `You withdrew $${amount.toLocaleString()} from retirement.`,
  );
  return true;
}
