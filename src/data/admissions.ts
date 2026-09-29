import { RegionKey } from "../types";
import { MORE_EXAMS, MORE_PREP } from "./moreRegions";

// The entrance exam each country's applicants sit, and how its score is shown.
// The engine works in 0-100; only the label differs.

export type ExamDef = { name: string; blurb: string; cost: number; minAge: number };

const CORE_EXAMS = {
  us: { name: "SAT", blurb: "The standardised test most American universities ask for.", cost: 60, minAge: 16 },
  uk: { name: "A-levels", blurb: "Your final exams. Universities make offers on your predicted grades and results.", cost: 0, minAge: 17 },
  nigeria: { name: "JAMB", blurb: "The national entrance exam. Every university sets its own cut-off mark.", cost: 20, minAge: 16 },
  japan: { name: "Common University Entrance Exam", blurb: "A national exam every applicant sits in January, before the school's own tests.", cost: 150, minAge: 17 },
  brazil: { name: "ENEM", blurb: "The national exam that feeds almost every public university's admission.", cost: 30, minAge: 16 },
};

export const EXAMS: Record<RegionKey, ExamDef> = { ...(CORE_EXAMS as unknown as Record<"us" | "uk" | "nigeria" | "japan" | "brazil", ExamDef>), ...MORE_EXAMS };

export function formatExam(region: RegionKey | undefined, score: number): string {
  const s = Math.max(0, Math.min(100, score));
  switch (region ?? "us") {
    case "us":
      return String(Math.round((400 + s * 12) / 10) * 10);
    case "uk": {
      const grades = ["E", "D", "C", "B", "A", "A*"];
      const g = (n: number) => grades[Math.max(0, Math.min(5, n))];
      const base = Math.floor(s / 17);
      return `${g(base + (s % 17 > 8 ? 1 : 0))}${g(base)}${g(base - (s % 17 > 12 ? 0 : 1))}`;
    }
    case "nigeria":
      return `${Math.round(120 + s * 2.8)} / 400`;
    case "japan":
      return `${Math.round(s * 9)} / 900`;
    case "brazil":
      return `${Math.round(350 + s * 6.5)} / 1000`;
    case "canada":
      return `${Math.round(55 + s * 0.45)}%`;
    case "australia":
      return (Math.round((30 + s * 0.7) * 20) / 20).toFixed(2);
    case "germany":
      return (4 - s * 0.03).toFixed(1);
    case "france":
      return `${(6 + s * 0.14).toFixed(1)} / 20`;
    case "india":
      return `${Math.round(s * 3)} percentile-ish / 300`;
    case "mexico":
      return `${Math.round(60 + s * 1.4)} / 200`;
    case "southkorea":
      return `${Math.round(s * 4)} / 400`;
  }
}

export const PREP_COST: Record<RegionKey, number> = { us: 400, uk: 300, nigeria: 60, japan: 900, brazil: 120, ...MORE_PREP };
