import { Character, LifeEvent, PlayerCondition, WorldState } from "../types";
import { finishDecision, queueDecision, registerDecision } from "./decisionQueue";
import { getRegion } from "../data/regions";
import { CONDITIONS, ConditionDef, conditionDef } from "./mortality";
import { hasActiveCondition } from "./worldState";
import { changeStat } from "./stats";
import { traitMod } from "./character";
import { clamp, randomInt } from "./util";
import { ageOf } from "./people";

// Your body and your head. Conditions can start, be treated, or wear you down;
// stress and fitness (hidden) feed happiness, health and looks every year.

// ---------- conditions ----------

export type PlayerConditionDef = ConditionDef & {
  acute?: boolean; // clears itself within a year (treatment softens it)
  bill?: number; // an automatic hospital bill when it strikes (US-baseline dollars)
};

const EXTRA: PlayerConditionDef[] = [
  { key: "flu", label: "a bad flu", minAge: 0, chance: 0.1, mortality: 1, healthHit: 4, acute: true, cause: "an illness", treatCost: 120 },
  { key: "injury", label: "a serious injury", minAge: 4, chance: 0.05, mortality: 1, healthHit: 12, acute: true, cause: "an accident", treatCost: 800, bill: 2500 },
  { key: "infection", label: "a nasty infection", minAge: 0, chance: 0.04, mortality: 1.05, healthHit: 8, acute: true, cause: "an infection", treatCost: 300 },
  { key: "asthma", label: "asthma", minAge: 2, chance: 0.012, mortality: 1.1, healthHit: 3, cause: "an illness", treatCost: 400 },
  { key: "anxiety", label: "an anxiety disorder", minAge: 12, chance: 0.014, mortality: 1.05, healthHit: 2, cause: "an illness", treatCost: 500 },
  { key: "back pain", label: "chronic back pain", minAge: 30, chance: 0.02, mortality: 1, healthHit: 3, cause: "old age", treatCost: 600 },
];

// depression and the mortality list come from mortality.ts; treatCost added where missing
export const PLAYER_CONDITIONS: PlayerConditionDef[] = [
  ...CONDITIONS.map((d) => ({ ...d, treatCost: d.treatCost ?? (d.key === "depression" ? 500 : d.key === "hypertension" ? 400 : d.key === "diabetes" ? 900 : d.key === "copd" ? 1500 : d.key === "kidney disease" ? 2500 : 600) })),
  ...EXTRA,
];
export const playerConditionDef = (key: string) => PLAYER_CONDITIONS.find((d) => d.key === key) ?? conditionDef(key);

export const hasCondition = (c: Character, key: string) => !!c.conditions?.some((x) => x.key === key);

// ---------- who pays ----------

// the price level of the country you live in, relative to the US baseline
export function priceLevel(c: Character): number {
  const tier = getRegion(c.originRegion).costOfLivingTier;
  return tier === "low" ? 0.35 : tier === "high" ? 1.1 : 1;
}

export function hasCover(c: Character): boolean {
  const model = getRegion(c.originRegion).healthcare;
  if (model === "public") return true;
  if (c.age < 18) return true; // your parents cover you
  if (c.job && !c.inJail) return true; // employer plan
  return !!c.insured;
}

export function insurancePremium(c: Character): number {
  return Math.round(900 * priceLevel(c));
}

// the share of a medical bill you actually pay
export function copayShare(c: Character): number {
  const model = getRegion(c.originRegion).healthcare;
  if (model === "public") return 0.05;
  if (model === "mixed") return 0.3;
  return hasCover(c) ? 0.2 : 1;
}

/** what a US-baseline bill comes to for you, in your country, with your cover */
export function medicalBill(c: Character, baseline: number): number {
  return Math.round(baseline * priceLevel(c) * copayShare(c));
}

export function coverageLine(c: Character): string {
  const model = getRegion(c.originRegion).healthcare;
  if (model === "public") return "Covered by the public health system - small copays.";
  if (model === "mixed") return "Public system plus a share you pay - about 30% of each bill.";
  if (c.age < 18) return "Covered by your parents' plan.";
  if (c.job) return "Covered by your employer's plan - you pay about 20%.";
  return c.insured ? "You have private insurance - you pay about 20%." : "You're uninsured - you pay the full price of care.";
}

// ---------- treating things ----------

export function treatmentCost(c: Character, key: string): number {
  return medicalBill(c, playerConditionDef(key)?.treatCost ?? 300);
}

