import { Character } from "../types";
import { changeStat } from "./stats";
import { clamp } from "./util";
import { addPerson } from "./people";

// Habits of the mind: meditation, faith and giving your time.

export type FaithDef = { key: string; label: string; place: string };

export const FAITHS: FaithDef[] = [
  { key: "christian", label: "Christianity", place: "church" },
  { key: "muslim", label: "Islam", place: "mosque" },
  { key: "hindu", label: "Hinduism", place: "temple" },
  { key: "buddhist", label: "Buddhism", place: "temple" },
  { key: "jewish", label: "Judaism", place: "synagogue" },
  { key: "sikh", label: "Sikhism", place: "gurdwara" },
  { key: "spiritual", label: "Spiritual, not religious", place: "your circle" },
  { key: "none", label: "Non-religious", place: "" },
];
export const faithDef = (k?: string | null) => FAITHS.find((f) => f.key === k);

export function setFaith(c: Character, key: string): void {
  c.faith = key;
  c.practising = key !== "none";
  c.yearLog.push(key === "none" ? "You decided faith isn't part of your life." : `You began to follow ${faithDef(key)?.label ?? key} more seriously.`);
}

export function togglePractising(c: Character): void {
  if (!c.faith || c.faith === "none") return;
  c.practising = !c.practising;
}
export function toggleMeditation(c: Character): void {
  if (c.age < 10) return;
  c.meditating = !c.meditating;
}
export function toggleVolunteering(c: Character): void {
  if (c.age < 14) return;
  c.volunteering = !c.volunteering;
}

export function tickMind(c: Character): void {
  if (c.inJail) return;
  if (c.meditating) {
    c.stress = clamp((c.stress ?? 25) - 6);
    c.sanity = clamp((c.sanity ?? 75) + 1);
    changeStat(c, "happiness", 1, "Meditation");
  }
  if (c.faith && c.faith !== "none" && c.practising) {
    changeStat(c, "happiness", 1, "Your faith community");
    c.stress = clamp((c.stress ?? 25) - 2);
    const friends = c.relationships.filter((r) => r.alive && r.type === "friend").length;
    if (c.age >= 12 && friends < 8 && Math.random() < 0.18) {
      const p = addPerson(c, { type: "friend", age: clamp(c.age + Math.round((Math.random() - 0.4) * 20), 10, 85), level: 45 + Math.round(Math.random() * 20) });
      c.yearLog.push(`You got to know ${p.name.split(" ")[0]} at ${faithDef(c.faith)?.place || "your community"}.`);
    }
  }
  if (c.volunteering && c.age >= 14) {
    changeStat(c, "happiness", 2, "Giving your time");
    c.stress = clamp((c.stress ?? 25) + 1);
    if (c.age >= 18) c.network = clamp((c.network ?? 0) + 3);
    if (c.personality) c.personality.a = clamp(c.personality.a + 0.3);
    c.volunteerYears = (c.volunteerYears ?? 0) + 1;
  }
}
