import { LifeEvent } from "../../types";
import { clamp } from "../../engine/util";

export const HEALTH_EVENTS: LifeEvent[] = [
  {
    id: "common-cold",
    minAge: 3,
    maxAge: 90,
    weight: 1.2,
    text: () => "You caught a nasty cold that's been going around.",
    choices: [
      {
        label: "Push through it",
        effect: (c) => {
          c.stats.health = clamp(c.stats.health - 6);
        },
      },
      {
        label: "Rest up for a few days",
        effect: (c) => {
          c.stats.health = clamp(c.stats.health - 1);
          c.stats.happiness = clamp(c.stats.happiness - 2);
        },
      },
    ],
  },
  {
    id: "dental-issue",
    minAge: 8,
    maxAge: 80,
    weight: 0.8,
    text: () => "A tooth has been bothering you for weeks now.",
    choices: [
      {
        label: "See a dentist",
        effect: (c) => {
          c.money = Math.max(0, c.money - 300);
          c.stats.health = clamp(c.stats.health + 5);
        },
      },
      {
        label: "Ignore it",
        effect: (c) => {
          c.stats.health = clamp(c.stats.health - 8);
        },
      },
    ],
  },
  {
    id: "food-poisoning",
    minAge: 5,
    maxAge: 85,
    weight: 0.3,
    text: () => "That leftover takeout was clearly a mistake.",
    autoEffect: (c) => {
      c.stats.health = clamp(c.stats.health - 6);
    },
  },
  {
    id: "gym-injury",
    minAge: 16,
    maxAge: 60,
    weight: 0.6,
    text: () => "You pushed too hard at the gym and something in your back is not happy about it.",
    choices: [
      {
        label: "Rest and recover properly",
        effect: (c) => {
          c.stats.health = clamp(c.stats.health - 3);
        },
      },
      {
        label: "Keep training anyway",
        effect: (c) => {
          c.stats.health = clamp(c.stats.health - 12);
        },
      },
    ],
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
  {
    id: "burnout-stress",
    minAge: 20,
    maxAge: 65,
    weight: 1,
    condition: (c) => c.job !== null,
    text: () => "You've been running on fumes for months. Something has to change.",
    choices: [
      {
        label: "Take time off",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness + 12);
          c.money = Math.max(0, c.money - 500);
        },
      },
      {
        label: "Push through it",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness - 12);
          c.stats.health = clamp(c.stats.health - 6);
        },
      },
    ],
  },
  {
    id: "therapy-consideration",
    minAge: 16,
    maxAge: 80,
    weight: 0.7,
    condition: (c) => c.stats.happiness < 45,
    text: () => "Things have felt heavy lately. A friend suggested talking to someone.",
    choices: [
      {
        label: "Try therapy",
        effect: (c) => {
          c.money = Math.max(0, c.money - 400);
          c.stats.happiness = clamp(c.stats.happiness + 18);
        },
      },
      {
        label: "You'll figure it out yourself",
        effect: (c) => {
          c.stats.happiness = clamp(c.stats.happiness - 3);
        },
      },
    ],
  },
  {
    id: "allergic-reaction",
    minAge: 4,
    maxAge: 90,
    weight: 0.2,
    text: () => "Something you ate didn't agree with you at all.",
    autoEffect: (c) => {
      c.stats.health = clamp(c.stats.health - 4);
    },
  },
  {
    id: "insomnia-stretch",
    minAge: 17,
    maxAge: 70,
    weight: 0.6,
    text: () => "You haven't been sleeping well for weeks.",
    choices: [
      {
        label: "See a doctor about it",
        effect: (c) => {
          c.money = Math.max(0, c.money - 200);
          c.stats.health = clamp(c.stats.health + 6);
        },
      },
      {
        label: "Just deal with being tired",
        effect: (c) => {
          c.stats.health = clamp(c.stats.health - 5);
          c.stats.happiness = clamp(c.stats.happiness - 3);
        },
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
    id: "drinking-too-much",
    minAge: 21,
    maxAge: 55,
    weight: 0.4,
    text: () => "Looking back at the last few months, you've been drinking a lot more than usual.",
    choices: [
      {
        label: "Cut back",
        effect: (c) => {
          c.stats.health = clamp(c.stats.health + 8);
          c.stats.happiness = clamp(c.stats.happiness - 3);
        },
      },
      {
        label: "It's fine, you've got it under control",
        effect: (c) => {
          c.stats.health = clamp(c.stats.health - 10);
          c.money = Math.max(0, c.money - 300);
        },
      },
    ],
  },
  {
    id: "health-kick",
    minAge: 18,
    maxAge: 80,
    weight: 0.8,
    text: () => "You've been feeling motivated to actually take care of yourself lately.",
    autoEffect: (c) => {
      c.stats.health = clamp(c.stats.health + 8);
      c.stats.looks = clamp(c.stats.looks + 3);
    },
  },
];
