import { SkillKey, TalentKey } from "../types";

// Odd jobs: no application, no interview, no boss - you pick one up when you
// want the money. Capped per year, paid by talent and reputation.

export type GigGate = "light" | "parttime" | "adult"; // legal working age tier (data/regions.ts WorkAges)

export type GigDef = {
  key: string;
  label: string;
  icon: string; // Ionicons name
  gate: GigGate;
  pay: [number, number]; // US-baseline dollars per gig
  talent: TalentKey; // the aptitude that pays best here
  skill?: { key: SkillKey; level: number }; // a skill you need to have
  minSmarts?: number;
  needsCar?: boolean;
  blurb: string;
  risk?: { chance: number; text: string; cost: [number, number] }; // it can go wrong
};

export const GIGS: GigDef[] = [
  { key: "babysit", label: "Babysitting", icon: "happy", gate: "light", pay: [40, 160], talent: "social",
    blurb: "Watch someone else's kids for an evening. Bedtime is the hard part." },
  { key: "dogwalk", label: "Dog walking & pet sitting", icon: "paw", gate: "light", pay: [30, 120], talent: "athletic",
    blurb: "Walk the neighbourhood's dogs. Some of them pull." },
  { key: "carwash", label: "Car washing", icon: "car-sport", gate: "light", pay: [30, 130], talent: "athletic",
    blurb: "Bucket, sponge, driveway. Sunny days only." },
  { key: "lawn", label: "Lawn mowing & handyman jobs", icon: "leaf", gate: "light", pay: [50, 220], talent: "technical",
    blurb: "Mow, weed, fix the gate, paint the fence.",
    risk: { chance: 0.08, text: "You clipped something you shouldn't have and paid for the repair.", cost: [20, 90] } },
  { key: "tutor", label: "Tutoring", icon: "school", gate: "parttime", pay: [60, 240], talent: "academic", minSmarts: 60,
    blurb: "Help someone younger pass the test you already passed." },
  { key: "resell", label: "Reselling thrift finds", icon: "pricetag", gate: "parttime", pay: [-40, 280], talent: "business",
    blurb: "Buy low at yard sales, sell high online. Sometimes it just sits in your room.",
    risk: { chance: 0.25, text: "Nobody wanted it - you're stuck with the stock.", cost: [15, 70] } },
  { key: "busk", label: "Busking", icon: "musical-notes", gate: "light", pay: [5, 260], talent: "musical", skill: { key: "music", level: 20 },
    blurb: "Set up on a busy corner with an open case. Music is the pay." },
  { key: "events", label: "Event & festival help", icon: "ticket", gate: "parttime", pay: [80, 280], talent: "social",
    blurb: "Set up stages, hand out wristbands, stay late for the fireworks." },
  { key: "delivery", label: "Food & parcel delivery", icon: "bicycle", gate: "parttime", pay: [80, 320], talent: "athletic",
    blurb: "Pick up, drop off, tip or no tip.",
    risk: { chance: 0.1, text: "A bad fall on a wet corner cost you a repair and a bruise.", cost: [30, 120] } },
  { key: "freelance", label: "Freelance design / writing / code", icon: "laptop", gate: "parttime", pay: [80, 950], talent: "technical", minSmarts: 45,
    blurb: "Small jobs for clients online. Pays more the better you are." },
  { key: "rideshare", label: "Rideshare driving", icon: "car", gate: "adult", pay: [200, 720], talent: "social", needsCar: true,
    blurb: "Drive strangers around town. Ratings matter.",
    risk: { chance: 0.08, text: "A fender-bender and a claim you had to cover.", cost: [80, 400] } },
];

export const gigDef = (key: string) => GIGS.find((g) => g.key === key);
