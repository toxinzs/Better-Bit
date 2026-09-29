import { NewsKind } from "../types";

// Templates for "Around you" - what happens to other people. Tokens: {n} first
// name, {job} a job title, {cond} an illness, {age} their age, {he}/{his}/{him}.
export const NEWS: Record<Exclude<NewsKind, "death">, string[]> = {
  job: [
    "{n} started a new job as a {job}.",
    "{n} landed a role as a {job} and is over the moon.",
    "{n} switched careers and is now a {job}.",
    "{n} is trying out something new: working as a {job}.",
  ],
  promotion: [
    "{n} got promoted at work.",
    "{n} was made a team lead. {He} is celebrating.",
    "{n} got a big raise.",
  ],
  layoff: [
    "{n} lost {his} job in a round of layoffs.",
    "{n}'s company let a lot of people go, {him} included.",
  ],
  retired: [
    "{n} retired after a long career.",
    "{n} finally retired and is planning a lot of naps.",
  ],
  wedding: [
    "{n} got married.",
    "{n} tied the knot in a small ceremony.",
    "{n} got engaged!",
    "{n} eloped and told everyone afterward.",
  ],
  baby: [
    "{n} had a baby.",
    "{n} and {his} partner welcomed a new baby.",
    "{n} announced a pregnancy.",
  ],
  health: [
    "{n} was diagnosed with {cond}.",
    "{n} had a health scare but is okay.",
    "{n} had surgery and is recovering.",
    "{n} was in the hospital for a few days.",
  ],
  move: [
    "{n} moved to a new city.",
    "{n} bought a house.",
    "{n} moved abroad for work.",
    "{n} moved in with a new roommate.",
  ],
  breakup: [
    "{n} and {his} partner split up.",
    "{n} went through a rough breakup.",
  ],
  milestone: [
    "{n} turned {age}.",
    "{n} picked up a new hobby and can't stop talking about it.",
    "{n} ran a race for the first time.",
    "{n} adopted a dog.",
    "{n} won a small local award.",
  ],
};

// deterministic milestones for kids and siblings, keyed by the person's age
export const AGE_MILESTONES: Record<number, string> = {
  5: "{n} started school.",
  13: "{n} became a teenager.",
  16: "{n} got a driver's license.",
  18: "{n} graduated high school.",
  22: "{n} graduated from college.",
};
