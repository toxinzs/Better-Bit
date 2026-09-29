import { Character, Degree, Job } from "../types";
import { majorDef } from "../data/majors";
import { GRAD_PROGRAMMES, TRADE_PROGRAMMES, institutionByName } from "../data/institutions";

// What your qualifications are worth to an employer. Kept apart from the
// college engine so the jobs engine can read it without importing the world.

const rank: Record<string, number> = { certificate: 1, associate: 1.5, bachelor: 2, master: 3, professional: 3, doctorate: 4 };
export const degreeLevel = (d: Degree) => d.level ?? "bachelor"; // older degrees were all bachelor's

export function bestLevel(c: Character): number {
  return Math.max(0, ...(c.degrees ?? []).map((d) => rank[degreeLevel(d)] ?? 2));
}

export function isBachelorPlus(c: Character): boolean {
  return (c.degrees ?? []).some((d) => degreeLevel(d) !== "certificate" && degreeLevel(d) !== "associate") || c.hasCollegeDegree;
}

function certHelps(d: Degree, job: Job): boolean {
  if (degreeLevel(d) !== "certificate") return false;
  const prog = TRADE_PROGRAMMES.find((p) => p.label === d.major);
  return !!prog?.jobs?.includes(job.title);
}

function majorMatches(d: Degree, job: Job): boolean {
  const m = majorDef(d.major.replace(/^(Master's|PhD) in /, ""));
  if (!m || !job.field) return false;
  return m.field === job.field || !!m.also?.includes(job.field);
}

export function degreeMatches(c: Character, job: Job): boolean {
  return (c.degrees ?? []).some((d) => certHelps(d, job) || majorMatches(d, job));
}

// jobs that name a specific degree (a Doctor holds a medical degree)
export function meetsMajorNeed(c: Character, job: Job): boolean {
  if (!job.needsMajor || job.needsMajor.length === 0) return true;
  const want = job.needsMajor.map((s) => s.toLowerCase());
  return (c.degrees ?? []).some((d) => {
    const m = d.major.toLowerCase();
    if (want.some((w) => m === w || m.endsWith(` in ${w}`))) return true;
    const prog = TRADE_PROGRAMMES.find((p) => p.label === d.major) ?? GRAD_PROGRAMMES.find((p) => p.label === d.major);
    return !!prog?.jobs?.includes(job.title);
  });
}

// interview edge from what you studied and where
export function degreePrep(c: Character, job: Job): number {
  const degs = c.degrees ?? [];
  if (degs.length === 0) return 0;
  let p = 0.6;
  if (degreeMatches(c, job)) p += 1.6;
  const top = Math.max(...degs.map((d) => institutionByName(d.school)?.prestige ?? 40));
  p += (top - 50) / 45;
  p += Math.min(1, (bestLevel(c) - 2) * 0.5);
  const gpa = Math.max(...degs.map((d) => d.gpa ?? 3));
  p += (gpa - 3) * 0.5;
  p += Math.min(1.2, (c.internships ?? 0) * 0.6);
  return p;
}

// what your qualifications do to a starting salary
export function degreeSalaryFactor(c: Character, job: Job): number {
  const degs = c.degrees ?? [];
  if (degs.length === 0) return 1;
  let f = 1;
  if (degreeMatches(c, job)) {
    const md = degs.map((d) => majorDef(d.major.replace(/^(Master's|PhD) in /, ""))).filter(Boolean)[0];
    f += 0.05 + ((md?.pay ?? 1) - 1) * 0.25;
  }
  const top = Math.max(...degs.map((d) => institutionByName(d.school)?.prestige ?? 40));
  f += Math.max(0, (top - 60)) / 400;
  if (bestLevel(c) >= 3) f += 0.06;
  return Math.max(0.9, Math.min(1.35, f));
}
