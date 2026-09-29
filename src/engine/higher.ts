import { Character, DegreeLevel, Enrollment, ExamResult, LifeEvent } from "../types";
import { EXAMS, PREP_COST, formatExam } from "../data/admissions";
import { GRAD_PROGRAMMES, HOUSING, INSTITUTIONS, Institution, Programme, TRADE_PROGRAMMES, institutionById, institutionsFor } from "../data/institutions";
import { MAJOR_DEFS, majorDef } from "../data/majors";
import { scoreToGpa } from "../data/education";
import { SKILL_TALENT, traitMod } from "./character";
import { changeStat } from "./stats";
import { finishDecision, queueDecision, registerDecision } from "./decisionQueue";
import { easeStress } from "./health";
import { effortLevel } from "./education";
import { onEnterSchoolStage, setFlag } from "./school";
import { bestLevel, degreeLevel, isBachelorPlus } from "./degrees";
import { clamp, randomInt } from "./util";

// University, grad school and trade school: getting in (an entrance exam, an
// application list, recommendation letters, scholarships), paying for it
// (family, scholarships, student loans), the years themselves (grades, dean's
// list, probation, dismissal) and what you leave with (a degree that opens
// specific doors).

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;
const CLASS_RANK: Record<string, number> = { struggling: 0, working: 1, middle: 2, comfortable: 3, wealthy: 4 };
const FAMILY_SHARE = [0, 0.1, 0.3, 0.65, 1];
const LOAN_APR: Record<string, number> = { us: 0.055, uk: 0.045, nigeria: 0.1, japan: 0.02, brazil: 0.08 };

export const inHigher = (c: Character) => !!c.higher;

// ---------------------------------------------------------------- old saves

export function ensureHigher(c: Character): void {
  if (c.higher || !c.inCollege || !c.currentSchool) return;
  const inst = INSTITUTIONS.find((i) => i.name === c.currentSchool) ?? institutionsFor(c.originRegion).find((i) => i.tier === "state") ?? INSTITUTIONS[0];
  const start = c.collegeStartAge ?? c.age - 1;
  c.higher = {
    instId: inst.id,
    institution: c.currentSchool,
    major: c.currentMajor ?? "Business",
    level: "bachelor",
    online: c.currentOnline ?? false,
    housing: c.currentHousing ?? "dorm",
    startAge: start,
    years: inst.years,
    done: Math.max(0, c.age - start),
    gpa: c.gpa ?? 3,
    tuition: inst.cost,
    scholarship: 0,
    family: 0,
    wage: 0,
    probation: 0,
    deans: 0,
  };
}

// ---------------------------------------------------------------- the exam

export const examDef = (c: Character) => EXAMS[c.originRegion ?? "us"];

export function bestExam(c: Character): ExamResult | undefined {
  return (c.exams ?? []).slice().sort((a, b) => b.score - a.score)[0];
}

export function examCanSit(c: Character): { ok: boolean; reason?: string } {
  const d = examDef(c);
  if (c.age < d.minAge) return { ok: false, reason: `You can sit the ${d.name} from ${d.minAge}.` };
  if (c.flags?.includes(`exam-${c.age}`)) return { ok: false, reason: "You've already sat it this year." };
  if (c.higher) return { ok: false, reason: "You're already at university." };
  return { ok: true };
}

export function prepCost(c: Character): number {
  return PREP_COST[c.originRegion ?? "us"];
}

export function sitExam(c: Character, prep: boolean): void {
  const can = examCanSit(c);
  const d = examDef(c);
  if (!can.ok) {
    c.yearLog.push(can.reason ?? "You can't sit the exam right now.");
    return;
  }
  const cost = d.cost + (prep ? prepCost(c) : 0);
  if (c.money < cost) {
    c.yearLog.push(`You couldn't afford the ${d.name}${prep ? " and prep course" : ""} (${money(cost)}).`);
    return;
  }
  c.money -= cost;
  (c.flags ??= []).push(`exam-${c.age}`);
  const academic = c.talents?.academic ?? 50;
  const help = (c.helpBonus ?? 0) * 0.6;
  let score = 18 + c.stats.smarts * 0.42 + ((c.gpa ?? 3) / 4) * 20 + academic * 0.1 + effortLevel(c) * 0.06 + help;
  if (prep) score += 8;
  if ((c.stress ?? 0) > 75) score -= 4;
  score += (Math.random() + Math.random() - 1) * 12;
  score = Math.round(clamp(score, 5, 100));
  (c.exams ??= []).push({ age: c.age, score, name: d.name });
  changeStat(c, "smarts", 1, `Sitting the ${d.name}`);
  c.stress = clamp((c.stress ?? 25) + 8);
  const line = `You sat the ${d.name}${prep ? " after a prep course" : ""}: ${formatExam(c.originRegion, score)}.`;
  c.yearLog.push(line);
  c.fullLog.push({ age: c.age, text: line });
}

