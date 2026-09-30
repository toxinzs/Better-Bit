import { Addiction, AddictionKey, Character } from "../types";
import { changeStat } from "./stats";
import { clamp, randomInt } from "./util";
import { livingIndex, inflation } from "./where";
import { getRegion } from "../data/regions";

// Habits that can take hold: alcohol, nicotine, gambling, drugs and screens.
// `level` is dependence (0-100). Below 25 it's an occasional thing; from 25 up
// you're hooked and it plays out every year whether you like it or not.

export type SubstanceDef = {
  key: AddictionKey;
  label: string;
  use: string; // the action's label
  icon: string;
  pull: number; // how easily it grabs you
  hook: number; // level at which it starts to run itself
  cost: number; // baseline dollars for one use
  yearly: number; // baseline dollars a year at level 50
  blurb: string;
};

export const SUBSTANCES: SubstanceDef[] = [
  { key: "alcohol", label: "Alcohol", use: "Have a few drinks", icon: "beer", pull: 0.9, hook: 25, cost: 45, yearly: 1800, blurb: "Legal, social and everywhere." },
  { key: "nicotine", label: "Nicotine", use: "Smoke a cigarette", icon: "flame", pull: 1.6, hook: 20, cost: 12, yearly: 2400, blurb: "It grabs quickly and lets go slowly." },
  { key: "gambling", label: "Gambling", use: "Place a bet", icon: "dice", pull: 1.0, hook: 25, cost: 80, yearly: 0, blurb: "The house always wins in the end." },
  { key: "drugs", label: "Drugs", use: "Try something stronger", icon: "medkit", pull: 1.5, hook: 20, cost: 100, yearly: 4500, blurb: "Illegal in most places, and very hard to stop." },
  { key: "screen", label: "Screens & social media", use: "Scroll for hours", icon: "phone-portrait", pull: 1.1, hook: 35, cost: 0, yearly: 0, blurb: "Designed by very clever people to keep you there." },
];

export const substanceDef = (k: AddictionKey) => SUBSTANCES.find((s) => s.key === k)!;
export const addictionOf = (c: Character, k: AddictionKey): Addiction | undefined => (c.addictions ?? []).find((a) => a.key === k);
export const isHooked = (c: Character, k: AddictionKey): boolean => {
  const a = addictionOf(c, k);
  return !!a && !a.quitting && a.level >= substanceDef(k).hook;
};
export const hooked = (c: Character): Addiction[] => (c.addictions ?? []).filter((a) => a.level >= substanceDef(a.key).hook);

export function levelWord(n: number, hook: number): string {
  return n >= 75 ? "Severe" : n >= hook + 15 ? "Serious" : n >= hook ? "Hooked" : n >= 12 ? "Regular" : "Occasional";
}

// ---------- who can, and how easily they fall ----------

export function minAgeFor(c: Character, k: AddictionKey): number {
  const legal = getRegion(c.originRegion).legalAges;
  return k === "alcohol" ? legal.drinking : k === "nicotine" ? legal.smoking : k === "gambling" ? legal.gambling : k === "drugs" ? 16 : 8;
}

export function canUse(c: Character, k: AddictionKey): { ok: boolean; reason?: string } {
  if (c.inJail) return { ok: false, reason: "Not from behind bars." };
  const min = minAgeFor(c, k);
  if (c.age < min) return { ok: false, reason: `You need to be ${min}.` };
  if (c.money < substanceDef(k).cost * livingIndex(c.originRegion)) return { ok: false, reason: "You can't afford it." };
  const a = addictionOf(c, k);
  if (a?.tried === c.age && (a.uses ?? 0) >= 3) return { ok: false, reason: "That's enough for this year." };
  return { ok: true };
}

function willpower(c: Character): number {
  return ((c.personality?.c ?? 50) - 50) / 100 - ((c.personality?.n ?? 50) - 50) / 180;
}

export function pullFor(c: Character, k: AddictionKey): number {
  const def = substanceDef(k);
  let p = 0.11 * def.pull;
  p *= 1 - willpower(c) * 0.9;
  p *= 1 + Math.max(0, (c.stress ?? 25) - 40) / 80;
  if (c.quirks?.includes("risk-taker")) p *= 1.3;
  if (c.age < 18) p *= 1.15;
  if ((c.stats.happiness ?? 60) < 35) p *= 1.3;
  return clamp(p, 0.01, 0.6);
}

// ---------- using ----------

