export type CollegeListing = {
  name: string;
  tier: "community" | "state" | "private" | "ivy";
  cost: number; // per year
  minGpa: number; // required to get in
  probationGpa: number; // fall below this while enrolled and academic probation fires
};

export const COLLEGES: CollegeListing[] = [
  { name: "Riverside Community College", tier: "community", cost: 3500, minGpa: 1.5, probationGpa: 1.2 },
  { name: "State University", tier: "state", cost: 12000, minGpa: 2.5, probationGpa: 1.8 },
  { name: "Ashford Private University", tier: "private", cost: 32000, minGpa: 3.0, probationGpa: 2.2 },
  { name: "Northbridge University", tier: "ivy", cost: 58000, minGpa: 3.7, probationGpa: 2.8 },
];

export function availableColleges(gpa: number): CollegeListing[] {
  return COLLEGES.filter((c) => gpa >= c.minGpa);
}

export const MAJORS = [
  "Business",
  "Computer Science",
  "Nursing",
  "Education",
  "Psychology",
  "Engineering",
  "Fine Arts",
  "Biology",
  "English",
  "Criminal Justice",
];

export type HousingListing = {
  key: "dorm" | "greek" | "apartment" | "commute";
  label: string;
  costPerYear: number;
};

export const COLLEGE_HOUSING: HousingListing[] = [
  { key: "dorm", label: "Dorm", costPerYear: 9000 },
  { key: "greek", label: "Greek House", costPerYear: 7000 },
  { key: "apartment", label: "Off-Campus Apartment", costPerYear: 11000 },
  { key: "commute", label: "Commute From Home", costPerYear: 0 },
];

export const GREEK_HOUSES = ["Kappa Delta", "Sigma Chi", "Alpha Phi", "Theta Nu"];

export type ClubKey = "band" | "art-club" | "chess-club" | "drama-club" | "robotics-club";

export const CLUBS: { key: ClubKey; label: string; minAge: number; skill?: "music" | "art" | "acting" }[] = [
  { key: "band", label: "Band", minAge: 11, skill: "music" },
  { key: "art-club", label: "Art Club", minAge: 11, skill: "art" },
  { key: "chess-club", label: "Chess Club", minAge: 11 },
  { key: "drama-club", label: "Drama Club", minAge: 11, skill: "acting" },
  { key: "robotics-club", label: "Robotics Club", minAge: 11 },
];

export function availableClubs(age: number): typeof CLUBS {
  return CLUBS.filter((c) => age >= c.minAge);
}

export const CLIQUES = ["Jocks", "Nerds", "Artsy", "Popular", "Loners"];
