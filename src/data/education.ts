import { EducationStage, RegionKey, SchoolKind, TalentKey } from "../types";
import { NAME_POOLS } from "./names";
import { hashKey, rngFrom } from "./companies";

// How schooling looks in each country: what the stages are called, how grades
// are shown, and (for the admissions release) which exams they sit. The engine
// works in 0-100 scores and a 4.0 GPA everywhere; only the labels differ.

export type EduSystem = {
  stageNames: Record<"elementary" | "middle" | "high", string>;
  gradeStyle: "letter" | "gcse" | "five" | "waec" | "ten";
  gradeWord: string; // "GPA", "Average"...
  leavingAge: number; // youngest you may leave school
  exams: string[]; // headline exams (used by the admissions release)
  blurb: string;
};

export const EDU_SYSTEMS: Record<RegionKey, EduSystem> = {
  us: {
    stageNames: { elementary: "Elementary School", middle: "Middle School", high: "High School" },
    gradeStyle: "letter", gradeWord: "GPA", leavingAge: 16, exams: ["SAT", "ACT", "AP exams"],
    blurb: "Letter grades, a 4.0 GPA, and the SAT/ACT waiting at the end.",
  },
  uk: {
    stageNames: { elementary: "Primary School", middle: "Secondary School", high: "Secondary School / Sixth Form" },
    gradeStyle: "gcse", gradeWord: "Average", leavingAge: 18, exams: ["GCSEs", "A-levels"],
    blurb: "GCSEs at 16, A-levels at 18, and UCAS to get to university.",
  },
  nigeria: {
    stageNames: { elementary: "Primary School", middle: "Junior Secondary School", high: "Senior Secondary School" },
    gradeStyle: "waec", gradeWord: "Average", leavingAge: 15, exams: ["WAEC", "JAMB"],
    blurb: "WAEC results decide a lot, and JAMB is the gate to university.",
  },
  japan: {
    stageNames: { elementary: "Elementary School", middle: "Junior High School", high: "High School" },
    gradeStyle: "five", gradeWord: "Average", leavingAge: 15, exams: ["High school entrance exams", "University entrance exams"],
    blurb: "Entrance exams at every step, after-school juku, and a 5-point grade scale.",
  },
  brazil: {
    stageNames: { elementary: "Ensino Fundamental", middle: "Ensino Fundamental II", high: "Ensino Médio" },
    gradeStyle: "ten", gradeWord: "Média", leavingAge: 15, exams: ["ENEM", "Vestibular"],
    blurb: "Grades out of ten, and the ENEM decides where you go next.",
  },
};

export const eduSystem = (region?: RegionKey) => EDU_SYSTEMS[region ?? "us"];

export function stageLabel(region: RegionKey | undefined, stage: EducationStage): string {
  const sys = eduSystem(region);
  if (stage === "elementary" || stage === "middle" || stage === "high") return sys.stageNames[stage];
  return { none: "Not in school yet", college: "College / University", graduated: "Not enrolled" }[stage];
}

// score 0-100 -> the label your country would print
export function gradeLabel(region: RegionKey | undefined, score: number): string {
  const s = Math.max(0, Math.min(100, score));
  switch (eduSystem(region).gradeStyle) {
    case "letter":
      return s >= 97 ? "A+" : s >= 93 ? "A" : s >= 90 ? "A-" : s >= 87 ? "B+" : s >= 83 ? "B" : s >= 80 ? "B-" : s >= 77 ? "C+" : s >= 73 ? "C" : s >= 70 ? "C-" : s >= 60 ? "D" : "F";
    case "gcse":
      return `Grade ${s >= 92 ? 9 : s >= 85 ? 8 : s >= 78 ? 7 : s >= 70 ? 6 : s >= 62 ? 5 : s >= 54 ? 4 : s >= 44 ? 3 : s >= 30 ? 2 : 1}`;
    case "five":
      return String(s >= 88 ? 5 : s >= 74 ? 4 : s >= 58 ? 3 : s >= 40 ? 2 : 1);
    case "waec":
      return s >= 75 ? `A1` : s >= 70 ? "B2" : s >= 65 ? "B3" : s >= 60 ? "C4" : s >= 55 ? "C5" : s >= 50 ? "C6" : s >= 45 ? "D7" : s >= 40 ? "E8" : "F9";
    case "ten":
      return (Math.round(s) / 10).toFixed(1);
  }
}

export const scoreToGpa = (score: number): number => {
  const s = Math.max(0, Math.min(100, score));
  return Math.round(Math.max(0, Math.min(4, (s - 53) / 10)) * 100) / 100;
};

// ---------------------------------------------------------------- subjects

export type SubjectDef = { key: string; label: string; talent: TalentKey; weight: number };

