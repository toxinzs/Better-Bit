import { Character, Job, WorldState } from "../types";
import { BONUS_FIELDS, FIELD_TALENT, MIN_YEARS, RUNG_MULT, titleAt } from "../data/careers";
import { WELFARE } from "../data/economy";
import { changeStat } from "./stats";
import { clamp, randomInt } from "./util";
import { effectiveSalary, hasActiveCondition } from "./worldState";
import { cityWage, livingIndex } from "./where";
import { refreshCoworkers } from "./people";
import { addictionPerfPenalty } from "./addiction";
import type { Requirement } from "./jobs";

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;
const hasDegree = (c: Character) => c.hasCollegeDegree || (c.degrees ?? []).length > 0;

// ------------------------------------------------------------------ roles

// a fresh role: where on the ladder you're hired depends on how long you've
// worked in the field
export function startRole(job: Job, c: Character): Job {
  if (job.kind !== "fulltime") return job;
  const years = (c.fieldYears ?? {})[job.field ?? ""] ?? 0;
  const rung = years >= 10 ? 2 : years >= 5 ? 1 : 0;
  const base = job.title;
  const out: Job = { ...job, baseTitle: base, rung, perf: 55, rapport: 50, since: c.age, pip: false };
  if (rung > 0) {
    out.title = titleAt(base, job.field, rung);
    out.salary = Math.round(job.salary * RUNG_MULT[rung]);
  }
  return out;
}

// old saves: a job with none of the career fields gets sensible ones
export function ensureRole(c: Character): Job | null {
  const j = c.job;
  if (!j) return null;
  if (j.kind === "parttime") return j;
  if (j.perf === undefined) {
    const from = (c.jobHistory ?? []).slice().reverse().find((h) => h.to === -1)?.from ?? c.age - 1;
    j.baseTitle ??= j.title;
    j.rung ??= 0;
    j.perf = 55;
    j.rapport ??= 50;
    j.since ??= from;
  }
  return j;
}

export const tenure = (c: Character): number => {
  const open = (c.jobHistory ?? []).slice().reverse().find((h) => h.to === -1);
  return Math.max(0, c.age - (open?.from ?? c.age));
};

export const yearsInRole = (c: Character): number => Math.max(0, c.age - (c.job?.since ?? c.age));

export function maxRung(c: Character, job: Job): number {
  if (job.company?.size === "Small business") return 3;
  return job.requiresCollege || job.needsMajor || hasDegree(c) ? 5 : 4;
}

export const salaryNow = (c: Character, world: WorldState, job: Job | null | undefined = c.job): number => (job ? effectiveSalary(job, world, c.originRegion, cityWage(c)) : 0);

// ------------------------------------------------------------------ performance

export type PerfFactor = { label: string; delta: number };

export function perfFactors(c: Character): PerfFactor[] {
  const j = c.job;
  if (!j) return [];
  const field = j.field ?? "";
  const talent = c.talents?.[FIELD_TALENT[field] ?? "business"] ?? 50;
  const f: PerfFactor[] = [];
  const add = (label: string, delta: number) => { if (Math.abs(delta) >= 0.5) f.push({ label, delta: Math.round(delta) }); };
  add("Smarts", (c.stats.smarts - 50) * 0.22);
  add(`Aptitude for ${field.toLowerCase() || "this work"}`, (talent - 50) * 0.2);
  add("Conscientiousness", ((c.personality?.c ?? 50) - 50) * 0.25);
  add("Experience in the field", Math.min(10, ((c.fieldYears ?? {})[field] ?? 0) * 1.5));
  add("Your boss and team", ((j.rapport ?? 50) - 50) * 0.15);
  if (c.workMode === "coast") add("Coasting", -10);
  if (c.workMode === "grind") add("Putting in the hours", 12);
  if (c.stats.health < 40) add("Poor health", -(40 - c.stats.health) * 0.3);
  if ((c.stress ?? 25) > 60) add("Stress", -((c.stress ?? 25) - 60) * 0.3);
  add("Mood", (c.stats.happiness - 50) * 0.08);
  if (c.courseBoost) add("Recent training", c.courseBoost);
  const drag = addictionPerfPenalty(c);
  if (drag > 0) add("Substance use", -Math.min(20, drag));
  if (j.minSkill) add("Skill for the job", Math.max(-6, Math.min(6, ((c.skills?.[j.minSkill.skill] ?? 0) - j.minSkill.level) / 8)));
  return f;
}