// ---------------------------------------------------------------- letters and extras

export function letterStrength(c: Character): number {
  const teachers = (c.recLetters ?? []).map((id) => c.relationships.find((r) => r.id === id)).filter(Boolean) as { level: number }[];
  const fromTeachers = teachers.reduce((s, t) => s + 12 + t.level * 0.18, 0);
  return clamp(fromTeachers + ((c.talents?.verbal ?? 50) - 50) * 0.2 + 20);
}

export function askForLetter(c: Character, teacherId: string): void {
  const t = c.relationships.find((r) => r.id === teacherId && r.alive && r.type === "teacher");
  if (!t) return;
  if ((c.recLetters ?? []).includes(teacherId)) {
    c.yearLog.push(`${t.name} has already agreed to write for you.`);
    return;
  }
  if ((c.recLetters?.length ?? 0) >= 3) {
    c.yearLog.push("Three letters is plenty.");
    return;
  }
  const p = clamp(0.15 + t.level / 120 + ((c.gpa ?? 3) - 2.5) * 0.1, 0.05, 0.95);
  if (Math.random() < p) {
    (c.recLetters ??= []).push(teacherId);
    t.level = clamp(t.level + 4);
    c.yearLog.push(`${t.name} agreed to write you a glowing recommendation.`);
  } else {
    t.level = clamp(t.level - 2);
    c.yearLog.push(`${t.name} said they didn't know you well enough to write a strong letter.`);
  }
}

export function extracurricularScore(c: Character): number {
  const acts = c.schoolActivities?.length ?? 0;
  const years = Object.values(c.activityYears ?? {}).reduce((s, y) => s + Math.min(3, y), 0);
  const lead = c.skills?.leadership ?? 0;
  return clamp(acts * 9 + years * 5 + lead * 0.35 + (c.internships ?? 0) * 6);
}

// ---------------------------------------------------------------- how strong is your application

export type Standing = "safety" | "match" | "reach" | "long";

export function compositeScore(c: Character, inst: Institution, gpaOverride?: number): number {
  const gpa100 = ((gpaOverride ?? c.gpa ?? 3) / 4) * 100;
  const exam = bestExam(c)?.score;
  const ec = extracurricularScore(c);
  const letters = letterStrength(c);
  const essay = (c.talents?.verbal ?? 50) * 0.55 + c.stats.smarts * 0.25 + 12;
  let s: number;
  if (inst.needsExam) {
    const ex = exam ?? Math.max(10, 0.45 * c.stats.smarts); // no score on file: a weak substitute
    s = 0.38 * ex + 0.3 * gpa100 + 0.12 * ec + 0.1 * letters + 0.1 * essay;
  } else {
    s = 0.55 * gpa100 + 0.2 * essay + 0.15 * ec + 0.1 * letters;
  }
  if ((inst.tier === "elite" || inst.tier === "private") && CLASS_RANK[c.background?.wealthClass ?? "middle"] >= 4) s += 3; // legacy and donations
  if (c.track === "college") s += 1;
  return clamp(s);
}

export function admitProbability(c: Character, inst: Institution, gpaOverride?: number, barOverride?: number): number {
  const bar = barOverride ?? inst.bar;
  if (bar <= 14) return 0.98;
  const x = (compositeScore(c, inst, gpaOverride) - bar) / 6;
  return clamp(1 / (1 + Math.exp(-x)), 0.02, 0.98);
}

export function standingOf(p: number): { key: Standing; label: string } {
  return p >= 0.8 ? { key: "safety", label: "Safety" } : p >= 0.45 ? { key: "match", label: "Match" } : p >= 0.15 ? { key: "reach", label: "Reach" } : { key: "long", label: "Long shot" };
}

// ---------------------------------------------------------------- aid

export type Aid = { scholarship: number; family: number; reasons: string[] };