const ELEM: SubjectDef[] = [
  { key: "reading", label: "Reading & Writing", talent: "verbal", weight: 1 },
  { key: "math", label: "Maths", talent: "academic", weight: 1 },
  { key: "science", label: "Science", talent: "technical", weight: 0.8 },
  { key: "art", label: "Art & Music", talent: "artistic", weight: 0.6 },
  { key: "pe", label: "PE", talent: "athletic", weight: 0.6 },
];
const MIDDLE: SubjectDef[] = [
  { key: "english", label: "English", talent: "verbal", weight: 1 },
  { key: "math", label: "Maths", talent: "academic", weight: 1 },
  { key: "science", label: "Science", talent: "technical", weight: 1 },
  { key: "social", label: "Social Studies", talent: "verbal", weight: 0.8 },
  { key: "art", label: "Art & Music", talent: "artistic", weight: 0.5 },
  { key: "pe", label: "PE", talent: "athletic", weight: 0.5 },
];
const HIGH: SubjectDef[] = [
  { key: "english", label: "English", talent: "verbal", weight: 1 },
  { key: "math", label: "Maths", talent: "academic", weight: 1 },
  { key: "science", label: "Sciences", talent: "technical", weight: 1 },
  { key: "history", label: "History", talent: "verbal", weight: 0.8 },
  { key: "language", label: "Languages", talent: "social", weight: 0.7 },
  { key: "tech", label: "Computing & Tech", talent: "technical", weight: 0.5 },
  { key: "arts", label: "Arts & Music", talent: "artistic", weight: 0.5 },
  { key: "pe", label: "PE", talent: "athletic", weight: 0.4 },
];

export function subjectsFor(stage: EducationStage): SubjectDef[] {
  if (stage === "elementary") return ELEM;
  if (stage === "middle") return MIDDLE;
  return HIGH;
}

// ---------------------------------------------------------------- schools

export const SCHOOL_KINDS: Record<SchoolKind, { label: string; blurb: string; qualityBoost: number; tuition: number }> = {
  public: { label: "Public school", blurb: "Free and local. Quality depends on the area.", qualityBoost: 0, tuition: 0 },
  private: { label: "Private school", blurb: "Small classes, big fees.", qualityBoost: 18, tuition: 9000 },
  magnet: { label: "Magnet school", blurb: "Free, selective and academic. You need the grades to get in.", qualityBoost: 14, tuition: 0 },
  boarding: { label: "Boarding school", blurb: "You live there. Expensive, disciplined, and far from home.", qualityBoost: 22, tuition: 22000 },
  alternative: { label: "Alternative school", blurb: "For students who've been excluded elsewhere. A second chance.", qualityBoost: -12, tuition: 0 },
};

const PLACES = ["Ashbury", "Northport", "Redhill", "Lakeside", "Marlow", "Brookfield", "Oakdale", "Fairview", "Stonebridge", "Riverton", "Highgate", "Willowmere"];
const SUFFIX: Record<"elementary" | "middle" | "high", string[]> = {
  elementary: ["Elementary", "Primary School", "Junior School"],
  middle: ["Middle School", "Junior High", "Secondary School"],
  high: ["High School", "Academy", "Senior High", "College"],
};

export function schoolName(region: RegionKey | undefined, stage: "elementary" | "middle" | "high", kind: SchoolKind, seedKey: string): string {
  const r = rngFrom(hashKey("school:" + seedKey));
  const place = PLACES[Math.floor(r() * PLACES.length)];
  const last = NAME_POOLS[region ?? "us"].last;
  const surname = last[Math.floor(r() * last.length)];
  const suffix = SUFFIX[stage][Math.floor(r() * SUFFIX[stage].length)];
  if (kind === "private") return r() < 0.5 ? `St. ${surname}'s ${suffix}` : `${place} Preparatory ${suffix.replace(/^Junior /, "")}`;
  if (kind === "boarding") return `${surname} Hall Boarding ${suffix.includes("School") ? "School" : "Academy"}`;
  if (kind === "magnet") return `${place} Science & Arts ${suffix}`;
  if (kind === "alternative") return `${place} Second Chance Learning Centre`;
  return `${place} ${suffix}`;
}

// ---------------------------------------------------------------- social

export type CliqueDef = { key: string; blurb: string };
export const CLIQUE_INFO: Record<string, string> = {
  Jocks: "Sport, noise and a lot of energy. Fitness and popularity up - the books suffer.",
  Nerds: "Grades, games and inside jokes. You learn more - but you're not the most popular.",
  Artsy: "Bands, sketchbooks and thrift-store outfits. Happier and more creative.",
  Popular: "Parties and status. Everyone knows you - and it's exhausting.",
  Loners: "Your own company, mostly. Calmer, but lonelier and easy to overlook.",
};

// yearly effect of the crowd you run with
export const CLIQUE_EFFECT: Record<string, { pop: number; smarts: number; happy: number; stress: number; fitness: number }> = {
  Jocks: { pop: 2, smarts: -0.25, happy: 1, stress: 0, fitness: 3 },
  Nerds: { pop: -2, smarts: 0.6, happy: 0, stress: 2, fitness: -1 },
  Artsy: { pop: 0, smarts: 0, happy: 2, stress: -2, fitness: 0 },
  Popular: { pop: 4, smarts: -0.15, happy: 1, stress: 4, fitness: 0 },
  Loners: { pop: -3, smarts: 0.1, happy: -2, stress: -3, fitness: 0 },
};
