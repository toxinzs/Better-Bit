import { Character, EventChoice, LifeEvent, Relationship } from "../types";
import { getRegion } from "../data/regions";
import { PERSON_JOBS, addPerson, ageOf, uid } from "./people";
import { addNews } from "./relatives";
import { clamp } from "./util";

// Raising kids and letting them go. Parenting actions depend on how old the
// child is; pressure options (a job, college, settling down, marriage) exist
// only for children who are old enough for them to be the child's own call -
// and they are consequence-driven: a child can comply, refuse, and resent it.
// Nothing here forces anything on anyone: a refusal is a real outcome.

const first = (r: Relationship) => r.name.split(" ")[0];
const pick = <T,>(xs: T[]): T => xs[Math.floor(Math.random() * xs.length)];
const rel = (c: Character, id?: string) => c.relationships.find((x) => x.id === id);
const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

export type KidBracket = "baby" | "toddler" | "child" | "teen" | "adult";

export function bracketOf(age: number): KidBracket {
  if (age <= 2) return "baby";
  if (age <= 5) return "toddler";
  if (age <= 12) return "child";
  if (age <= 17) return "teen";
  return "adult";
}

export function isMyChild(r: Relationship): boolean {
  return r.type === "child" && r.alive && r.status !== "placed" && !r.hidden;
}

const kidOf = (r: Relationship) => (r.kid ??= { smarts: 50, discipline: 50, resent: 0 });

// ---------- region pressure ----------

export function pressureStrength(c: Character): { strength: number; minChildAge: number } {
  return getRegion(c.originRegion).marriagePressure;
}

// Why an option isn't available for this child right now, or null. "n/a"
// means it doesn't apply to this child at all (so it isn't shown).
export function kidLock(c: Character, r: Relationship, key: string): string | null {
  if (!isMyChild(r)) return "n/a";
  const age = ageOf(c, r);
  const k = kidOf(r);
  const { minChildAge } = pressureStrength(c);
  switch (key) {
    case "playWith":
      return age <= 8 ? null : "n/a";
    case "readStory":
      return age >= 1 && age <= 10 ? null : "n/a";
    case "helpHomework":
      return age >= 6 && age <= 17 ? null : "n/a";
    case "discipline":
      return age >= 4 && age <= 17 ? null : "n/a";
    case "payCollege":
      if (age < 17 || age > 24 || k.path === "college") return "n/a";
      return c.money < 10000 ? "$10,000" : null;
    case "pushCollege":
      // guidance, not pressure - from the last years of school on
      return age >= 16 && age <= 24 && k.path !== "college" ? null : "n/a";
    case "pushJob":
      // an adult with no work
      return age >= 20 && age <= 50 && (!r.job || r.job === "Between jobs") ? null : "n/a";
    case "pushSettle":
      return age >= minChildAge && age <= 45 && !k.partnered && !r.married ? null : "n/a";
    case "pushMarriage":
      return age >= minChildAge && age <= 50 && !!k.partnered && !r.married ? null : "n/a";
  }
  return "n/a";
}

// ---------- parenting (kids under 18) ----------

const PLAY = [
  "You built a fort out of every pillow in the house and defended it from imaginary dragons.",
  "You spent the afternoon on the floor with {n}, doing silly voices for every toy.",
  "You and {n} danced around the living room to the same song nine times.",
  "You played hide and seek, and {n} hid in the most obvious place, every time.",
];

const STORY = [
  "You read {n} the same book three times. {n} had the words memorised by the third.",
  "You made up a bedtime story with {n} as the hero. {n} fell asleep mid-adventure.",
  "You and {n} curled up with a stack of picture books.",
];

export function playWith(c: Character, r: Relationship, dampen: number): string {
  const n = first(r);
  const bond = Math.max(1, Math.round(7 * dampen));
  r.level = clamp(r.level + bond);
  kidOf(r).smarts = clamp(kidOf(r).smarts + 1);
  c.stats.happiness = clamp(c.stats.happiness + 4);
  return `${pick(PLAY).replace(/\{n\}/g, n)} (+${bond} bond)`;
}

export function readStory(c: Character, r: Relationship, dampen: number): string {
  const n = first(r);
  const bond = Math.max(1, Math.round(6 * dampen));
  r.level = clamp(r.level + bond);
  kidOf(r).smarts = clamp(kidOf(r).smarts + 2);
  c.stats.happiness = clamp(c.stats.happiness + 3);
  return `${pick(STORY).replace(/\{n\}/g, n)} (+${bond} bond)`;
}

export function helpHomework(c: Character, r: Relationship, dampen: number): string {
  const n = first(r);
  const bond = Math.max(1, Math.round(5 * dampen));
  r.level = clamp(r.level + bond);
  kidOf(r).smarts = clamp(kidOf(r).smarts + 3);
  kidOf(r).discipline = clamp(kidOf(r).discipline + 1);
  return `You sat with ${n} until the homework made sense. It took a while, but ${n} got there. (+${bond} bond)`;
}

