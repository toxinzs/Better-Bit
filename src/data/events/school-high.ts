import { LifeEvent } from "../../types";
import { clamp, randomInt } from "../../engine/util";
import {
  randomClassmate,
  randomTeacher,
  bumpGpa,
  setFlag,
  hasFlag,
  throwParty,
  skipClass,
  onEnterSchoolStage,
} from "../../engine/school";
import { partner, hasPartner } from "./helpers";

export const SCHOOL_HIGH_EVENTS: LifeEvent[] = [
  {
    id: "freshman-year-clique",
    minAge: 14,
    maxAge: 14,
    once: true,
    weight: 3,
    text: () => "High school's a bigger pond. Where do you land?",
    choices: [
      {
        label: "Stick with who you know",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness + 4);
        },
      },
      {
        label: "Try something new",
        effect: (c) => {
          const cliques = ["Jocks", "Nerds", "Artsy", "Popular", "Loners"];
          c.clique = cliques[randomInt(0, cliques.length - 1)];
          c.stats.happiness = clamp(c.stats.happiness + 2);
        },
      },
    ],
  },
  {
    id: "varsity-tryouts",
    minAge: 14,
    maxAge: 17,
    weight: 1,
    text: () => "Varsity tryouts are today.",
    choices: [
      {
        label: "Try out",
        effect: (c) => {
          const boost = hasFlag(c, "made-middle-school-team") ? 0.2 : 0;
          const made = Math.random() < 0.45 + boost;
          if (made) {
            const activities = c.schoolActivities ?? [];
            if (!activities.includes("varsity team")) activities.push("varsity team");
            c.schoolActivities = activities;
            c.stats.health = clamp(c.stats.health + 4);
            c.stats.happiness = clamp(c.stats.happiness + 12);
          } else {
            c.stats.happiness = clamp(c.stats.happiness - 6);
          }
        },
      },
      {
        label: "Skip it",
        effect: () => {},
      },
    ],
  },
  {
    id: "student-council",
    minAge: 14,
    maxAge: 17,
    weight: 0.6,
    text: () => "Student council elections are coming up.",
    choices: [
      {
        label: "Campaign for a seat",
        effect: (c) => {
          const win = Math.random() < 0.4 + (c.stats.looks - 50) / 300;
          if (win) {
            setFlag(c, "won-student-council");
            c.stats.happiness = clamp(c.stats.happiness + 10);
          } else {
            c.stats.happiness = clamp(c.stats.happiness - 4);
          }
        },
      },
      {
        label: "Don't bother",
        effect: () => {},
      },
    ],
  },
  {
    id: "ask-to-prom",
    minAge: 16,
    maxAge: 18,
    once: true,
    weight: 4,
    text: () => "Prom's coming up, and you've got someone in mind to ask.",
    choices: [
      {
        label: "Ask them",
        effect: (c) => {
          const target = hasPartner(c) ? partner(c) : randomClassmate(c);
          const said_yes = Math.random() < 0.7;
          if (target) target.level = clamp(target.level + (said_yes ? 10 : -5));
          c.stats.happiness = clamp(c.stats.happiness + (said_yes ? 10 : -6));
          setFlag(c, said_yes ? "has-prom-date" : "prom-rejected");
        },
      },
      {
        label: "Go solo",
        effect: (c) => {
          setFlag(c, "going-to-prom-solo");
        },
      },
    ],
  },
  {
    id: "prom-night",
    minAge: 16,
    maxAge: 18,
    once: true,
    weight: 5,
    condition: (c) => hasFlag(c, "has-prom-date") || hasFlag(c, "going-to-prom-solo") || hasFlag(c, "prom-rejected"),
    text: () => "It's prom night.",
    choices: [
      {
        label: "Go all out",
        effect: (c) => {
          c.money = Math.max(0, c.money - 300);
          c.stats.happiness = clamp(c.stats.happiness + 15);
          if (hasFlag(c, "has-prom-date")) {
            const p = hasPartner(c) ? partner(c) : randomClassmate(c);
            if (p) p.level = clamp(p.level + 10);
          }
        },
      },
      {
        label: "Keep it low-key",
        effect: (c) => {
          c.money = Math.max(0, c.money - 60);
          c.stats.happiness = clamp(c.stats.happiness + 6);
        },
      },
    ],
  },
  {
    id: "homecoming",
    minAge: 14,
    maxAge: 17,
    weight: 1,
    text: () => "It's homecoming.",
    choices: [
      {
        label: "Go",
        effect: (c) => {
          c.money = Math.max(0, c.money - 40);
          c.stats.happiness = clamp(c.stats.happiness + 7);
          const cm = randomClassmate(c);
          if (cm) cm.level = clamp(cm.level + 5);
        },
      },
      {
        label: "Skip it",
        effect: () => {},
      },
    ],
  },
  {
    id: "sneaking-out",
    minAge: 14,
    maxAge: 17,
    weight: 0.8,
    text: () => "Your friends want you to sneak out tonight.",
    choices: [
      {
        label: "Go for it",
        effect: (c) => {
          const caught = Math.random() < 0.4;
          if (caught) {
            const parent = c.relationships.find((r) => (r.type === "mother" || r.type === "father") && r.alive);
            if (parent) parent.level = clamp(parent.level - 15);
            c.stats.happiness = clamp(c.stats.happiness - 5);
          } else {
            c.stats.happiness = clamp(c.stats.happiness + 8);
          }
        },
      },
      {
        label: "Stay home",
        effect: () => {},
      },
    ],
  },
  {
    id: "parents-out-of-town",
    minAge: 14,
    maxAge: 17,
    weight: 0.7,
    text: () => "Your parents are out of town this weekend. The house is empty.",
    choices: [
      {
        label: "Throw a party",
        effect: (c) => throwParty(c),
      },
      {
        label: "Don't",
        effect: () => {},
      },
    ],
  },
  {
    id: "cheating-on-a-test",
    minAge: 14,
    maxAge: 17,
    weight: 0.7,
    text: () => "You didn't study, and the test is today.",
    choices: [
      {
        label: "Cheat",
        effect: (c) => {
          const caught = Math.random() < 0.3;
          if (caught) {
            bumpGpa(c, -0.3);
            const t = randomTeacher(c);
            if (t) t.level = clamp(t.level - 15);
            c.stats.happiness = clamp(c.stats.happiness - 8);
          } else {
            bumpGpa(c, 0.1);
          }
        },
      },
      {
        label: "Take the hit honestly",
        effect: (c) => {
          bumpGpa(c, -0.1);
        },
      },
    ],
  },
  {
    id: "skip-class-invite",
    minAge: 14,
    maxAge: 17,
    weight: 0.8,
    text: (c) => {
      const cm = randomClassmate(c);
      return cm ? `${cm.name} wants to ditch class with you.` : "Some classmates want to ditch class.";
    },
    choices: [
      {
        label: "Skip with them",
        effect: (c) => {
          const cm = randomClassmate(c);
          if (cm) cm.level = clamp(cm.level + 5);
          skipClass(c);
        },
      },
      {
        label: "Stay in class",
        effect: () => {},
      },
    ],
  },
  {
    id: "bullying-high-school",
    minAge: 14,
    maxAge: 17,
    weight: 0.7,
    text: () => "Things have gotten worse between you and a kid in your grade — it's escalating.",
    choices: [
      {
        label: "Stand your ground",
        effect: (c) => {
          const cm = randomClassmate(c);
          if (cm) cm.level = clamp(cm.level - 10);
          c.stats.happiness = clamp(c.stats.happiness + 3);
        },
      },
      {
        label: "Try to make peace",
        effect: (c) => {
          const cm = randomClassmate(c);
          if (cm) cm.level = clamp(cm.level + 8);
        },
      },
    ],
  },
  {
    id: "guidance-counselor-talk",
    minAge: 15,
    maxAge: 16,
    once: true,
    weight: 2,
    text: () => "Your guidance counselor wants to talk about your plans after graduation.",
    choices: [
      {
        label: "Talk about college",
        effect: (c) => {
          setFlag(c, "leaning-college");
        },
      },
      {
        label: "Talk about working right away",
        effect: (c) => {
          setFlag(c, "leaning-work");
        },
      },
    ],
  },
  {
    id: "job-vs-clubs",
    minAge: 15,
    maxAge: 17,
    weight: 0.6,
    condition: (c) => c.job !== null,
    text: () => "Between your job and your clubs, something's got to give.",
    choices: [
      {
        label: "Cut back at work",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness + 4);
          bumpGpa(c, 0.05);
        },
      },
      {
        label: "Cut back on clubs",
        effect: (c) => {
          c.schoolActivities = [];
        },
      },
    ],
  },
  {
    id: "a-teacher-notices-you",
    minAge: 14,
    maxAge: 17,
    weight: 0.6,
    text: (c) => {
      const t = randomTeacher(c);
      return t ? `${t.name} pulled you aside after class today.` : "A teacher pulled you aside after class today.";
    },
    choices: [
      {
        label: "Hear them out",
        effect: (c) => {
          const t = randomTeacher(c);
          if (t) t.level = clamp(t.level + 10);
        },
      },
      {
        label: "Brush it off",
        effect: (c) => {
          const t = randomTeacher(c);
          if (t) t.level = clamp(t.level - 5);
        },
      },
    ],
  },
  {
    id: "senioritis",
    minAge: 17,
    maxAge: 18,
    once: true,
    weight: 2,
    text: () => "Senior year's almost over, and it's hard to care anymore.",
    choices: [
      {
        label: "Coast",
        effect: (c) => {
          bumpGpa(c, -0.3);
          c.stats.happiness = clamp(c.stats.happiness + 6);
        },
      },
      {
        label: "Finish strong",
        effect: (c) => {
          bumpGpa(c, 0.2);
        },
      },
    ],
  },
  {
    id: "graduation-day",
    minAge: 17,
    maxAge: 18,
    once: true,
    weight: 8,
    text: () => "Graduation day.",
    autoEffect: (c) => {
      const gpa = c.gpa ?? 3.0;
      c.stats.happiness = clamp(c.stats.happiness + (gpa >= 3.5 ? 25 : 15));
      if (!c.inCollege) {
        c.educationStage = "graduated";
        onEnterSchoolStage(c, "graduated");
      }
    },
  },
];
