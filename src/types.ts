export type Gender = "male" | "female" | "nonbinary";

export type RegionKey = "us" | "uk" | "nigeria" | "japan" | "brazil";

export type Stats = {
  health: number;
  happiness: number;
  smarts: number;
  looks: number;
};

export type StatKey = keyof Stats;

export type EducationStage =
  | "none"
  | "elementary"
  | "middle"
  | "high"
  | "college"
  | "graduated";

export type RelationType =
  | "mother"
  | "father"
  | "sibling"
  | "friend"
  | "partner"
  | "child"
  | "ex"
  | "classmate"
  | "teacher"
  | "coworker"
  | "grandchild";

export type TextMessage = {
  text: string;
  fromPlayer: boolean;
  age: number;
};

// How the relationship is going in the big picture, separate from `level`:
// "distant" = drifted apart from neglect, "estranged" = cut off (blocked, a
// falling-out), "placed" = a child placed for adoption.
export type PersonStatus = "active" | "distant" | "estranged" | "placed";

export type Relationship = {
  id: string;
  name: string;
  type: RelationType;
  level: number; // 0-100
  alive: boolean;
  engaged?: boolean;
  married?: boolean;
  messages?: TextMessage[];

  // ---- people-who-feel-real fields; all optional so old saves still load
  // (engine/people.ts backfillPeople() fills them in lazily) ----
  gender?: Gender;
  // The person's birth year relative to the player's: age = player.age -
  // bornOffset while alive (negative = born before the player). Nothing
  // ticks; see ageOf() in engine/people.ts.
  bornOffset?: number;
  traits?: string[];
  job?: string; // display only ("Nurse", "Retired", "Student")
  health?: number; // 0-100, hidden-ish; shown as a dot/chip
  conditions?: string[];
  favor?: number; // hidden 0-100: how much this person would do for you
  fertility?: number; // hidden 0-100
  status?: PersonStatus;
  diedAge?: number; // the person's own age when they died (set with alive:false)
  causeOfDeath?: string;
  funeral?: string; // how they were laid to rest
  blocked?: boolean; // you or they cut contact off
  wealth?: number; // hidden 0-100: how much money they could spare
  treated?: boolean; // their serious illness is being treated (lowers their mortality)
  lowYears?: number; // consecutive years the bond has been very low
  ledger?: number; // money owed: positive = they owe you, negative = you owe them
  // how many times each interaction has been used this year (the year is the
  // player's age when it started; the counters reset when it changes)
  yr?: { age: number; n: Record<string, number> };
  giftLog?: { age: number; item: string }[];
  likesKnown?: string[]; // taste tags you've learned from how they reacted
  seen?: string[]; // conversation scenes already played with them
  dates?: number; // teen dating: dates/outings had together
  kissed?: boolean; // teen dating: first kiss happened
};

export type Job = {
  title: string;
  salary: number;
  minAge: number;
  minSmarts?: number;
  requiresCollege?: boolean;
  requiresCleanRecord?: boolean;
};

export type OwnedCar = {
  name: string;
  value: number;
};

export type OwnedHome = {
  name: string;
  value: number;
  mortgageBalance: number;
  yearlyPayment: number;
};

export type LoanKind = "personal" | "creditCard" | "student";

export type Loan = {
  id: string;
  kind: LoanKind;
  name: string;
  balance: number;
  apr: number;
  minPayment: number;
  limit?: number; // credit cards only
};

export type PortfolioHolding = {
  ticker: string;
  shares: number;
  costBasis: number; // total $ paid, for gain/loss display
};

export type Retirement = {
  balance: number;
  contributionRate: number; // 0-0.5, fraction of gross salary
};

export type SkillKey = "music" | "singing" | "art" | "martialArts" | "acting";
export type Skills = Partial<Record<SkillKey, number>>;

export type Degree = {
  school: string;
  major: string;
  online: boolean;
};

export type CrimeTier = "petty" | "moderate" | "serious";

export type LogEntry = {
  age: number;
  text: string;
};

// One archived year of the life story: everything that happened at `age`.
export type YearRecord = {
  age: number;
  lines: string[];
  news?: NewsItem[]; // "Around you": what happened to other people
};

export type NewsKind =
  | "job" | "promotion" | "layoff" | "retired" | "wedding" | "baby" | "health" | "death" | "move" | "breakup" | "milestone";

