export type LoanListing = {
  name: string;
  amount: number;
  apr: number;
  termYears: number;
  minAge: number;
  minCreditScore?: number;
};

export type CreditCardListing = {
  name: string;
  limit: number;
  apr: number;
  minAge: number;
  minCreditScore?: number;
};

export const PERSONAL_LOAN_LISTINGS: LoanListing[] = [
  { name: "Small Personal Loan", amount: 2000, apr: 0.12, termYears: 2, minAge: 18 },
  { name: "Medium Personal Loan", amount: 8000, apr: 0.15, termYears: 4, minAge: 18, minCreditScore: 600 },
  { name: "Large Personal Loan", amount: 20000, apr: 0.18, termYears: 6, minAge: 18, minCreditScore: 670 },
];

export const CREDIT_CARD_LISTINGS: CreditCardListing[] = [
  { name: "Starter Card", limit: 1000, apr: 0.26, minAge: 18 },
  { name: "Standard Card", limit: 4000, apr: 0.22, minAge: 18, minCreditScore: 620 },
  { name: "Premium Card", limit: 10000, apr: 0.18, minAge: 21, minCreditScore: 720 },
];

export function availablePersonalLoans(age: number, creditScore: number): LoanListing[] {
  return PERSONAL_LOAN_LISTINGS.filter((l) => age >= l.minAge && creditScore >= (l.minCreditScore ?? 0));
}

export function availableCreditCards(age: number, creditScore: number): CreditCardListing[] {
  return CREDIT_CARD_LISTINGS.filter((l) => age >= l.minAge && creditScore >= (l.minCreditScore ?? 0));
}
