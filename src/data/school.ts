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

export type ClubKey =
  | "band" | "art-club" | "chess-club" | "drama-club" | "robotics-club"
  | "football" | "basketball" | "track" | "swimming" | "soccer" | "volleyball"
  | "choir" | "debate" | "student-council" | "yearbook" | "volunteering" | "coding-club";

export type ClubDef = {
  key: ClubKey;
  label: string;
  minAge: number;
  kind: "sport" | "arts" | "academic" | "service";
  skill?: "music" | "singing" | "art" | "acting" | "athletics" | "debate" | "coding" | "leadership";
  talent?: "athletic" | "musical" | "artistic" | "verbal" | "technical" | "social" | "academic";
  tryout?: boolean; // you have to make the team
  blurb: string;
};

export const CLUBS: ClubDef[] = [
  { key: "football", label: "Football Team", minAge: 12, kind: "sport", skill: "athletics", talent: "athletic", tryout: true, blurb: "Practice every day and a game on Fridays." },
  { key: "basketball", label: "Basketball Team", minAge: 12, kind: "sport", skill: "athletics", talent: "athletic", tryout: true, blurb: "Fast, loud and a lot of running." },
  { key: "soccer", label: "Soccer Team", minAge: 8, kind: "sport", skill: "athletics", talent: "athletic", tryout: true, blurb: "The world's game, on a muddy pitch." },
  { key: "track", label: "Track & Field", minAge: 11, kind: "sport", skill: "athletics", talent: "athletic", blurb: "Just you, the clock and the finish line." },
  { key: "swimming", label: "Swim Team", minAge: 9, kind: "sport", skill: "athletics", talent: "athletic", blurb: "Early mornings and chlorine hair." },
  { key: "volleyball", label: "Volleyball Team", minAge: 12, kind: "sport", skill: "athletics", talent: "athletic", tryout: true, blurb: "Set, spike, repeat." },
  { key: "band", label: "Band", minAge: 10, kind: "arts", skill: "music", talent: "musical", blurb: "Marching, concerts and practice rooms." },
  { key: "choir", label: "Choir", minAge: 8, kind: "arts", skill: "singing", talent: "musical", blurb: "Harmonies and a winter concert." },
  { key: "art-club", label: "Art Club", minAge: 9, kind: "arts", skill: "art", talent: "artistic", blurb: "Paint, clay and a gallery night." },
  { key: "drama-club", label: "Drama Club", minAge: 10, kind: "arts", skill: "acting", talent: "verbal", blurb: "Auditions, rehearsals and opening night." },
  { key: "chess-club", label: "Chess Club", minAge: 8, kind: "academic", talent: "academic", blurb: "Quiet rooms and loud victories." },
  { key: "robotics-club", label: "Robotics Club", minAge: 11, kind: "academic", skill: "coding", talent: "technical", blurb: "Build a robot, break a robot, rebuild it." },
  { key: "coding-club", label: "Coding Club", minAge: 11, kind: "academic", skill: "coding", talent: "technical", blurb: "Build apps and games after school." },
  { key: "debate", label: "Debate Team", minAge: 12, kind: "academic", skill: "debate", talent: "verbal", tryout: true, blurb: "Argue either side, and win." },
  { key: "student-council", label: "Student Council", minAge: 12, kind: "service", skill: "leadership", talent: "social", tryout: true, blurb: "Run the dances and fight for a longer lunch." },
  { key: "yearbook", label: "Yearbook", minAge: 12, kind: "service", talent: "artistic", blurb: "Photos, deadlines and captions." },
  { key: "volunteering", label: "Volunteering Club", minAge: 12, kind: "service", skill: "leadership", talent: "social", blurb: "Give back and look good on applications." },
];

export function availableClubs(age: number): ClubDef[] {
  return CLUBS.filter((c) => age >= c.minAge);
}

export const CLIQUES = ["Jocks", "Nerds", "Artsy", "Popular", "Loners"];