export function estimateAid(c: Character, inst: Institution, level: DegreeLevel, cost: number, composite: number): Aid {
  const reasons: string[] = [];
  if (cost <= 0) return { scholarship: 0, family: 0, reasons };
  let frac = 0;
  if (inst.tier !== "elite" || (level !== "bachelor" && level !== "associate")) {
    const merit = clamp((composite - inst.bar - 4) / 30, 0, 0.7);
    if (merit > 0.02) {
      frac += merit;
      reasons.push("merit scholarship");
    }
  }
  if (level === "bachelor" || level === "associate") {
    const need = [0.6, 0.35, 0.12, 0, 0][CLASS_RANK[c.background?.wealthClass ?? "middle"]];
    if (need > 0) {
      frac += need;
      reasons.push("need-based grant");
    }
    const sport = (c.schoolActivities ?? []).some((a) => /Team|Track|Swim/.test(a)) && (c.skills?.athletics ?? 0) >= 55 && Object.values(c.activityYears ?? {}).some((y) => y >= 2);
    const arts = Math.max(c.skills?.music ?? 0, c.skills?.art ?? 0, c.skills?.acting ?? 0, c.skills?.singing ?? 0) >= 62;
    if (sport) {
      frac += 0.35;
      reasons.push("athletic scholarship");
    } else if (arts) {
      frac += 0.25;
      reasons.push("arts scholarship");
    }
  }
  frac = clamp(frac, 0, 1);
  const scholarship = Math.round(cost * frac);
  let family = 0;
  if (level === "bachelor" || level === "associate") {
    const parents = c.relationships.filter((r) => r.alive && (r.type === "mother" || r.type === "father"));
    const bond = Math.max(0, ...parents.map((p) => p.level));
    if (parents.length > 0 && bond >= 30) family = Math.round((cost - scholarship) * FAMILY_SHARE[CLASS_RANK[c.background?.wealthClass ?? "middle"]]);
    if (family > 0) reasons.push("family contribution");
  }
  return { scholarship, family, reasons };
}

// ---------------------------------------------------------------- applications

export type Offer = {
  inst: Institution;
  major: string;
  level: DegreeLevel;
  years: number;
  tuition: number;
  scholarship: number;
  family: number;
  wage: number;
  reasons: string[];
};

// tight budgets start out living at home; you can change it on the campus screen
const housingFor = (inst: Institution, age: number, c?: Character): Enrollment["housing"] =>
  !inst.housing || inst.online || (c && CLASS_RANK[c.background?.wealthClass ?? "middle"] <= 1) ? "commute" : age < 21 ? "dorm" : "apartment";
export const housingCost = (key: Enrollment["housing"]) => HOUSING.find((h) => h.key === key)?.costPerYear ?? 0;

export function applicationWindow(c: Character): { ok: boolean; reason?: string } {
  if (c.higher) return { ok: false, reason: "You're already enrolled." };
  if (c.age < 16) return { ok: false, reason: "Applications open at 16." };
  if (c.educationStage !== "high" && c.educationStage !== "graduated") return { ok: false, reason: "Finish school first." };
  if (c.diploma === "none") return { ok: false, reason: "You need a diploma or the GED first." };
  if (c.appliedAge === c.age) return { ok: false, reason: "You've already applied this year. Results are in." };
  return { ok: true };
}

const hasAssociate = (c: Character) => (c.degrees ?? []).some((d) => degreeLevel(d) === "associate");

export function estimateOffer(c: Character, inst: Institution, major: string, levelIn?: DegreeLevel, prog?: Programme): Offer {
  const level: DegreeLevel = levelIn ?? (inst.tier === "community" ? "associate" : "bachelor");
  const tuition = Math.round(inst.cost * (prog?.cost ?? 1));
  const composite = compositeScore(c, inst);
  const aid = estimateAid(c, inst, level, tuition, composite);
  // an associate degree carries two years of credit into a university
  const years = prog?.years ?? (level === "bachelor" && hasAssociate(c) ? Math.max(2, inst.years - 2) : inst.years);
  return { inst, major, level, years, tuition, scholarship: aid.scholarship, family: aid.family, wage: prog?.wage ?? 0, reasons: aid.reasons };
}

export function netTuition(o: Offer): number {
  return Math.max(0, o.tuition - o.scholarship - o.family);
}

export function applyToUniversities(c: Character, ids: string[], major: string): LifeEvent | undefined {
  const win = applicationWindow(c);
  if (!win.ok) {
    c.yearLog.push(win.reason ?? "You can't apply right now.");
    return undefined;
  }
  const insts = ids.map(institutionById).filter((i): i is Institution => !!i && i.region === (c.originRegion ?? "us") && !i.trade);
  if (insts.length === 0) {
    c.yearLog.push("Pick at least one place to apply.");
    return undefined;
  }
  if (insts.length > 5) insts.length = 5;
  c.appliedAge = c.age;
  c.stress = clamp((c.stress ?? 25) + 4);
  const accepted: Offer[] = [];
  const waitlisted: string[] = [];
  const rejected: string[] = [];
  for (const inst of insts) {
    const p = admitProbability(c, inst);
    const r = Math.random();
    if (r < p) accepted.push(estimateOffer(c, inst, major));
    else if (r < p + 0.12) {
      if (Math.random() < 0.35) accepted.push(estimateOffer(c, inst, major));
      else waitlisted.push(inst.name);
    } else rejected.push(inst.name);
  }
  return decisionEvent(c, accepted, waitlisted, rejected, major);
}

