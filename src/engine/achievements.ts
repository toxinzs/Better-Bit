import { Character, WorldState } from "../types";
import { ACHIEVEMENTS, achievementDef } from "../data/achievements";

// Checked once a year, after everything else has happened.
export function tickAchievements(c: Character, world: WorldState): void {
  const have = (c.achievements ??= {});
  for (const a of ACHIEVEMENTS) {
    if (have[a.key] !== undefined) continue;
    let ok = false;
    try {
      ok = a.test(c, world);
    } catch {
      ok = false;
    }
    if (!ok) continue;
    have[a.key] = c.age;
    c.yearLog.push(`Achievement unlocked: ${a.label}.`);
    c.fullLog.push({ age: c.age, text: `Achievement: ${a.label}.` });
  }
  c.lifeScore = lifeScore(c);
}

export function lifeScore(c: Character): number {
  const have = c.achievements ?? {};
  let pts = Object.keys(have).reduce((s, k) => s + (achievementDef(k)?.points ?? 0), 0);
  pts += Math.round(c.age / 2);
  pts += Math.round((c.stats.happiness + c.stats.health) / 20);
  return pts;
}

export function toggleBucket(c: Character, key: string): void {
  const list = (c.bucket ??= []);
  c.bucket = list.includes(key) ? list.filter((k) => k !== key) : [...list, key].slice(-8);
}

export const earned = (c: Character): number => Object.keys(c.achievements ?? {}).length;
