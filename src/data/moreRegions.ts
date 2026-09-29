import type { RegionDef } from "./regions";
import type { EduSystem } from "./education";
import type { ExamDef } from "./admissions";

// The seven countries added in 2.4. Legal ages, tax lean, wages and cost of
// living are approximations of the real country - flavour and balance, not law.

export const MORE_REGIONS: Record<"canada" | "australia" | "germany" | "france" | "india" | "mexico" | "southkorea", RegionDef> = {
  canada: {
    key: "canada", label: "Canada", healthcare: "public", workAge: { light: 12, parttime: 14, fulltime: 18 }, costOfLivingTier: "mid",
    startingWealthRange: [0, 350], legalAges: { drinking: 19, smoking: 19, gambling: 19, driving: 16, marriage: 18, consent: 16 }, drugsIllegal: false,
    marriagePressure: { strength: 0.15, minChildAge: 27 }, stateTaxRate: 0.07, jobMultiplier: 0.92,
    skinTonePalette: ["#f1c27d", "#ffdbac", "#e0ac69", "#c68642", "#8d5524", "#a86432"],
    appearanceFlavor: ["is unfailingly polite, even when annoyed", "owns a suspicious number of flannel shirts", "says sorry to furniture", "has a calm, friendly way about them", "always seems to have a coffee in hand"],
  },
  australia: {
    key: "australia", label: "Australia", healthcare: "mixed", workAge: { light: 12, parttime: 14, fulltime: 18 }, costOfLivingTier: "high",
    startingWealthRange: [0, 450], legalAges: { drinking: 18, smoking: 18, gambling: 18, driving: 17, marriage: 18, consent: 16 }, drugsIllegal: true,
    marriagePressure: { strength: 0.15, minChildAge: 27 }, stateTaxRate: 0.08, jobMultiplier: 1.05,
    skinTonePalette: ["#f1c27d", "#ffdbac", "#e0ac69", "#c68642", "#8d5524", "#a86432"],
    appearanceFlavor: ["has a sun-weathered, easygoing look", "is quick with a joke and slow to get rattled", "lives in thongs and sunscreen", "treats every stranger like a mate", "always seems one barbecue away from happy"],
  },
  germany: {
    key: "germany", label: "Germany", healthcare: "public", workAge: { light: 13, parttime: 15, fulltime: 18 }, costOfLivingTier: "mid",
    startingWealthRange: [0, 350], legalAges: { drinking: 16, smoking: 18, gambling: 18, driving: 18, marriage: 18, consent: 14 }, drugsIllegal: true,
    marriagePressure: { strength: 0.1, minChildAge: 28 }, stateTaxRate: 0.11, jobMultiplier: 0.92,
    skinTonePalette: ["#ffdbac", "#f1c27d", "#e0ac69", "#c68642", "#a86432"],
    appearanceFlavor: ["is punctual to the minute and proud of it", "has firm opinions about recycling", "dresses practically and well", "has a dry, deadpan sense of humour", "takes a good bread very seriously"],
  },
  france: {
    key: "france", label: "France", healthcare: "public", workAge: { light: 14, parttime: 16, fulltime: 18 }, costOfLivingTier: "mid",
    startingWealthRange: [0, 320], legalAges: { drinking: 18, smoking: 18, gambling: 18, driving: 18, marriage: 18, consent: 15 }, drugsIllegal: true,
    marriagePressure: { strength: 0.12, minChildAge: 27 }, stateTaxRate: 0.13, jobMultiplier: 0.86,
    skinTonePalette: ["#ffdbac", "#f1c27d", "#e0ac69", "#c68642", "#8d5524", "#a86432"],
    appearanceFlavor: ["makes even a plain outfit look intentional", "has strong opinions about lunch", "shrugs with real conviction", "argues for the joy of it", "is unhurried about everything but bread"],
  },
  india: {
    key: "india", label: "India", healthcare: "mixed", workAge: { light: 12, parttime: 14, fulltime: 18 }, costOfLivingTier: "low",
    startingWealthRange: [0, 100], legalAges: { drinking: 21, smoking: 21, gambling: 21, driving: 18, marriage: 21, consent: 18 }, drugsIllegal: true,
    marriagePressure: { strength: 0.8, minChildAge: 23 }, stateTaxRate: 0, jobMultiplier: 0.3,
    skinTonePalette: ["#c68642", "#a86432", "#8d5524", "#e0ac69", "#5c3317"],
    appearanceFlavor: ["has a warmth that fills a room", "talks about family in every other sentence", "is always being fed something", "carries themselves with quiet pride", "can bargain with a smile"],
  },
  mexico: {
    key: "mexico", label: "Mexico", healthcare: "mixed", workAge: { light: 12, parttime: 15, fulltime: 18 }, costOfLivingTier: "low",
    startingWealthRange: [0, 130], legalAges: { drinking: 18, smoking: 18, gambling: 18, driving: 18, marriage: 18, consent: 15 }, drugsIllegal: true,
    marriagePressure: { strength: 0.6, minChildAge: 23 }, stateTaxRate: 0.02, jobMultiplier: 0.38,
    skinTonePalette: ["#c68642", "#a86432", "#e0ac69", "#8d5524", "#f1c27d"],
    appearanceFlavor: ["has a laugh that starts everyone else off", "loves a long Sunday lunch", "is generous to a fault", "dresses up for even a small occasion", "has a story for every street corner"],
  },
  southkorea: {
    key: "southkorea", label: "South Korea", healthcare: "mixed", workAge: { light: 13, parttime: 15, fulltime: 18 }, costOfLivingTier: "mid",
    startingWealthRange: [0, 350], legalAges: { drinking: 19, smoking: 19, gambling: 19, driving: 18, marriage: 18, consent: 16 }, drugsIllegal: true,
    marriagePressure: { strength: 0.55, minChildAge: 25 }, stateTaxRate: 0.04, jobMultiplier: 0.78,
    skinTonePalette: ["#ffdbac", "#f1c27d", "#e0ac69", "#ecc094"],
    appearanceFlavor: ["is immaculately put together", "works impossibly hard and rarely admits it", "is fluent in skincare and memes", "bows without thinking about it", "has a quiet, sharp sense of style"],
  },
};

