import { LifeEvent } from "../../types";
import { clamp, randomInt } from "../../engine/util";
import { randomClassmate, randomTeacher, bumpGpa, setFlag, joinClub } from "../../engine/school";
import { CLIQUES, CLUBS } from "../../data/school";

export const SCHOOL_MIDDLE_EVENTS: LifeEvent[] = [
  {
    id: "lunch-table",
    minAge: 11,
    maxAge: 12,
    once: true,
    weight: 5,
    text: () => "Where do you sit at lunch?",
    choices: CLIQUES.map((clique) => ({
      label: clique,
      effect: (c) => {
        c.clique = clique;
        c.stats.happiness = clamp(c.stats.happiness + 5);
        setFlag(c, `clique-${clique.toLowerCase()}`);
      },
    })),
  },
  {
    id: "first-crush",
    minAge: 11,
    maxAge: 13,
    weight: 1,
    text: (c) => {
      const cm = randomClassmate(c);
      return cm ? `You have a real crush on ${cm.name}.` : "You have a crush on someone in your grade.";
    },
    choices: [
      {
        label: "Pass a note",
        effect: (c) => {
          const cm = randomClassmate(c);
          const goesWell = Math.random() < 0.5;
          if (cm) cm.level = clamp(cm.level + (goesWell ? 15 : -5));
          c.stats.happiness = clamp(c.stats.happiness + (goesWell ? 8 : -4));
        },
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
    id: "group-project-slacker",
    minAge: 11,
    maxAge: 13,
    weight: 0.8,
    text: () => "Your group project partner hasn't done anything.",
    choices: [
      {
        label: "Pick up the slack",
        effect: (c) => {
          bumpGpa(c, 0.05);
          c.stats.happiness = clamp(c.stats.happiness - 3);
        },
      },
      {
        label: "Call them out",
        effect: (c) => {
          const t = randomTeacher(c);
          if (t) t.level = clamp(t.level + 4);
          const cm = randomClassmate(c);
          if (cm) cm.level = clamp(cm.level - 10);
        },
      },
    ],
  },
  {
    id: "the-group-chat",
    minAge: 11,
    maxAge: 13,
    weight: 0.7,
    text: () => "The group chat is being mean to someone in your grade, and everyone's watching how you react.",
    choices: [
      {
        label: "Speak up",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness + 4);
          const cm = randomClassmate(c);
          if (cm) cm.level = clamp(cm.level - 6);
          setFlag(c, "spoke-up-on-classmate");
        },
      },
      {
        label: "Stay quiet",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness - 3);
        },
      },
    ],
  },
  {
    id: "tryouts",
    minAge: 11,
    maxAge: 13,
    weight: 1,
    text: () => "Tryouts for a school team are today.",
    choices: [
      {
        label: "Try out",
        effect: (c) => {
          const made = Math.random() < 0.5;
          if (made) {
            const activities = c.schoolActivities ?? [];
            if (!activities.includes("a sports team")) activities.push("a sports team");
            c.schoolActivities = activities;
            c.stats.health = clamp(c.stats.health + 3);
            c.stats.happiness = clamp(c.stats.happiness + 10);
            setFlag(c, "made-middle-school-team");
          } else {
            c.stats.happiness = clamp(c.stats.happiness - 5);
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
    id: "pick-a-club",
    minAge: 11,
    maxAge: 13,
    weight: 1,
    text: () => {
      const club = CLUBS[randomInt(0, CLUBS.length - 1)];
      return `${club.label} is looking for new members.`;
    },
    choices: [
      {
        label: "Join",
        effect: (c) => {
          const club = CLUBS[randomInt(0, CLUBS.length - 1)];
          joinClub(c, club.key);
        },
      },
      {
        label: "Not now",
        effect: () => {},
      },
    ],
  },
  {
    id: "growing-pains",
    minAge: 11,
    maxAge: 13,
    weight: 0.6,
    text: () => "Your body's changing in ways that feel awkward and confusing. It's a normal, rough stretch.",
    choices: [
      {
        label: "Talk to a parent about it",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness + 4);
        },
      },
      {
        label: "Deal with it on your own",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness - 2);
        },
      },
    ],
  },
  {
    id: "first-phone-first-account",
    minAge: 11,
    maxAge: 13,
    once: true,
    weight: 2,
    text: () => "You got your first phone, and with it, your first social media account.",
    choices: [
      {
        label: "Post carefully",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness + 3);
        },
      },
      {
        label: "Overshare",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness + 6);
          setFlag(c, "overshared-early");
        },
      },
    ],
  },
  {
    id: "detention",
    minAge: 11,
    maxAge: 13,
    weight: 0.6,
    text: () => "You got caught doing something you shouldn't have. Detention's on the table.",
    choices: [
      {
        label: "Take it",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness - 4);
        },
      },
      {
        label: "Talk your way out",
        effect: (c) => {
          const worked = Math.random() < 0.3 + (c.stats.smarts - 50) / 300;
          const t = randomTeacher(c);
          if (worked) {
            if (t) t.level = clamp(t.level + 5);
          } else {
            c.stats.happiness = clamp(c.stats.happiness - 6);
            if (t) t.level = clamp(t.level - 5);
          }
        },
      },
    ],
  },
  {
    id: "clique-pressure",
    minAge: 11,
    maxAge: 13,
    weight: 0.8,
    condition: (c) => !!c.clique,
    text: (c) => `Your ${c.clique} friends want you to be cold to someone who isn't one of you.`,
    choices: [
      {
        label: "Go along with it",
        effect: (c) => {
          c.relationships.forEach((r) => {
            if (r.type === "classmate" && r.alive) r.level = clamp(r.level + 3);
          });
          const cm = randomClassmate(c);
          if (cm) cm.level = clamp(cm.level - 12);
          setFlag(c, "went-along-with-clique");
        },
      },
      {
        label: "Refuse",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness + 5);
          c.relationships.forEach((r) => {
            if (r.type === "classmate" && r.alive) r.level = clamp(r.level - 4);
          });
          setFlag(c, "refused-clique-pressure");
        },
      },
    ],
  },
  {
    id: "middle-school-dance",
    minAge: 11,
    maxAge: 13,
    weight: 0.8,
    text: () => "There's a school dance coming up.",
    choices: [
      {
        label: "Go",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness + 6);
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
    id: "middle-school-report-card",
    minAge: 11,
    maxAge: 13,
    weight: 3,
    text: () => "Report cards came out today.",
    autoEffect: (c) => {
      const smartsEffect = (c.stats.smarts - 50) / 100;
      bumpGpa(c, smartsEffect * 0.5 + (Math.random() - 0.5) * 0.4);
    },
  },
];