// Discipline is a real 4-way choice. Nothing physical is on the menu: talking,
// consequences, or letting it slide.
export function buildDisciplineEvent(c: Character, r: Relationship): LifeEvent {
  const n = first(r);
  const teen = ageOf(c, r) >= 13;
  let result = "";
  const go = (fn: (cc: Character, rr: Relationship) => string): EventChoice["effect"] => (cc) => {
    const rr = rel(cc, r.id) ?? r;
    result = fn(cc, rr);
  };
  return {
    id: uid("disc"),
    minAge: 0,
    maxAge: 999,
    who: r.id,
    logText: () => "",
    text: () => `${n} has been testing the rules again${teen ? ", and it's starting to be a pattern" : ""}. How do you handle it?`,
    choices: [
      {
        label: "Talk it through calmly",
        tone: "good",
        effect: go((cc, rr) => {
          const close = rr.level >= 40;
          rr.level = clamp(rr.level + 3);
          kidOf(rr).discipline = clamp(kidOf(rr).discipline + (close ? 3 : 1));
          return `You sat ${n} down and talked it through. ${close ? `${n} listened.` : `${n} wasn't in the mood, but it might have sunk in.`} (+3 bond)`;
        }),
        resultText: () => result,
      },
      {
        label: teen ? "Ground them" : "Time-out",
        effect: go((cc, rr) => {
          rr.level = clamp(rr.level - (teen ? 6 : 3));
          kidOf(rr).discipline = clamp(kidOf(rr).discipline + 5);
          return `${teen ? `You grounded ${n} for a week.` : `${n} had a time-out.`} There was some slamming of doors. It worked. (${teen ? "-6" : "-3"} bond)`;
        }),
        resultText: () => result,
      },
      {
        label: teen ? "Take away their phone for a week" : "Take away a toy for the day",
        effect: go((cc, rr) => {
          rr.level = clamp(rr.level - 3);
          kidOf(rr).discipline = clamp(kidOf(rr).discipline + 4);
          return `You took ${n}'s ${teen ? "phone" : "favorite toy"} away for a while. ${n} sulked, then adjusted. (-3 bond)`;
        }),
        resultText: () => result,
      },
      {
        label: "Let it slide",
        effect: go((cc, rr) => {
          rr.level = clamp(rr.level + 2);
          kidOf(rr).discipline = clamp(kidOf(rr).discipline - 3);
          return `You let it go this time. ${n} was relieved. The rules feel a little looser. (+2 bond)`;
        }),
        resultText: () => result,
      },
    ],
  };
}

// ---------- paying for college ----------

export function payForCollege(c: Character, r: Relationship): string {
  const n = first(r);
  c.money = Math.max(0, c.money - 10000);
  const k = kidOf(r);
  k.path = "college";
  r.level = clamp(r.level + 10);
  r.favor = clamp((r.favor ?? 50) + 8);
  if (ageOf(c, r) >= 18) r.job = "Student";
  c.stats.happiness = clamp(c.stats.happiness + 3);
  return `You paid ${n}'s way into college (-${money(10000)}). ${n} was speechless, then hugged you for a long time. (+10 bond)`;
}

// ---------- pressure (a child old enough for it to be their call) ----------

type PressureKind = "pushJob" | "pushCollege" | "pushSettle" | "pushMarriage";

function complianceChance(c: Character, r: Relationship, kind: PressureKind): number {
  const k = kidOf(r);
  const { strength } = pressureStrength(c);
  const base = r.level / 250 + k.discipline / 300 - k.resent * 0.1;
  switch (kind) {
    case "pushJob":
      return clamp(0.3 + base, 0.1, 0.85);
    case "pushCollege":
      return clamp(0.25 + base + k.smarts / 300, 0.1, 0.85);
    case "pushSettle":
      return clamp(0.12 + strength * 0.35 + base * 0.5, 0.05, 0.7);
    case "pushMarriage":
      return clamp(0.12 + strength * 0.4 + base * 0.5, 0.05, 0.7);
  }
}

// In cultures where the expectation is strong a refusal stings less (it's
// what everybody's parents do); where it isn't, it lands as a real intrusion.
function refusalCost(c: Character, kind: PressureKind): number {
  const { strength } = pressureStrength(c);
  if (kind === "pushJob" || kind === "pushCollege") return 7;
  return Math.round(5 + (1 - strength) * 8);
}

