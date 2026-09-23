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
import { WORLD_EVENTS } from "./world";
import { SCHOOL_ELEMENTARY_EVENTS } from "./school-elementary";
import { SCHOOL_MIDDLE_EVENTS } from "./school-middle";
import { SCHOOL_HIGH_EVENTS } from "./school-high";
import { SCHOOL_COLLEGE_EVENTS } from "./school-college";

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
  ...WORLD_EVENTS,
  ...SCHOOL_ELEMENTARY_EVENTS,
  ...SCHOOL_MIDDLE_EVENTS,
  ...SCHOOL_HIGH_EVENTS,
  ...SCHOOL_COLLEGE_EVENTS,
];
