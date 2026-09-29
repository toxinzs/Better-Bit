import { Lifestyle, RentKey } from "../types";

// Yearly rent for a place, at the US baseline in a city with a cost index of 1.
export const RENT_BASE = 15000;

export type RentOption = {
  key: RentKey;
  label: string;
  icon: string; // Ionicons name
  mult: number; // times RENT_BASE
  minAge: number;
  blurb: string;
  happy: number; // yearly mood effect of living here
};

export const RENT_OPTIONS: RentOption[] = [
  { key: "share", label: "Room in a shared house", icon: "people", mult: 0.4, minAge: 18, blurb: "Cheap, noisy, and someone always eats your yoghurt.", happy: -1 },
  { key: "studio", label: "Studio flat", icon: "bed", mult: 0.65, minAge: 18, blurb: "One room that does everything. Yours alone.", happy: 0 },
  { key: "onebed", label: "One-bedroom apartment", icon: "business", mult: 0.9, minAge: 18, blurb: "A proper bedroom with a door that shuts.", happy: 1 },
  { key: "twobed", label: "Two-bedroom apartment", icon: "home", mult: 1.25, minAge: 18, blurb: "Room for a partner, a desk or a small family.", happy: 1 },
  { key: "house", label: "Rented house", icon: "home", mult: 1.8, minAge: 21, blurb: "A garden, a driveway and a landlord who fixes things slowly.", happy: 2 },
];

export const rentOption = (k?: RentKey) => RENT_OPTIONS.find((o) => o.key === k);

export type LifestyleDef = {
  key: Lifestyle;
  label: string;
  icon: string;
  cost: number; // yearly living costs at baseline (food, bills, transport, small joys)
  blurb: string;
  happy: number;
  health: number;
};

export const LIFESTYLES: LifestyleDef[] = [
  { key: "frugal", label: "Frugal", icon: "leaf", cost: 5500, blurb: "Home-cooked meals, second-hand everything, the bus.", happy: -1.5, health: -0.5 },
  { key: "normal", label: "Comfortable enough", icon: "cart", cost: 8500, blurb: "Groceries, the odd takeaway, a coffee now and then.", happy: 0, health: 0 },
  { key: "comfortable", label: "Living well", icon: "sparkles", cost: 13500, blurb: "Good food, nice things, taxis when it rains.", happy: 2, health: 0.5 },
];

export const lifestyleDef = (k?: Lifestyle) => LIFESTYLES.find((l) => l.key === k) ?? LIFESTYLES[1];
