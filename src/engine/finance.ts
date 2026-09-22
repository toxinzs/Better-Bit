import { Character, Loan } from "../types";

// Additive-optional-field pattern: old saves won't have `loans`/`creditScore`
// at all after JSON.parse, even though the type says they're always there.
// Call this before reading either field so downstream code can assume they exist.
export function ensureFinance(c: Character): Loan[] {
  if (!c.loans) c.loans = [];
  if (c.creditScore == null) c.creditScore = 650;
  return c.loans;
}

export function creditScoreLabel(score: number): string {
  if (score >= 800) return "Exceptional";
  if (score >= 740) return "Very Good";
  if (score >= 670) return "Good";
  if (score >= 580) return "Fair";
  return "Poor";
}
