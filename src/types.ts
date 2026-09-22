export type Gender = "male" | "female" | "nonbinary";

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
  | "ex";

export type TextMessage = {
  text: string;
  fromPlayer: boolean;
  age: number;
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

export type CrimeTier = "petty" | "moderate" | "serious";

export type LogEntry = {
  age: number;
  text: string;
};

export type MacroConditionKind = "recession" | "boom" | "war" | "pandemic";

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
  criminalRecord?: boolean;
  inJail?: boolean;
  jailYearsLeft?: number;
  jailYearsTotal?: number;
  relationships: Relationship[];
  yearLog: string[];
  fullLog: LogEntry[];
  triggeredEvents: string[];
};

export type EventChoice = {
  label: string;
  effect: (c: Character, world: WorldState) => void;
  resultText?: (c: Character, world: WorldState) => string;
};

export type LifeEvent = {
  id: string;
  minAge: number;
  maxAge: number;
  weight?: number;
  once?: boolean;
  condition?: (c: Character, world: WorldState) => boolean;
  text: (c: Character, world: WorldState) => string;
  choices?: EventChoice[];
  autoEffect?: (c: Character, world: WorldState) => void;
};