function decisionEvent(c: Character, accepted: Offer[], waitlisted: string[], rejected: string[], major: string): LifeEvent {
  const lines: string[] = [];
  if (accepted.length) lines.push(`Accepted: ${accepted.map((o) => o.inst.name).join(", ")}.`);
  if (waitlisted.length) lines.push(`Waitlisted, and it went nowhere: ${waitlisted.join(", ")}.`);
  if (rejected.length) lines.push(`Turned down by: ${rejected.join(", ")}.`);
  return {
    id: `admissions-${c.age}`,
    minAge: 0,
    maxAge: 200,
    banner: { title: "Admissions results", subtitle: `Applying to study ${major}`, icon: "mail-open", step: accepted.length ? "Your offers" : "No offers" },
    text: () =>
      `${lines.join("\n")}\n\n${
        accepted.length
          ? "Where will you go? Fees after aid are shown on each offer - housing is extra (halls cost thousands; living at home is free)."
          : "It isn't the outcome you wanted. There are other routes - a trade, an online degree, work, or applying again next year with stronger results."
      }`,
    choices: [
      ...accepted.map((o) => {
        const perYear = netTuition(o);
        return {
          label: o.inst.name,
          sublabel: `${o.years} years · ${perYear <= 0 ? "fully covered" : `${money(perYear)}/yr out of pocket`}${o.reasons.length ? ` · ${o.reasons.join(", ")}` : ""}`,
          tone: "good" as const,
          effect: (cc: Character) => enrol(cc, o, housingFor(o.inst, cc.age, cc)),
        };
      }),
      {
        label: accepted.length ? "Take a gap year" : "Take a year to regroup",
        effect: (cc: Character) => {
          cc.educationStage = "graduated";
          changeStat(cc, "happiness", 4, "A year to breathe");
          cc.yearLog.push("You decided to take a year to figure things out.");
        },
      },
    ],
  };
}

// sensible defaults for someone who just wants to be put through
export function suggestMajor(c: Character): string {
  const t = c.talents;
  const scored = MAJOR_DEFS.filter((m) => m.difficulty <= 72).map((m) => ({ m, s: (t?.[m.talent] ?? 50) - Math.max(0, m.difficulty - c.stats.smarts) * 0.7 + m.pay * 6 }));
  scored.sort((a, b) => b.s - a.s);
  return scored[0]?.m.label ?? "Business";
}

export function quickApply(c: Character): LifeEvent | undefined {
  const pool = institutionsFor(c.originRegion).filter((i) => !i.trade);
  const probs = pool.map((i) => ({ i, p: admitProbability(c, i) })).sort((a, b) => b.p - a.p);
  const safety = probs.filter((x) => x.p >= 0.75).slice(-2);
  const match = probs.filter((x) => x.p >= 0.35 && x.p < 0.75).slice(0, 2);
  const reach = probs.filter((x) => x.p < 0.35 && x.p >= 0.08).slice(0, 1);
  const chosen = [...safety, ...match, ...reach].map((x) => x.i.id);
  if (chosen.length === 0 && probs[0]) chosen.push(probs[0].i.id);
  return applyToUniversities(c, chosen, suggestMajor(c));
}

// ---------------------------------------------------------------- trade school

export function tradeInstitution(c: Character): Institution | undefined {
  return institutionsFor(c.originRegion).find((i) => i.trade);
}

export function tradeOffer(c: Character, prog: Programme): Offer | undefined {
  const inst = tradeInstitution(c);
  if (!inst) return undefined;
  return { inst, major: prog.label, level: "certificate", years: prog.years, tuition: Math.round(inst.cost * prog.cost), scholarship: 0, family: Math.round(inst.cost * prog.cost * FAMILY_SHARE[CLASS_RANK[c.background?.wealthClass ?? "middle"]] * 0.6), wage: prog.wage ?? 0, reasons: [] };
}

