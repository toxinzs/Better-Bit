import { LifeEvent } from "../../types";
import { CHILDHOOD_EVENTS } from "./childhood";
import { TEEN_EVENTS } from "./teen";
import { ROMANCE_EVENTS } from "./romance";
import { FAMILY_EVENTS } from "./family";
import { HEALTH_EVENTS } from "./health";
import { MONEY_EVENTS } from "./money";
import { CAREER_EVENTS } from "./career";
import { RANDOM_EVENTS } from "./random";
import { SENIOR_EVENTS } from "./senior";

export const EVENTS: LifeEvent[] = [
  ...CHILDHOOD_EVENTS,
  ...TEEN_EVENTS,
  ...ROMANCE_EVENTS,
  ...FAMILY_EVENTS,
  ...HEALTH_EVENTS,
  ...MONEY_EVENTS,
  ...CAREER_EVENTS,
  ...RANDOM_EVENTS,
  ...SENIOR_EVENTS,
];
