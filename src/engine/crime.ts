import { Character, EventChoice, LifeEvent } from "../types";
import { clamp, randomInt } from "./util";
import { CrimeDef, crimeById } from "../data/crimes";

const PAROLE_CHANCE = 0.15;
const BAIL_CREDIT_HIT = 25;
const JAIL_CREDIT_HIT = 50;

export function successChance(crime: CrimeDef, smarts: number): number {
  return clamp(crime.successBase + (smarts - 50) / 200, 0.05, 0.95);
}

// Returns a synthetic LifeEvent (pay to settle it vs. do the time) if the
// player got caught, so the store can surface it through the exact same
// pendingEvent/EventModal machinery ageUp() already uses for random events -
// no separate UI needed for the arrest itself.
export function commitCrime(c: Character, crimeId: string): LifeEvent | null {
  const crime = crimeById(crimeId);
  if (!crime) return null;

  const chance = successChance(crime, c.stats.smarts);
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
  return buildArrestEvent(c, crime);
}

function buildArrestEvent(c: Character, crime: CrimeDef): LifeEvent {
  const sentence = randomInt(crime.sentenceMinYears, crime.sentenceMaxYears);
  const choices: EventChoice[] = [];

  if (c.money >= crime.bailAmount) {
    choices.push({
      label: `Pay $${crime.bailAmount.toLocaleString()} and settle it`,
      effect: (ch) => {
        ch.money -= crime.bailAmount;
        ch.criminalRecord = true;
        ch.creditScore = clamp((ch.creditScore ?? 650) - BAIL_CREDIT_HIT, 300, 850);
      },
      resultText: () => "You paid your way out. No time served, but it's on your record now.",
    });
  }

  choices.push({
    label:
      sentence > 0
        ? `Can't pay — do the time (${sentence} year${sentence === 1 ? "" : "s"})`
        : "Can't pay — take the record",
    effect: (ch) => {
      ch.criminalRecord = true;
      ch.creditScore = clamp((ch.creditScore ?? 650) - JAIL_CREDIT_HIT, 300, 850);
      if (sentence > 0) {
        ch.inJail = true;
        ch.jailYearsLeft = sentence;
        ch.jailYearsTotal = sentence;
        ch.job = null;
      }
    },
    resultText: () => (sentence > 0 ? `You were sentenced to ${sentence} year${sentence === 1 ? "" : "s"}.` : "You got off with just a record."),
  });

  return {
    id: `arrest-${crime.id}-${Date.now()}`,
    minAge: 0,
    maxAge: 200,
    text: () => `You were arrested for ${crime.label.toLowerCase()}. Bail is set at $${crime.bailAmount.toLocaleString()}.`,
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