export function startTrade(c: Character, key: string): void {
  const prog = TRADE_PROGRAMMES.find((p) => p.key === key);
  if (!prog) return;
  if (c.higher) return void c.yearLog.push("You're already enrolled somewhere.");
  if (c.age < 16 || (c.diploma === "none" && c.age < 17)) return void c.yearLog.push("Too young for that programme.");
  if (c.educationStage === "middle" || c.educationStage === "elementary") return void c.yearLog.push("Finish school first.");
  if ((c.gpa ?? 3) < prog.minGpa) return void c.yearLog.push(`Your grades aren't enough for ${prog.label} (${prog.minGpa.toFixed(1)}+ needed).`);
  const offer = tradeOffer(c, prog);
  if (!offer) return;
  enrol(c, offer, "commute");
}

export function tradePickerEvent(c: Character): LifeEvent {
  const opts = TRADE_PROGRAMMES.filter((p) => (c.gpa ?? 3) >= p.minGpa);
  return {
    id: `trade-picker-${c.age}`,
    minAge: 0,
    maxAge: 200,
    banner: { title: "Learning a trade", icon: "hammer", subtitle: tradeInstitution(c)?.name },
    text: () => "A trade gives you a skill, a certificate and a way to earn quickly. Apprenticeships pay you while you learn. What appeals?",
    choices: [
      ...opts.slice(0, 7).map((p) => {
        const o = tradeOffer(c, p);
        return {
          label: p.label,
          sublabel: `${p.years} year${p.years > 1 ? "s" : ""} · ${p.wage ? `paid ${money(p.wage)}/yr` : o && o.tuition - o.family > 0 ? `${money(Math.max(0, o.tuition - o.family))}/yr` : "covered"}`,
          effect: (cc: Character) => startTrade(cc, p.key),
        };
      }),
      { label: "Actually, not right now", effect: () => {} },
    ],
  };
}

// ---------------------------------------------------------------- grad school

export function gradEligibility(c: Character, prog: Programme): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (!isBachelorPlus(c)) reasons.push("Needs a bachelor's degree");
  const gpa = Math.max(0, ...(c.degrees ?? []).filter((d) => degreeLevel(d) === "bachelor").map((d) => d.gpa ?? c.gpa ?? 3));
  if (isBachelorPlus(c) && gpa < prog.minGpa - 0.2) reasons.push(`Needs a ${prog.minGpa.toFixed(1)} GPA (you graduated with ${gpa.toFixed(1)})`);
  if (prog.needsMajorField && !(c.degrees ?? []).some((d) => prog.needsMajorField!.includes(d.major))) reasons.push(`Needs a degree in ${prog.needsMajorField.join(" / ")}`);
  if (c.higher) reasons.push("You're already enrolled");
  if (c.age < 20) reasons.push("Too early - finish your degree first");
  return { ok: reasons.length === 0, reasons };
}

export function lastBachelor(c: Character) {
  return (c.degrees ?? []).filter((d) => degreeLevel(d) === "bachelor").slice(-1)[0];
}

export function gradMajor(c: Character, prog: Programme): string {
  const base = lastBachelor(c)?.major ?? "your field";
  if (prog.key === "masters") return `Master's in ${base}`;
  if (prog.key === "phd") return `PhD in ${base}`;
  if (prog.key === "mba") return "MBA";
  if (prog.key === "law") return "Law";
  if (prog.key === "medicine") return "Medicine";
  if (prog.key === "pharmd") return "Pharmacy";
  if (prog.key === "teaching") return "Education";
  return prog.label;
}

export function applyToGrad(c: Character, ids: string[], progKey: string): LifeEvent | undefined {
  const prog = GRAD_PROGRAMMES.find((p) => p.key === progKey);
  if (!prog) return undefined;
  const el = gradEligibility(c, prog);
  if (!el.ok) {
    c.yearLog.push(el.reasons[0]);
    return undefined;
  }
  if (c.appliedAge === c.age) {
    c.yearLog.push("You've already applied this year.");
    return undefined;
  }
  const insts = ids.map(institutionById).filter((i): i is Institution => !!i && i.region === (c.originRegion ?? "us") && !i.trade && !i.online).slice(0, 4);
  if (insts.length === 0) {
    c.yearLog.push("Pick at least one school.");
    return undefined;
  }
  c.appliedAge = c.age;
  const gpa = lastBachelor(c)?.gpa ?? c.gpa ?? 3;
  const major = gradMajor(c, prog);
  const accepted: Offer[] = [];
  const rejected: string[] = [];
  for (const inst of insts) {
    const bar = Math.max(inst.bar * 0.85, (prog.minGpa / 4) * 100 - 6);
    const p = admitProbability(c, inst, gpa, bar);
    if (Math.random() < p) {
      const tuition = Math.round(inst.cost * prog.cost);
      const comp = compositeScore(c, inst, gpa);
      const merit = clamp((comp - bar - 4) / 35, 0, 0.6);
      accepted.push({ inst, major, level: prog.level, years: prog.years, tuition, scholarship: Math.round(tuition * merit), family: 0, wage: prog.wage ?? 0, reasons: merit > 0.02 ? ["merit funding"] : [] });
    } else rejected.push(inst.name);
  }
  return decisionEvent(c, accepted, [], rejected, major);
}

