import { Character, Gender, Job, LifeEvent, WorldState } from "../types";
import { clamp, randomInt, pickWeighted } from "./util";
import { EVENTS } from "../data/events";
import { randomFirstName, randomLastName } from "../data/names";
import { MIN_AGE_GYM, MIN_AGE_LIBRARY, MIN_AGE_CONVERSATION } from "./lifeStage";
import { tickWorldState, hasActiveCondition, effectiveSalary } from "./worldState";
import { ambientMessageTick } from "./relationships";
import { tickAssets } from "./assets";

export { getLifeStage } from "./lifeStage";
export type { LifeStage } from "./lifeStage";
export { createInitialWorldState, effectiveSalary, hasActiveCondition } from "./worldState";
export { textRelationship, callRelationship, bootyCall, sendGift } from "./relationships";
export { buyCar, sellCar, buyHome, sellHome, netWorth } from "./assets";

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

  ambientMessageTick(c);

  // education auto-progression (doesn't override college/graduated)
  if (!c.inCollege && c.educationStage !== "graduated") {
    const stage = educationForAge(c.age);
    if (stage) c.educationStage = stage;
  }

  // income
  if (c.job) {
    const pay = effectiveSalary(c.job, world);
    c.money += pay;
    c.yearLog.push(`You earned $${pay.toLocaleString()} working as a ${c.job.title}.`);
  }

  tickAssets(c);

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

  const pendingEvent = pickWeighted(choicePool);

  if (c.yearLog.length === 0) {
    c.yearLog.push(`Another year passed. You are now ${c.age}.`);
  }

  return { died: false, pendingEvent };
}

export function resolveEvent(c: Character, world: WorldState, event: LifeEvent, choiceIndex: number) {
  const choice = event.choices?.[choiceIndex];
  if (!choice) return;
  if (event.once) c.triggeredEvents.push(event.id);
  choice.effect(c, world);
  const baseText = event.text(c, world);
  const resultText = choice.resultText?.(c, world);
  c.yearLog.push(resultText ? `${baseText} ${resultText}` : baseText);
  c.fullLog.push({ age: c.age, text: c.yearLog[c.yearLog.length - 1] });
}

export type Activity = "gym" | "library" | "doctor";

export function applyActivity(c: Character, activity: Activity) {
  if (activity === "gym") {
    if (c.age < MIN_AGE_GYM) {
      c.yearLog.push("You're too young for the gym.");
      return;
    }
    c.stats.health = clamp(c.stats.health + 5);
    c.stats.looks = clamp(c.stats.looks + 2);
    c.stats.happiness = clamp(c.stats.happiness - 1);
    c.yearLog.push("You hit the gym.");
  } else if (activity === "library") {
    if (c.age < MIN_AGE_LIBRARY) {
      c.yearLog.push("You're too young to study at the library yet.");
      return;
    }
    c.stats.smarts = clamp(c.stats.smarts + 5);
    c.stats.happiness = clamp(c.stats.happiness - 1);
    c.yearLog.push("You spent the afternoon at the library.");
  } else {
    if (c.money >= 150) {
      c.money -= 150;
      c.stats.health = clamp(c.stats.health + 8);
      c.yearLog.push("You visited the doctor for a checkup. -$150");
    } else {
      c.yearLog.push("You couldn't afford a doctor's visit.");
    }
  }
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
  c.job = job;
  c.yearLog.push(`You got a job as a ${job.title}!`);
}

export function quitJob(c: Character) {
  c.job = null;
  c.yearLog.push("You quit your job.");
}
