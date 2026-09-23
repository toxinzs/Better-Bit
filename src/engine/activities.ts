import { Character, Gender, LifeEvent, Relationship } from "../types";
import { clamp, randomInt } from "./util";
import { randomFirstName, randomLastName } from "../data/names";
import {
  VenueKey,
  VENUES,
  LessonDef,
  LESSONS,
  VacationKey,
  VACATIONS,
  ConceptionMethod,
  CONCEPTION_METHODS,
  STERILIZATION_COST,
  DOCTOR_COST,
} from "../data/activities";

// Local relationship lookups, same reasoning as engine/relationships.ts's own
// local hasPartner() - the engine doesn't import from data/events/helpers.ts
// (that file is for event *content*, which imports the engine, not the other
// way around).
function partner(c: Character): Relationship | undefined {
  return c.relationships.find((r) => r.type === "partner" && r.alive);
}
function hasPartner(c: Character): boolean {
  return partner(c) !== undefined;
}
function children(c: Character): Relationship[] {
  return c.relationships.filter((r) => r.type === "child" && r.alive);
}
function mother(c: Character): Relationship | undefined {
  return c.relationships.find((r) => r.type === "mother" && r.alive);
}
function father(c: Character): Relationship | undefined {
  return c.relationships.find((r) => r.type === "father" && r.alive);
}

function randomCandidateName(): string {
  const genders: Gender[] = ["male", "female", "nonbinary"];
  const g = genders[randomInt(0, genders.length - 1)];
  return `${randomFirstName(g)} ${randomLastName()}`;
}

// ---------- Venues ----------

export function applyVenue(c: Character, key: VenueKey): void {
  const def = VENUES.find((v) => v.key === key);
  if (!def) return;
  if (c.age < def.minAge) {
    c.yearLog.push(`You're too young for the ${def.label.toLowerCase()}.`);
    return;
  }
  if (def.cost > 0 && c.money < def.cost) {
    c.yearLog.push(`You couldn't afford the ${def.label.toLowerCase()}.`);
    return;
  }
  if (def.cost > 0) c.money -= def.cost;

  switch (key) {
    case "gym":
      c.stats.health = clamp(c.stats.health + 5);
      c.stats.looks = clamp(c.stats.looks + 2);
      c.stats.happiness = clamp(c.stats.happiness - 1);
      c.yearLog.push("You hit the gym.");
      break;
    case "library":
      c.stats.smarts = clamp(c.stats.smarts + 5);
      c.stats.happiness = clamp(c.stats.happiness - 1);
      c.yearLog.push("You spent the afternoon at the library.");
      break;
    case "park":
      c.stats.happiness = clamp(c.stats.happiness + 4);
      c.stats.health = clamp(c.stats.health + 2);
      c.yearLog.push("You spent a relaxing day at the park.");
      break;
    case "beach":
      c.stats.happiness = clamp(c.stats.happiness + 5);
      c.stats.looks = clamp(c.stats.looks + 1);
      c.stats.health = clamp(c.stats.health + 1);
      c.yearLog.push("You caught some sun at the beach.");
      break;
    case "worship":
      c.stats.happiness = clamp(c.stats.happiness + 3);
      c.yearLog.push("You spent time at your place of worship. A moment of peace.");
      break;
    case "museum":
      c.stats.smarts = clamp(c.stats.smarts + 4);
      c.stats.happiness = clamp(c.stats.happiness + 2);
      c.yearLog.push("You spent the day at the museum.");
      break;
    case "movies":
      c.stats.happiness = clamp(c.stats.happiness + 6);
      c.yearLog.push("You caught a movie.");
      break;
    case "mall":
      c.stats.looks = clamp(c.stats.looks + 4);
      c.stats.happiness = clamp(c.stats.happiness + 3);
      c.yearLog.push("You went on a shopping spree at the mall.");
      break;
    case "concert":
      c.stats.happiness = clamp(c.stats.happiness + 10);
      c.stats.health = clamp(c.stats.health - 1);
      c.yearLog.push("You went to a concert. Ears ringing, worth every penny.");
      break;
    case "spa":
      c.stats.happiness = clamp(c.stats.happiness + 8);
      c.stats.health = clamp(c.stats.health + 3);
      c.stats.looks = clamp(c.stats.looks + 3);
      c.yearLog.push("You spent the day at the spa.");
      break;
    case "bar": {
      c.stats.happiness = clamp(c.stats.happiness + 5);
      c.stats.health = clamp(c.stats.health - 2);
      const roughNight = Math.random() < 0.15;
      if (roughNight) {
        c.stats.happiness = clamp(c.stats.happiness - 4);
        c.stats.health = clamp(c.stats.health - 3);
        c.yearLog.push("You went to the bar. Rough hangover the next day.");
      } else {
        c.yearLog.push("You had a good night at the bar.");
      }
      break;
    }
    case "club":
      c.stats.happiness = clamp(c.stats.happiness + 7);
      c.stats.health = clamp(c.stats.health - 3);
      c.yearLog.push("You danced the night away at the club.");
      break;
    case "casino": {
      const win = Math.random() < 0.45;
      if (win) {
        const payout = Math.round((def.cost * randomInt(12, 30)) / 10);
        c.money += payout;
        c.stats.happiness = clamp(c.stats.happiness + 10);
        c.yearLog.push(`You hit it big at the casino. +$${payout.toLocaleString()}.`);
      } else {
        c.stats.happiness = clamp(c.stats.happiness - 4);
        c.yearLog.push("You lost it all at the casino.");
      }
      break;
    }
  }
}

