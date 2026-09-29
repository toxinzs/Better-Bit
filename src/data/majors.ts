import { TalentKey } from "../types";

// What you study. Every major sets how hard the degree is, which talent it
// leans on, how it pays, which job fields it opens - and the labels below
// are also what jobs ask for (a Doctor needs Medicine, a Nurse needs Nursing).

export type MajorDef = {
  label: string;
  field: string; // job field it lines up with (data/jobs.ts)
  also?: string[]; // other fields it's respected in
  difficulty: number; // 0-100: how demanding the coursework is
  talent: TalentKey;
  pay: number; // multiplier on what it adds to a starting salary
  stress: number; // extra yearly stress
  skill?: "coding" | "debate" | "art" | "music" | "acting" | "leadership" | "athletics";
  blurb: string;
};

export const MAJOR_DEFS: MajorDef[] = [
  { label: "Business", field: "Finance & Business", also: ["Office & Admin", "Retail & Service"], difficulty: 50, talent: "business", pay: 1.05, stress: 2, skill: "leadership", blurb: "Markets, management and how companies work." },
  { label: "Accounting", field: "Finance & Business", difficulty: 58, talent: "academic", pay: 1.08, stress: 4, blurb: "Precise, in demand and never out of work." },
  { label: "Finance", field: "Finance & Business", difficulty: 62, talent: "business", pay: 1.18, stress: 6, blurb: "Money, models and long hours." },
  { label: "Marketing", field: "Finance & Business", also: ["Creative & Media"], difficulty: 45, talent: "social", pay: 1.0, stress: 2, skill: "leadership", blurb: "Brands, campaigns and human psychology." },
  { label: "Economics", field: "Finance & Business", also: ["Public Service"], difficulty: 60, talent: "academic", pay: 1.1, stress: 4, blurb: "Why people and countries make the choices they do." },
  { label: "Computer Science", field: "Tech", difficulty: 68, talent: "technical", pay: 1.25, stress: 5, skill: "coding", blurb: "Algorithms, software and endless debugging." },
  { label: "Data Science", field: "Tech", also: ["Finance & Business"], difficulty: 66, talent: "technical", pay: 1.22, stress: 5, skill: "coding", blurb: "Statistics, code and telling stories with numbers." },
  { label: "Information Systems", field: "Tech", also: ["Office & Admin"], difficulty: 50, talent: "technical", pay: 1.05, stress: 3, skill: "coding", blurb: "Technology for business - the practical side of tech." },
  { label: "Engineering", field: "Tech", also: ["Outdoors & Trades"], difficulty: 75, talent: "technical", pay: 1.25, stress: 7, blurb: "Physics, maths and building things that work." },
  { label: "Civil Engineering", field: "Outdoors & Trades", also: ["Tech"], difficulty: 68, talent: "technical", pay: 1.12, stress: 5, blurb: "Bridges, roads and the structure of cities." },
  { label: "Architecture", field: "Creative & Media", also: ["Outdoors & Trades"], difficulty: 70, talent: "artistic", pay: 1.1, stress: 8, skill: "art", blurb: "Design studios and very little sleep." },
  { label: "Nursing", field: "Healthcare", difficulty: 62, talent: "social", pay: 1.1, stress: 6, blurb: "Clinical placements, care and real-world skills." },
  { label: "Biology", field: "Healthcare", also: ["Education & Care"], difficulty: 62, talent: "academic", pay: 1.0, stress: 4, blurb: "Life, labs and the route to medicine." },
  { label: "Medicine", field: "Healthcare", difficulty: 88, talent: "academic", pay: 1.6, stress: 10, blurb: "The long road to becoming a doctor." },
  { label: "Pharmacy", field: "Healthcare", difficulty: 74, talent: "academic", pay: 1.3, stress: 6, blurb: "Chemistry, patients and precision." },
  { label: "Psychology", field: "Education & Care", also: ["Public Service", "Healthcare"], difficulty: 50, talent: "social", pay: 0.95, stress: 3, blurb: "Minds, behaviour and how to help." },
  { label: "Sociology", field: "Public Service", also: ["Education & Care"], difficulty: 42, talent: "verbal", pay: 0.9, stress: 2, blurb: "Society, inequality and why groups behave as they do." },
  { label: "Criminal Justice", field: "Public Service", difficulty: 45, talent: "social", pay: 0.95, stress: 3, blurb: "Policing, law and the courts." },
  { label: "Political Science", field: "Public Service", also: ["Finance & Business"], difficulty: 52, talent: "verbal", pay: 1.0, stress: 3, skill: "debate", blurb: "Power, policy and elections." },
  { label: "Law", field: "Public Service", difficulty: 82, talent: "verbal", pay: 1.55, stress: 9, skill: "debate", blurb: "Reading, arguing, and being right on paper." },
  { label: "Education", field: "Education & Care", difficulty: 42, talent: "social", pay: 0.95, stress: 3, blurb: "How people learn - and how to teach them." },
  { label: "English", field: "Creative & Media", also: ["Education & Care"], difficulty: 48, talent: "verbal", pay: 0.92, stress: 3, skill: "debate", blurb: "Books, writing and close reading." },
  { label: "History", field: "Education & Care", also: ["Creative & Media"], difficulty: 46, talent: "verbal", pay: 0.9, stress: 2, blurb: "Archives, arguments and old maps." },
  { label: "Philosophy", field: "Public Service", also: ["Education & Care"], difficulty: 50, talent: "verbal", pay: 0.9, stress: 2, skill: "debate", blurb: "Big questions with no answer key." },
  { label: "Fine Arts", field: "Creative & Media", difficulty: 40, talent: "artistic", pay: 0.85, stress: 3, skill: "art", blurb: "Studio time, critiques and a lot of paint." },
  { label: "Music", field: "Creative & Media", difficulty: 48, talent: "musical", pay: 0.85, stress: 4, skill: "music", blurb: "Practice rooms, recitals and theory." },
  { label: "Theatre & Film", field: "Creative & Media", difficulty: 44, talent: "verbal", pay: 0.85, stress: 4, skill: "acting", blurb: "Stages, sets and shoestring productions." },
  { label: "Journalism", field: "Creative & Media", difficulty: 48, talent: "verbal", pay: 0.95, stress: 5, skill: "debate", blurb: "Deadlines, sources and the truth." },
  { label: "Environmental Science", field: "Outdoors & Trades", also: ["Public Service"], difficulty: 56, talent: "academic", pay: 1.0, stress: 3, blurb: "Ecosystems, climate and fieldwork." },
  { label: "Physics", field: "Tech", also: ["Education & Care"], difficulty: 80, talent: "academic", pay: 1.15, stress: 6, blurb: "The rules the universe runs on." },
  { label: "Mathematics", field: "Tech", also: ["Finance & Business", "Education & Care"], difficulty: 78, talent: "academic", pay: 1.12, stress: 5, blurb: "Proofs, patterns and pure thinking." },
  { label: "Hospitality Management", field: "Food & Hospitality", difficulty: 38, talent: "social", pay: 0.95, stress: 3, blurb: "Hotels, events and the guest experience." },
  { label: "Sports Science", field: "Education & Care", also: ["Healthcare"], difficulty: 46, talent: "athletic", pay: 0.95, stress: 2, skill: "athletics", blurb: "Bodies, performance and coaching." },
];

export const MAJORS = MAJOR_DEFS.map((m) => m.label);
export const majorDef = (label: string) => MAJOR_DEFS.find((m) => m.label === label);