export function treatCondition(c: Character, key: string): void {
  const cond = c.conditions?.find((x) => x.key === key);
  const def = playerConditionDef(key);
  if (!cond || !def) return;
  if (cond.treated) return;
  const cost = treatmentCost(c, key);
  if (c.money < cost) {
    c.yearLog.push(`You couldn't afford treatment for ${def.label} ($${cost.toLocaleString()}).`);
    return;
  }
  c.money -= cost;
  const acute = (def as PlayerConditionDef).acute;
  const cured = acute || (key === "depression" || key === "anxiety" ? Math.random() < 0.5 : false);
  if (cured) {
    c.conditions = (c.conditions ?? []).filter((x) => x.key !== key);
    changeStat(c, "health", Math.ceil(def.healthHit / 2), "Treatment");
    c.yearLog.push(`You got treated for ${def.label} and recovered. -$${cost.toLocaleString()}`);
  } else {
    cond.treated = true;
    changeStat(c, "health", Math.max(3, Math.round(def.healthHit * 0.4)), "Treatment");
    c.yearLog.push(`You started treatment for ${def.label}. It's under control. -$${cost.toLocaleString()}`);
  }
}

export function buyInsurance(c: Character): void {
  if (c.insured) {
    c.insured = false;
    c.yearLog.push("You dropped your private health insurance.");
    return;
  }
  const cost = insurancePremium(c);
  if (c.money < cost) {
    c.yearLog.push(`You couldn't afford insurance ($${cost.toLocaleString()}/yr).`);
    return;
  }
  c.insured = true;
  c.yearLog.push(`You took out private health insurance. It costs $${cost.toLocaleString()} a year.`);
}

export function conditionMortality(c: Character): number {
  let mult = 1;
  for (const cond of c.conditions ?? []) {
    let m = playerConditionDef(cond.key)?.mortality ?? 1;
    if (cond.treated) m = Math.max(1, m * 0.55);
    mult *= m;
  }
  // softened: the death table is already tuned for a whole life, conditions push it up, not through the roof
  return Math.min(1 + (mult - 1) * 0.6, 5);
}

export function causeFromConditions(c: Character): string | undefined {
  const worst = (c.conditions ?? [])
    .map((x) => playerConditionDef(x.key))
    .filter((d): d is ConditionDef => !!d && d.mortality > 1.4)
    .sort((a, b) => b.mortality - a.mortality)[0];
  return worst?.cause;
}

// ---------- the yearly tick ----------