export function visitDoctor(c: Character): void {
  if (c.money < DOCTOR_COST) {
    c.yearLog.push("You couldn't afford a doctor's visit.");
    return;
  }
  c.money -= DOCTOR_COST;
  c.stats.health = clamp(c.stats.health + 8);
  c.yearLog.push(`You visited the doctor for a checkup. -$${DOCTOR_COST}`);
}

// ---------- Lessons ----------

export function takeLesson(c: Character, key: LessonDef["key"]): void {
  const def = LESSONS.find((l) => l.key === key);
  if (!def) return;
  if (c.age < def.minAge) {
    c.yearLog.push(`You're too young for ${def.label.toLowerCase()}.`);
    return;
  }
  if (c.money < def.cost) {
    c.yearLog.push(`You couldn't afford ${def.label.toLowerCase()}.`);
    return;
  }
  c.money -= def.cost;
  const skills = c.skills ?? {};
  const breakthrough = Math.random() < 0.1;
  const gain = randomInt(8, 15) + (breakthrough ? 5 : 0);
  skills[key] = clamp((skills[key] ?? 0) + gain);
  c.skills = skills;
  c.stats.happiness = clamp(c.stats.happiness + 2);
  c.yearLog.push(
    breakthrough
      ? `You took ${def.label.toLowerCase()} and had a real breakthrough.`
      : `You took ${def.label.toLowerCase()}. Getting better at it.`,
  );
}

// ---------- Dating ----------

export type DatingCandidate = { name: string; vibe: string; appeal: number };

const VIBES = [
  "Funny and a little chaotic",
  "Quiet but thoughtful",
  "Way too into fitness",
  "Talks about their job nonstop",
  "Genuinely kind",
  "Has strong opinions about pizza toppings",
  "Still figuring things out",
  "Confident to a fault",
  "Into astrology, unfortunately",
  "The type to text good morning every day",
];

export function generateDatingCandidates(): DatingCandidate[] {
  return Array.from({ length: 3 }, () => ({
    name: randomCandidateName(),
    vibe: VIBES[randomInt(0, VIBES.length - 1)],
    appeal: randomInt(40, 95),
  }));
}

export function pursueDatingCandidate(c: Character, candidate: DatingCandidate): void {
  if (c.age < 18) {
    c.yearLog.push("You're too young to date yet.");
    return;
  }
  if (hasPartner(c)) {
    c.yearLog.push("You're already seeing someone.");
    return;
  }
  const chance = clamp(0.3 + candidate.appeal / 150, 0.2, 0.85);
  const matched = Math.random() < chance;
  if (matched) {
    c.relationships.push({
      id: `partner-${Date.now()}`,
      name: candidate.name,
      type: "partner",
      level: randomInt(55, 75),
      alive: true,
    });
    c.stats.happiness = clamp(c.stats.happiness + 12);
    c.yearLog.push(`You matched with ${candidate.name}, and it actually went somewhere.`);
  } else {
    c.stats.happiness = clamp(c.stats.happiness - 2);
    c.yearLog.push(`You met up with ${candidate.name}, but there was no spark.`);
  }
}

export function goOnBlindDate(c: Character): void {
  if (c.age < 18) {
    c.yearLog.push("You're too young to date yet.");
    return;
  }
  if (hasPartner(c)) {
    c.yearLog.push("You're already seeing someone.");
    return;
  }
  const name = randomCandidateName();
  const goesWell = Math.random() < 0.45;
  if (goesWell) {
    c.relationships.push({
      id: `partner-${Date.now()}`,
      name,
      type: "partner",
      level: 60,
      alive: true,
    });
    c.stats.happiness = clamp(c.stats.happiness + 10);
    c.yearLog.push(`Your blind date with ${name} actually clicked.`);
  } else {
    c.stats.happiness = clamp(c.stats.happiness - 3);
    c.yearLog.push("Your blind date was painfully awkward. Never again.");
  }
}

const PREGNANCY_CHANCE = 0.14; // per unprotected encounter, real enough to matter

// A real "use protection?" screen first, chained the same way crime.ts's
// arrest/trial sequence is - the standing pattern for any player-initiated
// action needing a real multi-step choice. The outcome (caught/not, messy/
// not) is rolled once inside effect() and read back by resultText via a
// closure variable, same reasoning as buildTrialEvent's `convicted`.
export function hookup(c: Character): LifeEvent | null {
  if (c.age < 18) {
    c.yearLog.push("You're too young for that.");
    return null;
  }
  return buildHookupProtectionEvent(hasPartner(c));
}