// `force` skips the age and money checks, for events that put you in the moment
export function use(c: Character, k: AddictionKey, force = false): boolean {
  if (!force && !canUse(c, k).ok) return false;
  const def = substanceDef(k);
  const idx = livingIndex(c.originRegion) * inflation(c);
  const cost = Math.round(def.cost * idx);
  let a = addictionOf(c, k);
  if (!a) {
    a = { key: k, level: 0, since: c.age };
    (c.addictions ??= []).push(a);
  }
  a.uses = a.tried === c.age ? (a.uses ?? 0) + 1 : 1;
  a.tried = c.age;
  a.quitting = false;
  a.clean = 0;
  if (cost > 0) c.money -= cost;
  const before = a.level;
  const grab = pullFor(c, k);
  const step = Math.random() < grab * (1 + a.level / 60) ? randomInt(6, 16) : Math.random() < 0.4 ? 3 : 0;
  a.level = clamp(a.level + step);

  switch (k) {
    case "alcohol":
      changeStat(c, "happiness", randomInt(2, 5), "A few drinks");
      changeStat(c, "health", -1, "Drinking");
      if (Math.random() < 0.08) { c.yearLog.push("You drank too much and did something you regret."); changeStat(c, "happiness", -4, "A bad night"); }
      else c.yearLog.push("You had a few drinks and a good night.");
      break;
    case "nicotine":
      changeStat(c, "health", -1, "Smoking");
      c.stress = clamp((c.stress ?? 25) - 4);
      c.yearLog.push("You smoked a cigarette. It steadied your nerves and you know it shouldn't.");
      break;
    case "gambling": {
      const stake = Math.min(c.money, Math.round(120 * idx * (1 + a.level / 60)));
      const win = Math.random() < 0.42;
      const delta = win ? Math.round(stake * (0.8 + Math.random() * 1.6)) : -stake;
      c.money += delta;
      changeStat(c, "happiness", win ? 4 : -3, win ? "A win" : "A loss");
      c.yearLog.push(win ? `You won $${delta.toLocaleString()} on a bet.` : `You lost $${stake.toLocaleString()} on a bet.`);
      break;
    }
    case "drugs": {
      changeStat(c, "happiness", randomInt(3, 7), "A high");
      changeStat(c, "health", -randomInt(2, 4), "Drugs");
      c.sanity = clamp((c.sanity ?? 75) - 1);
      if (getRegion(c.originRegion).drugsIllegal && Math.random() < 0.07) {
        c.criminalRecord = true;
        c.recordCleanYears = 0;
        c.money = Math.max(0, c.money - Math.round(600 * idx));
        c.yearLog.push("You were caught with drugs, fined, and now you've got a record.");
      } else c.yearLog.push("You took something you probably shouldn't have.");
      break;
    }
    case "screen":
      changeStat(c, "happiness", 2, "Scrolling");
      changeStat(c, "smarts", -1, "Hours on screens");
      c.stress = clamp((c.stress ?? 25) + 2);
      c.yearLog.push("You lost an evening to the screen without noticing.");
      break;
  }
  if (before < def.hook && a.level >= def.hook) {
    c.yearLog.push(`You realise you can't stop. You're hooked on ${def.label.toLowerCase()}.`);
    c.fullLog.push({ age: c.age, text: `You became dependent on ${def.label.toLowerCase()}.` });
  }
  return true;
}

// ---------- getting clean ----------

export type QuitMethod = "cold" | "group" | "rehab";
export const REHAB_COST = 9000;
export const rehabCost = (c: Character) => Math.round(REHAB_COST * livingIndex(c.originRegion) * inflation(c));

export function quitChance(c: Character, k: AddictionKey, method: QuitMethod): number {
  const a = addictionOf(c, k);
  const lvl = a?.level ?? 0;
  const base = method === "cold" ? 0.42 : method === "group" ? 0.55 : 0.82;
  return clamp(base - lvl / 260 + willpower(c) * 0.3 - (k === "nicotine" || k === "drugs" ? 0.08 : 0), 0.08, 0.92);
}

export function quit(c: Character, k: AddictionKey, method: QuitMethod): boolean {
  const a = addictionOf(c, k);
  if (!a || a.quitting) return false;
  if (method === "rehab") {
    const cost = rehabCost(c);
    if (c.money < cost) return false;
    c.money -= cost;
  }
  const def = substanceDef(k);
  if (Math.random() < quitChance(c, k, method)) {
    a.quitting = true;
    a.clean = 0;
    a.level = Math.max(0, a.level - 18);
    changeStat(c, "happiness", 4, "Taking control");
    c.yearLog.push(`You ${method === "rehab" ? "completed rehab and " : ""}quit ${def.label.toLowerCase()}. The hardest part is staying stopped.`);
  } else {
    c.stress = clamp((c.stress ?? 25) + 8);
    changeStat(c, "happiness", -4, "Failing to quit");
    changeStat(c, "health", -1, "Withdrawal");
    c.yearLog.push(`You tried to quit ${def.label.toLowerCase()} and couldn't, this time.`);
  }
  return true;
}