export type NewsItem = {
  kind: NewsKind;
  text: string;
  relId?: string;
};

// A small serializable descriptor of a decision the player still owes an
// answer to (a funeral, a pregnancy choice, ...). Stored on the character,
// not held as a live LifeEvent, so a reload can't lose it and two of them
// in one year can queue up. engine/decisionQueue.ts turns these into events.
export type PendingDecision = {
  id: string;
  kind: string;
  relId?: string;
  data?: Record<string, unknown>;
};

export type MacroConditionKind = "recession" | "boom" | "war" | "pandemic" | "crackdown";

export type MacroCondition = {
  kind: MacroConditionKind;
  startYear: number;
  endsYear: number;
};

export type StockState = {
  ticker: string;
  price: number;
  prevPrice: number;
};

export type WorldState = {
  year: number;
  activeCondition: MacroCondition | null;
  history: MacroCondition[];
  log: string[];
  stocks?: StockState[];
};

export type Character = {
  firstName: string;
  lastName: string;
  gender: Gender;
  age: number;
  alive: boolean;
  causeOfDeath?: string;
  stats: Stats;
  money: number;
  job: Job | null;
  educationStage: EducationStage;
  inCollege: boolean;
  hasCollegeDegree: boolean;
  car?: OwnedCar | null;
  home?: OwnedHome | null;
  loans?: Loan[];
  creditScore?: number;
  portfolio?: PortfolioHolding[];
  retirement?: Retirement;
  skills?: Skills;
  usingBirthControl?: boolean;
  sterilized?: boolean;
  criminalRecord?: boolean;
  recordCleanYears?: number;
  isJuvenileRecord?: boolean;
  onAnkleMonitor?: boolean;
  monitorYearsLeft?: number;
  inJail?: boolean;
  jailYearsLeft?: number;
  jailYearsTotal?: number;
  gpa?: number;
  clique?: string;
  schoolActivities?: string[];
  greekHouse?: string;
  currentSchool?: string;
  currentMajor?: string;
  currentOnline?: boolean;
  currentHousing?: "dorm" | "greek" | "apartment" | "commute";
  collegeStartAge?: number;
  degrees?: Degree[];
  flags?: string[];
  pregnant?: boolean;
  pendingBabyId?: string;
  // hidden stats (never shown as a number)
  sanity?: number; // 0-100, default 75; "craziness" = 100 - sanity
  fertility?: number; // 0-100
  decisions?: PendingDecision[];
  yearNews?: NewsItem[];
  griefYears?: number; // years of lingering sadness after losing someone close
  originRegion?: RegionKey;
  appearanceFlavor?: string;
  avatarSeed?: number;
  relationships: Relationship[];
  yearLog: string[];
  lifeLog?: YearRecord[];
  recentEvents?: { id: string; age: number }[];
  quietLastYear?: boolean;
  fullLog: LogEntry[];
  triggeredEvents: string[];
};

export type EventChoice = {
  label: string;
  // returning a LifeEvent chains a follow-up choice screen (reusing the
  // same pendingEvent/EventModal machinery) instead of ending here - see
  // the court/trial sequence in engine/crime.ts for the pattern. Existing
  // choices that return nothing are unaffected.
  effect: (c: Character, world: WorldState) => void | LifeEvent;
  resultText?: (c: Character, world: WorldState) => string;
  // a smaller second line under the label (e.g. "$2,000")
  sublabel?: string;
  // shown greyed out and not tappable (e.g. "can't afford it")
  disabled?: boolean;
  // colours the choice: "danger" for a drastic/irreversible option
  tone?: "default" | "danger" | "good";
};

export type LifeEvent = {
  id: string;
  minAge: number;
  maxAge: number;
  weight?: number;
  once?: boolean;
  condition?: (c: Character, world: WorldState) => boolean;
  text: (c: Character, world: WorldState) => string;
  // What goes in the life log once resolved, when it should differ from the
  // popup text (return "" to log nothing).
  logText?: (c: Character, world: WorldState) => string;
  // the relationship this popup is about - EventModal shows their portrait
  // and name above the text
  who?: string | ((c: Character) => string | undefined);
  choices?: EventChoice[];
  autoEffect?: (c: Character, world: WorldState) => void;
};
