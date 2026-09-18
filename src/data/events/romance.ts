import { LifeEvent } from "../../types";
import { clamp } from "../../engine/util";
import { partner, hasPartner } from "./helpers";

export const ROMANCE_EVENTS: LifeEvent[] = [
  {
    id: "met-someone",
    minAge: 18,
    maxAge: 40,
    weight: 3,
    condition: (c) => !hasPartner(c),
    text: () => "You met someone who actually makes you laugh.",
    choices: [
      {
        label: "Ask them out",
        effect: (c) => {
          c.relationships.push({
            id: `partner-${Date.now()}`,
            name: "Your partner",
            type: "partner",
            level: 65,
            alive: true,
          });
          c.stats.happiness = clamp(c.stats.happiness + 12);
        },
      },
      {
        label: "Not right now",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness - 1);
        },
      },
    ],
  },
  {
    id: "blind-date",
    minAge: 19,
    maxAge: 45,
    weight: 0.6,
    condition: (c) => !hasPartner(c),
    text: () => "A friend set you up on a blind date. Low expectations, honestly.",
    choices: [
      {
        label: "Give it a shot",
        effect: (c) => {
          const goes_well = Math.random() > 0.5;
          if (goes_well) {
            c.relationships.push({
              id: `partner-${Date.now()}`,
              name: "Your partner",
              type: "partner",
              level: 60,
              alive: true,
            });
            c.stats.happiness = clamp(c.stats.happiness + 10);
          } else {
            c.stats.happiness = clamp(c.stats.happiness - 3);
          }
        },
        resultText: (c) => (hasPartner(c) ? "It actually clicked." : "Awkward silence for an hour. Never again."),
      },
      {
        label: "Cancel last minute",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness - 1);
        },
      },
    ],
  },
  {
    id: "date-night",
    minAge: 18,
    maxAge: 70,
    weight: 1.4,
    condition: (c) => hasPartner(c),
    text: () => "Your partner wants to plan something special together this weekend.",
    choices: [
      {
        label: "Plan a real date night",
        effect: (c) => {
          const p = partner(c);
          if (p) p.level = clamp(p.level + 8);
          c.money = Math.max(0, c.money - 150);
          c.stats.happiness = clamp(c.stats.happiness + 5);
        },
      },
      {
        label: "Cancel, you're tired",
        effect: (c) => {
          const p = partner(c);
          if (p) p.level = clamp(p.level - 8);
        },
      },
    ],
  },
  {
    id: "cheating-temptation",
    minAge: 20,
    maxAge: 55,
    weight: 0.4,
    condition: (c) => hasPartner(c),
    text: () => "Someone made it very clear they're interested in you. Your partner would never know.",
    choices: [
      {
        label: "Stay loyal",
        effect: (c) => {
          const p = partner(c);
          if (p) p.level = clamp(p.level + 5);
          c.stats.happiness = clamp(c.stats.happiness + 3);
        },
      },
      {
        label: "Give in",
        effect: (c) => {
          const caught = Math.random() < 0.5;
          if (caught) {
            const p = partner(c);
            if (p) {
              p.type = "ex";
              p.married = false;
              p.engaged = false;
            }
            c.stats.happiness = clamp(c.stats.happiness - 25);
          } else {
            c.stats.happiness = clamp(c.stats.happiness + 8);
          }
        },
        resultText: (c) => (hasPartner(c) ? "You got away with it. For now." : "You got caught. It's over."),
      },
    ],
  },
  {
    id: "got-cheated-on",
    minAge: 20,
    maxAge: 55,
    weight: 0.35,
    condition: (c) => hasPartner(c),
    text: () => "You found messages on your partner's phone that make it pretty clear what's been going on.",
    choices: [
      {
        label: "End it",
        effect: (c) => {
          const p = partner(c);
          if (p) {
            p.type = "ex";
            p.married = false;
            p.engaged = false;
          }
          c.stats.happiness = clamp(c.stats.happiness - 10);
        },
      },
      {
        label: "Try to work through it",
        effect: (c) => {
          const p = partner(c);
          if (p) p.level = clamp(p.level - 20);
          c.stats.happiness = clamp(c.stats.happiness - 15);
        },
      },
    ],
  },
  {
    id: "breakup",
    minAge: 18,
    maxAge: 60,
    weight: 0.5,
    condition: (c) => {
      const p = partner(c);
      return p !== undefined && !p.married && p.level < 35;
    },
    text: () => "Things with your partner have felt off for a while now. It's not working.",
    choices: [
      {
        label: "Break up",
        effect: (c) => {
          const p = partner(c);
          if (p) p.type = "ex";
          c.stats.happiness = clamp(c.stats.happiness - 10);
        },
      },
      {
        label: "Try to fix it",
        effect: (c) => {
          const p = partner(c);
          if (p) p.level = clamp(p.level + 15);
        },
      },
    ],
  },
  {
    id: "engagement",
    minAge: 22,
    maxAge: 45,
    weight: 6,
    once: true,
    condition: (c) => {
      const p = partner(c);
      return p !== undefined && p.level > 70 && !p.engaged && !p.married;
    },
    text: () => "Things with your partner have been serious for a while now.",
    choices: [
      {
        label: "Propose",
        effect: (c) => {
          const p = partner(c);
          if (p) {
            p.engaged = true;
            p.level = clamp(p.level + 15);
          }
          c.stats.happiness = clamp(c.stats.happiness + 20);
        },
      },
      {
        label: "Not ready yet",
        effect: () => {},
      },
    ],
  },
  {
    id: "wedding-day",
    minAge: 22,
    maxAge: 46,
    weight: 8,
    once: true,
    condition: (c) => {
      const p = partner(c);
      return p !== undefined && p.engaged === true && !p.married;
    },
    text: () => "Your wedding day. Everyone you love is in one room.",
    choices: [
      {
        label: "Throw a big wedding",
        effect: (c) => {
          const p = partner(c);
          if (p) {
            p.married = true;
            p.engaged = false;
            p.level = clamp(p.level + 15);
          }
          c.money = Math.max(0, c.money - 8000);
          c.stats.happiness = clamp(c.stats.happiness + 25);
        },
      },
      {
        label: "Keep it small and simple",
        effect: (c) => {
          const p = partner(c);
          if (p) {
            p.married = true;
            p.engaged = false;
            p.level = clamp(p.level + 10);
          }
          c.money = Math.max(0, c.money - 1500);
          c.stats.happiness = clamp(c.stats.happiness + 15);
        },
      },
    ],
  },
  {
    id: "anniversary",
    minAge: 23,
    maxAge: 90,
    weight: 1,
    condition: (c) => {
      const p = partner(c);
      return p !== undefined && p.married === true;
    },
    text: () => "Your anniversary is coming up.",
    choices: [
      {
        label: "Make it special",
        effect: (c) => {
          const p = partner(c);
          if (p) p.level = clamp(p.level + 6);
          c.money = Math.max(0, c.money - 200);
          c.stats.happiness = clamp(c.stats.happiness + 5);
        },
      },
      {
        label: "Let it slide this year",
        effect: (c) => {
          const p = partner(c);
          if (p) p.level = clamp(p.level - 10);
        },
      },
    ],
  },
  {
    id: "in-laws-drama",
    minAge: 24,
    maxAge: 60,
    weight: 0.7,
    condition: (c) => {
      const p = partner(c);
      return p !== undefined && (p.married === true || p.level > 60);
    },
    text: () => "Your partner's family invited themselves over again, and they always have opinions.",
    choices: [
      {
        label: "Bite your tongue",
        effect: (c) => {
          const p = partner(c);
          if (p) p.level = clamp(p.level + 4);
          c.stats.happiness = clamp(c.stats.happiness - 3);
        },
      },
      {
        label: "Say what you actually think",
        effect: (c) => {
          const p = partner(c);
          if (p) p.level = clamp(p.level - 8);
          c.stats.happiness = clamp(c.stats.happiness + 4);
        },
      },
    ],
  },
  {
    id: "divorce-question",
    minAge: 25,
    maxAge: 70,
    weight: 0.3,
    condition: (c) => {
      const p = partner(c);
      return p !== undefined && p.married === true && p.level < 30;
    },
    text: () => "It's been rough for a long time now. The marriage isn't working.",
    choices: [
      {
        label: "File for divorce",
        effect: (c) => {
          const p = partner(c);
          if (p) {
            p.type = "ex";
            p.married = false;
          }
          c.money = Math.max(0, Math.round(c.money * 0.6));
          c.stats.happiness = clamp(c.stats.happiness - 12);
        },
        resultText: () => "It's final. You split the assets and went your separate ways.",
      },
      {
        label: "Go to couples counseling",
        effect: (c) => {
          c.money = Math.max(0, c.money - 1000);
          const p = partner(c);
          if (p) p.level = clamp(p.level + 20);
        },
      },
    ],
  },
];