export function tickHealth(c: Character, world: WorldState): void {
  c.conditions ??= [];
  const stress = c.stress ?? 25;
  const fitness = c.fitness ?? 50;
  const pandemic = hasActiveCondition(world, "pandemic");

  // what's already wrong with you
  const next: PlayerCondition[] = [];
  for (const cond of c.conditions) {
    const def = playerConditionDef(cond.key);
    if (!def) continue;
    if ((def as PlayerConditionDef).acute) {
      // acute things clear up within the year, and most of the damage heals with them
      if (cond.since < c.age) {
        changeStat(c, "health", Math.round(def.healthHit * (c.age < 55 ? 0.6 : 0.3)), `Recovered from ${def.label}`);
        continue;
      }
    } else if ((cond.key === "depression" || cond.key === "anxiety") && !cond.treated && Math.random() < (cond.key === "depression" ? 0.2 : 0.12)) {
      // untreated, it lifts on its own more often than not, given time
      c.yearLog.push(`Slowly, the worst of your ${cond.key} has lifted.`);
      continue;
    } else if (cond.key === "depression") {
      changeStat(c, "happiness", cond.treated ? -2 : -6, "Depression");
      c.stress = clamp((c.stress ?? 25) + (cond.treated ? 2 : 6));
    } else if (cond.key === "anxiety") {
      c.stress = clamp((c.stress ?? 25) + (cond.treated ? 3 : 9));
      c.sanity = clamp((c.sanity ?? 75) - (cond.treated ? 0 : 1));
    } else if (Math.random() < 0.7) {
      changeStat(c, "health", -(cond.treated ? 0.3 : def.healthHit / 10), `Living with ${def.label}`);
    }
    next.push(cond);
  }
  c.conditions = next;

  // what might start
  for (const def of PLAYER_CONDITIONS as PlayerConditionDef[]) {
    if (c.age < def.minAge || hasCondition(c, def.key)) continue;
    let chance = def.chance;
    if (c.age >= 60) chance *= 1.4;
    // stressed, unfit and run-down people get ill more often (capped so it can't snowball)
    chance *= Math.min(2.2, (1 + Math.max(0, stress - 50) / 60) * (1 + (50 - fitness) / 150) * (1 + Math.max(0, 55 - c.stats.health) / 120));
    if (!(def as PlayerConditionDef).acute && def.key !== "depression" && def.key !== "anxiety") chance *= 0.7;
    if (def.key === "flu" && pandemic) chance *= 2.5;
    if (def.key === "depression" || def.key === "anxiety") chance *= 1 + Math.max(0, traitMod(c, "n")) * 0.8 + (c.stats.happiness < 35 ? 1 : 0);
    if (def.key === "injury" && (c.quirks?.includes("risk-taker") || (c.talents?.athletic ?? 50) > 75)) chance *= 1.5;
    if (def.key === "asthma" && c.age > 12) chance *= 0.3; // mostly a childhood thing
    if (Math.random() >= Math.min(chance, 0.6)) continue;
    c.conditions.push({ key: def.key, since: c.age });
    changeStat(c, "health", -def.healthHit, `Diagnosed with ${def.label}`);
    let line = `You came down with ${def.label}.`;
    if (def.bill) {
      const bill = medicalBill(c, def.bill);
      c.money = Math.max(0, c.money - bill);
      line = `You were rushed to hospital with ${def.label}. The bill: $${bill.toLocaleString()}.`;
    } else if (def.severe) {
      line = `You were diagnosed with ${def.label}.`;
      queueDecision(c, { kind: "diagnosis", data: { cond: def.key } });
    } else if (!(def as PlayerConditionDef).acute) {
      line = `You were diagnosed with ${def.label}. See a doctor about it.`;
    }
    c.yearLog.push(line);
    c.fullLog.push({ age: c.age, text: line });
  }

  // premium for private cover
  if (c.insured && getRegion(c.originRegion).healthcare !== "public" && c.age >= 18 && !c.job) {
    const premium = insurancePremium(c);
    if (c.money >= premium) c.money -= premium;
    else {
      c.insured = false;
      c.yearLog.push("You couldn't keep up your insurance payments, so it lapsed.");
    }
  }
}

// a serious diagnosis is a real decision, not a log line
registerDecision("diagnosis", (c, _world, d) => {
  const key = String(d.data?.cond);
  const def = playerConditionDef(key);
  const cond = c.conditions?.find((x) => x.key === key);
  if (!def || !cond || cond.treated) return null;
  const cost = treatmentCost(c, key);
  const afford = c.money >= cost;
  return {
    id: `diagnosis-${d.id}`,
    minAge: 0,
    maxAge: 200,
    text: () => `The tests are back. You have ${def.label}. Your doctor lays out the options plainly - treatment works better the sooner it starts.`,
    choices: [
      {
        label: "Start treatment",
        sublabel: afford ? `$${cost.toLocaleString()}` : `$${cost.toLocaleString()} - you can't afford it`,
        disabled: !afford,
        effect: (cc) => {
          finishDecision(cc, d.id);
          treatCondition(cc, key);
        },
        resultText: () => "You start treatment. It's frightening, but you're not facing it alone.",
      },
      {
        label: "Decline treatment",
        tone: "danger",
        effect: (cc) => {
          finishDecision(cc, d.id);
          changeStat(cc, "happiness", -4, "A hard diagnosis");
        },
        resultText: () => "You decide to leave it. It's your body, your call - but it won't wait forever.",
      },
    ],
  } as LifeEvent;
});

// ---------- stress, fitness and what they do ----------

const debtOf = (c: Character) => (c.loans ?? []).reduce((s, l) => s + l.balance, 0);

export function stressWord(s: number): string {
  return s >= 80 ? "Overwhelmed" : s >= 60 ? "Tense" : s >= 35 ? "Manageable" : "Calm";
}
export function fitnessWord(f: number): string {
  return f >= 80 ? "Athletic" : f >= 60 ? "Fit" : f >= 40 ? "Average" : f >= 20 ? "Out of shape" : "Sedentary";
}

