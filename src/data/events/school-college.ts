import { LifeEvent } from "../../types";
import { clamp, randomInt } from "../../engine/util";
import {
  randomClassmate,
  randomTeacher,
  bumpGpa,
  setFlag,
  hasFlag,
  throwParty,
  dropOutOfCollege,
  graduateCollege,
  changeMajor,
} from "../../engine/school";
import { GREEK_HOUSES, MAJORS, COLLEGES } from "../../data/school";

function isRushing(c: import("../../types").Character): boolean {
  return (c.flags ?? []).some((f) => f.startsWith("rushing-"));
}

function rushHouseName(c: import("../../types").Character): string | undefined {
  const flag = (c.flags ?? []).find((f) => f.startsWith("rushing-"));
  return flag ? flag.replace("rushing-", "") : undefined;
}

export const SCHOOL_COLLEGE_EVENTS: LifeEvent[] = [
  {
    id: "roommate-luck",
    minAge: 18,
    maxAge: 24,
    once: true,
    weight: 3,
    condition: (c) => c.inCollege && c.currentHousing === "dorm",
    text: () => "You just met your roommate for the first time.",
    autoEffect: (c) => {
      const good = Math.random() < 0.6;
      const cm = randomClassmate(c);
      if (good) {
        if (cm) cm.level = clamp(cm.level + 15);
        c.stats.happiness = clamp(c.stats.happiness + 8);
      } else {
        c.stats.happiness = clamp(c.stats.happiness - 8);
      }
    },
  },
  {
    id: "rush-week",
    minAge: 18,
    maxAge: 22,
    once: true,
    weight: 3,
    condition: (c) => c.inCollege && !c.greekHouse,
    text: () => "It's rush week.",
    choices: [
      {
        label: "Rush a house",
        effect: (c) => {
          const house = GREEK_HOUSES[randomInt(0, GREEK_HOUSES.length - 1)];
          setFlag(c, `rushing-${house}`);
        },
      },
      {
        label: "Skip it",
        effect: (c) => {
          setFlag(c, "declined-rush");
        },
      },
    ],
  },
  {
    id: "a-hazing-moment",
    minAge: 18,
    maxAge: 22,
    once: true,
    weight: 4,
    condition: (c) => isRushing(c),
    text: (c) => `${rushHouseName(c) ?? "The house"} wants to see how far you'll go to prove yourself.`,
    choices: [
      {
        label: "Go along with it",
        effect: (c) => {
          const house = rushHouseName(c);
          c.stats.health = clamp(c.stats.health - randomInt(5, 15));
          c.flags = (c.flags ?? []).filter((f) => !f.startsWith("rushing-"));
          if (house) {
            c.greekHouse = house;
            setFlag(c, `rushed-${house}`);
            c.stats.happiness = clamp(c.stats.happiness + 15);
          }
        },
      },
      {
        label: "Refuse",
        effect: (c) => {
          c.flags = (c.flags ?? []).filter((f) => !f.startsWith("rushing-"));
          setFlag(c, "blackballed");
          c.stats.happiness = clamp(c.stats.happiness + 5);
        },
      },
    ],
  },
  {
    id: "all-nighter-before-finals",
    minAge: 18,
    maxAge: 26,
    weight: 1.5,
    condition: (c) => c.inCollege,
    text: () => "Finals are tomorrow and you're way behind.",
    choices: [
      {
        label: "Pull an all-nighter",
        effect: (c) => {
          bumpGpa(c, 0.2);
          c.stats.health = clamp(c.stats.health - 8);
        },
      },
      {
        label: "Get some sleep and wing it",
        effect: (c) => {
          bumpGpa(c, -0.1);
        },
      },
    ],
  },
  {
    id: "office-hours",
    minAge: 18,
    maxAge: 26,
    weight: 1,
    condition: (c) => c.inCollege,
    text: (c) => {
      const t = randomTeacher(c);
      return t ? `You stopped by ${t.name}'s office hours.` : "You stopped by a professor's office hours.";
    },
    choices: [
      {
        label: "Actually engage",
        effect: (c) => {
          const t = randomTeacher(c);
          if (t) t.level = clamp(t.level + 12);
          bumpGpa(c, 0.05);
        },
      },
      {
        label: "Just show your face",
        effect: () => {},
      },
    ],
  },
  {
    id: "group-project-college",
    minAge: 18,
    maxAge: 26,
    weight: 1,
    condition: (c) => c.inCollege,
    text: () => "Your group project team is falling apart and the deadline's real this time.",
    choices: [
      {
        label: "Carry the team",
        effect: (c) => {
          bumpGpa(c, 0.1);
          c.stats.happiness = clamp(c.stats.happiness - 4);
        },
      },
      {
        label: "Let it fail",
        effect: (c) => {
          bumpGpa(c, -0.2);
        },
      },
    ],
  },
  {
    id: "spring-break",
    minAge: 18,
    maxAge: 24,
    weight: 1,
    condition: (c) => c.inCollege,
    text: () => "Spring break's here.",
    choices: [
      {
        label: "Go on the trip",
        effect: (c) => {
          c.money = Math.max(0, c.money - 900);
          c.stats.happiness = clamp(c.stats.happiness + 14);
        },
      },
      {
        label: "Stay and save the money",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness - 2);
        },
      },
    ],
  },
  {
    id: "failed-a-class",
    minAge: 18,
    maxAge: 26,
    weight: 0.8,
    condition: (c) => c.inCollege && (c.gpa ?? 4) < 2.5,
    text: () => "You failed a class.",
    choices: [
      {
        label: "Retake it",
        effect: (c) => {
          c.money = Math.max(0, c.money - 1200);
          bumpGpa(c, 0.15);
        },
      },
      {
        label: "Drop it and move on",
        effect: (c) => {
          bumpGpa(c, -0.05);
        },
      },
    ],
  },
  {
    id: "change-your-major",
    minAge: 18,
    maxAge: 26,
    weight: 0.5,
    condition: (c) => c.inCollege,
    text: (c) => `Your advisor thinks ${c.currentMajor ?? "your major"} might not be the right fit.`,
    choices: [
      {
        label: "Switch majors",
        effect: (c) => {
          const options = MAJORS.filter((m) => m !== c.currentMajor);
          const newMajor = options[randomInt(0, options.length - 1)];
          changeMajor(c, newMajor);
        },
      },
      {
        label: "Stick with it",
        effect: () => {},
      },
    ],
  },
  {
    id: "thinking-about-dropping-out",
    minAge: 18,
    maxAge: 26,
    weight: 0.5,
    condition: (c) => c.inCollege,
    text: () => "Between the money, the stress, and everything else — you're seriously thinking about dropping out.",
    choices: [
      {
        label: "Walk away",
        effect: (c) => dropOutOfCollege(c),
      },
      {
        label: "Push through",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness + 3);
        },
      },
    ],
  },
  {
    id: "academic-probation",
    minAge: 18,
    maxAge: 26,
    weight: 1.5,
    condition: (c) => c.inCollege && hasFlag(c, "on-probation"),
    text: () => "Your grades have landed you on academic probation.",
    choices: [
      {
        label: "Buckle down",
        effect: (c) => {
          bumpGpa(c, 0.4);
          c.flags = (c.flags ?? []).filter((f) => f !== "on-probation");
        },
      },
      {
        label: "It keeps slipping",
        effect: (c) => {
          bumpGpa(c, -0.2);
          const college = COLLEGES.find((cl) => cl.name === c.currentSchool);
          if (college && (c.gpa ?? 4) < college.probationGpa - 0.4) {
            c.inCollege = false;
            c.educationStage = "graduated";
            c.currentSchool = undefined;
            c.currentMajor = undefined;
            c.currentOnline = undefined;
            c.currentHousing = undefined;
            c.stats.happiness = clamp(c.stats.happiness - 20);
            setFlag(c, "expelled");
            c.yearLog.push("Your grades finally caught up with you. You were expelled.");
          }
        },
      },
    ],
  },
  {
    id: "campus-party",
    minAge: 18,
    maxAge: 24,
    weight: 1,
    condition: (c) => c.inCollege,
    text: (c) => (c.greekHouse ? `${c.greekHouse} is throwing a party.` : "There's a party on campus tonight."),
    choices: [
      {
        label: "Go",
        effect: (c) => throwParty(c),
      },
      {
        label: "Stay in",
        effect: () => {},
      },
    ],
  },
  {
    id: "internship-offer",
    minAge: 19,
    maxAge: 26,
    weight: 0.8,
    condition: (c) => c.inCollege,
    text: (c) =>
      c.greekHouse
        ? `You landed an internship interview — turns out the recruiter was ${c.greekHouse} too.`
        : "You landed an internship interview.",
    choices: [
      {
        label: "Take it seriously",
        effect: (c) => {
          const boost = c.greekHouse ? 0.25 : 0;
          const got_it = Math.random() < 0.5 + boost;
          if (got_it) {
            c.money += 2000;
            setFlag(c, "had-internship");
            c.stats.happiness = clamp(c.stats.happiness + 10);
          } else {
            c.stats.happiness = clamp(c.stats.happiness - 3);
          }
        },
      },
      {
        label: "Not interested right now",
        effect: () => {},
      },
    ],
  },
  {
    id: "graduation-college",
    minAge: 18,
    maxAge: 60,
    weight: 3,
    // Deliberately not `once: true` - with multiple degrees now real, this
    // needs to be able to fire again for a second enrollment later in
    // life, and c.inCollege turning false the moment it fires is what
    // actually stops it from repeating within the same enrollment.
    // Gated on real years enrolled (a ~4-year degree), not raw age - so a
    // character going back for a second degree at 30 doesn't "graduate"
    // the moment they walk in, and freshman year gets to actually happen
    // before the rest of the college pool gets crowded out by this firing
    // (a real pacing bug this update's own verification caught).
    condition: (c) => c.inCollege && c.collegeStartAge != null && c.age - c.collegeStartAge >= 3,
    text: () => "Graduation day.",
    autoEffect: (c) => graduateCollege(c),
  },
];
