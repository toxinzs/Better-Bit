import { LifeEvent } from "../../types";
import { clamp } from "../../engine/util";

export const MONEY_EVENTS: LifeEvent[] = [
  {
    id: "found-money",
    minAge: 8,
    maxAge: 90,
    weight: 0.7,
    text: () => "You found some cash on the sidewalk. No one around to claim it.",
    autoEffect: (c) => {
      c.money += 40;
      c.stats.happiness = clamp(c.stats.happiness + 3);
    },
  },
  {
    id: "parking-ticket",
    minAge: 18,
    maxAge: 80,
    weight: 0.8,
    condition: (c) => c.age >= 18,
    text: () => "You came back to your car to find a parking ticket on the windshield.",
    autoEffect: (c) => {
      c.money = Math.max(0, c.money - 85);
      c.stats.happiness = clamp(c.stats.happiness - 3);
    },
  },
  {
    id: "tax-refund",
    minAge: 19,
    maxAge: 80,
    weight: 0.7,
    condition: (c) => c.job !== null,
    text: () => "Tax season. Turns out you overpaid.",
    autoEffect: (c) => {
      c.money += 900;
      c.stats.happiness = clamp(c.stats.happiness + 5);
    },
  },
  {
    id: "phishing-scam",
    minAge: 18,
    maxAge: 90,
    weight: 0.5,
    condition: (c) => c.money > 200,
    text: () => "You got an email saying your bank account has 'suspicious activity' and needs verification.",
    choices: [
      {
        label: "Click the link",
        effect: (c) => {
          c.money = Math.max(0, Math.round(c.money * 0.7));
        },
        resultText: () => "That was not your bank. That was very much not your bank.",
      },
      {
        label: "Delete it, obviously",
        effect: () => {},
      },
    ],
  },
  {
    id: "lottery-ticket",
    minAge: 18,
    maxAge: 90,
    weight: 0.8,
    text: () => "The jackpot's huge this week. Worth a couple bucks on a ticket?",
    choices: [
      {
        label: "Buy one",
        effect: (c) => {
          const win = Math.random();
          c.money = Math.max(0, c.money - 5);
          if (win > 0.98) {
            c.money += 25000;
            c.stats.happiness = clamp(c.stats.happiness + 40);
          } else if (win > 0.85) {
            c.money += 100;
          }
        },
        resultText: (c) => (c.stats.happiness > 90 ? "JACKPOT. Your life just changed." : "Didn't hit. Worth a shot."),
      },
      {
        label: "Save your money",
        effect: () => {},
      },
    ],
  },
  {
    id: "car-repair",
    minAge: 18,
    maxAge: 85,
    weight: 0.7,
    text: () => "Your car's making a sound it should definitely not be making.",
    choices: [
      {
        label: "Get it fixed properly",
        effect: (c) => {
          c.money = Math.max(0, c.money - 650);
        },
      },
      {
        label: "Ignore it and hope",
        effect: (c) => {
          const worse = Math.random() > 0.5;
          if (worse) c.money = Math.max(0, c.money - 1800);
        },
        resultText: (c) => "Sometimes that works out. Sometimes it really doesn't.",
      },
    ],
  },
  {
    id: "side-hustle",
    minAge: 18,
    maxAge: 65,
    weight: 0.9,
    text: () => "You've got some free time and an idea for a small side hustle.",
    choices: [
      {
        label: "Go for it",
        effect: (c) => {
          const success = c.stats.smarts > 50;
          c.money += success ? 1800 : 300;
          c.stats.happiness = clamp(c.stats.happiness + 6);
        },
      },
      {
        label: "Not worth the effort",
        effect: () => {},
      },
    ],
  },
  {
    id: "generous-stranger",
    minAge: 5,
    maxAge: 90,
    weight: 0.3,
    text: () => "A stranger overheard you were short on cash and quietly covered your bill.",
    autoEffect: (c) => {
      c.money += 60;
      c.stats.happiness = clamp(c.stats.happiness + 6);
    },
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
    id: "forgotten-subscription",
    minAge: 18,
    maxAge: 90,
    weight: 0.6,
    text: () => "You noticed a subscription you forgot you even signed up for, quietly draining your account for months.",
    autoEffect: (c) => {
      c.money = Math.max(0, c.money - 180);
    },
  },
  {
    id: "rent-increase",
    minAge: 19,
    maxAge: 70,
    weight: 0.6,
    text: () => "Your landlord is raising the rent again.",
    choices: [
      {
        label: "Pay it, moving is a hassle",
        effect: (c) => {
          c.money = Math.max(0, c.money - 600);
        },
      },
      {
        label: "Start looking for somewhere new",
        effect: (c) => {
          c.money = Math.max(0, c.money - 200);
          c.stats.happiness = clamp(c.stats.happiness - 3);
        },
      },
    ],
  },
];
