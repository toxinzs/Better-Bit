import { Character } from "../../types";
import { ageOf } from "../../engine/people";

export function mother(c: Character) {
  return c.relationships.find((r) => r.type === "mother" && r.alive);
}
export function father(c: Character) {
  return c.relationships.find((r) => r.type === "father" && r.alive);
}
export function partner(c: Character) {
  return c.relationships.find((r) => r.type === "partner" && r.alive);
}
export function sibling(c: Character) {
  return c.relationships.filter((r) => r.type === "sibling" && r.alive)[0];
}
// every living child that is still with you (a child placed for adoption
// isn't someone you can gift a bike to)
export function children(c: Character) {
  return c.relationships.filter((r) => r.type === "child" && r.alive && r.status !== "placed");
}
export function minorChildren(c: Character) {
  return children(c).filter((r) => ageOf(c, r) < 18);
}
export function friends(c: Character) {
  return c.relationships.filter((r) => r.type === "friend" && r.alive);
}
export function exes(c: Character) {
  return c.relationships.filter((r) => r.type === "ex" && r.alive);
}
export function hasPartner(c: Character) {
  return partner(c) !== undefined;
}
export function hasMinorChild(c: Character) {
  return minorChildren(c).length > 0;
}
export function hasChild(c: Character) {
  return children(c).length > 0;
}
