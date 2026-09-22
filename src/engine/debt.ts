import { Character } from "../types";
import { clamp } from "./util";
import { ensureFinance } from "./finance";
import { LoanListing, CreditCardListing } from "../data/loans";

const CREDIT_CARD_MIN_PAYMENT_RATE = 0.05;
const CREDIT_CARD_MIN_PAYMENT_FLOOR = 25;

let idCounter = 0;
function newLoanId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

export function takeOutLoan(c: Character, listing: LoanListing): boolean {
  const loans = ensureFinance(c);
  // simple interest, spread evenly across the term - same straight-line
  // simplification the home mortgage already uses, just with real interest
  const totalRepay = Math.round(listing.amount * (1 + listing.apr * listing.termYears));
  const yearlyPayment = Math.round(totalRepay / listing.termYears);
  loans.push({
    id: newLoanId("loan"),
    kind: "personal",
    name: listing.name,
    balance: totalRepay,
    apr: listing.apr,
    minPayment: yearlyPayment,
  });
  c.money += listing.amount;
  c.yearLog.push(
    `You took out a ${listing.name}: +$${listing.amount.toLocaleString()} now, $${yearlyPayment.toLocaleString()}/yr for ${listing.termYears} years.`,
  );
  return true;
}

export function openCreditCard(c: Character, listing: CreditCardListing): boolean {
  const loans = ensureFinance(c);
  if (loans.some((l) => l.kind === "creditCard")) return false;
  loans.push({
    id: newLoanId("card"),
    kind: "creditCard",
    name: listing.name,
    balance: 0,
    apr: listing.apr,
    minPayment: 0,
    limit: listing.limit,
  });
  c.yearLog.push(`You were approved for a ${listing.name} ($${listing.limit.toLocaleString()} limit).`);
  return true;
}

export function chargeCard(c: Character, loanId: string, amount: number): boolean {
  const loans = ensureFinance(c);
  const loan = loans.find((l) => l.id === loanId && l.kind === "creditCard");
  if (!loan || amount <= 0) return false;
  const available = (loan.limit ?? 0) - loan.balance;
  if (amount > available) return false;
  loan.balance += amount;
  c.money += amount;
  c.yearLog.push(`You put $${amount.toLocaleString()} on your ${loan.name}.`);
  return true;
}

export function payDownLoan(c: Character, loanId: string, amount: number): boolean {
  const loans = ensureFinance(c);
  const loan = loans.find((l) => l.id === loanId);
  if (!loan || amount <= 0 || c.money < amount) return false;
  const applied = Math.min(amount, loan.balance);
  c.money -= applied;
  loan.balance -= applied;
  c.yearLog.push(`You put $${applied.toLocaleString()} toward your ${loan.name}.`);
  return true;
}

// Interest accrual + automatic minimum payments, once per year (ageUp).
// Credit score reacts to utilization, payoff, and going into the red -
// visible cause and effect, not a hidden dice roll, matching how the rest
// of the money system is built.
export function tickDebt(c: Character): void {
  const loans = ensureFinance(c);
  if (loans.length === 0) return;

  let scoreDelta = 0;

  for (const loan of loans) {
    if (loan.kind === "creditCard") {
      const interest = Math.round(loan.balance * loan.apr);
      loan.balance += interest;
      if (loan.balance > 0) {
        const payment = Math.min(
          loan.balance,
          Math.max(CREDIT_CARD_MIN_PAYMENT_FLOOR, Math.round(loan.balance * CREDIT_CARD_MIN_PAYMENT_RATE)),
        );
        c.money -= payment;
        loan.balance -= payment;
        const utilization = loan.limit ? loan.balance / loan.limit : 0;
        scoreDelta += utilization > 0.7 ? -3 : utilization > 0.3 ? 0 : 2;
      }
    } else {
      const payment = Math.min(loan.minPayment, loan.balance);
      c.money -= payment;
      loan.balance -= payment;
      scoreDelta += 2;
    }
  }

  const paidOff = loans.filter((l) => l.balance <= 0);
  for (const l of paidOff) {
    c.yearLog.push(`You paid off your ${l.name}!`);
  }
  scoreDelta += 15 * paidOff.length;
  if (paidOff.length > 0) {
    c.loans = loans.filter((l) => l.balance > 0);
  }

  if (c.money < 0) {
    scoreDelta -= 15;
    c.yearLog.push("You're deep in the red — lenders are noticing, and it's hurting your credit.");
  }

  c.creditScore = clamp((c.creditScore ?? 650) + scoreDelta, 300, 850);
}
