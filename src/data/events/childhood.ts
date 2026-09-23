import { LifeEvent } from "../../types";
import { clamp, randomInt } from "../../engine/util";
import { mother, father } from "./helpers";
import { randomFullName } from "../../data/names";

export const CHILDHOOD_EVENTS: LifeEvent[] = [
  {
    id: "first-steps",
    minAge: 1,
    maxAge: 2,
    once: true,
    text: (c) => `You took your first steps today. ${mother(c)?.name ?? "Your mother"} cried happy tears.`,
    autoEffect: (c) => {
      c.stats.happiness = clamp(c.stats.happiness + 5);
    },
  },
  {
    id: "toddler-tantrum",
    minAge: 2,
    maxAge: 4,
    weight: 1.5,
    text: () => "You threw a full-blown tantrum in the middle of the grocery store.",
    choices: [
      {
        label: "Scream louder",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness + 8);
        },
        resultText: () => "You got the candy. Victory.",
      },
      {
        label: "Calm down",
        effect: (c) => {
          const m = mother(c);
          if (m) m.level = clamp(m.level + 5);
        },
        resultText: () => "Your mom appreciated you settling down.",
      },
    ],
  },
  {
    id: "learned-to-read",
    minAge: 4,
    maxAge: 5,
    once: true,
    text: () => "You learned to read this year.",
    autoEffect: (c) => {
      c.stats.smarts = clamp(c.stats.smarts + 6);
    },
  },
  {
    id: "wanted-a-pet",
    minAge: 5,
    maxAge: 10,
    once: true,
    text: () => "You begged your parents for a dog at the pet store.",
    choices: [
      {
        label: "Beg harder",
        effect: (c) => {
          const success = Math.random() > 0.4;
          c.stats.happiness = clamp(c.stats.happiness + (success ? 15 : -5));
        },
        resultText: (c) => (c.stats.happiness > 50 ? "They caved! You have a dog now." : "They said no. You sulked for a week."),
      },
      {
        label: "Let it go",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness - 2);
        },
      },
    ],
  },
  {
    id: "playground-fight",
    minAge: 6,
    maxAge: 11,
    text: () => "A kid at recess knocked over your block tower on purpose.",
    choices: [
      {
        label: "Push them back",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness + 3);
          c.stats.looks = clamp(c.stats.looks - 2);
        },
        resultText: () => "You both got sent to the principal's office.",
      },
      {
        label: "Tell the teacher",
        effect: (c) => {
          c.stats.smarts = clamp(c.stats.smarts + 2);
        },
        resultText: () => "The teacher handled it. You felt a little proud of yourself.",
      },
      {
        label: "Walk away",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness - 3);
        },
        resultText: () => "You let it go, but it bugged you all day.",
      },
    ],
  },
  {
    id: "report-card",
    minAge: 6,
    maxAge: 17,
    weight: 2,
    text: (c) => `Report card day. Your grades reflect ${c.stats.smarts} smarts.`,
    choices: [
      {
        label: "Study harder next term",
        effect: (c) => {
          c.stats.smarts = clamp(c.stats.smarts + 4);
          c.stats.happiness = clamp(c.stats.happiness - 1);
        },
      },
      {
        label: "Whatever, it's fine",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness + 1);
        },
      },
    ],
  },
  {
    id: "made-a-friend",
    minAge: 6,
    maxAge: 14,
    weight: 1.5,
    text: () => "You made a new best friend at school.",
    autoEffect: (c) => {
      c.stats.happiness = clamp(c.stats.happiness + 6);
      c.relationships.push({
        id: `friend-${Date.now()}-${Math.random()}`,
        name: randomFullName(c.originRegion),
        type: "friend",
        level: 60,
        alive: true,
      });
    },
  },
  {
    id: "chores-allowance",
    minAge: 7,
    maxAge: 13,
    weight: 1.2,
    text: () => "Your parents offered you an allowance if you keep your room clean.",
    choices: [
      {
        label: "Do the chores",
        effect: (c) => {
          c.money += 100;
          const m = mother(c);
          if (m) m.level = clamp(m.level + 3);
        },
      },
      {
        label: "Skip it",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness + 2);
        },
      },
    ],
  },
  {
    id: "talent-show",
    minAge: 8,
    maxAge: 12,
    once: true,
    text: () => "The school is holding a talent show. Sign-ups are open.",
    choices: [
      {
        label: "Perform something",
        effect: (c) => {
          const good = c.stats.looks + c.stats.smarts > 100;
          c.stats.happiness = clamp(c.stats.happiness + (good ? 14 : -6));
        },
        resultText: (c) => (c.stats.happiness > 50 ? "The crowd loved it!" : "It didn't go great. Kids can be rough."),
      },
      {
        label: "Watch from the audience",
        effect: () => {},
      },
    ],
  },
  {
    id: "science-fair",
    minAge: 9,
    maxAge: 13,
    once: true,
    text: () => "Science fair projects are due next week and you haven't started.",
    choices: [
      {
        label: "Pull it together late",
        effect: (c) => {
          c.stats.smarts = clamp(c.stats.smarts + 5);
          c.stats.happiness = clamp(c.stats.happiness - 4);
        },
      },
      {
        label: "Half-ask it",
        effect: (c) => {
          c.stats.smarts = clamp(c.stats.smarts - 2);
        },
      },
    ],
  },
  {
    id: "sibling-rivalry",
    minAge: 6,
    maxAge: 15,
    weight: 1,
    condition: (c) => c.relationships.some((r) => r.type === "sibling" && r.alive),
    text: () => "You and your sibling got into it over the TV remote again.",
    choices: [
      {
        label: "Stand your ground",
        effect: (c) => {
          const sib = c.relationships.find((r) => r.type === "sibling");
          if (sib) sib.level = clamp(sib.level - 6);
          c.stats.happiness = clamp(c.stats.happiness + 3);
        },
      },
      {
        label: "Let them have it",
        effect: (c) => {
          const sib = c.relationships.find((r) => r.type === "sibling");
          if (sib) sib.level = clamp(sib.level + 6);
        },
      },
    ],
  },
  {
    id: "new-sibling",
    minAge: 3,
    maxAge: 10,
    once: true,
    weight: 0.5,
    condition: (c) => !c.relationships.some((r) => r.type === "sibling"),
    text: (c) => `${mother(c)?.name ?? "Your mother"} came home with a new baby.`,
    autoEffect: (c) => {
      c.relationships.push({
        id: `sibling-${Date.now()}`,
        name: randomFullName(c.originRegion, c.lastName),
        type: "sibling",
        level: 55,
        alive: true,
      });
      c.stats.happiness = clamp(c.stats.happiness + randomInt(-4, 6));
    },
  },
  {
    id: "moved-cities",
    minAge: 5,
    maxAge: 14,
    once: true,
    weight: 0.4,
    text: () => "Your family is moving to a new city. New house, new school.",
    autoEffect: (c) => {
      c.stats.happiness = clamp(c.stats.happiness - 8);
      friendsLoseTouch(c);
    },
  },
];

function friendsLoseTouch(c: Parameters<LifeEvent["text"]>[0]) {
  c.relationships
    .filter((r) => r.type === "friend")
    .forEach((r) => {
      r.level = clamp(r.level - 20);
    });
}
