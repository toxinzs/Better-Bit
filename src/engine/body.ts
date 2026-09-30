import { Character, Diet, Routine } from "../types";
import { changeStat } from "./stats";
import { clamp } from "./util";
import { livingIndex, priceIndex, inflation } from "./where";
import { rngFrom } from "../data/companies";
import { getRegion } from "../data/regions";

// Your body: what you eat, how you move, and where that leaves you. Hidden BMI
// drifts with both; fitness, health, looks and the odds of falling ill follow.

export type DietDef = { key: Diet; label: string; icon: string; cost: number; blurb: string; bmi: number; health: number };
export type RoutineDef = { key: Routine; label: string; icon: string; cost: number; blurb: string; bmi: number; fitness: number; injury: number };

export const DIETS: DietDef[] = [
  { key: "junk", label: "Whatever's quick", icon: "fast-food", cost: -400, blurb: "Takeaways and snacks. Cheap and cheerful, until it isn't.", bmi: 1.4, health: -1 },
  { key: "normal", label: "Ordinary eating", icon: "restaurant", cost: 0, blurb: "A bit of everything, in no particular order.", bmi: 0.15, health: 0 },
  { key: "healthy", label: "Healthy", icon: "nutrition", cost: 900, blurb: "Fresh food, cooked at home, mostly vegetables.", bmi: -0.35, health: 1 },
  { key: "strict", label: "Strict plan", icon: "leaf", cost: 1800, blurb: "Tracked, measured, meal-prepped. It works, and it takes over.", bmi: -0.9, health: 1 },
];

export const ROUTINES: RoutineDef[] = [
  { key: "none", label: "No routine", icon: "bed", cost: 0, blurb: "You move when you have to.", bmi: 0.3, fitness: 0, injury: 0 },
  { key: "light", label: "Light: walks and stretching", icon: "walk", cost: 0, blurb: "A daily walk and the odd stretch.", bmi: -0.1, fitness: 2, injury: 0.01 },
  { key: "regular", label: "Regular: gym or classes", icon: "barbell", cost: 480, blurb: "Three sessions a week. A membership and a bag in the hall.", bmi: -0.5, fitness: 5, injury: 0.03 },
  { key: "intense", label: "Intense: training hard", icon: "flame", cost: 1400, blurb: "Coach, programme, protein. Serious gains and serious strain.", bmi: -0.9, fitness: 9, injury: 0.08 },
];

export const dietDef = (k?: Diet) => DIETS.find((d) => d.key === k) ?? DIETS[1];
export const routineDef = (k?: Routine) => ROUTINES.find((r) => r.key === k) ?? ROUTINES[0];

export function bmiWord(b: number): string {
  return b < 18.5 ? "Underweight" : b < 25 ? "Healthy weight" : b < 30 ? "Overweight" : b < 35 ? "Obese" : "Severely obese";
}

export function ensureBody(c: Character): void {
  c.routine ??= c.age < 18 ? "light" : "none";
  c.diet ??= "normal";
  if (c.bmi === undefined) {
    const build = c.appearance?.build ?? "average";
    const base = build === "slim" ? 20.5 : build === "stocky" ? 27 : build === "athletic" ? 23.5 : 23;
    const rng = rngFrom((c.avatarSeed ?? 1) + 555);
    const growth = c.age < 18 ? -Math.max(0, 18 - c.age) * 0.25 : Math.min(3, (c.age - 18) * 0.08);
    c.bmi = clamp(base + (rng() - 0.5) * 3 + growth + ((c.fitness ?? 50) < 30 ? 2 : 0), 14, 45);
  }
}

// how many times more likely a condition is because of your body
export function bodyRisk(c: Character, key: string): number {
  const b = c.bmi ?? 23;
  if (key === "diabetes") return b >= 35 ? 3 : b >= 30 ? 2.2 : b >= 27 ? 1.4 : 1;
  if (key === "hypertension" || key === "stroke") return b >= 35 ? 2.4 : b >= 30 ? 1.8 : b >= 27 ? 1.25 : 1;
  if (key === "heart disease") return (b >= 30 ? 1.6 : 1) * ((c.fitness ?? 50) < 30 ? 1.3 : 1);
  if (key === "back pain" || key === "arthritis") return b >= 30 ? 1.6 : b >= 27 ? 1.2 : 1;
  if (key === "injury") return c.routine === "intense" ? 1.4 : 1;
  return 1;
}

// ---------- the yearly tick ----------

