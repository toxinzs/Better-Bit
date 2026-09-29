export type ConvCategory =
  | "parent" | "sibling" | "friend" | "partner" | "child" | "grandchild" | "coworker" | "classmate" | "ex";

// One choice's effects are small deltas; the engine scales `lvl` by the
// per-year diminishing-returns curve. Tokens in text: {n} first name,
// {he}/{He}/{him}/{his}/{His} from the person's gender.
export type SceneChoice = {
  label: string;
  result: string;
  lvl?: number; // change in relationship level
  hap?: number; // player happiness
  smarts?: number;
  looks?: number;
  health?: number;
  money?: number; // + gained / - spent
  favor?: number; // hidden favor with them
  tone?: "good" | "danger";
};

export type Scene = {
  id: string;
  who: ConvCategory[];
  age?: [number, number]; // the player's age
  theirAge?: [number, number]; // the other person's age
  text: string;
  choices: SceneChoice[];
};
