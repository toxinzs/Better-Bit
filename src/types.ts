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

// Biological role for conception logic, separate from gender identity.
export type Bio = "female" | "male";

export type AdoptionKind = "open" | "semiOpen" | "closed";

export type Pregnancy = {
  carrier: "player" | "partner" | "surrogate";
  carrierId?: string; // the relationship who is carrying, when it isn't you
  otherParentId?: string; // the other parent (a partner, or someone from a hookup)
  conceivedAge: number; // the player's age when it began; the baby arrives the year after
  plan: "keep" | "adopt";
};

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
  bio?: Bio;
  onBC?: boolean; // they're on birth control
  coParent?: string; // relationship id of the child's other parent, when known
  adoption?: { kind: AdoptionKind; age: number }; // this child was placed for adoption
  hidden?: boolean; // not shown (a closed adoption until they find you)
  wealth?: number; // hidden 0-100: how much money they could spare
  harass?: number; // ex: how much unwanted contact you've made lately (decays yearly)
  incidents?: number; // ex: how many times it's escalated (drive-bys, showing up, their own harassment)
  // a restraining order between you: by "them" (they filed against you) or "you"
  order?: { by: "you" | "them"; untilAge: number; ignoring?: boolean };
  // a child of yours: hidden growth values that shape how they turn out
  kid?: {
    smarts: number;
    discipline: number;
    resent: number; // times you've pushed and been refused - makes them touchier
    path?: "college" | "work" | "gap"; // what they did at 18
    partnered?: boolean;
    grandKids?: number;
  };
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

export type JobKind = "parttime" | "fulltime";

export type CompanySize = "Small business" | "Mid-size" | "Large company" | "Corporation";

// A generated employer: every listing gets one (data/companies.ts).
export type Company = {
  name: string;
  industry: string;
  size: CompanySize;
  blurb: string;
  culture: string;
  benefits: string[];
  commute: string;
  stars: number; // 1-5 employee rating
};

export type Job = {
  title: string;
  salary: number; // per year (part-time: what the hours add up to)
  minAge: number;
  minSmarts?: number;
  requiresCollege?: boolean;
  requiresCleanRecord?: boolean;
  // ---- v2.1a: real listings ----
  kind?: JobKind;
  field?: string; // "Retail & Service", "Healthcare"...
  hours?: number; // per week
  minSkill?: { skill: SkillKey; level: number };
  day?: string; // "a typical day"
  growth?: string; // where it leads
  company?: Company; // set once you actually work somewhere
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

export type SkillKey = "music" | "singing" | "art" | "martialArts" | "acting" | "athletics" | "debate" | "coding" | "leadership";
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

// Big-Five style personality, each 0-100 (50 = typical). Never shown as a
// number: surfaced as trait words (engine/character.ts traitWords).
export type Personality = { o: number; c: number; e: number; a: number; n: number };

export type TalentKey = "academic" | "artistic" | "athletic" | "musical" | "social" | "technical" | "business" | "verbal";
export type Talents = Record<TalentKey, number>; // innate aptitude 0-100

export type WealthClass = "struggling" | "working" | "middle" | "comfortable" | "wealthy";

export type Appearance = {
  skin: string; // hex
  hairStyle: string; // see data/appearance.ts HAIR_STYLES
  hairColor: string; // hex
  eyes: string; // key in data/appearance.ts EYE_COLORS
  facialHair: string; // "none" | "stubble" | "mustache" | "goatee" | "beard"
  glasses: boolean;
  freckles: boolean;
  build: "slim" | "average" | "stocky" | "athletic";
  height: "short" | "average" | "tall";
  // a man/woman who loses their hair with age: age at which it starts thinning (0 = never)
  balding: number;
};

// ---- school (v2.2) ----
export type SchoolKind = "public" | "private" | "magnet" | "boarding" | "alternative";

export type School = {
  name: string;
  kind: SchoolKind;
  quality: number; // 0-100: teaching, facilities, peers - feeds every grade
  tuition: number; // per year (US-baseline dollars); public schools are free
  stage: EducationStage;
};

export type StudyMode = "slack" | "normal" | "hard";

export type ReportCard = {
  age: number;
  stage: EducationStage;
  school?: string;
  grades: Record<string, number>; // subject -> 0-100
  gpa: number; // this year's, 0-4
  rank: number;
  classSize: number;
  honor?: boolean;
  note: string; // the teacher's comment
};

export type Bullying = { role: "victim" | "bully"; years: number };

export type Diploma = "diploma" | "ged" | "none";

// An illness or long-term condition the player has. `key` matches
// engine/health.ts's PLAYER_CONDITIONS (which extends mortality.ts CONDITIONS).
export type PlayerCondition = { key: string; since: number; treated?: boolean };

export type StatNote = { reason: string; delta: number };

export type Background = {
  wealthClass: WealthClass;
  parentValues: string; // one line of flavour about how the family sees the world
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
  pregnant?: boolean; // legacy flag from before pregnancy had a carrier - migrated to `pregnancy`
  pregnancy?: Pregnancy;
  bio?: Bio;
  pendingBabyId?: string;
  // hidden stats (never shown as a number)
  sanity?: number; // 0-100, default 75; "craziness" = 100 - sanity
  fertility?: number; // 0-100
  decisions?: PendingDecision[];
  yearNews?: NewsItem[];
  // one entry per year lived (age, then the four stats as the year closed) -
  // drives the sparkline on the stat detail screens
  statHistory?: { age: number; health: number; happiness: number; smarts: number; looks: number }[];
  griefYears?: number; // years of lingering sadness after losing someone close
  originRegion?: RegionKey;
  appearanceFlavor?: string;
  avatarSeed?: number;
  // ---- character depth (v2.0c); all optional, backfilled by engine/character.ts ensureCharacter ----
  personality?: Personality;
  // ---- school (v2.2) ----
  school?: School | null; // where you go now (K-12)
  studyMode?: StudyMode;
  reportCards?: ReportCard[];
  popularity?: number; // 0-100
  bullying?: Bullying | null;
  conduct?: number; // 0-100: how well behaved you've been; falls with trouble
  suspensions?: number;
  track?: "college" | "trade" | "work" | "arts"; // set by the guidance counsellor
  diploma?: Diploma;
  failedYears?: number;
  activityYears?: Record<string, number>; // years spent in each club/team
  upbringing?: string; // how you were raised: strict, nurturing, permissive, neglectful
  helpBonus?: number; // extra help from a teacher or tutor this year
  // ---- work (v2.1a) ----
  partTime?: Job | null; // a second, part-time job alongside school or a career
  workYears?: number; // years spent in any job - experience for interviews
  gigRep?: number; // 0-100, how well known you are for odd jobs
  gigsThisYear?: number;
  appsThisYear?: number; // job applications made this year (capped)
  rejections?: { company: string; age: number }[]; // employers that turned you down (cooldown)
  jobHistory?: { title: string; company?: string; from: number; to: number }[];
  // ---- stat consequences + health (v2.0d) ----
  stress?: number; // 0-100 hidden; drags happiness/health when high
  fitness?: number; // 0-100 hidden; feeds health and looks
  conditions?: PlayerCondition[];
  insured?: boolean; // bought private cover (jobs and public systems cover you otherwise)
  statNotes?: Partial<Record<StatKey, StatNote[]>>; // what moved each stat this year
  quirks?: string[];
  talents?: Talents;
  background?: Background;
  appearance?: Appearance;
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
  // a small header shown above the text (an interview at a company, a court date...)
  banner?: { title: string; subtitle?: string; step?: string; icon?: string };
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
