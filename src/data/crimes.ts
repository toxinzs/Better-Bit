import { CrimeTier } from "../types";

export type CrimeDef = {
  id: string;
  label: string;
  tier: CrimeTier;
  minAge: number;
  successBase: number; // 0-1, before the smarts modifier
  rewardMin: number;
  rewardMax: number;
  sentenceMinYears: number;
  sentenceMaxYears: number;
  bailAmount: number;
};

export const CRIMES: CrimeDef[] = [
  {
    id: "shoplifting",
    label: "Shoplift from a store",
    tier: "petty",
    minAge: 10,
    successBase: 0.7,
    rewardMin: 20,
    rewardMax: 150,
    sentenceMinYears: 0,
    sentenceMaxYears: 1,
    bailAmount: 300,
  },
  {
    id: "vandalism",
    label: "Vandalize some property",
    tier: "petty",
    minAge: 10,
    successBase: 0.65,
    rewardMin: 0,
    rewardMax: 0,
    sentenceMinYears: 0,
    sentenceMaxYears: 1,
    bailAmount: 250,
  },
  {
    id: "pickpocket",
    label: "Pickpocket a stranger",
    tier: "petty",
    minAge: 12,
    successBase: 0.6,
    rewardMin: 10,
    rewardMax: 120,
    sentenceMinYears: 0,
    sentenceMaxYears: 1,
    bailAmount: 300,
  },
  {
    id: "burglary",
    label: "Break into a house",
    tier: "moderate",
    minAge: 16,
    successBase: 0.5,
    rewardMin: 500,
    rewardMax: 3000,
    sentenceMinYears: 1,
    sentenceMaxYears: 3,
    bailAmount: 2000,
  },
  {
    id: "carTheft",
    label: "Steal a car",
    tier: "moderate",
    minAge: 16,
    successBase: 0.45,
    rewardMin: 1000,
    rewardMax: 8000,
    sentenceMinYears: 1,
    sentenceMaxYears: 4,
    bailAmount: 3000,
  },
  {
    id: "fraud",
    label: "Run a scam",
    tier: "moderate",
    minAge: 18,
    successBase: 0.55,
    rewardMin: 500,
    rewardMax: 5000,
    sentenceMinYears: 1,
    sentenceMaxYears: 3,
    bailAmount: 2500,
  },
  {
    id: "robbery",
    label: "Rob a store at gunpoint",
    tier: "serious",
    minAge: 18,
    successBase: 0.35,
    rewardMin: 2000,
    rewardMax: 15000,
    sentenceMinYears: 3,
    sentenceMaxYears: 8,
    bailAmount: 10000,
  },
  {
    id: "trafficking",
    label: "Deal in bulk",
    tier: "serious",
    minAge: 18,
    successBase: 0.3,
    rewardMin: 5000,
    rewardMax: 30000,
    sentenceMinYears: 4,
    sentenceMaxYears: 10,
    bailAmount: 15000,
  },
];

export function availableCrimes(age: number): CrimeDef[] {
  return CRIMES.filter((c) => age >= c.minAge);
}

export function crimeById(id: string): CrimeDef | undefined {
  return CRIMES.find((c) => c.id === id);
}