export const perfTarget = (c: Character): number => clamp(50 + perfFactors(c).reduce((s, x) => s + x.delta, 0));

export function verdictFor(perf: number): string {
  return perf >= 85 ? "Outstanding" : perf >= 70 ? "Exceeds expectations" : perf >= 55 ? "Meets expectations" : perf >= 40 ? "Needs improvement" : "Unsatisfactory";
}

// ------------------------------------------------------------------ promotion

export type PromoCheck = { canRise: boolean; next?: string; nextSalary?: number; reqs: Requirement[]; eligible: boolean };

export function promoCheck(c: Character, world: WorldState): PromoCheck {
  const j = ensureRole(c);
  if (!j || j.kind !== "fulltime") return { canRise: false, reqs: [], eligible: false };
  const rung = j.rung ?? 0;
  const top = maxRung(c, j);
  if (rung >= top) return { canRise: false, reqs: [{ label: rung >= 5 ? "You're at the top of the ladder" : "You've gone as far as this employer goes", met: true }], eligible: false };
  const need = MIN_YEARS[rung] ?? 3;
  const reqs: Requirement[] = [
    { label: `${need}+ years in this role`, met: yearsInRole(c) >= need, note: `${yearsInRole(c)} so far` },
    { label: "Performance 72+", met: (j.perf ?? 0) >= 72, note: `${Math.round(j.perf ?? 0)} now` },
  ];
  if (rung + 1 >= 3) reqs.push({ label: "A degree, or 10+ years in the field", met: hasDegree(c) || ((c.fieldYears ?? {})[j.field ?? ""] ?? 0) >= 10 });
  const next = titleAt(j.baseTitle ?? j.title, j.field, rung + 1);
  const nextSalary = salaryNow(c, world, { ...j, salary: Math.round(j.salary * RUNG_MULT[rung + 1] / RUNG_MULT[rung]) });
  return { canRise: true, next, nextSalary, reqs, eligible: reqs.every((r) => r.met) };
}

function promote(c: Character): void {
  const j = c.job!;
  const rung = j.rung ?? 0;
  const oldTitle = j.title;
  j.salary = Math.round(j.salary * RUNG_MULT[rung + 1] / RUNG_MULT[rung]);
  j.rung = rung + 1;
  j.title = titleAt(j.baseTitle ?? j.title, j.field, j.rung);
  j.since = c.age;
  j.perf = Math.max(45, (j.perf ?? 60) - 8);
  c.promotions = (c.promotions ?? 0) + 1;
  c.stress = clamp((c.stress ?? 25) + 6);
  changeStat(c, "happiness", 6, "A promotion");
  const h = (c.jobHistory ?? []).slice().reverse().find((x) => x.to === -1);
  if (h) h.title = j.title;
  c.yearLog.push(`Promoted! You went from ${oldTitle} to ${j.title}.`);
  c.fullLog.push({ age: c.age, text: `You were promoted to ${j.title}.` });
}

// ------------------------------------------------------------------ losing work

