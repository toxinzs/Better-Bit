import { Character, CrimeTier, EventChoice, LifeEvent, WorldState } from "../types";
import { clamp, randomInt } from "./util";
import { hasActiveCondition } from "./worldState";
import { CrimeDef, crimeById } from "../data/crimes";

const PAROLE_CHANCE = 0.15;
const GUILTY_PLEA_CREDIT_HIT = 30;
const CONVICTED_CREDIT_HIT = 50;
const ACQUITTED_HAPPINESS_BOOST = 10;
const CRACKDOWN_CONVICTION_BONUS = 0.15;
const CRACKDOWN_SUCCESS_PENALTY = 0.15;
const EXPUNGEMENT_FEE = 500;
const EXPUNGEMENT_ELIGIBLE_YEARS = 7;

const BASE_CONVICTION_CHANCE: Record<CrimeTier, number> = { petty: 0.4, moderate: 0.55, serious: 0.7 };

// A small fixed tier table, not a data/*.ts catalog - unlike jobs/cars/loans
// these three rows are always the same three choices, scaled by crime tier
// inline, not a growing list a player browses independently.
const LAWYER_TIERS: { name: string; costByTier: Record<CrimeTier, number>; qualityBonus: number }[] = [
  { name: "Public Defender", costByTier: { petty: 0, moderate: 0, serious: 0 }, qualityBonus: -0.15 },
  { name: "Hired Lawyer", costByTier: { petty: 800, moderate: 2500, serious: 6000 }, qualityBonus: 0 },
  { name: "Top Lawyer", costByTier: { petty: 2000, moderate: 6000, serious: 15000 }, qualityBonus: 0.2 },
];

export function successChance(crime: CrimeDef, smarts: number, world?: WorldState): number {
  const crackdownPenalty = world && hasActiveCondition(world, "crackdown") ? CRACKDOWN_SUCCESS_PENALTY : 0;
  return clamp(crime.successBase + (smarts - 50) / 200 - crackdownPenalty, 0.05, 0.95);
}

// Returns a synthetic LifeEvent (the arrest, then a chained court sequence)
// if the player got caught, so the store can surface it through the exact
// same pendingEvent/EventModal machinery ageUp() already uses for random
// events - no separate UI needed for any of it.
export function commitCrime(c: Character, crimeId: string, world: WorldState): LifeEvent | null {
  const crime = crimeById(crimeId);
  if (!crime) return null;

  const chance = successChance(crime, c.stats.smarts, world);
  const success = Math.random() < chance;

  if (success) {
    const gain = crime.rewardMax > 0 ? randomInt(crime.rewardMin, crime.rewardMax) : 0;
    c.money += gain;
    c.stats.happiness = clamp(c.stats.happiness + 5);
    c.yearLog.push(
      gain > 0
        ? `You pulled it off: ${crime.label.toLowerCase()}. Walked away with $${gain.toLocaleString()}.`
        : `You pulled it off: ${crime.label.toLowerCase()}. Got away clean.`,
    );
    return null;
  }

  c.yearLog.push(`You got caught trying to ${crime.label.toLowerCase()}.`);
  return buildArrestEvent(crime);
}

function buildArrestEvent(crime: CrimeDef): LifeEvent {
  // rolled once, shared between the guilty-plea and convicted-at-trial
  // outcomes so they're comparable severity, not two independent rolls
  const fullSentence = randomInt(crime.sentenceMinYears, crime.sentenceMaxYears);
  const guiltySentence = Math.round(fullSentence * 0.5);

  return {
    id: `arrest-${crime.id}-${Date.now()}`,
    minAge: 0,
    maxAge: 200,
    text: () => `You were arrested for ${crime.label.toLowerCase()}. Bail is set at $${crime.bailAmount.toLocaleString()} while you await trial.`,
    choices: [
      {
        label:
          guiltySentence > 0
            ? `Plead guilty — take the deal (${guiltySentence} year${guiltySentence === 1 ? "" : "s"})`
            : "Plead guilty — take the deal",
        effect: (ch) => {
          ch.criminalRecord = true;
          ch.recordCleanYears = 0;
          ch.creditScore = clamp((ch.creditScore ?? 650) - GUILTY_PLEA_CREDIT_HIT, 300, 850);
          if (guiltySentence > 0) {
            ch.inJail = true;
            ch.jailYearsLeft = guiltySentence;
            ch.jailYearsTotal = guiltySentence;
            ch.job = null;
          }
        },
        resultText: () =>
          guiltySentence > 0
            ? `You took the deal. Sentenced to ${guiltySentence} year${guiltySentence === 1 ? "" : "s"}.`
            : "You took the deal — a fine and a record, no time served.",
      },
      {
        label: "Fight the charges in court",
        effect: (ch) => buildTrialEvent(crime, fullSentence, ch),
        resultText: () => "You decide to fight it.",
      },
    ],
  };
}

