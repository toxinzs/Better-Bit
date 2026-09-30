import { Character, HobbyState } from "../types";
import { HOBBIES, HobbyDef, MAX_ACTIVE, Reward, hobbyDef } from "../data/hobbies";
import { changeStat } from "./stats";
import { clamp } from "./util";
import { livingIndex, inflation } from "./where";
import { hasActiveCondition } from "./worldState";
import type { WorldState } from "../types";

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

export const scaleFor = (c: Character) => livingIndex(c.originRegion) * inflation(c);
export const hobbyCost = (c: Character, def: HobbyDef) => Math.round(def.cost * scaleFor(c));
export const stateOf = (c: Character, k: string): HobbyState | undefined => c.hobbies?.[k];
export const activeHobbies = (c: Character): string[] => Object.entries(c.hobbies ?? {}).filter(([, v]) => v.active).map(([k]) => k);

export function levelWord(n: number): string {
  return n >= 85 ? "Master" : n >= 65 ? "Expert" : n >= 40 ? "Skilled" : n >= 20 ? "Learning" : "Beginner";
}

export function canTakeUp(c: Character, def: HobbyDef): { ok: boolean; reason?: string } {
  if (c.age < def.minAge) return { ok: false, reason: `You need to be ${def.minAge}.` };
  if (c.inJail) return { ok: false, reason: "Not from behind bars." };
  if (stateOf(c, def.key)?.active) return { ok: false, reason: "You already do this." };
  if (activeHobbies(c).length >= MAX_ACTIVE) return { ok: false, reason: `You only have time for ${MAX_ACTIVE} at once.` };
  if (c.age >= 18 && c.money < hobbyCost(c, def) / 2) return { ok: false, reason: "You can't afford the kit." };
  return { ok: true };
}

export function takeUp(c: Character, key: string): boolean {
  const def = hobbyDef(key);
  if (!def || !canTakeUp(c, def).ok) return false;
  const cur = c.hobbies?.[key];
  (c.hobbies ??= {})[key] = { level: cur?.level ?? 3, since: cur?.since ?? c.age, active: true, lastShow: cur?.lastShow, done: cur?.done ?? [] };
  if (c.age >= 18) c.money -= Math.round(hobbyCost(c, def) / 2);
  c.yearLog.push(`You ${cur ? "picked up" : "took up"} ${def.label.toLowerCase()} ${cur ? "again" : ""}.`.replace(" .", "."));
  return true;
}

export function dropHobby(c: Character, key: string): void {
  const h = c.hobbies?.[key];
  if (h) h.active = false;
}

function applyReward(c: Character, r: Reward | undefined, label: string): void {
  if (!r) return;
  const s = scaleFor(c);
  if (r.money) c.money += Math.round(r.money * s);
  if (r.happy) changeStat(c, "happiness", r.happy, label);
  if (r.looks) changeStat(c, "looks", r.looks, label);
  if (r.smarts) changeStat(c, "smarts", r.smarts, label);
  if (r.network) c.network = clamp((c.network ?? 0) + r.network);
}

// ---------- showcases ----------

export function canShowcase(c: Character, key: string): { ok: boolean; reason?: string } {
  const def = hobbyDef(key);
  const h = stateOf(c, key);
  if (!def?.showcase || !h) return { ok: false, reason: "n/a" };
  if (!h.active) return { ok: false, reason: "Take it up again first." };
  if (h.level < def.showcase.minLevel) return { ok: false, reason: `Needs level ${def.showcase.minLevel}.` };
  if (h.lastShow === c.age) return { ok: false, reason: "You've done this once already this year." };
  const cost = Math.round(def.showcase.cost * scaleFor(c));
  if (c.money < cost) return { ok: false, reason: `You need ${money(cost)}.` };
  return { ok: true };
}

export function showcase(c: Character, key: string): boolean {
  const def = hobbyDef(key);
  const h = stateOf(c, key);
  if (!def?.showcase || !h || !canShowcase(c, key).ok) return false;
  const sc = def.showcase;
  const s = scaleFor(c);
  c.money -= Math.round(sc.cost * s);
  h.lastShow = c.age;
  const talent = c.talents?.[def.talent] ?? 50;
  const p = clamp(0.3 + h.level / 200 + (talent - 50) / 300, 0.15, 0.9);
  if (Math.random() < p) {
    const prize = sc.money[1] > 0 ? Math.round((sc.money[0] + Math.random() * (sc.money[1] - sc.money[0])) * s * (0.5 + h.level / 100)) : 0;
    c.money += prize;
    changeStat(c, "happiness", sc.happy, def.showcase.label);
    if (sc.network) c.network = clamp((c.network ?? 0) + sc.network);
    h.level = clamp(h.level + 2);
    c.yearLog.push(`${sc.win}${prize > 0 ? ` You made ${money(prize)}.` : ""}`);
    (h.done ??= []).push(`show-${c.age}`);
  } else {
    changeStat(c, "happiness", -1, "A disappointing result");
    h.level = clamp(h.level + 1);
    c.yearLog.push(sc.lose);
  }
  return true;
}

// ---------- the yearly tick ----------

export function tickHobbies(c: Character, world: WorldState): void {
  const all = c.hobbies;
  if (!all) return;
  const idx = scaleFor(c);
  for (const [key, h] of Object.entries(all)) {
    const def = hobbyDef(key);
    if (!def) continue;
    if (!h.active) {
      h.level = Math.max(0, h.level - 2);
      continue;
    }
    if (c.age >= 18 && !c.inJail) {
      const cost = Math.round(def.cost * idx * (c.money < 500 ? 0.5 : 1));
      c.money -= Math.round(cost / 2); // the other half was paid up front
      if (c.money < 0 && c.age >= 18 && cost > 0 && Math.random() < 0.3) {
        h.active = false;
        c.yearLog.push(`You couldn't afford ${def.label.toLowerCase()} any more and gave it up.`);
        continue;
      }
    }
    const talent = c.talents?.[def.talent] ?? 50;
    const drive = ((c.personality?.c ?? 50) - 50) / 12 + ((c.personality?.o ?? 50) - 50) / 20;
    let gain = 4 + (talent - 50) / 9 + drive + (h.level < 30 ? 2 : 0) + (c.stats.happiness > 70 ? 1 : 0);
    if (hasActiveCondition(world, "pandemic") && def.cat === "sport") gain -= 2;
    gain *= 1 - h.level / 95;
    // fractional progress rounds up or down by chance, so the last stretch is slow
    const whole = Math.floor(gain);
    h.level = clamp(h.level + whole + (Math.random() < gain - whole ? 1 : 0));
    if (def.fitness) c.fitness = clamp((c.fitness ?? 50) + def.fitness);
    c.stress = clamp((c.stress ?? 25) - def.stress);
    changeStat(c, "happiness", def.happy, def.label);
    if (def.smarts) changeStat(c, "smarts", def.smarts, def.label);
    if (def.looks && Math.random() < 0.4) changeStat(c, "looks", def.looks, def.label);
    for (const ms of def.milestones) {
      if (h.level >= ms.level && !(h.done ?? []).includes(ms.id)) {
        (h.done ??= []).push(ms.id);
        c.yearLog.push(ms.text);
        c.fullLog.push({ age: c.age, text: ms.text });
        applyReward(c, ms.reward, def.label);
      }
    }
  }
}

export { HOBBIES, MAX_ACTIVE };