export function loseJob(c: Character, cause: "laidoff" | "fired", world?: WorldState): void {
  const j = c.job;
  if (!j) return;
  const W = WELFARE[c.originRegion ?? "us"];
  const years = tenure(c);
  const weeks = Math.min(52, W.severanceWeeks * years);
  const gross = world ? salaryNow(c, world, j) : 0;
  let sev = Math.round((gross * weeks) / 52);
  if (cause === "fired") sev = Math.round(sev * 0.25);
  c.job = null;
  if (sev > 0) {
    c.money += sev;
    c.yearLog.push(`${cause === "laidoff" ? "Your redundancy" : "Your final pay"} came to ${money(sev)}.`);
  }
  c.unemp = { since: c.age, lastSalary: j.salary, yearsLeft: cause === "laidoff" ? W.unemployYears : 0, cause };
  if (cause === "fired") c.firedAge = c.age;
  changeStat(c, "happiness", cause === "fired" ? -12 : -9, cause === "fired" ? "Losing your job" : "Being laid off");
  c.stress = clamp((c.stress ?? 25) + 8);
  refreshCoworkers(c);
}

// ------------------------------------------------------------------ retirement

export const retireAge = (c: Character): number => WELFARE[c.originRegion ?? "us"].retireAge;

export function pensionIncome(c: Character, world: WorldState): number {
  const W = WELFARE[c.originRegion ?? "us"];
  if (!c.retired && c.age < retireAge(c)) return 0;
  if (c.age < retireAge(c)) return 0;
  const best = c.peakSalary ?? 0;
  if (best <= 0) return Math.round(W.pension * 12000 * livingIndex(c.originRegion) * 0.6);
  const share = clamp((c.workYears ?? 0) / 35, 0.25, 1);
  return Math.round(effectiveSalary({ salary: best } as Job, world, c.originRegion, cityWage(c)) * W.pension * share);
}

export function canRetire(c: Character): boolean {
  return c.age >= 55 && !c.retired;
}

export function retire(c: Character): boolean {
  if (!canRetire(c)) return false;
  for (const slot of ["job", "partTime"] as const) {
    const j = c[slot];
    if (j) c.yearLog.push(`You left your job as a ${j.title}.`);
    c[slot] = null;
  }
  c.retired = true;
  c.unemp = null;
  changeStat(c, "happiness", 8, "Retirement");
  c.yearLog.push(`You retired.${c.age < retireAge(c) ? ` Your state pension starts at ${retireAge(c)}.` : ""}`);
  refreshCoworkers(c);
  return true;
}

// ------------------------------------------------------------------ actions

export function setWorkMode(c: Character, mode: "coast" | "steady" | "grind"): void {
  c.workMode = mode;
}

export function askForRaise(c: Character, world: WorldState): boolean {
  const j = ensureRole(c);
  if (!j || j.kind !== "fulltime" || c.raiseAsked === c.age) return false;
  c.raiseAsked = c.age;
  const p = clamp(0.12 + ((j.perf ?? 50) - 55) / 90 + (j.rapport ?? 50) / 400 + ((c.talents?.verbal ?? 50) - 50) / 400 + (c.network ?? 0) / 600, 0.03, 0.75) * (hasActiveCondition(world, "recession") ? 0.5 : 1);
  if (Math.random() < p) {
    const pct = randomInt(3, 7);
    j.salary = Math.round(j.salary * (1 + pct / 100));
    j.rapport = clamp((j.rapport ?? 50) + 3);
    changeStat(c, "happiness", 4, "A raise");
    c.yearLog.push(`You asked for a raise and got ${pct}%. You're on ${money(salaryNow(c, world))} a year now.`);
  } else {
    j.rapport = clamp((j.rapport ?? 50) - 8);
    changeStat(c, "happiness", -3, "A refused raise");
    c.yearLog.push("You asked for a raise. The answer was a polite no, and things are a little cooler at work.");
  }
  return true;
}

