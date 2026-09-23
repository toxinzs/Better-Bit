import { LifeEvent } from "../../types";
import { clamp } from "../../engine/util";
import { randomFullName } from "../../data/names";

export const RANDOM_EVENTS: LifeEvent[] = [
  {
    id: "mistaken-for-celebrity",
    minAge: 12,
    maxAge: 80,
    weight: 0.3,
    text: () => "Someone stopped you on the street, dead certain you were a famous person.",
    autoEffect: (c) => {
      c.stats.happiness = clamp(c.stats.happiness + 8);
      c.stats.looks = clamp(c.stats.looks + 2);
    },
  },
  {
    id: "witnessed-kindness",
    minAge: 6,
    maxAge: 90,
    weight: 0.5,
    text: () => "You watched a stranger help someone who dropped everything they were carrying, no hesitation.",
    autoEffect: (c) => {
      c.stats.happiness = clamp(c.stats.happiness + 4);
    },
  },
  {
    id: "not-at-fault-accident",
    minAge: 18,
    maxAge: 80,
    weight: 0.3,
    condition: (c) => c.age >= 18,
    text: () => "Someone rear-ended you at a red light. Not your fault, but definitely your headache.",
    autoEffect: (c) => {
      c.stats.happiness = clamp(c.stats.happiness - 6);
      c.money += 400;
    },
  },
  {
    id: "storm-damage",
    minAge: 10,
    maxAge: 90,
    weight: 0.2,
    text: () => "A bad storm rolled through and knocked a tree branch straight into the roof.",
    choices: [
      {
        label: "Get it repaired immediately",
        effect: (c) => {
          c.money = Math.max(0, c.money - 1200);
        },
      },
      {
        label: "Patch it temporarily",
        effect: (c) => {
          c.money = Math.max(0, c.money - 200);
          c.stats.happiness = clamp(c.stats.happiness - 3);
        },
      },
    ],
  },
  {
    id: "old-friend-reconnect",
    minAge: 20,
    maxAge: 90,
    weight: 0.5,
    text: () => "Someone you haven't talked to in years messaged you out of nowhere.",
    autoEffect: (c) => {
      c.stats.happiness = clamp(c.stats.happiness + 6);
      c.relationships.push({
        id: `friend-${Date.now()}`,
        name: randomFullName(c.originRegion),
        type: "friend",
        level: 55,
        alive: true,
      });
    },
  },
  {
    id: "jury-duty",
    minAge: 20,
    maxAge: 70,
    weight: 0.3,
    text: () => "A jury duty summons showed up in the mail.",
    choices: [
      {
        label: "Show up",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness - 4);
          c.stats.smarts = clamp(c.stats.smarts + 2);
        },
      },
      {
        label: "Try to get out of it",
        effect: (c) => {
          const success = Math.random() > 0.5;
          c.stats.happiness = clamp(c.stats.happiness + (success ? 3 : -6));
        },
      },
    ],
  },
  {
    id: "got-lost",
    minAge: 15,
    maxAge: 90,
    weight: 0.3,
    text: () => "You took a wrong turn somewhere and ended up completely lost in an unfamiliar part of town.",
    autoEffect: (c) => {
      c.stats.happiness = clamp(c.stats.happiness - 2);
    },
  },
  {
    id: "stray-animal",
    minAge: 8,
    maxAge: 90,
    weight: 0.3,
    text: () => "A stray showed up at your door looking rough, and it won't leave.",
    choices: [
      {
        label: "Take it in",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness + 12);
          c.money = Math.max(0, c.money - 100);
        },
      },
      {
        label: "Call animal control",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness - 3);
        },
      },
    ],
  },
  {
    id: "neighbor-drama",
    minAge: 20,
    maxAge: 90,
    weight: 0.5,
    text: () => "Your neighbor's music has been way too loud, way too late, for way too long.",
    choices: [
      {
        label: "Knock and say something",
        effect: (c) => {
          const goes_well = Math.random() > 0.4;
          c.stats.happiness = clamp(c.stats.happiness + (goes_well ? 5 : -5));
        },
      },
      {
        label: "Just deal with it",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness - 4);
        },
      },
    ],
  },
  {
    id: "package-mixup",
    minAge: 15,
    maxAge: 90,
    weight: 0.3,
    text: () => "A package showed up on your doorstep addressed to someone else entirely, but it's already open.",
    choices: [
      {
        label: "Return it to the right address",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness + 4);
        },
      },
      {
        label: "Finders keepers",
        effect: (c) => {
          c.money += 60;
          c.stats.happiness = clamp(c.stats.happiness - 2);
        },
      },
    ],
  },
  {
    id: "viral-post",
    minAge: 13,
    maxAge: 60,
    weight: 0.3,
    once: true,
    text: () => "Something you posted online blew up completely out of nowhere.",
    autoEffect: (c) => {
      c.stats.happiness = clamp(c.stats.happiness + 10);
      c.stats.looks = clamp(c.stats.looks + 3);
    },
  },
  {
    id: "weird-dream",
    minAge: 6,
    maxAge: 90,
    weight: 0.6,
    text: () => "You had an unusually vivid dream that's stuck with you all day.",
    autoEffect: (c) => {
      c.stats.happiness = clamp(c.stats.happiness + randomSign());
    },
  },
];

function randomSign() {
  return Math.random() > 0.5 ? 3 : -1;
}
