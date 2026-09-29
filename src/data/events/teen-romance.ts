import { Character, LifeEvent, Relationship } from "../../types";
import { clamp } from "../../engine/util";
import { hasPartner, partner } from "./helpers";
import { romanceCandidates, runPersonAction } from "../../engine/interactions";
import { fillTokens } from "../../engine/conversations";
import { ageOf } from "../../engine/people";

// Teen romance, unlocked at 13 through school. Everything here is sweet and
// age-matched: a candidate is a classmate or friend within a year of you, also
// 13-17 (see romanceAllowed in engine/interactions.ts). Nothing here goes
// further than a first kiss.

const crushOf = (c: Character): Relationship | undefined => romanceCandidates(c)[0];
const crushId = (c: Character) => crushOf(c)?.id;
const first = (r: Relationship) => r.name.split(" ")[0];
const isTeen = (c: Character) => c.age >= 13 && c.age < 18;
// couples where somebody is still a minor keep to these teen events
const teenCouple = (c: Character) => {
  const p = partner(c);
  return !!p && (c.age < 18 || ageOf(c, p) < 18);
};

function startDating(c: Character, r: Relationship) {
  r.type = "partner";
  r.level = clamp(Math.max(r.level, 55) + 8);
  r.dates = 0;
  r.kissed = false;
  c.stats.happiness = clamp(c.stats.happiness + 12);
}

export const TEEN_ROMANCE_EVENTS: LifeEvent[] = [
  {
    id: "crush-asks-you-out",
    minAge: 13,
    maxAge: 17,
    weight: 1.6,
    condition: (c) => isTeen(c) && !!crushOf(c),
    who: crushId,
    text: (c) => {
      const r = crushOf(c)!;
      return `${first(r)} catches you after class, fidgeting with ${fillTokens("{his}", r)} backpack strap. "So... would you want to go out with me? Like, actually go out?"`;
    },
    logText: () => "",
    choices: [
      {
        label: "Say yes",
        tone: "good",
        effect: (c) => {
          const r = crushOf(c);
          if (r) startDating(c, r);
        },
        resultText: (c) => {
          const p = partner(c);
          return p ? `You said yes. You and ${first(p)} are officially together.` : "";
        },
      },
      {
        label: "Say you need to think about it",
        effect: (c) => {
          const r = crushOf(c);
          if (r) r.level = clamp(r.level + 2);
        },
        resultText: (c) => `You asked for a little time. ${crushOf(c) ? first(crushOf(c)!) : "They"} said they'd wait.`,
      },
      {
        label: "Say no, kindly",
        effect: (c) => {
          const r = crushOf(c);
          if (r) r.level = clamp(r.level - 3);
          c.stats.happiness = clamp(c.stats.happiness - 1);
        },
        resultText: () => "You let them down as gently as you could. It was awkward for about a week.",
      },
    ],
  },
  {
    id: "you-have-a-crush",
    minAge: 13,
    maxAge: 17,
    weight: 1.5,
    condition: (c) => isTeen(c) && !!crushOf(c),
    who: crushId,
    text: (c) => `You keep catching yourself thinking about ${crushOf(c) ? first(crushOf(c)!) : "someone"}. Your stomach does a weird flip every time ${crushOf(c) ? fillTokens("{he}", crushOf(c)!) : "they"} walk by.`,
    logText: () => "",
    choices: [
      {
        label: "Ask them out",
        effect: (c, w) => {
          const r = crushOf(c);
          if (r) runPersonAction(c, w, r.id, "askOut");
        },
      },
      {
        label: "Tell a friend and get advice",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness + 2);
        },
        resultText: () => "You spilled everything to a friend. They squealed, then gave you a plan. Whether you use it is up to you.",
      },
      {
        label: "Keep it to yourself",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness - 2);
        },
        resultText: () => "You kept it quiet. It's exhausting, having feelings.",
      },
    ],
  },
  {
    id: "school-dance-couple",
    minAge: 13,
    maxAge: 17,
    weight: 1.3,
    condition: (c) => teenCouple(c),
    who: (c) => partner(c)?.id,
    text: (c) => `The school dance is this Friday. ${first(partner(c)!)} asks if you're going together.`,
    logText: () => "",
    choices: [
      {
        label: "Go together",
        tone: "good",
        effect: (c) => {
          const p = partner(c);
          if (!p) return;
          p.level = clamp(p.level + 9);
          p.dates = (p.dates ?? 0) + 1;
          c.stats.happiness = clamp(c.stats.happiness + 6);
        },
        resultText: (c) => `You and ${first(partner(c)!)} danced badly and didn't care. A slow song came on and the whole gym went quiet. It was perfect.`,
      },
      {
        label: "Go with your friends instead",
        effect: (c) => {
          const p = partner(c);
          if (p) p.level = clamp(p.level - 3);
          c.stats.happiness = clamp(c.stats.happiness + 4);
        },
        resultText: () => "You had a great night with your friends. Your partner was a little hurt.",
      },
      {
        label: "Skip it",
        effect: (c) => {
          const p = partner(c);
          if (p) p.level = clamp(p.level - 4);
        },
        resultText: () => "You stayed home. They went without you.",
      },
    ],
  },
  {
    id: "school-dance-solo",
    minAge: 13,
    maxAge: 17,
    weight: 1.1,
    condition: (c) => isTeen(c) && !hasPartner(c),
    text: () => "The school dance is this Friday. Everyone is talking about it.",
    logText: () => "",
    choices: [
      {
        label: "Go with your friends",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness + 5);
          c.relationships.filter((r) => r.alive && r.type === "friend").forEach((r) => (r.level = clamp(r.level + 3)));
        },
        resultText: () => "You danced in a big awkward group and ate too many cookies. Best night of the month.",
      },
      {
        label: "Ask someone to go with you",
        effect: (c, w) => {
          const r = crushOf(c);
          if (r) runPersonAction(c, w, r.id, "askOut");
          else c.stats.happiness = clamp(c.stats.happiness - 1);
        },
        resultText: (c) => (crushOf(c) === undefined && !hasPartner(c) ? "You couldn't find the courage. You went with friends." : ""),
      },
      {
        label: "Stay home",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness - 1);
        },
        resultText: () => "You stayed home and watched something. It was fine.",
      },
    ],
  },
  {
    id: "teen-drifting-apart",
    minAge: 13,
    maxAge: 17,
    weight: 1.5,
    condition: (c) => teenCouple(c) && (partner(c)?.level ?? 100) < 42,
    who: (c) => partner(c)?.id,
    text: (c) => `Things with ${first(partner(c)!)} have felt off lately. You've both been quiet.`,
    logText: () => "",
    choices: [
      {
        label: "Try to fix it",
        effect: (c) => {
          const p = partner(c);
          if (p) p.level = clamp(p.level + 9);
        },
        resultText: () => "You talked it all through. It helped, a little.",
      },
      {
        label: "End it kindly",
        tone: "danger",
        effect: (c) => {
          const p = partner(c);
          if (!p) return;
          p.type = "ex";
          p.dates = 0;
          p.level = clamp(p.level - 12);
          c.stats.happiness = clamp(c.stats.happiness - 6);
        },
        resultText: () => "You ended things. It was a sad, honest conversation. You're exes now, but it wasn't ugly.",
      },
      {
        label: "Let it ride",
        effect: (c) => {
          const p = partner(c);
          if (p) p.level = clamp(p.level - 5);
        },
        resultText: () => "Nobody said anything. The distance grew.",
      },
    ],
  },
];
