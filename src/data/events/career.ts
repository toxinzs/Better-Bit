import { LifeEvent } from "../../types";
import { clamp } from "../../engine/util";

export const CAREER_EVENTS: LifeEvent[] = [
  {
    id: "college-decision",
    minAge: 18,
    maxAge: 20,
    weight: 30,
    once: true,
    condition: (c) => c.educationStage === "graduated" || c.educationStage === "high",
    text: (c) => `You graduated high school with ${c.stats.smarts} smarts. What now?`,
    choices: [
      {
        label: "Apply to college",
        effect: (c) => {
          if (c.stats.smarts >= 55) {
            c.inCollege = true;
            c.educationStage = "college";
          } else {
            c.stats.happiness = clamp(c.stats.happiness - 10);
          }
        },
        resultText: (c) => (c.inCollege ? "You got in! College starts this year." : "Your grades weren't enough. Rejected."),
      },
      {
        label: "Go straight to work",
        effect: (c) => {
          c.educationStage = "graduated";
        },
      },
    ],
  },
  {
    id: "college-life",
    minAge: 19,
    maxAge: 22,
    weight: 1.5,
    condition: (c) => c.inCollege,
    text: () => "Midterms are piling up and so is the temptation to just skip them.",
    choices: [
      {
        label: "Grind it out",
        effect: (c) => {
          c.stats.smarts = clamp(c.stats.smarts + 6);
          c.stats.happiness = clamp(c.stats.happiness - 4);
        },
      },
      {
        label: "Live a little",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness + 6);
          c.stats.smarts = clamp(c.stats.smarts - 3);
        },
      },
    ],
  },
  {
    id: "college-graduation",
    minAge: 21,
    maxAge: 23,
    once: true,
    condition: (c) => c.inCollege,
    text: () => "You walked at graduation. Cap, gown, the whole thing.",
    autoEffect: (c) => {
      c.inCollege = false;
      c.educationStage = "graduated";
      c.hasCollegeDegree = true;
      c.stats.happiness = clamp(c.stats.happiness + 10);
      c.stats.smarts = clamp(c.stats.smarts + 5);
    },
  },
  {
    id: "promotion-chance",
    minAge: 23,
    maxAge: 59,
    weight: 1.4,
    condition: (c) => c.job !== null,
    text: (c) => `Your boss is impressed with your work at ${c.job?.title}.`,
    choices: [
      {
        label: "Ask for a raise",
        effect: (c) => {
          if (c.job && c.stats.happiness + c.stats.smarts > 90) {
            c.job = { ...c.job, salary: Math.round(c.job.salary * 1.15) };
          } else {
            c.stats.happiness = clamp(c.stats.happiness - 5);
          }
        },
        resultText: (c) => (c.job ? `New salary: $${c.job.salary.toLocaleString()}` : ""),
      },
      {
        label: "Stay quiet, keep your head down",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness - 1);
        },
      },
    ],
  },
  {
    id: "job-interview-nerves",
    minAge: 18,
    maxAge: 65,
    weight: 0.8,
    condition: (c) => c.job === null,
    text: () => "You landed an interview for a job you actually want. Nerves are kicking in.",
    choices: [
      {
        label: "Prepare thoroughly",
        effect: (c) => {
          c.stats.smarts = clamp(c.stats.smarts + 2);
          c.stats.happiness = clamp(c.stats.happiness + 4);
        },
      },
      {
        label: "Wing it",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness - 2);
        },
      },
    ],
  },
  {
    id: "coworker-conflict",
    minAge: 20,
    maxAge: 65,
    weight: 1,
    condition: (c) => c.job !== null,
    text: () => "A coworker keeps taking credit for things you did.",
    choices: [
      {
        label: "Call it out in front of the team",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness + 6);
        },
      },
      {
        label: "Let it slide",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness - 8);
        },
      },
    ],
  },
  {
    id: "workplace-gossip",
    minAge: 19,
    maxAge: 65,
    weight: 0.6,
    condition: (c) => c.job !== null,
    text: () => "There's some juicy office gossip going around, and someone's asking what you think.",
    choices: [
      {
        label: "Stay out of it",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness - 1);
        },
      },
      {
        label: "Weigh in",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness + 3);
        },
        resultText: () => "It got back to the person you were talking about. Awkward.",
      },
    ],
  },
  {
    id: "relocation-offer",
    minAge: 22,
    maxAge: 55,
    weight: 0.4,
    once: true,
    condition: (c) => c.job !== null && c.job.salary > 40000,
    text: (c) => `Your company wants to relocate you for a bigger role. More money, but you'd have to leave everything behind.`,
    choices: [
      {
        label: "Take the opportunity",
        effect: (c) => {
          if (c.job) c.job = { ...c.job, salary: Math.round(c.job.salary * 1.3) };
          c.relationships.forEach((r) => {
            if (r.type === "friend") r.level = clamp(r.level - 20);
          });
        },
      },
      {
        label: "Turn it down, staying put",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness + 3);
        },
      },
    ],
  },
  {
    id: "quit-on-the-spot",
    minAge: 20,
    maxAge: 60,
    weight: 0.3,
    condition: (c) => c.job !== null && c.stats.happiness < 30,
    text: (c) => `You've had it with ${c.job?.title}. Today was the last straw.`,
    choices: [
      {
        label: "Quit, right now",
        effect: (c) => {
          c.job = null;
          c.stats.happiness = clamp(c.stats.happiness + 15);
        },
      },
      {
        label: "Cool off and stick it out",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness + 2);
        },
      },
    ],
  },
  {
    id: "networking-event",
    minAge: 21,
    maxAge: 60,
    weight: 0.5,
    text: () => "There's an industry networking mixer this week. Free food, awkward small talk.",
    choices: [
      {
        label: "Go",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness - 1);
          c.stats.smarts = clamp(c.stats.smarts + 2);
        },
        resultText: () => "Made a few decent connections, at least.",
      },
      {
        label: "Skip it",
        effect: () => {},
      },
    ],
  },
];
