import { Character } from "../../types";

export function mother(c: Character) {
  return c.relationships.find((r) => r.type === "mother" && r.alive);
}
export function father(c: Character) {
  return c.relationships.find((r) => r.type === "father" && r.alive);
}
export function partner(c: Character) {
  return c.relationships.find((r) => r.type === "partner" && r.alive);
}
export function children(c: Character) {
  return c.relationships.filter((r) => r.type === "child" && r.alive);
}
export function friends(c: Character) {
  return c.relationships.filter((r) => r.type === "friend" && r.alive);
}
export function hasPartner(c: Character) {
  return partner(c) !== undefined;
}
export function hasChild(c: Character) {
  return children(c).length > 0;
}
