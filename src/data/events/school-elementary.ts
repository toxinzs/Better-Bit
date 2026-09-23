import { LifeEvent } from "../../types";
import { clamp, randomInt } from "../../engine/util";
import { randomClassmate, randomTeacher, bumpGpa } from "../../engine/school";

export const SCHOOL_ELEMENTARY_EVENTS: LifeEvent[] = [
  {
    id: "first-day-of-school",
    minAge: 5,
    maxAge: 6,
    once: true,
    weight: 5,
    text: () => "It's your first day of school. Everyone's a stranger.",
    choices: [
      {
        label: "Make a friend right away",
        effect: (c) => {
          const cm = randomClassmate(c);
          if (cm) cm.level = clamp(cm.level + 15);
          c.stats.happiness = clamp(c.stats.happiness + 8);
        },
        resultText: (c) => {
          const cm = randomClassmate(c);
          return cm ? `You hit it off with ${cm.name}.` : "You made a friend.";
        },
      },
      {
        label: "Stick close to the wall",
        effect: (c) => {
          c.stats.smarts = clamp(c.stats.smarts - 1);
          c.stats.happiness = clamp(c.stats.happiness - 3);
        },
      },
    ],
  },
  {
    id: "show-and-tell",
    minAge: 6,
    maxAge: 9,
    weight: 1.5,
    text: () => "It's your turn for show and tell.",
    choices: [
      {
        label: "Bring something cool",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness + 6);
          const cm = randomClassmate(c);
          if (cm) cm.level = clamp(cm.level + 5);
        },
      },
      {
        label: "Forget it's your day",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness - 5);
        },
      },
    ],
  },
  {
    id: "recess-pushed",
    minAge: 6,
    maxAge: 10,
    weight: 1,
    text: () => "A kid shoves you at recess for no reason.",
    choices: [
      {
        label: "Push back",
        effect: (c) => {
          const t = randomTeacher(c);
          if (t) t.level = clamp(t.level - 8);
          c.stats.happiness = clamp(c.stats.happiness + 2);
        },
      },
      {
        label: "Tell the teacher",
        effect: (c) => {
          const t = randomTeacher(c);
          if (t) t.level = clamp(t.level + 6);
          const cm = randomClassmate(c);
          if (cm) cm.level = clamp(cm.level - 4);
        },
      },
    ],
  },
  {
    id: "spelling-bee",
    minAge: 7,
    maxAge: 10,
    weight: 0.8,
    text: () => "The class spelling bee is today.",
    choices: [
      {
        label: "Study hard",
        effect: (c) => {
          const win = Math.random() < 0.4 + (c.stats.smarts - 50) / 200;
          if (win) {
            c.stats.smarts = clamp(c.stats.smarts + 3);
            c.stats.happiness = clamp(c.stats.happiness + 8);
            bumpGpa(c, 0.1);
          } else {
            c.stats.happiness = clamp(c.stats.happiness - 2);
          }
        },
      },
      {
        label: "Wing it",
        effect: (c) => {
          const win = Math.random() < 0.15;
          c.stats.happiness = clamp(c.stats.happiness + (win ? 6 : -2));
        },
      },
    ],
  },
  {
    id: "class-pet-duty",
    minAge: 6,
    maxAge: 10,
    weight: 0.6,
    text: () => "The teacher's asking for a volunteer to take the class hamster home for break.",
    choices: [
      {
        label: "Accept",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness + 5);
          const t = randomTeacher(c);
          if (t) t.level = clamp(t.level + 6);
        },
      },
      {
        label: "Decline",
        effect: () => {},
      },
    ],
  },
  {
    id: "birthday-party-invite",
    minAge: 6,
    maxAge: 10,
    weight: 1,
    text: (c) => {
      const cm = randomClassmate(c);
      return cm ? `${cm.name} invited you to their birthday party.` : "A classmate invited you to their birthday party.";
    },
    choices: [
      {
        label: "Go",
        effect: (c) => {
          const cm = randomClassmate(c);
          if (cm) cm.level = clamp(cm.level + 10);
          c.stats.happiness = clamp(c.stats.happiness + 6);
        },
      },
      {
        label: "Can't go",
        effect: (c) => {
          const cm = randomClassmate(c);
          if (cm) cm.level = clamp(cm.level - 5);
        },
      },
    ],
  },
  {
    id: "the-quiz-peek",
    minAge: 7,
    maxAge: 10,
    weight: 0.7,
    text: () => "You could easily glance at your neighbor's answers during the quiz.",
    choices: [
      {
        label: "Cheat",
        effect: (c) => {
          const caught = Math.random() < 0.35;
          if (caught) {
            const t = randomTeacher(c);
            if (t) t.level = clamp(t.level - 15);
            c.stats.happiness = clamp(c.stats.happiness - 6);
            bumpGpa(c, -0.1);
          } else {
            bumpGpa(c, 0.05);
          }
        },
      },
      {
        label: "Don't",
        effect: () => {},
      },
    ],
  },
  {
    id: "someones-getting-picked-on",
    minAge: 6,
    maxAge: 10,
    weight: 0.8,
    text: () => "You see a classmate getting picked on by some older kids.",
    choices: [
      {
        label: "Step in",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness + 5);
          const risk = Math.random() < 0.3;
          if (risk) c.stats.health = clamp(c.stats.health - 5);
          c.relationships.forEach((r) => {
            if (r.type === "classmate" && r.alive) r.level = clamp(r.level + 3);
          });
        },
      },
      {
        label: "Look away",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness - 3);
        },
      },
    ],
  },
  {
    id: "lost-tooth",
    minAge: 5,
    maxAge: 8,
    weight: 0.5,
    text: () => "You lost a tooth! The tooth fairy came through.",
    autoEffect: (c) => {
      c.money += randomInt(1, 5);
      c.stats.happiness = clamp(c.stats.happiness + 3);
    },
  },
  {
    id: "field-trip",
    minAge: 6,
    maxAge: 10,
    weight: 1,
    text: () => {
      const spots = ["the museum", "the zoo", "a farm"];
      return `Your class went on a field trip to ${spots[randomInt(0, spots.length - 1)]}.`;
    },
    choices: [
      {
        label: "Explore on your own",
        effect: (c) => {
          c.stats.smarts = clamp(c.stats.smarts + 3);
          c.stats.happiness = clamp(c.stats.happiness + 2);
        },
      },
      {
        label: "Stick with the group",
        effect: (c) => {
          const cm = randomClassmate(c);
          if (cm) cm.level = clamp(cm.level + 4);
          c.stats.happiness = clamp(c.stats.happiness + 3);
        },
      },
    ],
  },
];