export function tickWellbeing(c: Character, world: WorldState): void {
  const inSchool = c.age >= 6 && c.age <= 22 && !c.job;
  let t = 20;
  if (inSchool) t += 14 + (c.quirks?.includes("perfectionist") ? 8 : 0) + (c.age >= 15 ? 8 : 0);
  // a job is pressure, and a high-paying one more so
  if (c.job) t += 26 + Math.min(10, c.job.salary / 15000);
  if (c.age >= 18) {
    const debt = debtOf(c);
    if (debt > 0) t += Math.min(22, debt / 2500);
    if (c.money < 200) t += 14;
    else if (c.money < 1000) t += 6;
  }
  if ((c.griefYears ?? 0) > 0) t += 12;
  if (c.inJail) t += 25;
  if (c.pregnancy) t += 5;
  const smallKids = c.relationships.filter((r) => r.type === "child" && r.alive && ageOf(c, r) < 6).length;
  t += Math.min(15, smallKids * 6);
  if (hasActiveCondition(world, "recession") && c.age >= 18) t += 6;
  if (hasActiveCondition(world, "war")) t += 6;
  // what steadies you
  const partner = c.relationships.find((r) => r.type === "partner" && r.alive);
  if (partner) t -= Math.min(8, partner.level / 12);
  const close = c.relationships.filter((r) => r.alive && (r.type === "friend" || r.type === "mother" || r.type === "father") && r.level >= 60).length;
  t -= Math.min(6, close * 1.5);
  t -= ((c.fitness ?? 50) - 50) / 6;
  if (c.stats.happiness > 70) t -= 3;
  t += traitMod(c, "n") * 10;
  t = clamp(t);
  c.stress = Math.round((c.stress ?? 25) + (t - (c.stress ?? 25)) * 0.5);

  // fitness slips with age unless you work at it
  const fit0 = c.fitness ?? (c.age < 18 ? 60 : 50);
  c.fitness = clamp(fit0 - (c.age > 50 ? 2 : c.age > 25 ? 1 : 0) + ((c.talents?.athletic ?? 50) > 70 ? 0.5 : 0) + (c.quirks?.includes("fitness-nut") ? 1 : 0));
  const fit = c.fitness;

  // consequences
  const stress = c.stress;
  if (stress >= 70) {
    changeStat(c, "happiness", -Math.round((stress - 60) / 8), "Stress");
    if (Math.random() < 0.55) changeStat(c, "health", -randomInt(1, 3), "Stress");
    c.sanity = clamp((c.sanity ?? 75) - 1);
    c.yearLog.push(stress >= 85 ? "You're stretched to breaking point." : "The pressure is getting to you.");
  } else if (stress < 25) {
    changeStat(c, "happiness", 1, "A calm year");
  }
  const fh = Math.trunc((fit - 50) / 20);
  if (fh !== 0) changeStat(c, "health", fh, fit >= 50 ? "Staying fit" : "Being out of shape");
  if (fit >= 75 && Math.random() < 0.4) changeStat(c, "looks", 1, "Staying fit");
  if (fit < 25 && Math.random() < 0.4) changeStat(c, "looks", -1, "Being out of shape");

  // life gets you down: money worries, being alone, a failing body
  if (c.age >= 18 && c.money < 200 && !c.job) changeStat(c, "happiness", -3, "Money worries");
  const socialCount = c.relationships.filter((r) => r.alive && (r.type === "friend" || r.type === "partner") && r.level >= 40).length;
  if (c.age >= 14 && socialCount === 0) changeStat(c, "happiness", -2, "Loneliness");
  if (c.stats.health < 35) changeStat(c, "happiness", -3, "Poor health");
  // the glow of a great year fades - very high happiness slides back toward a normal high
  if (c.stats.happiness > 80) changeStat(c, "happiness", -randomInt(2, 5), "Things settle down");
  // years show
  if (c.age > 40 && Math.random() < 0.6) changeStat(c, "looks", -1, "Getting older");
  if (c.age > 60 && Math.random() < 0.5) changeStat(c, "looks", -1, "Getting older");
}

// showing up sick: pay takes a hit, and a body that can't cope can cost a job
export function attendanceFactor(c: Character): number {
  const h = c.stats.health;
  return h < 20 ? 0.75 : h < 35 ? 0.88 : 1;
}

// ---------- fitness sources (called by activities) ----------

export function gainFitness(c: Character, n: number): void {
  c.fitness = clamp((c.fitness ?? 50) + n);
}
export function easeStress(c: Character, n: number): void {
  c.stress = clamp((c.stress ?? 25) - n);
}
