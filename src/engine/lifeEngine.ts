import { Character, Gender, Job, LifeEvent } from "../types";
import { clamp, randomInt, pickWeighted } from "./util";
import { EVENTS } from "../data/events";
import { randomFirstName, randomLastName } from "../data/names";

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

function eligibleEvents(c: Character): LifeEvent[] {
  return EVENTS.filter((e) => {
    if (c.age < e.minAge || c.age > e.maxAge) return false;
    if (e.once && c.triggeredEvents.includes(e.id)) return false;
    if (e.condition && !e.condition(c)) return false;
    return true;
  });
}

export type AgeUpResult = {
  died: boolean;
  causeOfDeath?: string;
  pendingEvent?: LifeEvent;
};

export function ageUp(c: Character): AgeUpResult {
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

  // education auto-progression (doesn't override college/graduated)
  if (!c.inCollege && c.educationStage !== "graduated") {
    const stage = educationForAge(c.age);
    if (stage) c.educationStage = stage;
  }

  // income
  if (c.job) {
    c.money += c.job.salary;
    c.yearLog.push(`You earned $${c.job.salary.toLocaleString()} working as a ${c.job.title}.`);
  }

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
  const pool = eligibleEvents(c);
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
    chosen.autoEffect?.(c);
    const text = chosen.text(c);
    c.yearLog.push(text);
    c.fullLog.push({ age: c.age, text });
  }

  const pendingEvent = pickWeighted(choicePool);

  if (c.yearLog.length === 0) {
    c.yearLog.push(`Another year passed. You are now ${c.age}.`);
  }

  return { died: false, pendingEvent };
}

export function resolveEvent(c: Character, event: LifeEvent, choiceIndex: number) {
  const choice = event.choices?.[choiceIndex];
  if (!choice) return;
  if (event.once) c.triggeredEvents.push(event.id);
  choice.effect(c);
  const baseText = event.text(c);
  const resultText = choice.resultText?.(c);
  c.yearLog.push(resultText ? `${baseText} ${resultText}` : baseText);
  c.fullLog.push({ age: c.age, text: c.yearLog[c.yearLog.length - 1] });
}

export type Activity = "gym" | "doctor" | "family";

export function applyActivity(c: Character, activity: Activity) {
  if (activity === "gym") {
    c.stats.health = clamp(c.stats.health + 5);
    c.stats.looks = clamp(c.stats.looks + 2);
    c.stats.happiness = clamp(c.stats.happiness - 1);
    c.yearLog.push("You hit the gym.");
  } else if (activity === "doctor") {
    if (c.money >= 150) {
      c.money -= 150;
      c.stats.health = clamp(c.stats.health + 8);
      c.yearLog.push("You visited the doctor for a checkup. -$150");
    } else {
      c.yearLog.push("You couldn't afford a doctor's visit.");
    }
  } else {
    c.relationships.forEach((r) => {
      if (r.alive && (r.type === "mother" || r.type === "father" || r.type === "child" || r.type === "partner")) {
        r.level = clamp(r.level + 5);
      }
    });
    c.stats.happiness = clamp(c.stats.happiness + 4);
    c.yearLog.push("You spent quality time with family.");
  }
}

export function applyForJob(c: Character, job: Job) {
  c.job = job;
  c.yearLog.push(`You got a job as a ${job.title}!`);
}

export function quitJob(c: Character) {
  c.job = null;
  c.yearLog.push("You quit your job.");
}
