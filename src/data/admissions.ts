import { RegionKey } from "../types";

// The entrance exam each country's applicants sit, and how its score is shown.
// The engine works in 0-100; only the label differs.

export type ExamDef = { name: string; blurb: string; cost: number; minAge: number };

export const EXAMS: Record<RegionKey, ExamDef> = {
  us: { name: "SAT", blurb: "The standardised test most American universities ask for.", cost: 60, minAge: 16 },
  uk: { name: "A-levels", blurb: "Your final exams. Universities make offers on your predicted grades and results.", cost: 0, minAge: 17 },
  nigeria: { name: "JAMB", blurb: "The national entrance exam. Every university sets its own cut-off mark.", cost: 20, minAge: 16 },
  japan: { name: "Common University Entrance Exam", blurb: "A national exam every applicant sits in January, before the school's own tests.", cost: 150, minAge: 17 },
  brazil: { name: "ENEM", blurb: "The national exam that feeds almost every public university's admission.", cost: 30, minAge: 16 },
};

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
  }
}

export const PREP_COST: Record<RegionKey, number> = { us: 400, uk: 300, nigeria: 60, japan: 900, brazil: 120 };
