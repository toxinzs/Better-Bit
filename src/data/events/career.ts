import { LifeEvent } from "../../types";
import { clamp } from "../../engine/util";
import { hasActiveCondition } from "../../engine/worldState";
import { randomInt } from "../../engine/util";
import { availableColleges, MAJORS } from "../school";
import { enrollInCollege } from "../../engine/school";

let collegeResult = ""; // read back by resultText after effect() runs

export const CAREER_EVENTS: LifeEvent[] = [
  // What comes after high school. Enrollment itself is the real thing in
  // engine/school.ts (a school, a major, housing); this event just makes the
  // decision happen instead of waiting for the player to find the School menu.
  {
    id: "after-graduation",
    minAge: 18,
    maxAge: 20,
    weight: 30,
    once: true,
    condition: (c) => !c.inCollege && !c.hasCollegeDegree && (c.educationStage === "graduated" || c.educationStage === "high"),
    text: (c) => `You finished school with a ${(c.gpa ?? 3).toFixed(2)} GPA. What now?`,
    choices: [
      {
        label: "Go to college",
        sublabel: "The best school your grades allow",
        effect: (c) => {
          const options = availableColleges(c.gpa ?? 0);
          const affordable = options.filter((o) => o.tier !== "ivy" || c.stats.smarts >= 70);
          const pick = affordable[affordable.length - 1] ?? options[options.length - 1];
          if (!pick) {
            c.stats.happiness = clamp(c.stats.happiness - 10);
            collegeResult = "Your grades weren't enough for any school that would take you. It stings.";
            return;
          }
          enrollInCollege(c, pick.name, MAJORS[randomInt(0, MAJORS.length - 1)], false, pick.tier === "community" ? "commute" : "dorm");
          collegeResult = `You got in to ${pick.name}. You can change your major any time from the School menu.`;
        },
        resultText: () => collegeResult,
      },
      {
        label: "Go straight to work",
        effect: (c) => {
          c.educationStage = "graduated";
        },
        resultText: () => "You're joining the workforce. Check the Career menu for openings.",
      },
      {
        label: "Take a gap year",
        effect: (c) => {
          c.educationStage = "graduated";
          c.stats.happiness = clamp(c.stats.happiness + 6);
          c.stats.smarts = clamp(c.stats.smarts + 1);
        },
        resultText: () => "You spent the year figuring things out. The plan can wait.",
      },
    ],
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
        effect: (c, world) => {
          const threshold = hasActiveCondition(world, "boom") ? 75 : hasActiveCondition(world, "recession") ? 105 : 90;
          if (c.job && c.stats.happiness + c.stats.smarts > threshold) {
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