function buildTrialEvent(crime: CrimeDef, fullSentence: number, character: Character): LifeEvent {
  const affordableTiers = LAWYER_TIERS.filter((tier) => tier.costByTier[crime.tier] === 0 || character.money >= tier.costByTier[crime.tier]);

  const choices: EventChoice[] = affordableTiers.map((tier) => {
    const cost = tier.costByTier[crime.tier];
    // closure-shared between effect and resultText, since resolveEvent
    // calls them back to back and the verdict is rolled live in effect()
    let convicted = false;

    return {
      label: `${tier.name}${cost > 0 ? ` ($${cost.toLocaleString()})` : " — free"}`,
      effect: (ch: Character, world: WorldState) => {
        ch.money -= cost;
        const smartsAdj = (50 - ch.stats.smarts) / 300;
        const crackdownAdj = hasActiveCondition(world, "crackdown") ? CRACKDOWN_CONVICTION_BONUS : 0;
        const convictionChance = clamp(
          BASE_CONVICTION_CHANCE[crime.tier] - tier.qualityBonus + smartsAdj + crackdownAdj,
          0.05,
          0.95,
        );
        convicted = Math.random() < convictionChance;
        if (convicted) {
          ch.criminalRecord = true;
          ch.recordCleanYears = 0;
          ch.creditScore = clamp((ch.creditScore ?? 650) - CONVICTED_CREDIT_HIT, 300, 850);
          if (fullSentence > 0) {
            ch.inJail = true;
            ch.jailYearsLeft = fullSentence;
            ch.jailYearsTotal = fullSentence;
            ch.job = null;
          }
        } else {
          ch.stats.happiness = clamp(ch.stats.happiness + ACQUITTED_HAPPINESS_BOOST);
        }
      },
      resultText: () =>
        convicted
          ? fullSentence > 0
            ? `The verdict: guilty. Sentenced to ${fullSentence} year${fullSentence === 1 ? "" : "s"}.`
            : "The verdict: guilty, but the judge went easy — just a record."
          : "The verdict: not guilty. You walked out with a clean slate.",
    };
  });

  return {
    id: `trial-${crime.id}-${Date.now()}`,
    minAge: 0,
    maxAge: 200,
    text: () => "The judge asks who will represent you.",
    choices,
  };
}

// Called from ageUp() instead of the normal event pool while c.inJail -
// sentence countdown, a parole roll once at least half is served, release.
export function tickSentence(c: Character): void {
  if (c.jailYearsLeft == null) return;

  c.jailYearsLeft -= 1;

  const servedEnough = c.jailYearsTotal != null && c.jailYearsTotal - c.jailYearsLeft >= c.jailYearsTotal / 2;
  if (c.jailYearsLeft > 0 && servedEnough && Math.random() < PAROLE_CHANCE) {
    c.yearLog.push("You were granted parole.");
    c.jailYearsLeft = 0;
  }

  if (c.jailYearsLeft <= 0) {
    c.inJail = false;
    c.jailYearsLeft = undefined;
    c.jailYearsTotal = undefined;
    c.yearLog.push("You were released from prison.");
  } else {
    c.yearLog.push(`${c.jailYearsLeft} year${c.jailYearsLeft === 1 ? "" : "s"} left on your sentence.`);
  }
}

// Called from ageUp() every year a record exists and the character isn't
// incarcerated - counts from release, not from conviction, since the loop
// naturally doesn't run this while c.inJail is true.
export function tickRecordClock(c: Character): void {
  if (c.criminalRecord) {
    c.recordCleanYears = (c.recordCleanYears ?? 0) + 1;
  }
}

export function canPetitionExpungement(c: Character): boolean {
  return (c.criminalRecord ?? false) && (c.recordCleanYears ?? 0) >= EXPUNGEMENT_ELIGIBLE_YEARS;
}

export function petitionExpungement(c: Character): boolean {
  if (!canPetitionExpungement(c) || c.money < EXPUNGEMENT_FEE) return false;
  c.money -= EXPUNGEMENT_FEE;
  const chance = clamp(0.6 + (c.stats.smarts - 50) / 300, 0.3, 0.9);
  const success = Math.random() < chance;
  if (success) {
    c.criminalRecord = false;
    c.recordCleanYears = 0;
    c.yearLog.push("Your record was expunged. A clean slate.");
  } else {
    c.yearLog.push("Your expungement petition was denied. You can try again next year.");
  }
  return success;
}

export { EXPUNGEMENT_FEE, EXPUNGEMENT_ELIGIBLE_YEARS };
