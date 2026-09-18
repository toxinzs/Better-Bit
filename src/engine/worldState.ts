import { Job, MacroCondition, MacroConditionKind, WorldState } from "../types";
import { pickWeighted, randomInt } from "./util";

type MacroConditionDef = {
  kind: MacroConditionKind;
  weight: number;
  minDuration: number;
  maxDuration: number;
  startText: string;
  endText: string;
};

const MACRO_CONDITIONS: MacroConditionDef[] = [
  {
    kind: "recession",
    weight: 3,
    minDuration: 2,
    maxDuration: 4,
    startText: "📉 A recession has hit. Jobs are tighter and raises are harder to come by.",
    endText: "📈 The recession is finally over.",
  },
  {
    kind: "boom",
    weight: 3,
    minDuration: 2,
    maxDuration: 4,
    startText: "📈 The economy is booming. Money is loosening up everywhere.",
    endText: "The boom has cooled off. Things are back to normal.",
  },
  {
    kind: "war",
    weight: 1,
    minDuration: 3,
    maxDuration: 6,
    startText: "⚔️ War has broken out. The draft is back in the news.",
    endText: "⚔️ The war has ended.",
  },
  {
    kind: "pandemic",
    weight: 1,
    minDuration: 1,
    maxDuration: 3,
    startText: "🦠 A pandemic is spreading.",
    endText: "🦠 The pandemic has run its course.",
  },
];

const CHANCE_OF_NEW_CONDITION = 0.05;

export function createInitialWorldState(): WorldState {
  return { year: 0, activeCondition: null, history: [], log: [] };
}

export function tickWorldState(world: WorldState): void {
  world.year += 1;
  world.log = [];

  if (world.activeCondition && world.year >= world.activeCondition.endsYear) {
    const def = MACRO_CONDITIONS.find((d) => d.kind === world.activeCondition!.kind);
    world.history = [...world.history, world.activeCondition];
    world.log.push(def?.endText ?? "Things have settled down.");
    world.activeCondition = null;
    return;
  }

  if (!world.activeCondition && Math.random() < CHANCE_OF_NEW_CONDITION) {
    const def = pickWeighted(MACRO_CONDITIONS);
    if (def) {
      const duration = randomInt(def.minDuration, def.maxDuration);
      const condition: MacroCondition = {
        kind: def.kind,
        startYear: world.year,
        endsYear: world.year + duration,
      };
      world.activeCondition = condition;
      world.log.push(def.startText);
    }
  }
}

export function hasActiveCondition(world: WorldState, kind: MacroConditionKind): boolean {
  return world.activeCondition?.kind === kind;
}

export function salaryMultiplier(world: WorldState): number {
  if (hasActiveCondition(world, "recession")) return 0.85;
  if (hasActiveCondition(world, "boom")) return 1.15;
  return 1;
}

export function effectiveSalary(job: Job, world: WorldState): number {
  return Math.round(job.salary * salaryMultiplier(world));
}
