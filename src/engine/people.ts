import { Character, Gender, Relationship, RelationType } from "../types";
import { NAME_POOLS, randomFirstName, randomLastName } from "../data/names";
import { clamp, randomInt } from "./util";

// The one place a person in the player's life gets made. Every place that
// used to `relationships.push({...})` by hand goes through newPerson() /
// addPerson() so each person has an age, gender, health, job, traits and
// the hidden favor/fertility numbers from day one. Old saves have none of
// that, so ensurePeople() fills it in lazily (deterministically, so a
// reload never rerolls anyone).

const TRAITS = [
  "warm", "funny", "stubborn", "generous", "private", "anxious", "adventurous", "frugal",
  "dramatic", "loyal", "flirty", "grumpy", "curious", "patient", "competitive", "romantic",
];

const JOBS = [
  "Nurse", "Electrician", "Accountant", "Chef", "Mechanic", "Teacher", "Software developer",
  "Retail manager", "Barber", "Truck driver", "Paralegal", "Pharmacist", "Contractor",
  "Graphic designer", "Bartender", "Police officer", "Social worker", "Realtor", "Warehouse lead",
  "Dental hygienist", "Farmer", "Photographer", "Bus driver", "Marketing associate",
];

let uidCounter = 0;
export function uid(prefix: string): string {
  uidCounter += 1;
  return `${prefix}-${Date.now().toString(36)}${uidCounter.toString(36)}${randomInt(0, 46655).toString(36)}`;
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// small deterministic PRNG so backfilled people never change between loads
function seededRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rint = (rng: () => number, min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;
const rpick = <T,>(rng: () => number, xs: T[]): T => xs[Math.floor(rng() * xs.length)];

export function randomGender(): Gender {
  const r = Math.random();
  return r < 0.475 ? "male" : r < 0.95 ? "female" : "nonbinary";
}

// ---------- ages ----------

// A living person's age comes from their birth year relative to the
// player's; a dead person's is frozen at the age they died.
export function ageOf(c: Character, r: Relationship): number {
  if (!r.alive && r.diedAge !== undefined) return r.diedAge;
  return Math.max(0, c.age - (r.bornOffset ?? 0));
}

export function isAdult(c: Character, r: Relationship): boolean {
  return ageOf(c, r) >= 18;
}

// ---------- creation ----------

export type PersonSpec = {
  type: RelationType;
  age: number; // the person's age right now
  gender?: Gender;
  name?: string;
  lastName?: string;
  id?: string;
  level?: number;
  fields?: Partial<Relationship>;
};

function jobFor(age: number, type: RelationType, rng: () => number, title?: string): string | undefined {
  if (type === "teacher") return title && /^(Dr\.|Professor)/.test(title) ? "Professor" : "Teacher";
  if (age < 5) return undefined;
  if (age < 18) return "Student";
  if (age >= 66) return "Retired";
  if (rng() < 0.1) return "Between jobs";
  return rpick(rng, JOBS);
}

function healthFor(age: number, rng: () => number): number {
  return clamp(Math.round(96 - Math.max(0, age - 38) * 0.75 + rint(rng, -10, 8)), 18, 100);
}

export function newPerson(c: Character, spec: PersonSpec): Relationship {
  const gender = spec.gender ?? randomGender();
  const name =
    spec.name ??
    `${randomFirstName(gender, c.originRegion)} ${spec.lastName ?? randomLastName(c.originRegion)}`;
  const rng = Math.random;
  const age = Math.max(0, Math.round(spec.age));
  const p: Relationship = {
    id: spec.id ?? uid(spec.type),
    name,
    type: spec.type,
    level: spec.level ?? randomInt(45, 70),
    alive: true,
    gender,
    bornOffset: c.age - age,
    traits: [rpick(rng, TRAITS), rpick(rng, TRAITS)].filter((t, i, a) => a.indexOf(t) === i),
    job: jobFor(age, spec.type, rng, name),
    health: healthFor(age, rng),
    conditions: [],
    favor: randomInt(35, 65),
    fertility: randomInt(35, 95),
    wealth: age < 18 ? randomInt(5, 15) : randomInt(15, 85),
    status: "active",
    // grown-up partners already have a romantic history behind them; a teen
    // couple starts from a first date
    dates: 0,
    kissed: spec.type === "partner" && age >= 18,
    ...spec.fields,
  };
  return p;
}

export function addPerson(c: Character, spec: PersonSpec): Relationship {
  const p = newPerson(c, spec);
  c.relationships.push(p);
  return p;
}

// ---------- backfill for saves made before people had ages ----------

const genderByFirstName = (() => {
  const map = new Map<string, Set<Gender>>();
  const add = (n: string, g: Gender) => {
    const set = map.get(n) ?? new Set<Gender>();
    set.add(g);
    map.set(n, set);
  };
  for (const pool of Object.values(NAME_POOLS)) {
    pool.male.forEach((n) => add(n, "male"));
    pool.female.forEach((n) => add(n, "female"));
    pool.neutral.forEach((n) => add(n, "nonbinary"));
  }
  return map;
})();

function guessGender(r: Relationship, rng: () => number): Gender {
  if (r.type === "mother") return "female";
  if (r.type === "father") return "male";
  const first = r.name.split(" ")[0];
  if (first === "Mr.") return "male";
  if (first === "Ms.") return "female";
  if (first === "Mx.") return "nonbinary";
  const found = genderByFirstName.get(first);
  if (found && found.size > 0) return rpick(rng, Array.from(found));
  return rng() < 0.5 ? "male" : "female";
}

function guessAge(c: Character, r: Relationship, rng: () => number): number {
  const a = c.age;
  switch (r.type) {
    case "mother": return a + rint(rng, 22, 34);
    case "father": return a + rint(rng, 22, 38);
    case "sibling": return Math.max(0, a + rint(rng, -6, 6));
    case "child": return a >= 18 ? rint(rng, 0, a - 18) : 0;
    case "grandchild": return rint(rng, 0, 14);
    case "classmate": return Math.max(4, a + rint(rng, -1, 1));
    case "teacher": return rint(rng, 28, 58);
    case "partner":
    case "ex": return a >= 18 ? Math.max(18, a + rint(rng, -5, 6)) : Math.max(12, a + rint(rng, -1, 1));
    default: return Math.max(13, a + rint(rng, -5, 5));
  }
}

// Fills in whatever a person is missing. Idempotent and deterministic (seeded
// by the person's id + the player's avatar seed), so it's safe to call on
// every load and on every year.
export function backfillPeople(c: Character): void {
  // older saves marked a faded-out classmate/teacher `alive: false`; that flag
  // now only ever means a real death, so those entries are dropped
  if (c.relationships.some((r) => !r.alive && (r.type === "classmate" || r.type === "teacher"))) {
    c.relationships = c.relationships.filter((r) => r.alive || (r.type !== "classmate" && r.type !== "teacher"));
  }
  for (const r of c.relationships) {
    if (
      r.bornOffset !== undefined &&
      r.gender !== undefined &&
      r.traits !== undefined &&
      r.health !== undefined &&
      r.favor !== undefined &&
      r.fertility !== undefined &&
      r.wealth !== undefined
    ) {
      continue;
    }
    const rng = seededRng(hashString(r.id + ":" + (c.avatarSeed ?? 0)));
    r.gender ??= guessGender(r, rng);
    if (r.bornOffset === undefined) {
      const age = guessAge(c, r, rng);
      r.bornOffset = c.age - age;
      if (!r.alive && r.diedAge === undefined) r.diedAge = age;
    }
    const age = ageOf(c, r);
    r.traits ??= [rpick(rng, TRAITS), rpick(rng, TRAITS)].filter((t, i, a) => a.indexOf(t) === i);
    r.job ??= jobFor(age, r.type, rng, r.name);
    r.health ??= healthFor(age, rng);
    r.conditions ??= [];
    r.favor ??= clamp(Math.round(r.level * 0.5) + rint(rng, 15, 40));
    r.fertility ??= rint(rng, 35, 95);
    r.wealth ??= age < 18 ? rint(rng, 5, 15) : rint(rng, 15, 85);
    r.status ??= "active";
    if (r.kissed === undefined) r.kissed = r.type === "partner" || r.type === "ex" ? true : false;
  }
}

// Everything that has to be true of a character for the relationship systems
// to work, in one idempotent call: made at load and at the start of ageUp().
export function ensurePeople(c: Character): void {
  backfillPeople(c);
  c.sanity ??= 75;
  c.fertility ??= randomInt(35, 95);
  c.decisions ??= [];
}

// ---------- death (single entry point; funerals build on this later) ----------

export function markDeceased(c: Character, r: Relationship, cause: string): void {
  if (!r.alive) return;
  r.diedAge = ageOf(c, r);
  r.alive = false;
  r.causeOfDeath = cause;
  r.engaged = false;
}

// ---------- display helpers ----------

export function healthWord(h: number | undefined): string {
  const v = h ?? 80;
  if (v >= 75) return "Healthy";
  if (v >= 50) return "Fair";
  if (v >= 25) return "Frail";
  return "Very ill";
}

export function jobLine(c: Character, r: Relationship): string {
  const age = ageOf(c, r);
  return [`${age}`, r.job].filter(Boolean).join(" · ");
}
