// Bump this like a real product would: patch for a small fix, minor for a
// Core Update or DLC pack landing, major for something that changes the
// game in a fundamental way. Add a matching CHANGELOG entry (newest first)
// whenever the version bumps - that's what WhatsNewModal reads from.
export const APP_VERSION = "1.4.1";

export type ChangelogEntry = {
  version: string;
  title: string;
  highlights: string[];
};

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.4.1",
    title: "What Just Happened",
    highlights: [
      "Every real action now shows a result popup - no more guessing what changed or digging through the yearly recap",
      "Hookups are a real choice now - use protection or don't, right before it happens",
      "Skip protection and there's a real chance of pregnancy - a real reveal popup, and a real choice to keep it or not",
      "Having a baby is a real moment now - born at the start of your next year, and you name them yourself",
    ],
  },
  {
    version: "1.4.0",
    title: "School, For Real",
    highlights: [
      "A new School tab - 4 real stages (elementary through college), 52 events, real classmates and faculty",
      "GPA, cliques, clubs, and a real roommate/rush/Greek-house college experience with multiple degrees",
      "Faculty actions - suck up, insult, report a classmate, and (in college) seduce a professor or dean",
      "Fighting is real now - attack anyone, win or lose, with rare real consequences",
      "Juvenile justice - an arrest under 18 means juvie and a real ankle monitor, not adult prison",
    ],
  },
  {
    version: "1.3.0",
    title: "Activities",
    highlights: [
      "A new Activities tab - 13 real venues from the library to the casino, each with its own effects",
      "Lessons build real skills (music, singing, art, martial arts, acting) for future fame careers",
      "Dating apps now show a real pool of matches to choose between, plus blind dates and hookups",
      "Birth control, IVF, insemination, donors, and sterilization - real reproductive choices",
      "Vacations, three tiers, that boost your family's relationships too if you bring them along",
    ],
  },
  {
    version: "1.2.0",
    title: "Court & Lawyers",
    highlights: [
      "Getting caught is now a real trial - plead guilty for a lighter, certain deal, or fight it in court",
      "Pick your defense: a free Public Defender, or pay for a Hired or Top Lawyer to shift the odds your way",
      "A crackdown can sweep the region - worse odds committing crimes and worse odds beating the charges",
      "Stay clean for 7 years and you can petition to expunge your record for good",
    ],
  },
  {
    version: "1.1.0",
    title: "Crime & Punishment (v1)",
    highlights: [
      "A new Crime tab - eight crimes across three tiers, real success odds shaped by your smarts",
      "Get caught and it's a real choice: pay bail and settle it, or can't pay and do real time",
      "Prison is its own life stage - no job, no random events, a sentence countdown, and a shot at parole",
      "A criminal record follows you - trust-based jobs (teacher, doctor, lawyer, and more) won't hire you anymore",
      "Getting arrested dings your credit score, same as any other real-world financial consequence",
    ],
  },
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
