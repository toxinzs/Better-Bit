import { TalentKey, WealthClass } from "../types";

// Who you are: quirks, talents and the family you're born into. Everything
// here is read by the engine (engine/character.ts) - nothing decorative.

export type QuirkDef = { key: string; label: string; blurb: string };

export const QUIRKS: QuirkDef[] = [
  { key: "perfectionist", label: "Perfectionist", blurb: "Sweats the details. Grades come easier; peace of mind doesn't." },
  { key: "risk-taker", label: "Risk-taker", blurb: "Lives for the thrill. Sometimes the thrill bites back." },
  { key: "bookworm", label: "Bookworm", blurb: "Always got a book. Your mind keeps growing." },
  { key: "social-butterfly", label: "Social butterfly", blurb: "Friendships stay warm without much effort." },
  { key: "night-owl", label: "Night owl", blurb: "Best at midnight, worst at breakfast. Sleep pays the price." },
  { key: "early-bird", label: "Early bird", blurb: "Up with the sun, and it shows in your health." },
  { key: "big-hearted", label: "Big-hearted", blurb: "People feel cared for around you. Bonds deepen on their own." },
  { key: "worrier", label: "Worrier", blurb: "Your mind runs the what-ifs. Stress builds up." },
  { key: "thrifty", label: "Thrifty", blurb: "Money sticks to you. Savings quietly grow." },
  { key: "spendthrift", label: "Spendthrift", blurb: "Money burns a hole in your pocket." },
  { key: "fitness-nut", label: "Fitness nut", blurb: "Movement is a habit. Health and looks hold up." },
  { key: "hot-headed", label: "Hot-headed", blurb: "Quick to snap. Tempers cost you, sometimes." },
];

export const quirkDef = (key: string) => QUIRKS.find((q) => q.key === key);

export const TALENTS: { key: TalentKey; label: string; blurb: string }[] = [
  { key: "academic", label: "Academic", blurb: "Learning comes easy - school, exams, big ideas." },
  { key: "artistic", label: "Artistic", blurb: "An eye for colour, shape and making things." },
  { key: "athletic", label: "Athletic", blurb: "A body that takes to sport and fights off illness." },
  { key: "musical", label: "Musical", blurb: "Rhythm, pitch and the pull of a good song." },
  { key: "social", label: "Social", blurb: "Reading a room and being liked in it." },
  { key: "technical", label: "Technical", blurb: "Tinkering, machines, code and how things work." },
  { key: "business", label: "Business", blurb: "A nose for money, deals and getting paid." },
  { key: "verbal", label: "Verbal", blurb: "Words, persuasion and telling a story." },
];

export const talentWord = (v: number) => (v >= 80 ? "Gifted" : v >= 62 ? "Strong" : v >= 40 ? "Average" : "Weak");

export const CLASSES: Record<WealthClass, { label: string; blurb: string; moneyFactor: number; allowance: number; wealth: [number, number]; jobs: string[]; values: string[] }> = {
  struggling: {
    label: "Struggling",
    blurb: "Money is always tight. Every dollar has a job before it arrives.",
    moneyFactor: 0.2,
    allowance: 0,
    wealth: [6, 20],
    jobs: ["Cleaner", "Day labourer", "Cashier", "Security guard", "Delivery driver", "Between jobs"],
    values: ["Work hard, expect little, and look after your own.", "Get through today; tomorrow will do what it does."],
  },
  working: {
    label: "Working class",
    blurb: "Steady work, careful budgets, and pride in earning your keep.",
    moneyFactor: 0.6,
    allowance: 60,
    wealth: [22, 40],
    jobs: ["Mechanic", "Electrician", "Truck driver", "Bus driver", "Warehouse lead", "Barber", "Chef", "Farmer"],
    values: ["An honest day's work is worth more than a fancy title.", "Family first, then everything else."],
  },
  middle: {
    label: "Middle class",
    blurb: "Comfortable enough, with room for lessons, trips and a plan.",
    moneyFactor: 1,
    allowance: 160,
    wealth: [40, 58],
    jobs: ["Nurse", "Teacher", "Accountant", "Social worker", "Retail manager", "Paralegal", "Police officer", "Marketing associate"],
    values: ["Study hard, get a good job, build a good life.", "Save a little, plan ahead, and keep the peace."],
  },
  comfortable: {
    label: "Comfortable",
    blurb: "Money isn't a worry. Doors open easily - and expectations come with them.",
    moneyFactor: 2.2,
    allowance: 420,
    wealth: [62, 78],
    jobs: ["Software developer", "Pharmacist", "Realtor", "Contractor", "Engineer", "Dentist"],
    values: ["Invest in yourself. Opportunity is something you prepare for.", "Excel, network, and never waste a good chance."],
  },
  wealthy: {
    label: "Wealthy",
    blurb: "A big house, private schools and a family name people know.",
    moneyFactor: 6,
    allowance: 1100,
    wealth: [82, 98],
    jobs: ["Surgeon", "Executive", "Lawyer", "Business owner", "Investment banker", "Architect"],
    values: ["The family name means something. Live up to it.", "Money is a tool - and an inheritance to protect."],
  },
};

// Odds of being born into each class, by region: [struggling, working, middle, comfortable, wealthy]
import { MORE_CLASS_WEIGHTS } from "./moreRegions";

export const CLASS_WEIGHTS: Record<string, number[]> = {
  ...MORE_CLASS_WEIGHTS,
  us: [12, 28, 35, 18, 7],
  uk: [10, 28, 38, 18, 6],
  nigeria: [38, 32, 18, 9, 3],
  japan: [6, 24, 42, 22, 6],
  brazil: [30, 32, 24, 10, 4],
};
export const CLASS_ORDER: WealthClass[] = ["struggling", "working", "middle", "comfortable", "wealthy"];
