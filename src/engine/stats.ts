import { Character, StatKey } from "../types";
import { clamp } from "./util";

// The one way new code moves a core stat: it clamps, and it remembers *why*
// so the stat detail screen can say what raised or lowered it this year.
export function changeStat(c: Character, key: StatKey, delta: number, reason: string): number {
  const before = c.stats[key];
  c.stats[key] = clamp(before + delta);
  const applied = Math.round(c.stats[key] - before);
  if (applied !== 0) {
    const notes = (c.statNotes ??= {});
    const list = (notes[key] ??= []);
    const existing = list.find((n) => n.reason === reason);
    if (existing) existing.delta += applied;
    else list.push({ reason, delta: applied });
  }
  return applied;
}

// called at the start of each year: last year's reasons are gone
export function resetStatNotes(c: Character): void {
  c.statNotes = {};
}
