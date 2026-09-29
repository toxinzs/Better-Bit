import { Character, Relationship } from "../types";
import { ageOf } from "./people";

// Who may start (or restart) a romance: adults with adults, or teens (13-17)
// with peers within a year who are also 13-17. Never across the age-18 line.
export function romanceAllowed(c: Character, r: Relationship): boolean {
  const a = c.age;
  const b = ageOf(c, r);
  if (a >= 18 && b >= 18) return true;
  return a >= 13 && a < 18 && b >= 13 && b < 18 && Math.abs(a - b) <= 1;
}
