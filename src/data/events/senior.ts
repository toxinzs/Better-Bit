import { LifeEvent } from "../../types";
import { clamp } from "../../engine/util";
import { hasChild } from "./helpers";
import { randomFullName } from "../../data/names";

export const SENIOR_EVENTS: LifeEvent[] = [
  {
    id: "midlife-crisis",
    minAge: 40,
    maxAge: 50,
    once: true,
    text: () => "You caught yourself staring in the mirror wondering where the time went.",
    choices: [
      {
        label: "Buy something reckless",
        effect: (c) => {
          c.money = Math.max(0, c.money - 5000);
          c.stats.happiness = clamp(c.stats.happiness + 15);
        },
      },
      {
        label: "Take up a new hobby instead",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness + 8);
        },
      },
    ],
  },
  {
    id: "retirement-question",
    minAge: 60,
    maxAge: 68,
    once: true,
    condition: (c) => c.job !== null,
    text: () => "You've put in the years. Retirement is on the table.",
    choices: [
      {
        label: "Retire",
        effect: (c) => {
          c.job = null;
          c.stats.happiness = clamp(c.stats.happiness + 12);
        },
      },
      {
        label: "Keep working",
        effect: (c) => {
          c.stats.health = clamp(c.stats.health - 3);
        },
      },
    ],
  },
  {
    id: "grandkids-visit",
    minAge: 60,
    maxAge: 90,
    weight: 1.2,
    condition: (c) => hasChild(c),
    text: () => "Your grandkids came to visit this weekend.",
    autoEffect: (c) => {
      c.stats.happiness = clamp(c.stats.happiness + 10);
    },
  },
  {
    id: "estate-planning",
    minAge: 60,
    maxAge: 85,
    once: true,
    text: () => "A friend mentioned it's time everyone your age got their affairs in order.",
    choices: [
      {
        label: "Write a will",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness + 4);
        },
      },
      {
        label: "You'll deal with that later",
        effect: () => {},
      },
    ],
  },
  {
    id: "reconnect-estranged",
    minAge: 55,
    maxAge: 90,
    weight: 0.4,
    once: true,
    text: () => "Someone from your past you haven't spoken to in decades reached out.",
    choices: [
      {
        label: "Hear them out",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness + 10);
        },
      },
      {
        label: "Too much water under the bridge",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness - 2);
        },
      },
    ],
  },
  {
    id: "volunteering",
    minAge: 58,
    maxAge: 90,
    weight: 0.8,
    text: () => "A local community center is looking for volunteers.",
    autoEffect: (c) => {
      c.stats.happiness = clamp(c.stats.happiness + 6);
    },
  },
  {
    id: "bucket-list-trip",
    minAge: 60,
    maxAge: 85,
    weight: 0.6,
    once: true,
    text: () => "There's a trip you've always talked about taking and never quite got around to.",
    choices: [
      {
        label: "Book it",
        effect: (c) => {
          c.money = Math.max(0, c.money - 4000);
          c.stats.happiness = clamp(c.stats.happiness + 20);
        },
      },
      {
        label: "Maybe next year",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness - 3);
        },
      },
    ],
  },
  {
    id: "memory-lapses",
    minAge: 70,
    maxAge: 95,
    weight: 0.7,
    text: () => "You've been forgetting little things more than usual lately.",
    choices: [
      {
        label: "Get checked out",
        effect: (c) => {
          c.money = Math.max(0, c.money - 300);
          c.stats.health = clamp(c.stats.health + 3);
        },
      },
      {
        label: "It's probably nothing",
        effect: (c) => {
          c.stats.health = clamp(c.stats.health - 4);
        },
      },
    ],
  },
  {
    id: "senior-social-club",
    minAge: 62,
    maxAge: 90,
    weight: 0.7,
    text: () => "There's a social club that meets weekly at the community center. A few neighbors keep inviting you.",
    autoEffect: (c) => {
      c.stats.happiness = clamp(c.stats.happiness + 5);
      c.relationships.push({
        id: `friend-${Date.now()}`,
        name: randomFullName(c.originRegion),
        type: "friend",
        level: 50,
        alive: true,
      });
    },
  },
  {
    id: "family-heirloom",
    minAge: 65,
    maxAge: 95,
    once: true,
    condition: (c) => hasChild(c),
    text: () => "You've been thinking about who should get the things that matter most to you.",
    autoEffect: (c) => {
      c.stats.happiness = clamp(c.stats.happiness + 6);
    },
  },
  {
    id: "reflecting-on-life",
    minAge: 65,
    maxAge: 95,
    weight: 1,
    text: (c) => `Sitting on the porch, you think back on ${c.age} years of it all.`,
    autoEffect: (c) => {
      c.stats.happiness = clamp(c.stats.happiness + 3);
    },
  },
];