export function pressure(c: Character, r: Relationship, kind: PressureKind): string {
  const n = first(r);
  const k = kidOf(r);
  const age = ageOf(c, r);
  const comply = Math.random() < complianceChance(c, r, kind);

  if (comply) {
    r.level = clamp(r.level - 2); // even a yes costs a little goodwill
    switch (kind) {
      case "pushJob": {
        const job = pick(PERSON_JOBS);
        r.job = job;
        r.wealth = clamp((r.wealth ?? 30) + 8);
        addNews(c, "job", r, `${n} started a new job as a ${job.toLowerCase()}.`);
        return `You pushed ${n} to get their life moving. ${n} sighed, then went and found work as a ${job.toLowerCase()}. It was your idea, and ${fillHe(r)} knows it. (-2 bond)`;
      }
      case "pushCollege":
        k.path = "college";
        if (age >= 18) r.job = "Student";
        return `You encouraged ${n} to go to college. ${n} thought it over and applied. (-2 bond)`;
      case "pushSettle":
        k.partnered = true;
        addNews(c, "wedding", r, `${n} started seeing someone.`);
        return `You nudged ${n} about settling down. ${n} rolled ${fillHis(r)} eyes, then a few weeks later mentioned someone. (-2 bond)`;
      case "pushMarriage":
        r.married = true;
        addNews(c, "wedding", r, `${n} got married.`);
        c.stats.happiness = clamp(c.stats.happiness + 5);
        return `You pushed for a wedding. ${n} and ${fillHis(r)} partner got married. You're delighted. ${n} is... mostly delighted. (-2 bond)`;
    }
  }

  const cost = refusalCost(c, kind);
  r.level = clamp(r.level - cost);
  k.resent += 1;
  c.stats.happiness = clamp(c.stats.happiness - 3);
  const what =
    kind === "pushJob" ? "get a job" : kind === "pushCollege" ? "go to college" : kind === "pushSettle" ? "settle down" : "get married";
  return `You told ${n} it was time to ${what}. ${n} said it's ${fillHis(r)} life and ${fillHe(r)} will decide when. ${k.resent >= 2 ? "This isn't the first time, and it shows." : ""} (-${cost} bond)`;
}

const fillHe = (r: Relationship) => (r.gender === "male" ? "he" : r.gender === "female" ? "she" : "they");
const fillHis = (r: Relationship) => (r.gender === "male" ? "his" : r.gender === "female" ? "her" : "their");

// ---------- kids growing up ----------

const FIRST_JOBS = ["Retail associate", "Barista", "Warehouse worker", "Delivery driver", "Line cook", "Receptionist"];

export function tickKids(c: Character): void {
  const { strength } = pressureStrength(c);
  const grandParents = c.relationships.filter((r) => r.type === "grandchild" && r.alive).length;
  for (const r of c.relationships) {
    if (!isMyChild(r)) continue;
    const age = ageOf(c, r);
    const k = kidOf(r);
    const n = first(r);

    // the resentment of being pushed fades slowly
    if (k.resent > 0 && Math.random() < 0.3) k.resent -= 1;

    // what they do at 18
    if (age === 18 && !k.path) {
      const p = clamp(0.25 + k.smarts / 200 + (c.money > 20000 ? 0.15 : 0), 0.15, 0.8);
      const roll = Math.random();
      if (roll < p) {
        k.path = "college";
        r.job = "Student";
        addNews(c, "milestone", r, `${n} started college.`);
      } else if (roll < p + (1 - p) * 0.75) {
        k.path = "work";
        r.job = pick(FIRST_JOBS);
        addNews(c, "job", r, `${n} started working as a ${r.job.toLowerCase()}.`);
      } else {
        k.path = "gap";
        r.job = "Between jobs";
        addNews(c, "milestone", r, `${n} is taking some time to figure things out.`);
      }
    }
    // college ends
    if (k.path === "college" && age === 22 && r.job === "Student") {
      r.job = pick(PERSON_JOBS);
      addNews(c, "job", r, `${n} graduated and started as a ${r.job.toLowerCase()}.`);
    }

    // their own love life and family, in their own time
    if (age >= 22 && age <= 36 && !k.partnered && !r.married && Math.random() < 0.07 + strength * 0.03) {
      k.partnered = true;
      addNews(c, "wedding", r, `${n} started seeing someone.`);
    } else if (age >= 24 && age <= 40 && k.partnered && !r.married && Math.random() < 0.06 + strength * 0.04) {
      r.married = true;
      addNews(c, "wedding", r, `${n} got married.`);
    } else if (age >= 24 && age <= 42 && r.married && (k.grandKids ?? 0) < 4 && grandParents < 8 && Math.random() < 0.07) {
      k.grandKids = (k.grandKids ?? 0) + 1;
      addPerson(c, {
        type: "grandchild",
        age: 0,
        lastName: r.name.split(" ").slice(-1)[0],
        level: 60,
        fields: { coParent: r.id },
      });
      c.stats.happiness = clamp(c.stats.happiness + 8);
      addNews(c, "baby", r, `${n} had a baby - you're a grandparent!`, true);
      c.yearLog.push(`${n} had a baby. You're a grandparent!`);
    }
  }
}