export function tickBody(c: Character): void {
  ensureBody(c);
  if (c.inJail) return;
  const diet = dietDef(c.diet);
  const routine = routineDef(c.routine);
  const idx = livingIndex(c.originRegion) * inflation(c);
  if (c.age >= 12) {
    const cost = Math.round((diet.cost + routine.cost) * idx);
    // a strict diet or a coach only costs what you actually pay; junk food saves a little
    if (c.age >= 18) c.money -= cost; // junk food saves a little; the rest costs
  }
  // a routine you can't afford lapses
  if (c.age >= 18 && c.money < 0 && (routine.cost > 0 || diet.cost > 900)) {
    if (c.routine === "regular" || c.routine === "intense") c.routine = "light";
    if (c.diet === "strict") c.diet = "healthy";
    c.yearLog.push("Money got tight, so the gym and the meal plan had to go.");
  }
  const stress = c.stress ?? 25;
  let d = diet.bmi + routine.bmi + (c.age > 30 ? 0.12 : 0) + (stress > 70 ? 0.3 : 0) + (Math.random() - 0.5) * 0.8;
  if (c.age < 18) d = d * 0.4 + 0.2; // kids grow rather than gain
  // a body drifts back towards where it's comfortable
  d += ((23.5 - (c.bmi ?? 23)) * 0.06);
  if ((c.bmi ?? 23) < 21) d += (21 - (c.bmi ?? 23)) * 0.15; // a lean body resists losing more
  c.bmi = clamp((c.bmi ?? 23) + d, 15.5, 46);
  const fit = routine.fitness;
  // fitness fades towards a lazy baseline unless you keep it up
  const cur = c.fitness ?? 50;
  c.fitness = clamp(cur + fit - Math.max(0, (cur - 35) * 0.18));
  if (diet.health) changeStat(c, "health", diet.health, `${diet.label} eating`);
  const b = c.bmi;
  if (b >= 30) {
    changeStat(c, "health", -Math.round((b - 28) / 4), "Carrying extra weight");
    if (Math.random() < 0.4) changeStat(c, "looks", -1, "Carrying extra weight");
  } else if (b < 17.5 && c.age >= 14) {
    changeStat(c, "health", -2, "Being underweight");
  }
  if (c.age >= 12 && routine.injury > 0 && Math.random() < routine.injury * bodyRisk(c, "injury") && !(c.conditions ?? []).some((x) => x.key === "injury")) {
    (c.conditions ??= []).push({ key: "injury", since: c.age });
    changeStat(c, "health", -8, "A training injury");
    const bill = Math.round(1200 * priceIndex(c.originRegion) * (getRegion(c.originRegion).healthcare === "public" ? 0.15 : 0.6));
    c.money = Math.max(0, c.money - bill);
    c.yearLog.push(`You hurt yourself training. The physio and scans cost $${bill.toLocaleString()}.`);
  }
  if (routine.key === "intense" && Math.random() < 0.25) changeStat(c, "happiness", 1, "Feeling strong");
}

// ---------- actions ----------

export function setDiet(c: Character, d: Diet): void {
  ensureBody(c);
  c.diet = d;
  c.yearLog.push(`You changed your eating: ${dietDef(d).label.toLowerCase()}.`);
}

export function setRoutine(c: Character, r: Routine): void {
  ensureBody(c);
  c.routine = r;
  c.yearLog.push(`You changed your exercise: ${routineDef(r).label.toLowerCase()}.`);
}

export function checkupCost(c: Character): number {
  const region = getRegion(c.originRegion);
  const share = region.healthcare === "public" ? 0.1 : c.insured ? 0.25 : 1;
  return Math.round(220 * priceIndex(c.originRegion) * share);
}

export function checkup(c: Character): boolean {
  if (c.checkupAge === c.age || c.money < checkupCost(c)) return false;
  c.money -= checkupCost(c);
  c.checkupAge = c.age;
  const hidden = (c.conditions ?? []).find((x) => !x.treated && !["flu", "injury", "infection"].includes(x.key));
  if (hidden && Math.random() < 0.5) {
    hidden.treated = true;
    changeStat(c, "health", 3, "Caught early");
    c.yearLog.push(`Your check-up caught your ${hidden.key} early. Treatment started straight away.`);
  } else {
    changeStat(c, "health", 2, "A clean check-up");
    c.stress = clamp((c.stress ?? 25) - 4);
    c.yearLog.push("You had a full check-up. Everything looked fine, and you feel better for knowing.");
  }
  return true;
}