function buildHookupProtectionEvent(partnered: boolean): LifeEvent {
  let caught = false;
  let messy = false;

  const resolve = (c: Character, useProtection: boolean): LifeEvent | undefined => {
    if (partnered) {
      caught = Math.random() < 0.5;
      const p = partner(c);
      if (caught) {
        if (p) {
          p.type = "ex";
          p.married = false;
          p.engaged = false;
        }
        c.stats.happiness = clamp(c.stats.happiness - 25);
      } else {
        c.stats.happiness = clamp(c.stats.happiness + 8);
      }
    } else {
      messy = Math.random() < 0.25;
      c.stats.happiness = clamp(c.stats.happiness + (messy ? -2 : 6));
    }

    if (!useProtection && !c.sterilized && !c.pregnant && Math.random() < PREGNANCY_CHANCE) {
      return buildPregnancyRevealEvent();
    }
    return undefined;
  };

  const outcomeText = () =>
    partnered
      ? caught
        ? "You cheated, and got caught. It's over."
        : "You cheated and got away with it. For now."
      : messy
        ? "Last night was a mistake."
        : "No strings attached. Exactly what you needed.";

  return {
    id: `hookup-protection-${Date.now()}`,
    minAge: 0,
    maxAge: 200,
    text: () => "Before anything happens...",
    choices: [
      {
        label: "Use protection",
        effect: (c) => resolve(c, true),
        resultText: outcomeText,
      },
      {
        label: "Don't use protection",
        effect: (c) => resolve(c, false),
        resultText: outcomeText,
      },
    ],
  };
}

// A real pregnancy is now its own reveal moment with a genuine choice,
// instead of a baby appearing the instant a choice is made - see
// tryConception/have-a-kid/unplanned-pregnancy, which all funnel into the
// same c.pregnant flag; the actual birth (and naming) happens next ageUp().
function buildPregnancyRevealEvent(): LifeEvent {
  return {
    id: `pregnancy-reveal-${Date.now()}`,
    minAge: 0,
    maxAge: 200,
    text: () => "You're pregnant.",
    choices: [
      {
        label: "Keep it",
        effect: (c) => {
          c.pregnant = true;
          c.stats.happiness = clamp(c.stats.happiness + 10);
        },
        resultText: () => "You're keeping it. A real change is coming.",
      },
      {
        label: "It's not the right time",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness - 10);
        },
        resultText: () => "It's not the right time. The pregnancy doesn't continue.",
      },
    ],
  };
}

// ---------- Fertility ----------

export function toggleBirthControl(c: Character): void {
  c.usingBirthControl = !c.usingBirthControl;
  c.yearLog.push(c.usingBirthControl ? "You started using birth control." : "You stopped using birth control.");
}

export function getSterilized(c: Character): void {
  if (c.sterilized) {
    c.yearLog.push("You're already sterilized.");
    return;
  }
  if (c.money < STERILIZATION_COST) {
    c.yearLog.push("You couldn't afford the procedure.");
    return;
  }
  c.money -= STERILIZATION_COST;
  c.sterilized = true;
  c.yearLog.push("You got a vasectomy/tubal ligation. A permanent decision, and you're at peace with it.");
}

export function tryConception(c: Character, method: ConceptionMethod): void {
  const def = CONCEPTION_METHODS.find((m) => m.key === method);
  if (!def) return;
  if (c.age < 18) {
    c.yearLog.push("You're too young for that.");
    return;
  }
  if (c.sterilized) {
    c.yearLog.push("That's not possible after being sterilized.");
    return;
  }
  if (c.pregnant) {
    c.yearLog.push("You're already expecting.");
    return;
  }
  if (c.money < def.cost) {
    c.yearLog.push(`You couldn't afford ${def.label}.`);
    return;
  }
  c.money -= def.cost;
  const success = Math.random() < def.successChance;
  if (success) {
    c.pregnant = true;
    c.stats.happiness = clamp(c.stats.happiness + 20);
    c.yearLog.push(`${def.label} worked. You're expecting. -$${def.cost.toLocaleString()}`);
  } else {
    c.stats.happiness = clamp(c.stats.happiness - 6);
    c.yearLog.push(`${def.label} didn't work this time. -$${def.cost.toLocaleString()}`);
  }
}

// ---------- Vacations ----------

export function takeVacation(c: Character, key: VacationKey): void {
  const def = VACATIONS.find((v) => v.key === key);
  if (!def) return;
  if (c.money < def.cost) {
    c.yearLog.push(`You couldn't afford the ${def.label.toLowerCase()}.`);
    return;
  }
  c.money -= def.cost;

  const boost = key === "weekend" ? 6 : key === "beach" ? 12 : 18;
  c.stats.happiness = clamp(c.stats.happiness + boost);
  c.stats.health = clamp(c.stats.health + Math.round(boost / 3));

  const family = [partner(c), ...children(c), mother(c), father(c)].filter(
    (r): r is Relationship => r !== undefined,
  );
  if (family.length > 0) {
    family.forEach((r) => (r.level = clamp(r.level + 8)));
    c.yearLog.push(`You took a ${def.label.toLowerCase()} with your family. Everyone needed it.`);
  } else {
    c.yearLog.push(`You took a ${def.label.toLowerCase()}.`);
  }
}
