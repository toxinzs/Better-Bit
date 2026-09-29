// Bump this like a real product would: patch for a small fix, minor for a
// Core Update or DLC pack landing, major for something that changes the
// game in a fundamental way. Add a matching CHANGELOG entry (newest first)
// whenever the version bumps - that's what WhatsNewModal reads from.
export const APP_VERSION = "1.10.0";

export type ChangelogEntry = {
  version: string;
  title: string;
  highlights: string[];
};

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.10.0",
    title: "Starting a Family",
    highlights: [
      "Adult couples (both 18+) can be intimate - with a real choice about protection when a baby is possible",
      "Fertility is a hidden stat for you and your partners and it changes with age and health, so timing matters",
      "If there's a pregnancy you find out right away and decide: keep the baby, plan an adoption, or not right now. If your partner is carrying, it's their decision too",
      "The baby arrives the following year - and you name them. A pregnancy can also end in a miscarriage",
      "Adoption is fleshed out: open, semi-open or closed. Stay in touch with letters and visits, or one day a grown child might come looking for you",
      "Same-gender couples and anyone who can't conceive naturally can use IVF, insemination, a donor or surrogacy",
      "Your partners have a hidden favor score too - it shapes how they respond to you",
    ],
  },
  {
    version: "1.9.0",
    title: "Life Goes On",
    highlights: [
      "The people in your life now age, get sick, change jobs, get married, have babies - and eventually pass away",
      "A new \"Around you\" section in your Life tab shows what's happening to everyone else, year by year",
      "When someone close dies you plan the funeral: cremation, a traditional burial, a lavish farewell, donating their body to science, or leaving it to the family - and you can give a eulogy",
      "Inheritance from parents and spouses, lingering grief, and an \"In memory\" list where you can leave flowers or remember them",
      "A relative can be diagnosed with something serious and you decide whether to be there, pay for treatment or keep your distance",
      "People ask you for money - give it, lend it, or say no - and friends slowly pay back what they owe",
      "Neglect people and your bond slips; friends you never see can drift away completely",
    ],
  },
  {
    version: "1.8.0",
    title: "People You Can Actually Talk To",
    highlights: [
      "Tap anyone in People to open their profile: bond, health, personality and everything you can do with them",
      "Talk to someone and you get a real conversation with choices - almost a hundred different scenes for parents, siblings, friends, partners, kids and more",
      "Go out, throw a party or have a sleepover - different places for kids, teens and adults",
      "Give money or ask for money with a slider - and what you borrow is remembered",
      "Ten gifts to choose from that change every year and for every person; watch how they react to learn what they like",
      "Dating opens at 13 through school: classmates can ask you out, first dates, holding hands, a first kiss, school dances - and breaking up gives you an ex at any age",
      "Every action has a yearly limit with diminishing returns, so you can't just spam one button",
    ],
  },
  {
    version: "1.7.1",
    title: "Real People",
    highlights: [
      "Everyone in your life now has an age, a job and a face that matches who they are",
      "Fixed a parent's passing naming the wrong parent - and it can now only happen to a parent who's actually old enough",
      "Popups can now hold lots of choices - they scroll, and can show who they're about",
      "Exes no longer drift back into a relationship after a single friendly text",
      "Groundwork for a big relationships update: talking, gifts, money, funerals and more",
    ],
  },
  {
    version: "1.7.0",
    title: "Alive",
    highlights: [
      "Some years now just pass quietly - popups are still the norm, but not every single year",
      "Events no longer repeat over and over - each one takes a break for years after it shows up",
      "Five themes to pick from: Midnight, Ocean, Sunset, Forest and Daylight (tap the palette button)",
      "Smoother, livelier motion - cards slide in, money counts up, stat changes float up, tabs bounce",
      "Your character's face reacts to how you're doing, and milestone birthdays get confetti",
    ],
  },
  {
    version: "1.6.0",
    title: "A Real Look",
    highlights: [
      "Your Life tab is now your full story - every year written down, with icons, instead of three lines and empty space",
      "Health, happiness, smarts and looks are always visible under your name",
      "Five tabs instead of seven: Life, Activities, People, Work, Money - with Crime and School folded into the right places",
      "People now have faces, grouped into Partner, Family, Friends and Exes, with relationship bars",
      "Redesigned Career, Money, Crime and Start screens, plus a bigger Age Up button that shows your next age",
      "Fixed partners being named \"Your partner\"",
    ],
  },
  {
    version: "1.5.1",
    title: "A Real Name Bank",
    highlights: [
      "Around 100 first names per gender and 110+ last names for every region - about 4x what was there",
      "Way more variety in family, friends, classmates, and dates - far fewer repeat names in a single life",
    ],
  },
  {
    version: "1.5.0",
    title: "Where You're From",
    highlights: [
      "A real country of origin - US, UK, Nigeria, Japan, or Brazil - with its own names, starting wealth, taxes, job market, and legal ages",
      "Surrender - a real, confirmed way to end a life on your own terms",
      "A real character avatar for the first time, built from your region and look",
      "Siblings and friends who show up on their own now always get a real name",
      "A visual pass - real elevation on cards, consolidated popups, color-coded tabs",
    ],
  },
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
