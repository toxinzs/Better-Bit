import { LifeEvent } from "../../types";
import { clamp } from "../../engine/util";
import { mother, father, hasPartner, children, hasChild } from "./helpers";

export const FAMILY_EVENTS: LifeEvent[] = [
  {
    id: "have-a-kid",
    minAge: 23,
    maxAge: 45,
    weight: 2,
    condition: (c) => hasPartner(c) && !c.sterilized,
    text: () => "You and your partner have been talking about starting a family.",
    choices: [
      {
        label: "Have a baby",
        effect: (c) => {
          c.relationships.push({
            id: `child-${Date.now()}`,
            name: "Your child",
            type: "child",
            level: 80,
            alive: true,
          });
          c.stats.happiness = clamp(c.stats.happiness + 15);
          c.money = Math.max(0, c.money - 3000);
        },
      },
      {
        label: "Not yet",
        effect: () => {},
      },
    ],
  },
  {
    id: "parenting-style",
    minAge: 24,
    maxAge: 55,
    weight: 1.3,
    condition: (c) => hasChild(c),
    text: () => "Your kid is asking for something you're not sure they should have.",
    choices: [
      {
        label: "Say yes",
        effect: (c) => {
          children(c).forEach((k) => (k.level = clamp(k.level + 6)));
          c.money = Math.max(0, c.money - 150);
        },
      },
      {
        label: "Say no, and mean it",
        effect: (c) => {
          children(c).forEach((k) => (k.level = clamp(k.level - 4)));
          c.stats.happiness = clamp(c.stats.happiness + 2);
        },
      },
    ],
  },
  {
    id: "kid-school-play",
    minAge: 26,
    maxAge: 55,
    weight: 1,
    condition: (c) => hasChild(c),
    text: () => "Your kid has a school play and really wants you there.",
    choices: [
      {
        label: "Be there, front row",
        effect: (c) => {
          children(c).forEach((k) => (k.level = clamp(k.level + 10)));
          c.stats.happiness = clamp(c.stats.happiness + 5);
        },
      },
      {
        label: "Work ran late",
        effect: (c) => {
          children(c).forEach((k) => (k.level = clamp(k.level - 10)));
        },
      },
    ],
  },
  {
    id: "sibling-adult",
    minAge: 20,
    maxAge: 70,
    weight: 0.8,
    condition: (c) => c.relationships.some((r) => r.type === "sibling" && r.alive),
    text: () => "Your sibling calls more often than you'd like to admit, usually to vent.",
    choices: [
      {
        label: "Be there for them",
        effect: (c) => {
          const sib = c.relationships.find((r) => r.type === "sibling");
          if (sib) sib.level = clamp(sib.level + 8);
          c.stats.happiness = clamp(c.stats.happiness + 2);
        },
      },
      {
        label: "Let it go to voicemail",
        effect: (c) => {
          const sib = c.relationships.find((r) => r.type === "sibling");
          if (sib) sib.level = clamp(sib.level - 8);
        },
      },
    ],
  },
  {
    id: "parent-health-decline",
    minAge: 35,
    maxAge: 65,
    weight: 0.6,
    condition: (c) => mother(c) !== undefined || father(c) !== undefined,
    text: (c) => `${mother(c)?.name ?? father(c)?.name ?? "Your parent"} isn't doing so well lately.`,
    choices: [
      {
        label: "Help out with their care",
        effect: (c) => {
          const m = mother(c);
          const f = father(c);
          if (m) m.level = clamp(m.level + 10);
          if (f) f.level = clamp(f.level + 10);
          c.money = Math.max(0, c.money - 1000);
          c.stats.happiness = clamp(c.stats.happiness - 2);
        },
      },
      {
        label: "You have your own life to deal with",
        effect: (c) => {
          const m = mother(c);
          const f = father(c);
          if (m) m.level = clamp(m.level - 10);
          if (f) f.level = clamp(f.level - 10);
        },
      },
    ],
  },
  {
    id: "parent-passes",
    minAge: 30,
    maxAge: 80,
    weight: 0.35,
    condition: (c) => mother(c) !== undefined || father(c) !== undefined,
    text: (c) => {
      const m = mother(c);
      const f = father(c);
      const name = m?.name ?? f?.name ?? "Your parent";
      return `${name} passed away this year.`;
    },
    autoEffect: (c) => {
      const m = mother(c);
      const f = father(c);
      const parentGone = m && Math.random() > 0.5 ? m : f ?? m;
      if (parentGone) {
        parentGone.alive = false;
        c.stats.happiness = clamp(c.stats.happiness - 25);
        c.money += 5000;
      }
    },
  },
  {
    id: "family-reunion",
    minAge: 20,
    maxAge: 90,
    weight: 0.9,
    text: () => "The whole extended family is getting together for a reunion this summer.",
    choices: [
      {
        label: "Go",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness + 8);
          c.relationships.forEach((r) => {
            if (r.alive) r.level = clamp(r.level + 3);
          });
        },
      },
      {
        label: "Skip it",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness - 2);
        },
      },
    ],
  },
  {
    id: "empty-nest",
    minAge: 45,
    maxAge: 65,
    once: true,
    weight: 0.7,
    condition: (c) => hasChild(c),
    text: () => "Your youngest just moved out. The house feels very quiet.",
    choices: [
      {
        label: "Turn their room into something for you",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness + 8);
        },
      },
      {
        label: "Leave it exactly as it was",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness - 4);
        },
      },
    ],
  },
];
