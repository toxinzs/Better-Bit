// Who dies and when. The player's own death odds live here (moved out of
// lifeEngine.ts so the relatives' odds can share the same shape).

export function deathChance(age: number, health: number): number {
  let base: number;
  if (age < 45) base = 0.0005;
  else if (age < 60) base = 0.004;
  else if (age < 70) base = 0.015;
  else if (age < 80) base = 0.04;
  else if (age < 90) base = 0.1;
  else if (age < 100) base = 0.25;
  else base = 0.5;

  if (health <= 0) base += 0.35;
  else if (health < 15) base += 0.12;
  else if (health < 30) base += 0.04;

  return Math.min(base, 0.95);
}

// ---------- relatives ----------

// A tiny background rate for anyone under 18 (accidents, rare illness). Kept
// as a constant so it can be tuned or set to 0.
export const MINOR_DEATH_RATE = 0.0002;

export type ConditionDef = {
  key: string;
  label: string; // "cancer", "high blood pressure"
  minAge: number;
  chance: number; // yearly onset chance once past minAge
  mortality: number; // multiplier on their yearly death chance
  healthHit: number; // one-off health drop on diagnosis
  severe?: boolean; // triggers a "diagnosed" decision for someone close
  treatCost?: number; // what treating it costs if you pay
  cause: string; // "died of ..." when it's the cause
};

export const CONDITIONS: ConditionDef[] = [
  { key: "hypertension", label: "high blood pressure", minAge: 40, chance: 0.02, mortality: 1.15, healthHit: 4, cause: "a stroke" },
  { key: "diabetes", label: "diabetes", minAge: 35, chance: 0.015, mortality: 1.5, healthHit: 6, cause: "complications of diabetes" },
  { key: "cancer", label: "cancer", minAge: 40, chance: 0.010, mortality: 3.5, healthHit: 25, severe: true, treatCost: 6000, cause: "cancer" },
  { key: "heart disease", label: "heart disease", minAge: 50, chance: 0.011, mortality: 3, healthHit: 20, severe: true, treatCost: 4500, cause: "heart disease" },
  { key: "stroke", label: "a stroke", minAge: 55, chance: 0.007, mortality: 3, healthHit: 22, severe: true, treatCost: 3000, cause: "a stroke" },
  { key: "copd", label: "COPD", minAge: 55, chance: 0.008, mortality: 2, healthHit: 12, cause: "lung disease" },
  { key: "kidney disease", label: "kidney disease", minAge: 50, chance: 0.007, mortality: 2, healthHit: 12, cause: "kidney failure" },
  { key: "arthritis", label: "arthritis", minAge: 55, chance: 0.03, mortality: 1, healthHit: 3, cause: "old age" },
  { key: "dementia", label: "dementia", minAge: 70, chance: 0.03, mortality: 2, healthHit: 8, severe: true, treatCost: 2500, cause: "complications of dementia" },
  { key: "depression", label: "depression", minAge: 14, chance: 0.012, mortality: 1.1, healthHit: 2, cause: "an illness" },
];

export const conditionDef = (key: string) => CONDITIONS.find((c) => c.key === key);

// The yearly death chance of somebody in your life. Same shape as your own
// (deathChance) but a bit gentler, pushed up by their conditions and down by
// treatment; a pandemic hits the elderly harder.
export function relativeDeathChance(
  age: number,
  health: number,
  conditions: string[],
  treated: boolean,
  pandemic: boolean,
): number {
  if (age < 18) return MINOR_DEATH_RATE;
  let p = deathChance(age, health) * 0.6;
  let mult = 1;
  for (const key of conditions) mult *= conditionDef(key)?.mortality ?? 1;
  if (treated) mult = Math.max(1, mult * 0.55);
  if (pandemic && age >= 60) mult *= 1.8;
  p *= Math.min(mult, 8);
  return Math.min(p, 0.9);
}

export function causeOfDeathFor(age: number, conditions: string[]): string {
  const worst = conditions
    .map(conditionDef)
    .filter((d): d is ConditionDef => !!d && d.mortality > 1.4)
    .sort((a, b) => b.mortality - a.mortality)[0];
  if (worst) return worst.cause;
  if (age >= 80) return "old age";
  if (age < 50 && Math.random() < 0.3) return "an accident";
  return age >= 65 ? "natural causes" : "an illness";
}
