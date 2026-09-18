import { LifeEvent } from "../types";
import { clamp } from "../engine/util";

function mother(c: Parameters<LifeEvent["text"]>[0]) {
  return c.relationships.find((r) => r.type === "mother");
}
function father(c: Parameters<LifeEvent["text"]>[0]) {
  return c.relationships.find((r) => r.type === "father");
}

export const EVENTS: LifeEvent[] = [
  // --- Early childhood (0-5) ---
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

  // --- Childhood (6-12) ---
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
        name: "A close friend",
        type: "friend",
        level: 60,
        alive: true,
      });
    },
  },
  {
    id: "broken-bone",
    minAge: 5,
    maxAge: 16,
    weight: 0.6,
    text: () => "You fell off your bike doing a stunt you definitely weren't ready for.",
    choices: [
      {
        label: "Walk it off",
        effect: (c) => {
          c.stats.health = clamp(c.stats.health - 10);
        },
        resultText: () => "Bad idea. It was actually broken.",
      },
      {
        label: "Go to the hospital",
        effect: (c) => {
          c.stats.health = clamp(c.stats.health - 3);
          c.money = Math.max(0, c.money - 800);
        },
        resultText: () => "A cast and a big bill, but you're okay.",
      },
    ],
  },

  // --- Teen (13-17) ---
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

  // --- Young adult (18-25) ---
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
    id: "first-apartment",
    minAge: 18,
    maxAge: 24,
    once: true,
    text: () => "You're thinking about moving out on your own.",
    choices: [
      {
        label: "Move out",
        effect: (c) => {
          c.money = Math.max(0, c.money - 1200);
          c.stats.happiness = clamp(c.stats.happiness + 8);
        },
      },
      {
        label: "Stay with family a bit longer",
        effect: (c) => {
          c.money += 1200;
        },
      },
    ],
  },
  {
    id: "met-someone",
    minAge: 18,
    maxAge: 40,
    weight: 1.3,
    condition: (c) => !c.relationships.some((r) => r.type === "partner" && r.alive),
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

  // --- Adult (26-59) ---
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
    id: "engagement",
    minAge: 22,
    maxAge: 45,
    once: true,
    condition: (c) => c.relationships.some((r) => r.type === "partner" && r.alive && r.level > 70),
    text: () => "Things with your partner have been serious for a while now.",
    choices: [
      {
        label: "Propose",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness + 20);
          const p = c.relationships.find((r) => r.type === "partner");
          if (p) p.level = clamp(p.level + 15);
        },
      },
      {
        label: "Not ready yet",
        effect: () => {},
      },
    ],
  },
  {
    id: "have-a-kid",
    minAge: 23,
    maxAge: 45,
    weight: 0.8,
    condition: (c) => c.relationships.some((r) => r.type === "partner" && r.alive),
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
    id: "health-scare",
    minAge: 30,
    maxAge: 75,
    weight: 1,
    text: () => "Your doctor found something in your last checkup that needs attention.",
    choices: [
      {
        label: "Get treatment",
        effect: (c) => {
          c.money = Math.max(0, c.money - 2000);
          c.stats.health = clamp(c.stats.health + 10);
        },
      },
      {
        label: "Ignore it and hope it goes away",
        effect: (c) => {
          c.stats.health = clamp(c.stats.health - 15);
        },
      },
    ],
  },
  {
    id: "investment-tip",
    minAge: 20,
    maxAge: 55,
    weight: 0.9,
    condition: (c) => c.money > 500,
    text: () => "A coworker won't stop talking about a stock that's 'about to blow up.'",
    choices: [
      {
        label: "Put in $500",
        effect: (c) => {
          const win = Math.random() > 0.5;
          c.money += win ? 1200 : -500;
        },
        resultText: (c) => `Your money moved. Balance: $${c.money.toLocaleString()}`,
      },
      {
        label: "Not touching that",
        effect: () => {},
      },
    ],
  },
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

  // --- Senior (60+) ---
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
    condition: (c) => c.relationships.some((r) => r.type === "child" && r.alive),
    text: () => "Your grandkids came to visit this weekend.",
    autoEffect: (c) => {
      c.stats.happiness = clamp(c.stats.happiness + 10);
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