// ---------------------------------------------------------------- enrolling

export function enrol(c: Character, o: Offer, housing: Enrollment["housing"]): void {
  const h: Enrollment = {
    instId: o.inst.id,
    institution: o.inst.name,
    major: o.major,
    level: o.level,
    online: !!o.inst.online,
    housing: o.inst.online ? "commute" : housing,
    startAge: c.age,
    years: o.years,
    done: 0,
    gpa: c.gpa ?? 3,
    tuition: o.tuition,
    scholarship: o.scholarship,
    family: o.family,
    wage: o.wage,
    probation: 0,
    deans: 0,
  };
  c.higher = h;
  c.inCollege = true;
  c.currentSchool = h.institution;
  c.currentMajor = h.major;
  c.currentOnline = h.online;
  c.currentHousing = h.housing;
  c.collegeStartAge = c.age;
  c.educationStage = "college";
  c.school = null;
  onEnterSchoolStage(c, "college");
  const line = `You started ${o.level === "certificate" ? "the" : "studying"} ${h.major} ${o.level === "certificate" ? "programme" : ""}at ${h.institution}.`.replace("  ", " ");
  c.yearLog.push(line);
  c.fullLog.push({ age: c.age, text: line });
}

export function setHousing(c: Character, key: Enrollment["housing"]): void {
  const h = c.higher;
  const inst = h ? institutionById(h.instId) : undefined;
  if (!h || !inst) return;
  if (h.online) return void c.yearLog.push("You study online - there's no housing to change.");
  if (key !== "commute" && !inst.housing) return void c.yearLog.push("There's no campus accommodation here.");
  h.housing = key;
  c.currentHousing = key;
  c.yearLog.push(`You moved to ${HOUSING.find((x) => x.key === key)?.label.toLowerCase()}.`);
}

export function changeMajor(c: Character, major: string): void {
  const h = c.higher;
  if (!h || (h.level !== "bachelor" && h.level !== "associate") || h.major === major) return;
  if (!majorDef(major)) return;
  h.major = major;
  c.currentMajor = major;
  if (h.done >= 2) h.years += 1;
  c.money = Math.max(0, c.money - 300);
  c.yearLog.push(`You switched your major to ${major}.${h.done >= 2 ? " It adds a year to your degree." : ""}`);
}

export function transferTo(c: Character, instId: string): void {
  const h = c.higher;
  const inst = institutionById(instId);
  if (!h || !inst || (h.level !== "bachelor" && h.level !== "associate") || inst.trade || inst.id === h.instId) return;
  if (h.done < 1) return void c.yearLog.push("Finish at least a year before transferring.");
  const p = admitProbability(c, inst, h.gpa);
  if (Math.random() > p) {
    c.yearLog.push(`${inst.name} turned down your transfer application.`);
    return;
  }
  const remaining = Math.max(1, inst.years - Math.min(h.done, inst.years - 1));
  h.level = inst.tier === "community" ? "associate" : "bachelor";
  h.instId = inst.id;
  h.institution = inst.name;
  h.tuition = inst.cost;
  h.years = h.done + remaining;
  h.online = !!inst.online;
  h.housing = housingFor(inst, c.age);
  const aid = estimateAid(c, inst, "bachelor", inst.cost, compositeScore(c, inst, h.gpa));
  h.scholarship = aid.scholarship;
  h.family = aid.family;
  c.currentSchool = inst.name;
  c.currentHousing = h.housing;
  c.currentOnline = h.online;
  c.popularity = clamp((c.popularity ?? 50) - 6);
  c.yearLog.push(`You transferred to ${inst.name}.`);
}

// ---------------------------------------------------------------- money

export function addStudentLoan(c: Character, amount: number): void {
  if (amount <= 0) return;
  const loans = (c.loans ??= []);
  let loan = loans.find((l) => l.kind === "student");
  if (!loan) {
    loan = { id: `student-${Date.now().toString(36)}`, kind: "student", name: "Student loan", balance: 0, apr: LOAN_APR[c.originRegion ?? "us"] ?? 0.05, minPayment: 0, deferred: true };
    loans.push(loan);
  }
  loan.balance += Math.round(amount);
  loan.deferred = true;
}

