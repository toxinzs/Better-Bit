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
  | "child";

export type Relationship = {
  id: string;
  name: string;
  type: RelationType;
  level: number; // 0-100
  alive: boolean;
};

export type Job = {
  title: string;
  salary: number;
  minAge: number;
  minSmarts?: number;
  requiresCollege?: boolean;
};

export type LogEntry = {
  age: number;
  text: string;
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
  relationships: Relationship[];
  yearLog: string[];
  fullLog: LogEntry[];
  triggeredEvents: string[];
};

export type EventChoice = {
  label: string;
  effect: (c: Character) => void;
  resultText?: (c: Character) => string;
};

export type LifeEvent = {
  id: string;
  minAge: number;
  maxAge: number;
  weight?: number;
  once?: boolean;
  condition?: (c: Character) => boolean;
  text: (c: Character) => string;
  choices?: EventChoice[];
  autoEffect?: (c: Character) => void;
};
