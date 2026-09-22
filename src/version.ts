// Bump this like a real product would: patch for a small fix, minor for a
// Core Update or DLC pack landing, major for something that changes the
// game in a fundamental way. Add a matching CHANGELOG entry (newest first)
// whenever the version bumps - that's what WhatsNewModal reads from.
export const APP_VERSION = "1.0.0";

export type ChangelogEntry = {
  version: string;
  title: string;
  highlights: string[];
};

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.0.0",
    title: "The money update",
    highlights: [
      "Real debt: personal loans and a revolving credit card, with a credit score that reacts to how you handle them",
      "A simulated stock market - six companies, prices that move with the economy, buy/sell with real gain/loss tracking",
      "Real progressive income tax, withheld automatically - your paycheck finally shows gross vs. take-home",
      "A 401(k)-style retirement account: pre-tax contributions, an employer match, and growth tied to the market",
      "Collapsible relationship rows - tap to expand instead of every action being on screen at once",
    ],
  },
];
