import { Character, Relationship } from "../types";
import { changeStat } from "./stats";
import { clamp, randomInt } from "./util";
import { livingIndex, inflation } from "./where";
import { hobbyDef } from "../data/hobbies";

// The quieter things you do with people: ask their advice, do them a favour,
// ask one back, share a hobby, get counselling together, check in on them.

const first = (r: Relationship) => r.name.split(" ")[0];
const money = (n: number) => `$${Math.round(n).toLocaleString()}`;
const scale = (c: Character) => livingIndex(c.originRegion) * inflation(c);
const bond = (n: number) => `(+${n} bond)`;

export function askAdvice(c: Character, r: Relationship, damp: number): string {
  const lvl = Math.max(1, Math.round(randomInt(2, 5) * damp));
  r.level = clamp(r.level + lvl);
  r.favor = clamp((r.favor ?? 50) + 1);
  const n = first(r);
  switch (r.type) {
    case "mother":
    case "father":
      changeStat(c, "happiness", 2, `${n}'s advice`);
      if (Math.random() < 0.35) changeStat(c, "smarts", 1, `${n}'s advice`);
      return `You asked ${n} for advice. It was lovingly overlong and mostly right. ${bond(lvl)}`;
    case "teacher":
      changeStat(c, "smarts", 2, `${n}'s advice`);
      return `${n} took time to talk through your options. ${bond(lvl)}`;
    case "coworker":
      if (c.job) c.job.rapport = clamp((c.job.rapport ?? 50) + 3);
      if (c.job) c.job.perf = clamp((c.job.perf ?? 55) + 2);
      return `${n} showed you a shortcut you wish you'd known a year ago. ${bond(lvl)}`;
    case "partner":
      c.stress = clamp((c.stress ?? 25) - 5);
      return `You talked it through with ${n}. Saying it out loud helped. ${bond(lvl)}`;
    default:
      c.stress = clamp((c.stress ?? 25) - 4);
      c.sanity = clamp((c.sanity ?? 75) + 1);
      return `${n} listened, and said the thing you needed to hear. ${bond(lvl)}`;
  }
}

export function doFavor(c: Character, r: Relationship, damp: number): string {
  const n = first(r);
  const cost = Math.round(40 * scale(c));
  if (c.age >= 18 && c.money >= cost) c.money -= cost;
  const lvl = Math.max(1, Math.round(5 * damp));
  r.level = clamp(r.level + lvl);
  r.favor = clamp((r.favor ?? 50) + 9);
  changeStat(c, "happiness", 1, "Being helpful");
  const lines = [`You helped ${n} move some furniture.`, `You drove ${n} to the airport at dawn.`, `You covered for ${n} when it mattered.`, `You looked after something for ${n} while ${"they"} were away.`];
  return `${lines[randomInt(0, lines.length - 1)]} ${n} won't forget it. ${bond(lvl)}`;
}

export function askFavor(c: Character, r: Relationship): string {
  const n = first(r);
  const p = clamp(0.2 + r.level / 200 + (r.favor ?? 50) / 220, 0.05, 0.85);
  if (Math.random() >= p) {
    r.level = clamp(r.level - 3);
    return `You asked ${n} for a favour. The answer was a polite no, and it was a little awkward.`;
  }
  r.favor = clamp((r.favor ?? 50) - 8);
  const adult = c.age >= 18;
  const roll = Math.random();
  if (adult && r.job && r.job !== "Student" && r.job !== "Retired" && roll < 0.4) {
    c.network = clamp((c.network ?? 0) + 6);
    if (!c.flags?.includes("return-offer")) c.flags = [...(c.flags ?? []), "return-offer"];
    return `${n} put in a good word for you at work. A door has opened.`;
  }
  if (roll < 0.7) {
    const saved = Math.round(220 * scale(c));
    c.money += saved;
    return `${n} helped you out with something that would have cost you ${money(saved)}.`;
  }
  changeStat(c, "happiness", 3, `${n} came through`);
  return `${n} dropped everything to help. You feel lucky to have them.`;
}

export function hobbyTogether(c: Character, r: Relationship, damp: number): string {
  const n = first(r);
  const active = Object.entries(c.hobbies ?? {}).filter(([, h]) => h.active).map(([k]) => k);
  const key = active[randomInt(0, Math.max(0, active.length - 1))];
  const h = key ? c.hobbies![key] : undefined;
  const lvl = Math.max(1, Math.round(6 * damp));
  r.level = clamp(r.level + lvl);
  c.stress = clamp((c.stress ?? 25) - 4);
  changeStat(c, "happiness", 2, "Doing what you love with someone");
  if (h) h.level = clamp(h.level + 2);
  return `You and ${n} spent the day on ${hobbyDef(key ?? "")?.label.toLowerCase() ?? "a hobby"}. ${bond(lvl)}`;
}

export const counsellingCost = (c: Character) => Math.round(400 * scale(c));

export function counselling(c: Character, r: Relationship): string {
  const n = first(r);
  if (c.money < counsellingCost(c)) return `You couldn't afford couples counselling.`;
  c.money -= counsellingCost(c);
  if (Math.random() < 0.65) {
    r.level = clamp(r.level + 14);
    changeStat(c, "happiness", 3, "Working things out");
    return `Counselling helped you and ${n} hear each other again. (+14 bond, -${money(counsellingCost(c))})`;
  }
  r.level = clamp(r.level + 3);
  return `The counsellor was kind, but you and ${n} are still stuck in the same old arguments. (+3 bond, -${money(counsellingCost(c))})`;
}

export function checkIn(c: Character, r: Relationship): string {
  const n = first(r);
  r.level = clamp(r.level + 5);
  r.health = clamp((r.health ?? 60) + 3);
  changeStat(c, "happiness", 1, "Looking out for someone");
  return `You checked on ${n}, brought some food and stayed a while. It meant a lot. ${bond(5)}`;
}
