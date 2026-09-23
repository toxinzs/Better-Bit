import { Character, LifeEvent } from "../types";
import { clamp, randomInt } from "./util";
import { CrimeDef } from "../data/crimes";
import { buildArrestEvent } from "./crime";

// Synthetic CrimeDefs, not part of the Crime tab's own catalog - these only
// ever get triggered from attack() below, reusing the exact same
// arrest/trial/lawyer machinery crime.ts already built (the standing
// pattern noted there for any player-initiated action needing a real
// multi-step legal consequence).
const ASSAULT_CRIME: CrimeDef = {
  id: "assault",
  label: "assault",
  tier: "moderate",
  minAge: 0,
  successBase: 0,
  rewardMin: 0,
  rewardMax: 0,
  sentenceMinYears: 0,
  sentenceMaxYears: 2,
  bailAmount: 1500,
};

const MANSLAUGHTER_CRIME: CrimeDef = {
  id: "manslaughter",
  label: "manslaughter",
  tier: "serious",
  minAge: 0,
  successBase: 0,
  rewardMin: 0,
  rewardMax: 0,
  sentenceMinYears: 8,
  sentenceMaxYears: 20,
  bailAmount: 50000,
};

const TRAGEDY_CHANCE = 0.008;
const WITNESSED_CHANCE = 0.7;
const BROKEN_UP_CHANCE = 0.15;
const ASSAULT_CHARGE_CHANCE = 0.15;

// A real "Attack" action available on any alive, non-child relationship -
// not School-exclusive, School is just what asked for it first. Rolls off
// health as the physical-capability proxy (no dedicated Strength stat
// exists yet). Returns a chained arrest LifeEvent on the rare tragic
// escalation, same as commitCrime() does for a caught crime - the store
// treats it exactly the same way, and separately checks c.alive in case
// the fight cost the player their own life.
export function attack(c: Character, relationshipId: string): LifeEvent | null {
  const r = c.relationships.find((x) => x.id === relationshipId && x.alive);
  if (!r || r.type === "child") {
    c.yearLog.push("That's not something you can do.");
    return null;
  }

  if (Math.random() < TRAGEDY_CHANCE) {
    const youDie = Math.random() < 0.5;
    if (youDie) {
      c.alive = false;
      c.causeOfDeath = "killed in a fight";
      c.yearLog.push(`The fight with ${r.name} went too far. It cost you your life.`);
      c.fullLog.push({ age: c.age, text: c.yearLog[c.yearLog.length - 1] });
      return null;
    }

    r.alive = false;
    const witnessed = Math.random() < WITNESSED_CHANCE;
    if (witnessed) {
      c.yearLog.push(`The fight with ${r.name} went too far. They didn't survive, and people saw.`);
      return buildArrestEvent(MANSLAUGHTER_CRIME, c);
    }
    c.stats.happiness = clamp(c.stats.happiness - 30);
    const flags = c.flags ?? [];
    flags.push("killed-someone-in-a-fight");
    c.flags = flags;
    c.yearLog.push(`The fight with ${r.name} went too far. They didn't survive, and no one saw. You'll carry this.`);
    return null;
  }

  if (Math.random() < BROKEN_UP_CHANCE) {
    c.yearLog.push(`You squared up with ${r.name}, but someone broke it up before it went anywhere.`);
    return null;
  }

  const winChance = clamp(0.5 + (c.stats.health - 50) / 200, 0.15, 0.85);
  const won = Math.random() < winChance;
  r.level = clamp(r.level - 30);
  if (won) {
    c.stats.happiness = clamp(c.stats.happiness + 3);
    c.yearLog.push(`You got into it with ${r.name} and came out on top.`);
  } else {
    c.stats.health = clamp(c.stats.health - randomInt(5, 15));
    c.stats.happiness = clamp(c.stats.happiness - 5);
    c.yearLog.push(`You got into it with ${r.name} and took the worse end of it.`);
  }

  if (Math.random() < ASSAULT_CHARGE_CHANCE) {
    return buildArrestEvent(ASSAULT_CRIME, c);
  }
  return null;
}
