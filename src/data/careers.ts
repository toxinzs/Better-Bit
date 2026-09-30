import { TalentKey } from "../types";

// The shape of a career: what each rung of the ladder is called, what it pays
// and what it takes to reach it. Rung 0 is the job you're hired into; 5 is the
// top of the tree.

export const RUNG_MULT = [1, 1.25, 1.55, 1.95, 2.6, 4.0];
export const RUNG_NAMES = ["Entry", "Senior", "Lead", "Manager", "Director", "Executive"];
// years in the current role before you can move up from this rung
export const MIN_YEARS = [2, 3, 3, 4, 5];

// [manager, director, executive] for each field
export const FIELD_TOP: Record<string, [string, string, string]> = {
  "Retail & Service": ["Store Manager", "Regional Manager", "Director of Retail"],
  Logistics: ["Operations Supervisor", "Logistics Manager", "Head of Logistics"],
  "Outdoors & Trades": ["Foreman", "Site Manager", "Contracts Director"],
  "Office & Admin": ["Office Manager", "Operations Manager", "Chief Operating Officer"],
  "Finance & Business": ["Senior Manager", "Director of Finance", "Chief Financial Officer"],
  Tech: ["Engineering Manager", "Director of Engineering", "Chief Technology Officer"],
  "Creative & Media": ["Creative Lead", "Creative Director", "Chief Creative Officer"],
  Healthcare: ["Department Head", "Clinical Director", "Chief Medical Officer"],
  "Education & Care": ["Head of Department", "Head Teacher", "Superintendent"],
  "Public Service": ["Supervisor", "Chief", "Commissioner"],
  "Food & Hospitality": ["Kitchen Manager", "General Manager", "Director of Hospitality"],
};

// bespoke ladders for the professions that have one (rung 0..5)
export const CUSTOM_LADDER: Record<string, string[]> = {
  Doctor: ["Doctor", "Attending Physician", "Consultant", "Head of Department", "Medical Director", "Chief Medical Officer"],
  Lawyer: ["Lawyer", "Senior Associate", "Counsel", "Partner", "Managing Partner", "General Counsel"],
  Nurse: ["Nurse", "Senior Nurse", "Charge Nurse", "Ward Manager", "Director of Nursing", "Chief Nursing Officer"],
  Teacher: ["Teacher", "Senior Teacher", "Head of Year", "Head of Department", "Deputy Head", "Head Teacher"],
  "Software Engineer": ["Software Engineer", "Senior Software Engineer", "Staff Engineer", "Engineering Manager", "Director of Engineering", "Chief Technology Officer"],
  "Police Officer": ["Police Officer", "Senior Officer", "Sergeant", "Lieutenant", "Captain", "Chief of Police"],
  Firefighter: ["Firefighter", "Senior Firefighter", "Lieutenant", "Captain", "Battalion Chief", "Fire Chief"],
  Accountant: ["Accountant", "Senior Accountant", "Audit Manager", "Accounting Manager", "Finance Director", "Chief Financial Officer"],
  Chef: ["Chef", "Sous Chef", "Head Chef", "Kitchen Manager", "Executive Chef", "Culinary Director"],
  Journalist: ["Journalist", "Senior Journalist", "Correspondent", "Editor", "Editor-in-Chief", "Publisher"],
  Electrician: ["Electrician", "Master Electrician", "Lead Electrician", "Foreman", "Contracts Manager", "Company Owner"],
  "Marketing Manager": ["Marketing Manager", "Senior Marketing Manager", "Head of Marketing", "Marketing Director", "Vice President of Marketing", "Chief Marketing Officer"],
};

export function titleAt(baseTitle: string, field: string | undefined, rung: number): string {
  const clean = baseTitle.replace(/ \(Full-time\)$/, "");
  if (rung <= 0) return baseTitle;
  const custom = CUSTOM_LADDER[clean];
  if (custom) return custom[Math.min(rung, custom.length - 1)];
  if (rung === 1) return `Senior ${clean}`;
  if (rung === 2) return `Lead ${clean}`;
  const top = FIELD_TOP[field ?? ""] ?? ["Manager", "Director", "Executive"];
  return top[Math.min(rung - 3, 2)];
}

// which innate aptitude matters most in each field
export const FIELD_TALENT: Record<string, TalentKey> = {
  "Retail & Service": "social",
  Logistics: "technical",
  "Outdoors & Trades": "technical",
  "Office & Admin": "business",
  "Finance & Business": "business",
  Tech: "technical",
  "Creative & Media": "artistic",
  Healthcare: "academic",
  "Education & Care": "verbal",
  "Public Service": "social",
  "Food & Hospitality": "social",
};

// fields where a good year comes with a bonus
export const BONUS_FIELDS = ["Finance & Business", "Tech"];
