import { LifeEvent } from "../../types";
import { CHILDHOOD_EVENTS } from "./childhood";
import { CHILDHOOD_EXTRA_EVENTS } from "./childhood-extra";
import { TEEN_EVENTS } from "./teen";
import { ROMANCE_EVENTS } from "./romance";
import { TEEN_ROMANCE_EVENTS } from "./teen-romance";
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
import { SCHOOL_EXTRA_EVENTS } from "./school-extra";
import { SCHOOL_COLLEGE_EVENTS } from "./school-college";
import { COLLEGE_EXTRA_EVENTS } from "./college-extra";
import { PLACE_EVENTS } from "./places";

export const EVENTS: LifeEvent[] = [
  ...CHILDHOOD_EVENTS,
  ...CHILDHOOD_EXTRA_EVENTS,
  ...TEEN_EVENTS,
  ...ROMANCE_EVENTS,
  ...TEEN_ROMANCE_EVENTS,
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
  ...SCHOOL_EXTRA_EVENTS,
  ...SCHOOL_COLLEGE_EVENTS,
  ...COLLEGE_EXTRA_EVENTS,
  ...PLACE_EVENTS,
];
