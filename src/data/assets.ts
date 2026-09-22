export type CarListing = { name: string; price: number; minAge: number };
export type HomeListing = { name: string; price: number; minAge: number };

export const CAR_LISTINGS: CarListing[] = [
  { name: "Used Sedan", price: 8000, minAge: 16 },
  { name: "New Sedan", price: 22000, minAge: 18 },
  { name: "SUV", price: 35000, minAge: 18 },
  { name: "Sports Car", price: 65000, minAge: 18 },
  { name: "Luxury Car", price: 120000, minAge: 18 },
];

export const HOME_LISTINGS: HomeListing[] = [
  { name: "Studio Apartment", price: 90000, minAge: 18 },
  { name: "Starter Home", price: 190000, minAge: 18 },
  { name: "Family Home", price: 340000, minAge: 18 },
  { name: "Large House", price: 560000, minAge: 18 },
  { name: "Mansion", price: 1200000, minAge: 18 },
];

export function availableCars(age: number): CarListing[] {
  return CAR_LISTINGS.filter((c) => age >= c.minAge);
}

export function availableHomes(age: number): HomeListing[] {
  return HOME_LISTINGS.filter((h) => age >= h.minAge);
}
