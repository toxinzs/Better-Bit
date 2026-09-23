import { RegionKey } from "../types";

export type CostOfLivingTier = "low" | "mid" | "high";

export type LegalAges = {
  drinking: number;
  smoking: number;
  gambling: number;
  driving: number;
  marriage: number;
  // Data/flavor only - deliberately NEVER wired into any gameplay gate.
  // Real ages of consent vary widely and sensitively by region (and are
  // genuinely contested/complex in some of them), and using the lowest
  // one in this list to open romantic/hookup content region-by-region
  // would be the wrong call regardless of how accurate the number is.
  // Every actual gate in the game (hookup, dating) stays hardcoded at 18.
  consent: number;
};

export type RegionDef = {
  key: RegionKey;
  label: string;
  costOfLivingTier: CostOfLivingTier;
  startingWealthRange: [number, number];
  legalAges: LegalAges;
  drugsIllegal: boolean;
  stateTaxRate: number; // flat add-on layered over taxes.ts's federal-shaped brackets
  jobMultiplier: number; // stacks multiplicatively with worldState.ts's existing boom/recession salaryMultiplier()
  // Flavor only - a rough regional plausibility skew, not a demographic
  // assignment. Every region spans a real range of tones; this just
  // weights which are more likely to come up for a character born there.
  skinTonePalette: string[];
  appearanceFlavor: string[];
};

export const REGIONS: Record<RegionKey, RegionDef> = {
  us: {
    key: "us",
    label: "United States",
    costOfLivingTier: "mid",
    startingWealthRange: [0, 400],
    legalAges: { drinking: 21, smoking: 21, gambling: 21, driving: 16, marriage: 18, consent: 16 },
    drugsIllegal: true,
    stateTaxRate: 0.05, // approximate blended US state average; real range is 0%-13.3% depending on the state
    jobMultiplier: 1, // baseline - data/jobs.ts's salary table is already US-shaped
    skinTonePalette: ["#8d5524", "#c68642", "#e0ac69", "#f1c27d", "#ffdbac"],
    appearanceFlavor: [
      "has an easy, quick smile",
      "carries themselves with a laid-back confidence",
      "always seems to be mid-story about something",
      "dresses like comfort matters more than style, and it works",
      "has a look people describe as \"open\"",
    ],
  },
  uk: {
    key: "uk",
    label: "United Kingdom",
    costOfLivingTier: "mid",
    startingWealthRange: [0, 350],
    legalAges: { drinking: 18, smoking: 18, gambling: 18, driving: 17, marriage: 18, consent: 16 },
    drugsIllegal: true,
    stateTaxRate: 0, // the UK's income tax is national, not layered with a separate regional add-on like US states
    jobMultiplier: 0.85, // approximates a lower average-wage baseline vs. the US-shaped job table
    skinTonePalette: ["#f1c27d", "#ffdbac", "#e0ac69", "#c68642", "#8d5524"],
    appearanceFlavor: [
      "has a dry sense of humor that takes people a minute to catch",
      "is never without a proper cup of tea nearby",
      "dresses neat even on a lazy day",
      "has a quiet, understated way about them",
      "always seems slightly amused by everything",
    ],
  },
  nigeria: {
    key: "nigeria",
    label: "Nigeria",
    costOfLivingTier: "low",
    startingWealthRange: [0, 120],
    // Nigeria's Child Rights Act sets 18 as the marriage/consent floor, though
    // enforcement and adoption vary significantly by state - a genuinely
    // complex real legal picture, stored here as data only, per the note above.
    legalAges: { drinking: 18, smoking: 18, gambling: 18, driving: 18, marriage: 18, consent: 18 },
    drugsIllegal: true,
    stateTaxRate: 0, // Nigeria's PAYE income tax is federally set, not stacked with a separate state layer
    jobMultiplier: 0.35, // approximates a much lower average-wage baseline vs. the US-shaped job table - the biggest single lever here until Nigeria gets its own job table
    skinTonePalette: ["#3d2314", "#5c3317", "#8d5524", "#a86432"],
    appearanceFlavor: [
      "has a booming laugh that fills a room",
      "dresses sharp even for an ordinary day",
      "speaks with a rhythm that draws people in",
      "carries themselves with real pride",
      "has a warmth that puts strangers at ease fast",
    ],
  },
  japan: {
    key: "japan",
    label: "Japan",
    costOfLivingTier: "high",
    startingWealthRange: [0, 600],
    // Japan's age of majority for alcohol/tobacco/gambling stayed at 20 even
    // after civil majority was lowered to 18 in 2022. Marriage was unified to
    // 18 for both sexes in the same 2022 reform. Age of consent was raised
    // from 13 to 16 in a 2023 law change - reflected here, data only.
    legalAges: { drinking: 20, smoking: 20, gambling: 20, driving: 18, marriage: 18, consent: 16 },
    drugsIllegal: true,
    stateTaxRate: 0.1, // approximates Japan's real flat-rate local inhabitant tax, genuinely layered on top of national income tax
    jobMultiplier: 0.9,
    skinTonePalette: ["#f1c27d", "#ffdbac", "#e0ac69"],
    appearanceFlavor: [
      "is meticulous about their appearance, down to the last detail",
      "has a calm, composed way of carrying themselves",
      "dresses with quiet, precise style",
      "has an expression that gives little away",
      "moves through a room without ever seeming rushed",
    ],
  },
  brazil: {
    key: "brazil",
    label: "Brazil",
    costOfLivingTier: "low",
    startingWealthRange: [0, 150],
    // Brazil's real age of consent is genuinely 14 in the penal code (with
    // added protections for 14-18 in specific circumstances) - a real and
    // sensitive legal fact, stored as data only per the note above, never
    // gated on. Gambling age reflects Brazil's recent legalization of
    // regulated sports betting/gaming.
    legalAges: { drinking: 18, smoking: 18, gambling: 18, driving: 18, marriage: 18, consent: 14 },
    drugsIllegal: true,
    stateTaxRate: 0, // Brazil leans on consumption tax (ICMS) more than a layered state income tax
    jobMultiplier: 0.3, // approximates a much lower average-wage baseline vs. the US-shaped job table
    skinTonePalette: ["#8d5524", "#c68642", "#e0ac69", "#f1c27d", "#a86432"],
    appearanceFlavor: [
      "has an unmistakable energy about them",
      "dresses for warm weather, always",
      "talks with their hands as much as their voice",
      "has a smile that shows up before they even say hello",
      "carries an easy, rhythmic way of moving",
    ],
  },
};

export function getRegion(key?: RegionKey): RegionDef {
  return REGIONS[key ?? "us"];
}
