import { Character, Gender, Job, LifeEvent, WorldState } from "../types";
import { clamp, randomInt, pickWeighted } from "./util";
import { EVENTS } from "../data/events";
import { randomFirstName, randomLastName } from "../data/names";
import { MIN_AGE_CONVERSATION } from "./lifeStage";
import { tickWorldState, hasActiveCondition, effectiveSalary } from "./worldState";
import { ambientMessageTick } from "./relationships";
import { tickAssets, netWorth } from "./assets";
import { tickDebt } from "./debt";
import { tickMarket, portfolioValue } from "./stocks";
import { incomeTax } from "./taxes";
import { applyContribution, tickRetirementGrowth, retirementBalance } from "./retirement";
import { tickSentence, tickRecordClock, tickAnkleMonitor, tickJuvenileRecordClear } from "./crime";
import {
  applyVenue,
  visitDoctor,
  takeLesson,
  generateDatingCandidates,
  pursueDatingCandidate,
  goOnBlindDate,
  hookup,
  toggleBirthControl,
  getSterilized,
  tryConception,
  takeVacation,
} from "./activities";
import { onEnterSchoolStage, tickCollegeCosts } from "./school";

export { getLifeStage } from "./lifeStage";
export type { LifeStage } from "./lifeStage";
export { createInitialWorldState, effectiveSalary, hasActiveCondition } from "./worldState";
export { textRelationship, callRelationship, bootyCall, sendGift } from "./relationships";
export { buyCar, sellCar, buyHome, sellHome, netWorth } from "./assets";
export { takeOutLoan, openCreditCard, payDownLoan, chargeCard } from "./debt";
export { creditScoreLabel } from "./finance";
export { buyStock, sellStock, portfolioValue } from "./stocks";
export { incomeTax, takeHomePay, effectiveTaxRate } from "./taxes";
export { setContributionRate, withdrawRetirement, retirementBalance } from "./retirement";
export {
  commitCrime,
  successChance,
  petitionExpungement,
  canPetitionExpungement,
  EXPUNGEMENT_FEE,
  EXPUNGEMENT_ELIGIBLE_YEARS,
} from "./crime";
export {
  applyVenue,
  visitDoctor,
  takeLesson,
  generateDatingCandidates,
  pursueDatingCandidate,
  goOnBlindDate,
  hookup,
  toggleBirthControl,
  getSterilized,
  tryConception,
  takeVacation,
} from "./activities";
export type { DatingCandidate } from "./activities";
export {
  hasFlag,
  joinClub,
  facultyAction,
  enrollInCollege,
  changeMajor,
  dropOutOfCollege,
  seduceFaculty,
  throwParty,
  skipClass,
} from "./school";
export { attack } from "./fighting";

export function totalNetWorth(c: Character, world: WorldState): number {
  return netWorth(c) + portfolioValue(c, world) + retirementBalance(c);
}

export function createCharacter(
  firstName: string,
  lastName: string,
  gender: Gender,
): Character {
  const motherName = `${randomFirstName("female")} ${lastName}`;
  const fatherName = `${randomFirstName("male")} ${lastName}`;

  const character: Character = {
    firstName,
    lastName,
    gender,
    age: 0,
    alive: true,
    stats: {
      health: randomInt(75, 100),
      happiness: randomInt(60, 90),
      smarts: randomInt(30, 65),
      looks: randomInt(30, 75),
    },
    money: 0,
    job: null,
    educationStage: "none",
    inCollege: false,
    hasCollegeDegree: false,
    loans: [],
    creditScore: 650,
    degrees: [],
    flags: [],
    relationships: [
      { id: "mother", name: motherName, type: "mother", level: randomInt(60, 90), alive: true },
      { id: "father", name: fatherName, type: "father", level: randomInt(55, 90), alive: true },
    ],
    yearLog: [`You were born! ${motherName} and ${fatherName} welcomed you into the world.`],
    fullLog: [{ age: 0, text: "You were born." }],
    triggeredEvents: [],
  };

  return character;
}

