import { LifeEvent } from "../../types";
import { clamp, randomInt } from "../../engine/util";
import { hasActiveCondition } from "../../engine/worldState";

export const WORLD_EVENTS: LifeEvent[] = [
  {
    id: "draft-notice",
    minAge: 18,
    maxAge: 25,
    once: true,
    weight: 4,
    condition: (c, world) => hasActiveCondition(world, "war"),
    text: () => "A draft notice arrived in the mail. With the war on, they're calling people up.",
    choices: [
      {
        label: "Report for service",
        effect: (c) => {
          c.money += 2000;
          c.stats.happiness = clamp(c.stats.happiness - 15);
          c.stats.health = clamp(c.stats.health - randomInt(0, 10));
        },
        resultText: () => "You served out your time. Not everyone comes back the same.",
      },
      {
        label: "Seek an exemption",
        effect: (c) => {
          c.money = Math.max(0, c.money - 1500);
          const success = Math.random() > 0.5;
          if (!success) {
            c.stats.happiness = clamp(c.stats.happiness - 20);
            c.stats.health = clamp(c.stats.health - randomInt(0, 10));
          }
        },
        resultText: (c) => (c.stats.happiness > 40 ? "It worked. You're exempt." : "It didn't work. You got called up anyway."),
      },
    ],
  },
  {
    id: "recession-layoff-scare",
    minAge: 18,
    maxAge: 65,
    weight: 4,
    condition: (c, world) => hasActiveCondition(world, "recession") && c.job !== null,
    text: (c) => `Layoffs are hitting your company hard. ${c.job?.title ?? "Your job"} might be next.`,
    choices: [
      {
        label: "Take a pay cut to keep the job",
        effect: (c) => {
          if (c.job) c.job = { ...c.job, salary: Math.round(c.job.salary * 0.85) };
          c.stats.happiness = clamp(c.stats.happiness - 5);
        },
      },
      {
        label: "Risk it and start looking elsewhere",
        effect: (c) => {
          const laidOff = Math.random() < 0.3;
          if (laidOff) {
            c.job = null;
            c.stats.happiness = clamp(c.stats.happiness - 12);
          }
        },
        resultText: (c) => (c.job ? "You kept your job, for now." : "You got laid off."),
      },
    ],
  },
  {
    id: "boom-job-offer",
    minAge: 18,
    maxAge: 65,
    weight: 4,
    condition: (c, world) => hasActiveCondition(world, "boom") && c.job !== null,
    text: (c) => `A recruiter reached out about a role that pays a lot more than ${c.job?.title ?? "your current job"}.`,
    choices: [
      {
        label: "Take the offer",
        effect: (c) => {
          if (c.job) c.job = { ...c.job, salary: Math.round(c.job.salary * 1.25) };
          c.stats.happiness = clamp(c.stats.happiness + 6);
        },
      },
      {
        label: "Stay loyal to your company",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness + 2);
        },
      },
    ],
  },
  {
    id: "pandemic-vaccine",
    minAge: 0,
    maxAge: 90,
    once: true,
    weight: 3,
    condition: (c, world) => hasActiveCondition(world, "pandemic"),
    text: () => "A vaccine is available now, if you want it.",
    choices: [
      {
        label: "Get vaccinated",
        effect: (c) => {
          c.money = Math.max(0, c.money - 50);
          c.stats.health = clamp(c.stats.health + 10);
        },
      },
      {
        label: "Skip it",
        effect: () => {},
      },
    ],
  },
];
