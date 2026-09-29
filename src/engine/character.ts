import { Appearance, Character, Personality, Talents, TalentKey, WealthClass } from "../types";
import { appearanceFromSeed } from "../data/appearance";
import { CLASSES, CLASS_ORDER, CLASS_WEIGHTS, QUIRKS } from "../data/traits";
import { clamp, randomInt } from "./util";

// Who you are. Rolled once at birth (creation screen), read all life long by
// the yearly tick (tickCharacter) and by school/jobs/lessons.

function seededRng(seed: number): () => number {
  let a = (seed >>> 0) + 0x51ed270b;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// a roughly bell-shaped 0-100 roll (most people are in the middle)
const bell = (rng: () => number, lo = 12, hi = 88) => Math.round(lo + ((rng() + rng() + rng()) / 3) * (hi - lo));

export function rollPersonality(rng: () => number = Math.random): Personality {
  return { o: bell(rng), c: bell(rng), e: bell(rng), a: bell(rng), n: bell(rng) };
}

export function rollTalents(rng: () => number = Math.random): Talents {
  const keys: TalentKey[] = ["academic", "artistic", "athletic", "musical", "social", "technical", "business", "verbal"];
  const t = {} as Talents;
  for (const k of keys) t[k] = bell(rng, 14, 86);
  // everyone has one thing they're plainly good at
  const star = keys[Math.floor(rng() * keys.length)];
  t[star] = Math.max(t[star], 74 + Math.floor(rng() * 20));
  return t;
}

export function rollQuirks(rng: () => number = Math.random): string[] {
  const pool = QUIRKS.map((q) => q.key);
  const a = pool.splice(Math.floor(rng() * pool.length), 1)[0];
  // some pairs cancel each other out - never roll both
  const clash: Record<string, string> = { thrifty: "spendthrift", spendthrift: "thrifty", "night-owl": "early-bird", "early-bird": "night-owl" };
  const rest = pool.filter((k) => k !== clash[a]);
  const b = rest[Math.floor(rng() * rest.length)];
  return [a, b];
}

export function rollClass(region: string | undefined, rng: () => number = Math.random): WealthClass {
  const w = CLASS_WEIGHTS[region ?? "us"] ?? CLASS_WEIGHTS.us;
  const total = w.reduce((s, x) => s + x, 0);
  let r = rng() * total;
  for (let i = 0; i < w.length; i++) {
    r -= w[i];
    if (r <= 0) return CLASS_ORDER[i];
  }
  return "middle";
}

export function classFamilyBlurb(cls: WealthClass, rng: () => number = Math.random): string {
  const v = CLASSES[cls].values;
  return v[Math.floor(rng() * v.length)];
}

// Fills in whatever a character is missing; deterministic by avatarSeed so an
// old save always gets the same person back. Idempotent.
export function ensureCharacter(c: Character): void {
  const seed = c.avatarSeed ?? 0;
  if (!c.personality) c.personality = rollPersonality(seededRng(seed));
  if (!c.talents) c.talents = rollTalents(seededRng(seed + 1));
  if (!c.quirks) c.quirks = rollQuirks(seededRng(seed + 2));
  if (!c.background) {
    const cls = rollClass(c.originRegion, seededRng(seed + 3));
    c.background = { wealthClass: cls, parentValues: classFamilyBlurb(cls, seededRng(seed + 4)) };
  }
  if (!c.appearance) c.appearance = appearanceFromSeed(seed, c.gender, c.originRegion);
}

// ---------- reading it ----------

/** -1..+1 : how far above/below typical a personality dimension is */
export function traitMod(c: Character, dim: keyof Personality): number {
  return ((c.personality?.[dim] ?? 50) - 50) / 50;
}

export function hasQuirk(c: Character, key: string): boolean {
  return !!c.quirks?.includes(key);
}

/** 0.6 - 1.6: how fast this talent makes you learn a related skill */
export function talentMult(c: Character, key: TalentKey): number {
  return 0.6 + (c.talents?.[key] ?? 50) / 100;
}

// a lesson skill and the talent that speeds it up
export const SKILL_TALENT: Record<string, TalentKey> = {
  music: "musical",
  singing: "musical",
  art: "artistic",
  martialArts: "athletic",
  acting: "verbal",
  athletics: "athletic",
  debate: "verbal",
  coding: "technical",
  leadership: "social",
};

export type TraitWord = { label: string; tone: "good" | "bad" | "neutral" };

const WORDS: Record<keyof Personality, { hi: TraitWord; lo: TraitWord }> = {
  o: { hi: { label: "Curious", tone: "good" }, lo: { label: "Traditional", tone: "neutral" } },
  c: { hi: { label: "Disciplined", tone: "good" }, lo: { label: "Easygoing", tone: "neutral" } },
  e: { hi: { label: "Outgoing", tone: "good" }, lo: { label: "Reserved", tone: "neutral" } },
  a: { hi: { label: "Kind", tone: "good" }, lo: { label: "Blunt", tone: "bad" } },
  n: { hi: { label: "Anxious", tone: "bad" }, lo: { label: "Steady", tone: "good" } },
};

export function traitWords(c: Character): TraitWord[] {
  const p = c.personality;
  if (!p) return [];
  const out: TraitWord[] = [];
  (Object.keys(WORDS) as (keyof Personality)[]).forEach((k) => {
    if (p[k] >= 66) out.push(WORDS[k].hi);
    else if (p[k] <= 34) out.push(WORDS[k].lo);
  });
  return out;
}

export const talentsKnown = (c: Character) => c.age >= 6;

// ---------- the yearly tick ----------

// Personality, quirks and talents at work. Runs once a year after the natural
// stat drift. Every effect is small; together they make two lives diverge.
export function tickCharacter(c: Character): void {
  ensureCharacter(c);
  const p = c.personality!;
  const inSchool = c.age >= 6 && c.age <= 22;

  // people mellow with age: more conscientious and steadier through adulthood
  if (c.age >= 18 && c.age <= 50) {
    p.c = clamp(p.c + (Math.random() < 0.4 ? 1 : 0));
    p.n = clamp(p.n - (Math.random() < 0.3 ? 1 : 0));
  }

  // neuroticism: a worrier's happiness sags and sanity is shakier
  c.stats.happiness = clamp(c.stats.happiness + Math.round(-traitMod(c, "n") * 1.6));
  if (p.n >= 70 && Math.random() < 0.4) c.sanity = clamp((c.sanity ?? 75) - 1);
  if (p.n <= 30 && Math.random() < 0.3) c.sanity = clamp((c.sanity ?? 75) + 1);

  // conscientiousness + academic talent: the students who put the work in
  if (inSchool) {
    const effort = (0.12 + traitMod(c, "c") * 0.28 + ((c.talents?.academic ?? 50) - 50) / 250) * (1 - Math.max(0, c.stats.smarts - 60) / 70);
    if (Math.random() < effort) c.stats.smarts = clamp(c.stats.smarts + 1);
    else if (effort < -0.05 && Math.random() < -effort) c.stats.smarts = clamp(c.stats.smarts - 1);
  }
  // openness keeps a mind growing well past school
  if (!inSchool && c.age <= 65 && p.o >= 65 && Math.random() < 0.25) c.stats.smarts = clamp(c.stats.smarts + 1);

  // athletic talent: a body that recovers
  if ((c.talents?.athletic ?? 50) >= 70 && Math.random() < 0.35) c.stats.health = clamp(c.stats.health + 1);

  // extraversion and agreeableness set how bonds age when you don't tend them
  for (const r of c.relationships) {
    if (!r.alive || r.status === "estranged") continue;
    if ((r.type === "friend" || r.type === "classmate") && r.level < 92) {
      if (p.e >= 65 && Math.random() < 0.5) r.level = clamp(r.level + 1);
      else if (p.e <= 30 && Math.random() < 0.5) r.level = clamp(r.level - 1);
    }
    if ((r.type === "mother" || r.type === "father" || r.type === "sibling" || r.type === "partner") && r.level < 92) {
      if (p.a >= 65 && Math.random() < 0.4) r.level = clamp(r.level + 1);
      else if (p.a <= 30 && Math.random() < 0.4) r.level = clamp(r.level - 1);
    }
  }

  quirkTick(c, inSchool);
}

function quirkTick(c: Character, inSchool: boolean): void {
  for (const q of c.quirks ?? []) {
    switch (q) {
      case "perfectionist":
        if (inSchool && Math.random() < 0.4) c.stats.smarts = clamp(c.stats.smarts + 1);
        if (Math.random() < 0.3) c.stats.happiness = clamp(c.stats.happiness - 1);
        break;
      case "risk-taker":
        if (c.age >= 10 && Math.random() < 0.12) {
          c.stats.health = clamp(c.stats.health - randomInt(3, 9));
          c.yearLog.push("A risk you took didn't pay off - you picked up a few bruises.");
        } else if (Math.random() < 0.3) c.stats.happiness = clamp(c.stats.happiness + 1);
        break;
      case "bookworm":
        if (c.age >= 6 && c.age <= 70 && Math.random() < 0.45) c.stats.smarts = clamp(c.stats.smarts + 1);
        break;
      case "social-butterfly":
        for (const r of c.relationships) if (r.alive && r.type === "friend" && r.level < 90 && Math.random() < 0.5) r.level = clamp(r.level + 1);
        break;
      case "night-owl":
        if (Math.random() < 0.3) c.stats.health = clamp(c.stats.health - 1);
        break;
      case "early-bird":
        if (Math.random() < 0.3) c.stats.health = clamp(c.stats.health + 1);
        break;
      case "big-hearted":
        for (const r of c.relationships) if (r.alive && r.level < 90 && Math.random() < 0.15) r.level = clamp(r.level + 1);
        break;
      case "worrier":
        if (Math.random() < 0.4) c.sanity = clamp((c.sanity ?? 75) - 1);
        break;
      case "thrifty":
        if (c.money > 500) c.money += Math.min(300, Math.round(c.money * 0.01));
        break;
      case "spendthrift":
        if (c.money > 500) c.money -= Math.min(300, Math.round(c.money * 0.01));
        break;
      case "fitness-nut":
        if (Math.random() < 0.4) c.stats.health = clamp(c.stats.health + 1);
        if (Math.random() < 0.2) c.stats.looks = clamp(c.stats.looks + 1);
        break;
      case "hot-headed":
        if (Math.random() < 0.15) c.sanity = clamp((c.sanity ?? 75) - 2);
        break;
    }
  }
}

// pocket money from the family while you're still growing up; what a house
// with money can spare is very different from one that can't
export function familyAllowance(c: Character): number {
  if (c.age < 6 || c.age > 17) return 0;
  return CLASSES[c.background?.wealthClass ?? "middle"].allowance;
}
export type { Appearance };