function startRepayment(c: Character): void {
  for (const l of c.loans ?? []) {
    if (l.kind !== "student") continue;
    l.deferred = false;
    l.minPayment = Math.max(300, Math.round((l.balance * (1 + l.apr * 5)) / 10));
  }
}

export function yearlyCosts(c: Character): { tuition: number; scholarship: number; family: number; housing: number; wage: number; youPay: number } {
  const h = c.higher;
  if (!h) return { tuition: 0, scholarship: 0, family: 0, housing: 0, wage: 0, youPay: 0 };
  const housing = h.online ? 0 : housingCost(h.housing);
  const tuitionNet = Math.max(0, h.tuition - h.scholarship - h.family);
  return { tuition: h.tuition, scholarship: h.scholarship, family: h.family, housing, wage: h.wage, youPay: tuitionNet + housing };
}

// ---------------------------------------------------------------- the year

const honorsFor = (c: Character, gpa: number, level: DegreeLevel): string | undefined => {
  if (level === "associate") return undefined;
  if (level === "certificate") return gpa >= 3.6 ? "Distinction" : gpa >= 2.8 ? "Merit" : "Pass";
  if (c.originRegion === "uk") return gpa >= 3.7 ? "First-class honours" : gpa >= 3.2 ? "Upper second (2:1)" : gpa >= 2.6 ? "Lower second (2:2)" : "Third-class";
  if (c.originRegion === "us") return gpa >= 3.9 ? "summa cum laude" : gpa >= 3.7 ? "magna cum laude" : gpa >= 3.5 ? "cum laude" : undefined;
  return gpa >= 3.7 ? "with distinction" : undefined;
};