export function askForPromotion(c: Character, world: WorldState): boolean {
  const j = ensureRole(c);
  if (!j || j.kind !== "fulltime" || c.promoAsked === c.age) return false;
  const chk = promoCheck(c, world);
  if (!chk.canRise) return false;
  c.promoAsked = c.age;
  const yearsOk = yearsInRole(c) >= (MIN_YEARS[j.rung ?? 0] ?? 3) - 1;
  const p = yearsOk ? clamp(0.1 + ((j.perf ?? 50) - 60) / 70 + (c.network ?? 0) / 400 + (j.rapport ?? 50) / 500, 0.03, 0.7) : 0.03;
  if (Math.random() < p) promote(c);
  else {
    j.rapport = clamp((j.rapport ?? 50) - 6);
    c.yearLog.push("You made your case for a promotion. They said you weren't ready yet.");
    changeStat(c, "happiness", -3, "Passed over");
  }
  return true;
}

export const NETWORK_COST = 400;
export const COURSE_COST = 1800;

export function networkCost(c: Character): number {
  return Math.round(NETWORK_COST * livingIndex(c.originRegion));
}
export function courseCost(c: Character): number {
  return Math.round(COURSE_COST * livingIndex(c.originRegion));
}

export function doNetwork(c: Character): boolean {
  const cost = networkCost(c);
  if (c.age < 18 || c.netAge === c.age || c.money < cost) return false;
  c.netAge = c.age;
  c.money -= cost;
  const gain = randomInt(6, 12) + Math.round(((c.talents?.social ?? 50) - 50) / 12);
  c.network = clamp((c.network ?? 0) + Math.max(3, gain));
  changeStat(c, "happiness", 1, "Meeting people");
  c.yearLog.push(`You went to an industry event and made some useful contacts. -${money(cost)}`);
  return true;
}

export function takeCourse(c: Character): boolean {
  const cost = courseCost(c);
  if (c.age < 18 || c.courseAge === c.age || c.money < cost) return false;
  c.courseAge = c.age;
  c.money -= cost;
  c.courseBoost = 8;
  changeStat(c, "smarts", 1, "Professional training");
  c.stress = clamp((c.stress ?? 25) + 3);
  c.yearLog.push(`You took a professional training course. -${money(cost)}`);
  return true;
}

export function toggleUnion(c: Character): void {
  c.inUnion = !c.inUnion;
  c.yearLog.push(c.inUnion ? "You joined the union. Dues come out of your pay, but you're protected." : "You left the union.");
}

export function takeCoworkerLunch(c: Character): boolean {
  const j = c.job;
  if (!j || c.age < 16) return false;
  j.rapport = clamp((j.rapport ?? 50) + 4);
  return true;
}

// ------------------------------------------------------------------ the yearly tick

