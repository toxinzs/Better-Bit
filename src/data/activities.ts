import { SkillKey } from "../types";
import { LegalAges } from "./regions";

export type VenueKey =
  | "park"
  | "beach"
  | "worship"
  | "library"
  | "museum"
  | "gym"
  | "movies"
  | "mall"
  | "concert"
  | "spa"
  | "bar"
  | "club"
  | "casino";

export type VenueDef = { key: VenueKey; label: string; minAge: number; cost: number };

// cost 0 = free. minAge is the fallback gate when no region is known;
// bar/club use the region's real drinking age and casino its gambling age
// (src/data/regions.ts) when one is passed to availableVenues.
export const VENUES: VenueDef[] = [
  { key: "park", label: "Park", minAge: 3, cost: 0 },
  { key: "beach", label: "Beach", minAge: 3, cost: 0 },
  { key: "worship", label: "Place of Worship", minAge: 0, cost: 0 },
  { key: "library", label: "Library", minAge: 5, cost: 0 },
  { key: "museum", label: "Museum", minAge: 6, cost: 25 },
  { key: "gym", label: "Gym", minAge: 10, cost: 0 },
  { key: "movies", label: "Movies", minAge: 5, cost: 20 },
  { key: "mall", label: "Mall", minAge: 8, cost: 75 },
  { key: "concert", label: "Concert", minAge: 13, cost: 120 },
  { key: "spa", label: "Spa", minAge: 16, cost: 150 },
  { key: "bar", label: "Bar", minAge: 21, cost: 60 },
  { key: "club", label: "Club", minAge: 21, cost: 90 },
  { key: "casino", label: "Casino", minAge: 21, cost: 100 },
];

export function availableVenues(age: number, legalAges?: LegalAges): VenueDef[] {
  return VENUES.filter((v) => {
    if (v.key === "bar" || v.key === "club") return age >= (legalAges?.drinking ?? v.minAge);
    if (v.key === "casino") return age >= (legalAges?.gambling ?? v.minAge);
    return age >= v.minAge;
  });
}

export type LessonDef = { key: SkillKey; label: string; minAge: number; cost: number };

export const LESSONS: LessonDef[] = [
  { key: "music", label: "Music Lessons", minAge: 6, cost: 40 },
  { key: "singing", label: "Singing Lessons", minAge: 6, cost: 40 },
  { key: "art", label: "Art Lessons", minAge: 6, cost: 35 },
  { key: "martialArts", label: "Martial Arts", minAge: 6, cost: 45 },
  { key: "acting", label: "Acting Class", minAge: 8, cost: 50 },
];

export function availableLessons(age: number): LessonDef[] {
  return LESSONS.filter((l) => age >= l.minAge);
}

export type VacationKey = "weekend" | "beach" | "international";

export const VACATIONS: { key: VacationKey; label: string; cost: number }[] = [
  { key: "weekend", label: "Weekend Getaway", cost: 400 },
  { key: "beach", label: "Beach Vacation", cost: 1500 },
  { key: "international", label: "International Trip", cost: 4000 },
];

export type ConceptionMethod = "ivf" | "insemination" | "donor";

export const CONCEPTION_METHODS: {
  key: ConceptionMethod;
  label: string;
  cost: number;
  successChance: number;
}[] = [
  { key: "ivf", label: "IVF", cost: 15000, successChance: 0.45 },
  { key: "insemination", label: "Insemination", cost: 3500, successChance: 0.35 },
  { key: "donor", label: "Use a Donor", cost: 2000, successChance: 0.35 },
];

export const STERILIZATION_COST = 800;
export const DOCTOR_COST = 150;