export function tickHigher(c: Character): void {
  ensureHigher(c);
  const h = c.higher;
  if (!h) return;
  const inst = institutionById(h.instId);
  const major = majorDef(h.major.replace(/^(Master's|PhD) in /, ""));
  h.done += 1;

  // grades
  const difficulty = major?.difficulty ?? (h.level === "professional" ? 80 : h.level === "certificate" ? 38 : h.level === "doctorate" ? 74 : 58);
  const talent = c.talents?.[major?.talent ?? "academic"] ?? 50;
  let score = 40 + c.stats.smarts * 0.32 + talent * 0.14 + effortLevel(c) * 0.2 + (c.helpBonus ?? 0);
  score -= (difficulty - 50) * 0.28;
  score -= ((inst?.prestige ?? 50) - 50) * 0.08;
  if (h.housing === "greek") score -= 2;
  if ((c.partTime?.hours ?? 0) >= 15) score -= 2;
  if ((c.stress ?? 0) > 70) score -= ((c.stress ?? 0) - 70) / 4;
  if (c.bullying?.role === "victim") score -= 3;
  score += (Math.random() + Math.random() + Math.random() - 1.5) * 8;
  const gpaYear = scoreToGpa(score);
  h.gpa = Math.round(((h.gpa * (h.done - 1) + gpaYear) / h.done) * 100) / 100;
  c.gpa = h.gpa;
  c.helpBonus = 0;
  c.yearLog.push(`Year ${h.done} of ${h.years}: ${gpaYear.toFixed(1)} GPA${gpaYear >= 3.7 ? " - dean's list" : ""}.`);
  if (gpaYear >= 3.7) {
    h.deans += 1;
    changeStat(c, "happiness", 3, "Making the dean's list");
  }
  const skillKey = major?.skill;
  if (skillKey) {
    const skills = (c.skills ??= {});
    const mult = 0.6 + (c.talents?.[SKILL_TALENT[skillKey] ?? "academic"] ?? 50) / 100;
    skills[skillKey] = clamp((skills[skillKey] ?? 0) + Math.round(randomInt(2, 5) * mult));
  }
  changeStat(c, "smarts", Math.random() < 0.5 ? 1 : 0, "Studying");

  // standing
  const bar = inst?.probationGpa ?? 1.8;
  if (h.gpa < bar) {
    h.probation += 1;
    setFlag(c, "on-probation");
    if (h.probation >= 2) {
      c.yearLog.push(`${h.institution} dismissed you for poor grades.`);
      setFlag(c, "expelled");
      dropOut(c, true);
      return;
    }
    c.yearLog.push("You're on academic probation. Another bad year and you'll be dismissed.");
  } else {
    h.probation = 0;
    c.flags = (c.flags ?? []).filter((f) => f !== "on-probation");
  }

  // paying for it
  const cost = yearlyCosts(c);
  if (cost.wage > 0) {
    c.money += cost.wage;
    c.yearLog.push(`Your ${h.level === "doctorate" ? "stipend" : "apprentice wages"}: ${money(cost.wage)}.`);
  }
  if (cost.youPay > 0) {
    const fromCash = Math.min(c.money, cost.youPay);
    c.money -= fromCash;
    const loan = cost.youPay - fromCash;
    if (loan > 0) addStudentLoan(c, loan);
    c.yearLog.push(
      `University costs: ${money(cost.youPay)} this year${cost.scholarship + cost.family > 0 ? ` (after ${money(cost.scholarship + cost.family)} in aid and family help)` : ""}${loan > 0 ? `; ${money(loan)} went on your student loan` : ""}.`,
    );
  }

  if (h.done >= h.years) graduate(c);
}

export function graduate(c: Character): void {
  const h = c.higher;
  if (!h) return;
  const honors = honorsFor(c, h.gpa, h.level);
  c.degrees = [...(c.degrees ?? []), { school: h.institution, major: h.major, online: h.online, level: h.level, gpa: h.gpa, honors, age: c.age }];
  if (h.level !== "certificate" && h.level !== "associate") c.hasCollegeDegree = true;
  clearEnrollment(c);
  startRepayment(c);
  changeStat(c, "happiness", 15, "Graduating");
  const line = `You graduated: ${h.major} at ${h.institution}${honors ? `, ${honors}` : ""} (${h.gpa.toFixed(1)} GPA).`;
  c.yearLog.push(line);
  c.fullLog.push({ age: c.age, text: line });
  queueDecision(c, { kind: "graduation", data: { major: h.major, school: h.institution, honors, gpa: h.gpa, level: h.level } });
  onEnterSchoolStage(c, "graduated");
}

export function dropOut(c: Character, dismissed = false): void {
  const h = c.higher;
  if (!h) {
    // older saves: fall back to the legacy fields
    if (c.inCollege) {
      c.inCollege = false;
      c.educationStage = "graduated";
    }
    return;
  }
  clearEnrollment(c);
  startRepayment(c);
  changeStat(c, "happiness", dismissed ? -12 : -8, dismissed ? "Being dismissed" : "Leaving university");
  if (!dismissed) c.yearLog.push("You dropped out. No qualification from this one - but you keep whatever debt you took on.");
  onEnterSchoolStage(c, "graduated");
}

function clearEnrollment(c: Character): void {
  c.higher = null;
  c.inCollege = false;
  c.educationStage = "graduated";
  c.currentSchool = undefined;
  c.currentMajor = undefined;
  c.currentOnline = undefined;
  c.currentHousing = undefined;
  c.collegeStartAge = undefined;
}

// internships feed interviews (engine/degrees.ts degreePrep)
export function gainInternship(c: Character): void {
  c.internships = (c.internships ?? 0) + 1;
}

registerDecision("graduation", (c, _w, d) => {
  const data = d.data as { major: string; school: string; honors?: string; gpa: number; level: DegreeLevel };
  const cert = data.level === "certificate";
  return {
    id: `graduation-${d.id}`,
    minAge: 0,
    maxAge: 200,
    banner: { title: cert ? "Certificate awarded" : "Graduation day", subtitle: data.school, icon: "ribbon" },
    text: () => `${cert ? "You've completed" : "You've graduated"} ${data.major}${data.honors ? ` with ${data.honors}` : ""}. Your final GPA: ${data.gpa.toFixed(1)}. How do you mark it?`,
    choices: [
      {
        label: "A big party with everyone",
        effect: (cc) => {
          finishDecision(cc, d.id);
          cc.money = Math.max(0, cc.money - 300);
          changeStat(cc, "happiness", 6, "Celebrating");
          for (const r of cc.relationships) if (r.alive && (r.type === "friend" || r.type === "classmate")) r.level = clamp(r.level + 6);
        },
      },
      {
        label: "A quiet dinner with family",
        effect: (cc) => {
          finishDecision(cc, d.id);
          for (const r of cc.relationships) if (r.alive && (r.type === "mother" || r.type === "father" || r.type === "sibling")) r.level = clamp(r.level + 6);
          changeStat(cc, "happiness", 4, "Family pride");
        },
      },
      {
        label: "Straight to the job hunt",
        effect: (cc) => {
          finishDecision(cc, d.id);
          cc.stress = clamp((cc.stress ?? 25) + 3);
          cc.appsThisYear = 0;
        },
      },
    ],
  } as LifeEvent;
});

export const dropOutOfCollege = (c: Character) => dropOut(c);
export { bestLevel, easeStress, traitMod };