export function tickCareer(c: Character, world: WorldState): void {
  c.network = clamp((c.network ?? 0) - 2);
  c.courseBoost = c.courseBoost ? Math.max(0, c.courseBoost - 4) : 0;
  const region = c.originRegion ?? "us";
  const W = WELFARE[region];

  // out of work: benefits, then the job hunt
  if (!c.job) {
    const u = c.unemp;
    if (u && u.yearsLeft > 0 && !c.retired) {
      const pay = Math.round(salaryNow(c, world, { salary: u.lastSalary } as Job) * W.unemployRate);
      if (pay > 0) {
        c.money += pay;
        c.yearLog.push(`Unemployment benefit paid you ${money(pay)}.`);
      }
      u.yearsLeft -= 1;
    }
    if (u && c.age >= 18 && !c.retired) {
      changeStat(c, "happiness", -2, "Being out of work");
      if (c.age - u.since >= 6) c.unemp = null;
    }
  } else if (c.unemp) c.unemp = null;

  // a pension for anyone past retirement age with no job
  if (c.age >= retireAge(c) && !c.job && !c.partTime && !c.business && c.age >= 60) {
    if (!c.retired) c.retired = true;
  }
  if (c.retired && c.age >= retireAge(c)) {
    const pension = pensionIncome(c, world);
    if (pension > 0) {
      c.money += pension;
      c.yearLog.push(`Your ${W.pensionName} paid you ${money(pension)}.`);
    }
  }

  const j = ensureRole(c);
  if (!j || c.inJail) return;
  if (j.kind === "parttime") return;
  const field = j.field ?? "";

  // experience piles up
  const fy = (c.fieldYears ??= {});
  fy[field] = (fy[field] ?? 0) + 1;
  c.peakSalary = Math.max(c.peakSalary ?? 0, j.salary);

  // how did the year go?
  const target = perfTarget(c);
  const perf = clamp((j.perf ?? 55) + (target - (j.perf ?? 55)) * 0.55 + (Math.random() + Math.random() - 1) * 8);
  j.perf = perf;
  j.rapport = clamp((j.rapport ?? 50) + (perf - 55) / 20 + (Math.random() - 0.5) * 4);
  if (c.workMode === "grind") {
    c.stress = clamp((c.stress ?? 25) + 8);
    changeStat(c, "health", -1.5, "Overwork");
    changeStat(c, "happiness", -1, "Long hours");
  } else if (c.workMode === "coast") c.stress = clamp((c.stress ?? 25) - 5);

  if (c.inUnion) {
    const dues = Math.round(salaryNow(c, world, j) * 0.01);
    c.money -= dues;
  }

  const verdict = verdictFor(perf);
  let note = "";
  const gross = salaryNow(c, world, j);
  const recession = hasActiveCondition(world, "recession");
  const boom = hasActiveCondition(world, "boom");
  const raisePct = perf >= 85 ? randomInt(3, 5) : perf >= 70 ? randomInt(2, 3) : perf >= 55 ? randomInt(1, 2) : 0;
  const raise = Math.round(raisePct * (recession ? 0.5 : boom ? 1.2 : 1) + (c.inUnion && raisePct < 2 ? 2 : 0));
  if (raise > 0) {
    j.salary = Math.round(j.salary * (1 + raise / 100));
    note = `${raise}% raise`;
  }
  if (BONUS_FIELDS.includes(field) && perf >= 70 && !recession) {
    const bonus = Math.round(gross * (0.04 + Math.random() * 0.08) * ((perf - 60) / 30));
    if (bonus > 0) {
      c.money += bonus;
      note += `${note ? ", " : ""}${money(bonus)} bonus`;
    }
  }
  j.review = { age: c.age, perf: Math.round(perf), verdict, note };
  c.yearLog.push(`Your annual review: ${verdict.toLowerCase()}${note ? ` - ${note}` : ""}.`);

  // a promotion, if you've earned one
  const promo = promoCheck(c, world);
  if (promo.eligible && Math.random() < 0.5 + (c.network ?? 0) / 400 + (j.rapport ?? 50) / 500) promote(c);

  // trouble
  if (perf < 32) {
    if (j.pip) {
      c.yearLog.push("Your performance didn't improve. You were dismissed.");
      loseJob(c, "fired", world);
      return;
    }
    j.pip = true;
    changeStat(c, "happiness", -4, "A performance warning");
    c.yearLog.push("Your manager put you on a performance improvement plan. Another year like this and you're out.");
  } else if (perf >= 45 && j.pip) {
    j.pip = false;
    c.yearLog.push("You got off the performance plan. Everyone breathed out.");
  }

  // layoffs
  const size = j.company?.size;
  let p = 0.012 + (recession ? 0.05 : 0) - (boom ? 0.01 : 0) + (perf < 50 ? 0.03 : 0) - Math.min(0.02, yearsInRole(c) * 0.004);
  p *= size === "Small business" ? 1.4 : size === "Corporation" ? 0.85 : 1;
  if (c.inUnion) p *= 0.4;
  if (Math.random() < Math.max(0, p)) {
    c.yearLog.push(`${j.company?.name ?? "Your employer"} announced redundancies and your role was one of them.`);
    loseJob(c, "laidoff", world);
  }
}