export const MORE_EDU: Record<"canada" | "australia" | "germany" | "france" | "india" | "mexico" | "southkorea", EduSystem> = {
  canada: { stageNames: { elementary: "Elementary School", middle: "Middle School", high: "High School" }, gradeStyle: "letter", gradeWord: "GPA", leavingAge: 16, exams: ["Provincial exams", "SAT (some schools)"], blurb: "Letter grades and a diploma, with university applications built on your final-year marks." },
  australia: { stageNames: { elementary: "Primary School", middle: "Junior Secondary", high: "Senior Secondary" }, gradeStyle: "letter", gradeWord: "GPA", leavingAge: 17, exams: ["ATAR"], blurb: "Year 12 ends with a single rank, the ATAR, that decides your university course." },
  germany: { stageNames: { elementary: "Grundschule", middle: "Sekundarstufe I", high: "Gymnasium" }, gradeStyle: "five", gradeWord: "Note", leavingAge: 16, exams: ["Abitur"], blurb: "The Abitur is your ticket to university - and a six-point grading scale where lower is better." },
  france: { stageNames: { elementary: "École primaire", middle: "Collège", high: "Lycée" }, gradeStyle: "ten", gradeWord: "Moyenne", leavingAge: 16, exams: ["Baccalauréat"], blurb: "Grades out of 20, and the Baccalauréat waiting at the end." },
  india: { stageNames: { elementary: "Primary School", middle: "Middle School", high: "Senior Secondary" }, gradeStyle: "waec", gradeWord: "Average", leavingAge: 14, exams: ["Board exams", "JEE / NEET"], blurb: "Board exams at 16 and 18, and entrance tests where a single mark can change your life." },
  mexico: { stageNames: { elementary: "Primaria", middle: "Secundaria", high: "Preparatoria" }, gradeStyle: "ten", gradeWord: "Promedio", leavingAge: 15, exams: ["COMIPEMS", "University entrance exam"], blurb: "Grades out of ten and competitive entrance exams for the best public schools." },
  southkorea: { stageNames: { elementary: "Elementary School", middle: "Middle School", high: "High School" }, gradeStyle: "five", gradeWord: "Average", leavingAge: 15, exams: ["Suneung (CSAT)"], blurb: "Long school days, night-time hagwon cram schools, and one exam day that can define your future." },
};

export const MORE_EXAMS: Record<"canada" | "australia" | "germany" | "france" | "india" | "mexico" | "southkorea", ExamDef> = {
  canada: { name: "Provincial Diploma Exams", blurb: "Final-year exams that count towards your diploma and university admission.", cost: 40, minAge: 16 },
  australia: { name: "ATAR", blurb: "A single ranking out of 99.95 built from your Year 12 results.", cost: 0, minAge: 17 },
  germany: { name: "Abitur", blurb: "The final school-leaving exam, and your entry to university.", cost: 0, minAge: 17 },
  france: { name: "Baccalauréat", blurb: "The national exam at the end of lycée. Results decide your options.", cost: 0, minAge: 17 },
  india: { name: "JEE / NEET", blurb: "Highly competitive entrance tests taken by millions for the best courses.", cost: 25, minAge: 17 },
  mexico: { name: "University Entrance Exam", blurb: "Public universities admit almost entirely on this exam.", cost: 30, minAge: 17 },
  southkorea: { name: "Suneung (CSAT)", blurb: "One exam day every November. The whole country goes quiet for it.", cost: 40, minAge: 17 },
};

export const MORE_PREP: Record<"canada" | "australia" | "germany" | "france" | "india" | "mexico" | "southkorea", number> = {
  canada: 250, australia: 350, germany: 150, france: 200, india: 80, mexico: 100, southkorea: 800,
};

export const MORE_CLASS_WEIGHTS: Record<string, number[]> = {
  canada: [8, 26, 38, 21, 7],
  australia: [8, 25, 38, 22, 7],
  germany: [6, 24, 42, 22, 6],
  france: [8, 26, 38, 21, 7],
  india: [32, 34, 20, 10, 4],
  mexico: [28, 34, 24, 10, 4],
  southkorea: [6, 24, 42, 22, 6],
};
