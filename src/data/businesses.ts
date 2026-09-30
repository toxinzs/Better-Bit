import { TalentKey } from "../types";

// Businesses you can start. All money is baseline dollars: the engine scales
// by country, city wage and city cost, so a food truck in Lagos is a very
// different bet from one in Zurich-priced Tokyo.

export type BizDef = {
  key: string;
  label: string;
  icon: string; // Ionicons name
  blurb: string;
  startup: number; // cost to open
  revenue: number; // yearly revenue at level 1, average reputation
  margin: number; // share of revenue left after the day-to-day costs
  fixed: number; // yearly overheads: rent, insurance, licences
  risk: number; // 0-1: how wild the year-to-year swings are
  talent: TalentKey; // the aptitude that makes a founder good at it
  field: string; // the job field its experience counts for
  minAge: number;
  needsDegree?: boolean;
  moonshot?: number; // yearly chance of a breakout year
};

export const BUSINESSES: BizDef[] = [
  { key: "foodtruck", label: "Food truck", icon: "restaurant", blurb: "Wheels, a grill and a line of hungry regulars.", startup: 30000, revenue: 85000, margin: 0.44, fixed: 6000, risk: 0.25, talent: "social", field: "Food & Hospitality", minAge: 18 },
  { key: "cafe", label: "Café", icon: "cafe", blurb: "Your own corner, your own playlist, an awful lot of milk.", startup: 90000, revenue: 190000, margin: 0.4, fixed: 26000, risk: 0.18, talent: "social", field: "Food & Hospitality", minAge: 21 },
  { key: "onlineshop", label: "Online shop", icon: "cart", blurb: "Sell something people want from your spare room.", startup: 12000, revenue: 60000, margin: 0.4, fixed: 2000, risk: 0.35, talent: "business", field: "Retail & Service", minAge: 18 },
  { key: "studio", label: "Creative studio", icon: "color-palette", blurb: "Design, photography, video: clients pay for your eye.", startup: 6000, revenue: 70000, margin: 0.72, fixed: 3000, risk: 0.2, talent: "artistic", field: "Creative & Media", minAge: 18 },
  { key: "consultancy", label: "Consultancy", icon: "briefcase", blurb: "Sell what's in your head by the hour.", startup: 15000, revenue: 110000, margin: 0.68, fixed: 8000, risk: 0.2, talent: "business", field: "Finance & Business", minAge: 24, needsDegree: true },
  { key: "startup", label: "Tech start-up", icon: "rocket", blurb: "Long odds, long nights, and a small chance of changing everything.", startup: 60000, revenue: 90000, margin: 0.5, fixed: 20000, risk: 0.6, talent: "technical", field: "Tech", minAge: 20, moonshot: 0.06 },
  { key: "landscaping", label: "Landscaping company", icon: "leaf", blurb: "Mowers, crews and a truck with your name on the door.", startup: 25000, revenue: 95000, margin: 0.42, fixed: 8000, risk: 0.15, talent: "technical", field: "Outdoors & Trades", minAge: 18 },
  { key: "gym", label: "Fitness studio", icon: "barbell", blurb: "Weights, classes and memberships nobody uses in February.", startup: 110000, revenue: 210000, margin: 0.36, fixed: 34000, risk: 0.2, talent: "athletic", field: "Healthcare", minAge: 21 },
  { key: "salon", label: "Hair salon", icon: "cut", blurb: "A chair, a mirror and a book of loyal clients.", startup: 40000, revenue: 100000, margin: 0.46, fixed: 10000, risk: 0.15, talent: "social", field: "Retail & Service", minAge: 19 },
  { key: "farm", label: "Small farm", icon: "nutrition", blurb: "Land, weather and work that never stops.", startup: 150000, revenue: 170000, margin: 0.34, fixed: 30000, risk: 0.3, talent: "technical", field: "Outdoors & Trades", minAge: 21 },
];

export const bizDef = (k?: string) => BUSINESSES.find((b) => b.key === k);

export const LEVEL_MULT = [1, 1.8, 3.0, 4.8, 7.5];
export const EMPLOYEE_WAGE = 16000; // baseline yearly