// ---------- risk ----------

export function addictionRisk(c: Character, key: string): number {
  const lvl = (k: AddictionKey) => (isHooked(c, k) ? addictionOf(c, k)!.level : (addictionOf(c, k)?.level ?? 0) * 0.4);
  if (key === "liver disease") return 1 + lvl("alcohol") / 12;
  if (key === "copd" || key === "cancer") return 1 + lvl("nicotine") / 25;
  if (key === "heart disease" || key === "stroke") return 1 + lvl("nicotine") / 60 + lvl("alcohol") / 120 + lvl("drugs") / 90;
  if (key === "hypertension") return 1 + lvl("alcohol") / 120;
  if (key === "depression" || key === "anxiety") return 1 + lvl("alcohol") / 100 + lvl("drugs") / 60 + lvl("screen") / 120;
  return 1;
}

// how much substance use drags on your work, for the performance review
export function addictionPerfPenalty(c: Character): number {
  return hooked(c).reduce((s, a) => s + (a.key === "screen" ? a.level / 14 : a.level / 9), 0);
}

// ---------- the yearly tick ----------

export function tickAddictions(c: Character): void {
  const list = c.addictions ?? [];
  if (list.length === 0) return;
  const idx = livingIndex(c.originRegion) * inflation(c);
  for (const a of list) {
    const def = substanceDef(a.key);
    if (a.quitting) {
      // staying clean: the pull fades, but a bad year can drag you back
      a.clean = (a.clean ?? 0) + 1;
      a.level = Math.max(0, a.level - randomInt(8, 16));
      if (a.level >= 10 && Math.random() < 0.1 + ((c.stress ?? 25) - 50) / 400) {
        a.quitting = false;
        a.level = clamp(a.level + 12);
        c.yearLog.push(`Under pressure, you relapsed on ${def.label.toLowerCase()}.`);
        changeStat(c, "happiness", -5, "A relapse");
      } else if (a.clean === 3 && a.level < 10) c.yearLog.push(`Three years clear of ${def.label.toLowerCase()}. You're proud of that.`);
      continue;
    }
    if (a.level < def.hook) {
      a.level = Math.max(0, a.level - 2); // casual use fades if you don't feed it
      continue;
    }
    // hooked: it plays out every year
    const f = a.level / 50;
    const spend = Math.round(def.yearly * idx * f);
    if (spend > 0) c.money -= spend;
    switch (a.key) {
      case "alcohol":
        changeStat(c, "health", -Math.round(1 + f), "Heavy drinking");
        changeStat(c, "looks", -(Math.random() < 0.4 ? 1 : 0), "Heavy drinking");
        break;
      case "nicotine":
        changeStat(c, "health", -Math.round(1 + f * 0.7), "Smoking");
        if (Math.random() < 0.3) changeStat(c, "looks", -1, "Smoking");
        break;
      case "gambling": {
        const lose = Math.min(Math.max(0, c.money), Math.round((1500 + c.money * 0.05) * f * idx));
        c.money -= lose;
        c.yearLog.push(`Gambling cost you $${lose.toLocaleString()} this year.`);
        break;
      }
      case "drugs":
        changeStat(c, "health", -Math.round(2 + f * 2), "Drug use");
        c.sanity = clamp((c.sanity ?? 75) - 2);
        if (Math.random() < a.level / 2200) {
          changeStat(c, "health", -30, "An overdose");
          c.yearLog.push("You overdosed and woke up in hospital. It could have been the end.");
          c.fullLog.push({ age: c.age, text: "You survived an overdose." });
        }
        break;
      case "screen":
        changeStat(c, "smarts", -1, "Too many screens");
        c.stress = clamp((c.stress ?? 25) + 3);
        if (c.age < 18 && Math.random() < 0.4) c.conduct = clamp((c.conduct ?? 80) - 2);
        break;
    }
    if (a.key !== "screen") changeStat(c, "happiness", -Math.round(f), `${def.label} is running your life`);
    // it wears on the people around you
    if (a.level >= 50) {
      for (const r of c.relationships) {
        if (!r.alive || !["partner", "mother", "father", "sibling", "child"].includes(r.type)) continue;
        r.level = clamp(r.level - randomInt(1, 4));
      }
    }
    // it can keep growing on its own
    a.level = clamp(a.level + (Math.random() < 0.5 ? randomInt(1, 5) : 0));
  }
  // fully recovered, or a passing thing that faded: nothing left to track
  c.addictions = list.filter((a) => a.level > 0 && !(a.quitting && a.level < 5 && (a.clean ?? 0) >= 2));
}