function educationForAge(age: number): Character["educationStage"] | null {
  if (age >= 14) return "high";
  if (age >= 11) return "middle";
  if (age >= 5) return "elementary";
  return "none";
}

function deathChance(age: number, health: number): number {
  let base: number;
  if (age < 45) base = 0.0005;
  else if (age < 60) base = 0.004;
  else if (age < 70) base = 0.015;
  else if (age < 80) base = 0.04;
  else if (age < 90) base = 0.1;
  else if (age < 100) base = 0.25;
  else base = 0.5;

  if (health <= 0) base += 0.35;
  else if (health < 15) base += 0.12;
  else if (health < 30) base += 0.04;

  return Math.min(base, 0.95);
}

function eligibleEvents(c: Character, world: WorldState): LifeEvent[] {
  return EVENTS.filter((e) => {
    if (c.age < e.minAge || c.age > e.maxAge) return false;
    if (e.once && c.triggeredEvents.includes(e.id)) return false;
    if (e.condition && !e.condition(c, world)) return false;
    return true;
  });
}

export type AgeUpResult = {
  died: boolean;
  causeOfDeath?: string;
  pendingEvent?: LifeEvent;
};

export function ageUp(c: Character, world: WorldState): AgeUpResult {
  tickWorldState(world);
  tickMarket(world);
  tickRetirementGrowth(c, world);

  c.age += 1;
  c.yearLog = [];

  // natural stat drift
  c.stats.happiness = clamp(c.stats.happiness + randomInt(-2, 2));
  c.stats.looks = clamp(c.stats.looks + randomInt(-1, 1));
  if (c.age >= 6 && c.age <= 22) {
    c.stats.smarts = clamp(c.stats.smarts + randomInt(0, 2));
  }
  if (c.age >= 55) {
    c.stats.health = clamp(c.stats.health - randomInt(0, 3));
  } else {
    // youthful recovery: minor injuries/illnesses heal on their own
    c.stats.health = clamp(c.stats.health + randomInt(1, 4));
  }
  if (hasActiveCondition(world, "pandemic")) {
    c.stats.health = clamp(c.stats.health - randomInt(0, 4));
  }

  if (c.inJail) {
    c.stats.happiness = clamp(c.stats.happiness - randomInt(3, 8));
    if (Math.random() < 0.1) {
      c.stats.health = clamp(c.stats.health - randomInt(5, 15));
      c.yearLog.push("A fight broke out on your block.");
    }
  }

  ambientMessageTick(c);

  // education auto-progression (doesn't override college/graduated)
  if (!c.inCollege && c.educationStage !== "graduated") {
    const stage = educationForAge(c.age);
    if (stage) {
      c.educationStage = stage;
      onEnterSchoolStage(c, stage);
    }
  }
  tickCollegeCosts(c);

  // income
  if (c.job) {
    const gross = effectiveSalary(c.job, world);
    const { contribution, employerMatch, taxableIncome } = applyContribution(c, gross);
    const tax = incomeTax(taxableIncome);
    const net = taxableIncome - tax;
    c.money += net;
    const contribText =
      contribution > 0
        ? ` $${contribution.toLocaleString()} to retirement${
            employerMatch > 0 ? ` (+$${employerMatch.toLocaleString()} employer match)` : ""
          },`
        : "";
    c.yearLog.push(
      `You earned $${gross.toLocaleString()} working as a ${c.job.title} —${contribText} $${tax.toLocaleString()} to taxes, $${net.toLocaleString()} take-home.`,
    );
  }

  tickAssets(c);
  tickDebt(c);

  // death roll: very low health raises the odds sharply but never guarantees death on its own
  const dieFromHealth = c.stats.health <= 0 && Math.random() < 0.4;
  const dieFromAge = Math.random() < deathChance(c.age, c.stats.health);
  if (dieFromHealth || dieFromAge) {
    c.alive = false;
    c.causeOfDeath = dieFromHealth ? "declining health" : "natural causes";
    c.yearLog.push(
      `At age ${c.age}, your life came to an end${dieFromHealth ? " after your health gave out" : ""}.`,
    );
    c.fullLog.push({ age: c.age, text: c.yearLog[c.yearLog.length - 1] });
    return { died: true, causeOfDeath: c.causeOfDeath };
  }

  // no random civilian life events while incarcerated - a dedicated
  // sentence tick (countdown/parole/release) replaces the event pool instead
  let pendingEvent: LifeEvent | undefined;
  if (c.inJail) {
    tickSentence(c);
  } else {
    tickRecordClock(c);
    tickAnkleMonitor(c);
    tickJuvenileRecordClear(c);

    // pick events: apply auto-effect ones immediately, hold at most one choice event
    const pool = eligibleEvents(c, world);
    const autoPool = pool.filter((e) => !e.choices);
    const choicePool = pool.filter((e) => e.choices && e.choices.length > 0);

    const autoCount = Math.min(2, autoPool.length);
    const usedIds = new Set<string>();
    for (let i = 0; i < autoCount; i++) {
      const remaining = autoPool.filter((e) => !usedIds.has(e.id));
      const chosen = pickWeighted(remaining);
      if (!chosen) break;
      usedIds.add(chosen.id);
      if (chosen.once) c.triggeredEvents.push(chosen.id);
      chosen.autoEffect?.(c, world);
      const text = chosen.text(c, world);
      c.yearLog.push(text);
      c.fullLog.push({ age: c.age, text });
    }

    pendingEvent = pickWeighted(choicePool);
  }

  if (c.yearLog.length === 0) {
    c.yearLog.push(
      c.inJail ? `Another year passed behind bars. You are now ${c.age}.` : `Another year passed. You are now ${c.age}.`,
    );
  }

  return { died: false, pendingEvent };
}

