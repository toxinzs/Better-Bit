import { Company, CompanySize, RegionKey } from "../types";
import { NAME_POOLS } from "./names";

// Employers are generated, never hand-listed: every job listing gets a
// company whose name, size, culture and perks are derived (deterministically)
// from a seed, so the same listing always shows the same company.

export function hashKey(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function rngFrom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T,>(r: () => number, xs: T[]): T => xs[Math.floor(r() * xs.length)];

type Pool = { first: string[]; second: string[]; industry: string };

const POOLS: Record<string, Pool> = {
  "Retail & Service": { industry: "Retail", first: ["Corner", "Maple", "Value", "Urban", "Sunrise", "Harbor", "Bright", "Fresh"], second: ["Mart", "Goods", "Market", "Outfitters", "Supply", "Stores", "Emporium"] },
  "Food & Hospitality": { industry: "Food & drink", first: ["Golden", "Copper", "Little", "Blue", "Hearth", "Salt", "Rosemary", "Ember"], second: ["Kitchen", "Grill", "Cafe", "Bakehouse", "Bistro", "Diner", "Roastery"] },
  "Outdoors & Trades": { industry: "Trades & outdoors", first: ["Ironside", "Greenfield", "Summit", "Keystone", "Oakridge", "Cornerstone", "Northwind", "Redwood"], second: ["Contracting", "Landscapes", "Works", "Builders", "Services", "Garage", "Supply"] },
  Logistics: { industry: "Logistics", first: ["Swift", "Meridian", "Crossroads", "Atlas", "Harbourline", "Rapid", "Fleet"], second: ["Freight", "Logistics", "Couriers", "Distribution", "Haulage", "Express"] },
  "Office & Admin": { industry: "Business services", first: ["Pinnacle", "Clearview", "Anchor", "Beacon", "Lattice", "Northgate"], second: ["Partners", "Group", "Solutions", "Associates", "Services"] },
  "Finance & Business": { industry: "Finance & business", first: ["Sterling", "Granite", "Halcyon", "Redfern", "Union", "Meridian", "Ashford"], second: ["Financial", "Capital", "Advisory", "Holdings", "Bank", "& Partners", "Realty"] },
  Tech: { industry: "Technology", first: ["Nimbus", "Quanta", "Pixel", "Vertex", "Lumen", "Cobalt", "Orbit", "Kite"], second: ["Labs", "Systems", "Software", "Digital", "Cloud", "Works", "Tech"] },
  Healthcare: { industry: "Healthcare", first: ["St. Anne's", "Riverside", "Mercy", "Northfield", "Lakeview", "Evergreen", "Unity"], second: ["Hospital", "Medical Centre", "Clinic", "Health", "Care Group", "Pharmacy"] },
  "Education & Care": { industry: "Education & care", first: ["Oakwood", "Willowbrook", "Bright Futures", "Hillcrest", "Kingsley", "Riverbend", "Sunnybank"], second: ["School", "Academy", "Learning Centre", "Camp", "Library", "Nursery"] },
  "Public Service": { industry: "Public service", first: ["City of", "County", "Metro", "Regional", "State", "Harbour District"], second: ["Police Department", "Fire Service", "Social Services", "Public Defender's Office", "Council", "Authority"] },
  "Creative & Media": { industry: "Creative & media", first: ["Paperplane", "Studio", "Lantern", "Indigo", "Motif", "Halftone", "Echo"], second: ["Studio", "Media", "Creative", "Pictures", "Press", "Collective"] },
};

const SIZES: { size: CompanySize; weight: number }[] = [
  { size: "Small business", weight: 45 },
  { size: "Mid-size", weight: 30 },
  { size: "Large company", weight: 18 },
  { size: "Corporation", weight: 7 },
];

const CULTURES = [
  "Friendly and informal - everyone knows everyone.",
  "Fast-paced and busy - you learn quickly or you don't.",
  "Family-run, and it feels like it.",
  "Professional and structured, with clear rules.",
  "Laid-back, with flexible shifts.",
  "Ambitious - people here are always going somewhere.",
  "Old-school and stable, with lifers on the payroll.",
  "Young, loud and a little chaotic in a good way.",
];

const BENEFITS: Record<CompanySize, string[]> = {
  "Small business": ["Staff discount", "Flexible shifts", "Free meals on shift", "Friendly team"],
  "Mid-size": ["Paid holidays", "Staff discount", "Training budget", "Overtime pay"],
  "Large company": ["Paid holidays", "Health cover", "Pension match", "Training programmes", "Career ladder"],
  Corporation: ["Health cover", "Pension match", "Bonus scheme", "Relocation help", "Career ladder", "Learning stipend"],
};

const COMMUTES = ["A 10-minute walk", "12 minutes by bus", "20 minutes by car", "25 minutes by train", "A 35-minute commute", "15 minutes by bike", "Right around the corner"];

const STAR_BASE: Record<CompanySize, number> = { "Small business": 3.6, "Mid-size": 3.5, "Large company": 3.4, Corporation: 3.3 };

// jobs whose employer should sound like the job (a library page works at a
// library, not "Torres's Camp")
const VENUE_BY_TITLE: Record<string, string[]> = {
  "Library Page": ["Public Library", "Library"],
  "Camp Counselor": ["Adventure Camp", "Summer Camp"],
  Lifeguard: ["Aquatic Centre", "Swim & Leisure"],
  "Cinema Usher": ["Cinema", "Picture House"],
  "Farm Hand": ["Farm", "Orchard"],
  Barista: ["Coffee House", "Roastery"],
  "Bakery Counter Assistant": ["Bakehouse", "Bakery"],
  "Dog Groomer's Assistant": ["Pet Spa", "Grooming Parlour"],
  "Grocery Bagger & Stocker": ["Grocers", "Supermarket"],
  "Fast Food Crew Member": ["Burgers", "Diner", "Grill"],
  "Tutor's Aide": ["Tutoring", "Learning Centre"],
  "Music Store Clerk": ["Music", "Guitars & Keys"],
  "Retail Associate": ["Outfitters", "Goods", "Stores"],
  "Retail Associate (Full-time)": ["Outfitters", "Goods", "Stores"],
  "Hotel Front Desk Agent": ["Hotel", "Inn", "Suites"],
  "Real Estate Agent": ["Realty", "Estates", "Property Group"],
  "Bank Teller": ["Bank", "Credit Union"],
  Accountant: ["Accounting", "Advisory"],
  Lawyer: ["Law Offices", "Legal"],
  Photographer: ["Photography", "Studio"],
  "Session Musician": ["Records", "Studios"],
  Actor: ["Theatre", "Productions"],
  Landscaper: ["Landscapes", "Garden Services"],
  Electrician: ["Electric", "Electrical Services"],
  Plumber: ["Plumbing", "Plumbing & Heating"],
  Carpenter: ["Joinery", "Carpentry"],
  "Auto Mechanic": ["Garage", "Auto Repair"],
  Welder: ["Fabrication", "Metalworks"],
  "IT Support Technician": ["IT Services", "Tech Support"],
  "Data Analyst": ["Analytics", "Insights"],
  "Web Designer": ["Studio", "Digital"],
  "Software Engineer": ["Software", "Labs", "Systems"],
  Journalist: ["News", "Press", "Media"],
  "Human Resources Officer": ["Group", "Partners"],
  "Marketing Manager": ["Brand Studio", "Marketing Group"],
  "Police Officer": ["Police Department"],
  Firefighter: ["Fire Service"],
  "Social Worker": ["Social Services"],
  Pharmacist: ["Pharmacy"],
  Doctor: ["Hospital", "Medical Centre"],
  Nurse: ["Hospital", "Health Centre"],
  "Nursing Assistant": ["Care Home", "Health Centre"],
  "Teaching Assistant": ["School", "Academy"],
  Teacher: ["School", "Academy"],
  "Line Cook": ["Kitchen", "Grill", "Bistro"],
  Chef: ["Kitchen", "Restaurant", "Bistro"],
  "Truck Driver": ["Freight", "Haulage"],
  "Delivery Driver": ["Couriers", "Express"],
  "Food Delivery Rider": ["Eats", "Couriers"],
  "Warehouse Worker": ["Distribution", "Logistics"],
  "Warehouse Packer": ["Distribution", "Fulfilment"],
};

export function companyFor(field: string, region: RegionKey | undefined, seedKey: string, title?: string): Company {
  const r = rngFrom(hashKey(seedKey));
  const pool = POOLS[field] ?? POOLS["Office & Admin"];
  let size: CompanySize = "Small business";
  const total = SIZES.reduce((s, x) => s + x.weight, 0);
  let roll = r() * total;
  for (const s of SIZES) {
    roll -= s.weight;
    if (roll <= 0) {
      size = s.size;
      break;
    }
  }
  // family-run places carry a local surname
  const familyRun = size === "Small business" && r() < 0.4 && field !== "Public Service" && field !== "Healthcare";
  const surname = pick(r, NAME_POOLS[region ?? "us"].last);
  const suffix = pick(r, (title && VENUE_BY_TITLE[title]) || pool.second);
  let name: string;
  if (pool.first[0] === "City of" || pool.first.includes("County")) name = `${pick(r, pool.first)} ${pick(r, ["Ashbury", "Northport", "Redhill", "Lakeside", "Marlow", "Brookfield"])} ${suffix}`;
  else if (familyRun) name = `${surname}'s ${suffix.replace(/^& /, "")}`;
  else name = `${pick(r, pool.first)} ${suffix}`;
  const culture = pick(r, CULTURES);
  const perks = BENEFITS[size].slice();
  const benefits: string[] = [];
  const n = 2 + Math.floor(r() * 2);
  while (benefits.length < n && perks.length) benefits.push(perks.splice(Math.floor(r() * perks.length), 1)[0]);
  const stars = Math.round(Math.max(1, Math.min(5, STAR_BASE[size] + (r() - 0.5) * 1.6)) * 2) / 2;
  const blurbs: Record<CompanySize, string[]> = {
    "Small business": [`${name} is a local ${pool.industry.toLowerCase()} business with a loyal customer base.`, `A well-liked neighbourhood ${pool.industry.toLowerCase()} spot that's been going for years.`],
    "Mid-size": [`${name} is a regional ${pool.industry.toLowerCase()} company with a handful of sites and a solid reputation.`, `${name} has grown steadily and keeps hiring.`],
    "Large company": [`${name} is a large ${pool.industry.toLowerCase()} employer with sites across the region.`, `A big name in local ${pool.industry.toLowerCase()} - hard to get into, easy to build a career at.`],
    Corporation: [`${name} is a national ${pool.industry.toLowerCase()} corporation with thousands of staff.`, `${name} is one of the country's best-known employers - competitive to join.`],
  };
  return {
    name,
    industry: pool.industry,
    size,
    blurb: pick(r, blurbs[size]),
    culture,
    benefits,
    commute: pick(r, COMMUTES),
    stars,
  };
}

const INTERVIEWER_FIRST = ["Marta", "Devon", "Priya", "Owen", "Tunde", "Keiko", "Luca", "Amara", "Sam", "Rosa", "Idris", "Hana", "Cole", "Nadia"];
const INTERVIEWER_ROLES = ["Hiring Manager", "Store Manager", "Team Lead", "HR Coordinator", "Shift Supervisor", "Department Head", "Owner"];
export type Humour = "warm" | "dry" | "stern" | "goofy";

export type Interviewer = { name: string; role: string; humour: Humour; mood: "cheerful" | "neutral" | "rushed" | "tired" };

export function interviewerFor(company: Company, region: RegionKey | undefined, seedKey: string): Interviewer {
  const r = rngFrom(hashKey("iv:" + seedKey));
  const last = pick(r, NAME_POOLS[region ?? "us"].last);
  return {
    name: `${pick(r, INTERVIEWER_FIRST)} ${last}`,
    role: company.size === "Small business" && r() < 0.5 ? "Owner" : pick(r, INTERVIEWER_ROLES),
    humour: pick(r, ["warm", "warm", "dry", "stern", "goofy"] as Humour[]),
    mood: pick(r, ["cheerful", "neutral", "neutral", "rushed", "tired"] as const),
  };
}
