import { LifeEvent } from "../../types";
import { clamp } from "../../engine/util";
import { mother } from "./helpers";

export const TEEN_EVENTS: LifeEvent[] = [
  {
    id: "first-crush",
    minAge: 13,
    maxAge: 17,
    once: true,
    text: () => "You caught yourself thinking about someone in your class... a lot.",
    choices: [
      {
        label: "Ask them out",
        effect: (c) => {
          const success = c.stats.looks + c.stats.happiness / 2 > 90;
          c.stats.happiness = clamp(c.stats.happiness + (success ? 12 : -8));
        },
        resultText: (c) => (c.stats.happiness > 50 ? "They said yes!" : "They let you down easy."),
      },
      {
        label: "Keep it to yourself",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness - 2);
        },
      },
    ],
  },
  {
    id: "house-party",
    minAge: 14,
    maxAge: 17,
    weight: 1.2,
    text: () => "You heard about a party this weekend while your parents are out of town.",
    choices: [
      {
        label: "Go and let loose",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness + 10);
          const m = mother(c);
          if (m) m.level = clamp(m.level - 8);
        },
        resultText: () => "You had a great time. Someone posted a video though.",
      },
      {
        label: "Stay home and study",
        effect: (c) => {
          c.stats.smarts = clamp(c.stats.smarts + 5);
          c.stats.happiness = clamp(c.stats.happiness - 3);
        },
      },
    ],
  },
  {
    id: "part-time-job-offer",
    minAge: 15,
    maxAge: 17,
    once: true,
    text: () => "A local shop is hiring after-school help.",
    choices: [
      {
        label: "Take the job",
        effect: (c) => {
          c.money += 1500;
          c.stats.happiness = clamp(c.stats.happiness - 2);
        },
        resultText: () => "Your own money for the first time. Feels good.",
      },
      {
        label: "Focus on school instead",
        effect: (c) => {
          c.stats.smarts = clamp(c.stats.smarts + 3);
        },
      },
    ],
  },
  {
    id: "prom",
    minAge: 17,
    maxAge: 18,
    once: true,
    text: () => "It's prom season.",
    choices: [
      {
        label: "Go all out",
        effect: (c) => {
          c.money = Math.max(0, c.money - 400);
          c.stats.happiness = clamp(c.stats.happiness + 15);
        },
      },
      {
        label: "Skip it",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness - 4);
        },
      },
    ],
  },
  {
    id: "drivers-test",
    minAge: 16,
    maxAge: 17,
    once: true,
    text: (c) => `You're old enough for your driver's test. Smarts: ${c.stats.smarts}.`,
    choices: [
      {
        label: "Take the test",
        effect: (c) => {
          const pass = c.stats.smarts > 35 || Math.random() > 0.3;
          c.stats.happiness = clamp(c.stats.happiness + (pass ? 10 : -8));
        },
        resultText: (c) => (c.stats.happiness > 50 ? "Passed! You can drive now." : "Failed. You'll have to retake it."),
      },
      {
        label: "Put it off",
        effect: () => {},
      },
    ],
  },
  {
    id: "peer-pressure-party",
    minAge: 14,
    maxAge: 17,
    weight: 0.9,
    text: () => "At a party, someone passes you a drink and everyone's watching to see what you'll do.",
    choices: [
      {
        label: "Take it",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness + 6);
          c.stats.health = clamp(c.stats.health - 4);
        },
        resultText: () => "You fit in, but you felt off the whole next day.",
      },
      {
        label: "Pass",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness - 2);
        },
        resultText: () => "A couple people gave you a hard time about it. Whatever.",
      },
    ],
  },
  {
    id: "viral-embarrassment",
    minAge: 13,
    maxAge: 18,
    once: true,
    weight: 0.6,
    text: () => "Someone recorded you tripping in the hallway and it's making the rounds at school.",
    choices: [
      {
        label: "Laugh it off",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness + 4);
        },
        resultText: () => "Owning it made you more likable, weirdly.",
      },
      {
        label: "Avoid everyone for a week",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness - 8);
        },
      },
    ],
  },
  {
    id: "college-prep-stress",
    minAge: 16,
    maxAge: 17,
    once: true,
    text: () => "College application season. Everyone's stressed, including you.",
    choices: [
      {
        label: "Grind through it",
        effect: (c) => {
          c.stats.smarts = clamp(c.stats.smarts + 8);
          c.stats.happiness = clamp(c.stats.happiness - 6);
        },
      },
      {
        label: "Do the minimum",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness + 3);
          c.stats.smarts = clamp(c.stats.smarts - 3);
        },
      },
    ],
  },
  {
    id: "body-image",
    minAge: 13,
    maxAge: 17,
    weight: 0.7,
    text: () => "You've been comparing yourself to people online a lot lately.",
    choices: [
      {
        label: "Take a break from your phone",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness + 6);
        },
      },
      {
        label: "Keep scrolling",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness - 5);
        },
      },
    ],
  },
  {
    id: "sneaking-out",
    minAge: 14,
    maxAge: 17,
    weight: 0.8,
    text: () => "Your friends are sneaking out tonight to hang by the river. You could climb out the window.",
    choices: [
      {
        label: "Sneak out",
        effect: (c) => {
          const caught = Math.random() < 0.35;
          c.stats.happiness = clamp(c.stats.happiness + 10);
          if (caught) {
            const m = mother(c);
            if (m) m.level = clamp(m.level - 15);
            c.stats.happiness = clamp(c.stats.happiness - 5);
          }
        },
        resultText: (c) => (c.stats.happiness > 50 ? "Got away with it." : "Got caught coming back in. Grounded."),
      },
      {
        label: "Stay in",
        effect: () => {},
      },
    ],
  },
];