// Returns a follow-up LifeEvent when the chosen choice's effect chains one
// (see the EventChoice.effect return type) - the caller (the store) sets
// that as the next pendingEvent instead of clearing it.
export function resolveEvent(c: Character, world: WorldState, event: LifeEvent, choiceIndex: number): LifeEvent | undefined {
  const choice = event.choices?.[choiceIndex];
  if (!choice) return undefined;
  if (event.once) c.triggeredEvents.push(event.id);
  const next = choice.effect(c, world);
  const baseText = event.text(c, world);
  const resultText = choice.resultText?.(c, world);
  c.yearLog.push(resultText ? `${baseText} ${resultText}` : baseText);
  c.fullLog.push({ age: c.age, text: c.yearLog[c.yearLog.length - 1] });
  return next || undefined;
}

export function spendTimeWith(c: Character, relationshipId: string) {
  const r = c.relationships.find((x) => x.id === relationshipId && x.alive);
  if (!r) return;
  r.level = clamp(r.level + 5);
  c.stats.happiness = clamp(c.stats.happiness + 2);
  c.yearLog.push(`You spent time with ${r.name}.`);
}

export function haveConversation(c: Character, relationshipId: string) {
  if (c.age < MIN_AGE_CONVERSATION) {
    c.yearLog.push("You're too young to have a real conversation yet.");
    return;
  }
  const r = c.relationships.find((x) => x.id === relationshipId && x.alive);
  if (!r) return;
  r.level = clamp(r.level + 8);
  c.stats.happiness = clamp(c.stats.happiness + 3);
  c.yearLog.push(`You had a good conversation with ${r.name}.`);
}

export function applyForJob(c: Character, job: Job) {
  if (c.inJail) {
    c.yearLog.push("You can't get a job from behind bars.");
    return;
  }
  c.job = job;
  c.yearLog.push(`You got a job as a ${job.title}!`);
}

export function quitJob(c: Character) {
  c.job = null;
  c.yearLog.push("You quit your job.");
}
