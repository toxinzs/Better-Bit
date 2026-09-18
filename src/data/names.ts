export const FIRST_NAMES_MALE = [
  "James", "Michael", "Daniel", "Marcus", "Andre", "Elijah", "Noah",
  "Malik", "Ethan", "Jayden", "Isaiah", "Omar", "Lucas", "Xavier",
];

export const FIRST_NAMES_FEMALE = [
  "Amara", "Sophia", "Aaliyah", "Maya", "Zoe", "Destiny", "Jasmine",
  "Nia", "Layla", "Chloe", "Imani", "Serenity", "Camille", "Aria",
];

export const FIRST_NAMES_NEUTRAL = [
  "River", "Quinn", "Sage", "Rowan", "Skyler", "Phoenix", "Ari",
];

export const LAST_NAMES = [
  "Johnson", "Williams", "Brooks", "Carter", "Bennett", "Reyes",
  "Coleman", "Diallo", "Okafor", "Price", "Sinclair", "Harmon",
  "Mercer", "Alston", "Whitfield",
];

export function randomFirstName(gender: "male" | "female" | "nonbinary"): string {
  const pool =
    gender === "male"
      ? FIRST_NAMES_MALE
      : gender === "female"
        ? FIRST_NAMES_FEMALE
        : FIRST_NAMES_NEUTRAL;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function randomLastName(): string {
  return LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
}
