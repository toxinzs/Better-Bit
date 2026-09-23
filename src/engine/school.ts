import { Character, EducationStage, RegionKey, Relationship } from "../types";
import { clamp, randomInt } from "./util";
import { randomFirstName, randomLastName } from "../data/names";
import { CLUBS, ClubKey, COLLEGES, COLLEGE_HOUSING, HousingListing } from "../data/school";

// ---------- generic "remember what happened" flags ----------
// Any event in any life stage can set/check one of these - what makes a
// rush choice, a clique pick, or a reported friend echo in a much later
// event instead of vanishing the moment its own event ends.

export function hasFlag(c: Character, flag: string): boolean {
  return (c.flags ?? []).includes(flag);
}

export function setFlag(c: Character, flag: string): void {
  const flags = c.flags ?? [];
  if (!flags.includes(flag)) flags.push(flag);
  c.flags = flags;
}

// ---------- classmate/teacher roster ----------

const STAGE_PREFIX: Partial<Record<EducationStage, string>> = {
  elementary: "elem",
  middle: "middle",
  high: "high",
  college: "college",
};

const K12_TITLES = ["Mr.", "Ms.", "Mx."];
const COLLEGE_TITLES = ["Dr.", "Professor"];

function randomPersonName(region?: RegionKey): string {
  const genders: ("male" | "female" | "nonbinary")[] = ["male", "female", "nonbinary"];
  const g = genders[randomInt(0, genders.length - 1)];
  return `${randomFirstName(g, region)} ${randomLastName(region)}`;
}

// Called whenever a character's schooling stage changes (K-12 auto-
// progression inside ageUp(), or college enroll/graduate/drop-out). Retires
// whatever roster belonged to a previous stage - a classmate you were
// close to (level >= 55) graduates into a real "friend" relationship,
// everyone else just fades off the roster - then generates the new
// stage's roster if it doesn't already have one. Idempotent: safe to call
// every year, only ever acts once per actual stage change.
export function onEnterSchoolStage(c: Character, stage: EducationStage): void {
  const prefix = STAGE_PREFIX[stage];

  c.relationships.forEach((r) => {
    if (r.type !== "classmate" && r.type !== "teacher") return;
    if (!r.alive) return;
    const belongsToCurrentStage = prefix != null && r.id.startsWith(`${r.type}-${prefix}-`);
    if (belongsToCurrentStage) return;
    if (r.type === "classmate" && r.level >= 55) {
      r.type = "friend";
    } else {
      r.alive = false;
    }
  });

  if (!prefix) return;

  const alreadyHasRoster = c.relationships.some((r) => r.alive && r.id.startsWith(`classmate-${prefix}-`));
  if (alreadyHasRoster) return;

  for (let i = 0; i < 3; i++) {
    c.relationships.push({
      id: `classmate-${prefix}-${i}-${Date.now()}-${i}`,
      name: randomPersonName(c.originRegion),
      type: "classmate",
      level: randomInt(40, 65),
      alive: true,
    });
  }

  const titles = stage === "college" ? COLLEGE_TITLES : K12_TITLES;
  c.relationships.push({
    id: `teacher-${prefix}-0-${Date.now()}`,
    name: `${titles[randomInt(0, titles.length - 1)]} ${randomLastName(c.originRegion)}`,
    type: "teacher",
    level: randomInt(45, 60),
    alive: true,
  });
}

// ---------- roster lookups, shared by the event files + SchoolTab ----------

export function classmates(c: Character): Relationship[] {
  return c.relationships.filter((r) => r.type === "classmate" && r.alive);
}

export function teachers(c: Character): Relationship[] {
  return c.relationships.filter((r) => r.type === "teacher" && r.alive);
}

export function randomClassmate(c: Character): Relationship | undefined {
  const list = classmates(c);
  return list.length > 0 ? list[randomInt(0, list.length - 1)] : undefined;
}

export function randomTeacher(c: Character): Relationship | undefined {
  const list = teachers(c);
  return list.length > 0 ? list[randomInt(0, list.length - 1)] : undefined;
}

// ---------- GPA ----------

export function bumpGpa(c: Character, delta: number): void {
  const current = c.gpa ?? 3.0;
  c.gpa = Math.round(Math.max(0, Math.min(4, current + delta)) * 100) / 100;
}

// ---------- clubs ----------

export function joinClub(c: Character, clubKey: ClubKey): void {
  const def = CLUBS.find((cl) => cl.key === clubKey);
  if (!def) return;
  if (c.age < def.minAge) {
    c.yearLog.push("You're too young for that club yet.");
    return;
  }
  const activities = c.schoolActivities ?? [];
  if (activities.includes(def.label)) {
    c.yearLog.push(`You're already in ${def.label}.`);
    return;
  }
  activities.push(def.label);
  c.schoolActivities = activities;
  if (def.skill) {
    const skills = c.skills ?? {};
    skills[def.skill] = clamp((skills[def.skill] ?? 0) + randomInt(5, 10));
    c.skills = skills;
  }
  c.stats.happiness = clamp(c.stats.happiness + 4);
  c.yearLog.push(`You joined ${def.label}.`);
}

// ---------- faculty actions ----------

export function facultyAction(c: Character, relationshipId: string, kind: "suckup" | "insult" | "report"): void {
  const teacher = c.relationships.find((r) => r.id === relationshipId && r.alive && r.type === "teacher");
  if (!teacher) return;

  if (kind === "suckup") {
    teacher.level = clamp(teacher.level + 10);
    const worked = Math.random() < 0.25;
    if (worked) {
      bumpGpa(c, 0.1);
      c.yearLog.push(`You buttered up ${teacher.name}. It actually helped your grade.`);
    } else {
      c.yearLog.push(`You buttered up ${teacher.name}.`);
    }
    return;
  }

  if (kind === "insult") {
    teacher.level = clamp(teacher.level - 25);
    const consequence = Math.random() < 0.3;
    if (consequence) {
      c.stats.happiness = clamp(c.stats.happiness - 5);
      c.yearLog.push(`You told off ${teacher.name}. You got sent to the office for it.`);
    } else {
      c.yearLog.push(`You told off ${teacher.name}. Worth it.`);
    }
    return;
  }

  const classmates = c.relationships.filter((r) => r.type === "classmate" && r.alive);
  const target = classmates[randomInt(0, classmates.length - 1)];
  if (!target) {
    c.yearLog.push("There's no one to report right now.");
    return;
  }
  teacher.level = clamp(teacher.level + 8);
  target.level = clamp(target.level - 30);
  classmates.forEach((cm) => {
    if (cm.id !== target.id) cm.level = clamp(cm.level - 4);
  });
  setFlag(c, "reported-a-classmate");
  c.yearLog.push(`You reported ${target.name} to ${teacher.name}. Word got around.`);
}

// ---------- college ----------

export function enrollInCollege(
  c: Character,
  school: string,
  major: string,
  online: boolean,
  housing: HousingListing["key"],
): void {
  const listing = COLLEGES.find((cl) => cl.name === school);
  if (!listing) return;
  if ((c.gpa ?? 0) < listing.minGpa) {
    c.yearLog.push(`Your GPA isn't high enough for ${school}.`);
    return;
  }
  c.inCollege = true;
  c.currentSchool = school;
  c.currentMajor = major;
  c.currentOnline = online;
  c.currentHousing = online ? "commute" : housing;
  c.collegeStartAge = c.age;
  c.educationStage = "college";
  onEnterSchoolStage(c, "college");
  c.yearLog.push(`You enrolled at ${school}, majoring in ${major}${online ? " (online)" : ""}.`);
}

export function changeMajor(c: Character, major: string): void {
  if (!c.inCollege) return;
  c.currentMajor = major;
  c.money = Math.max(0, c.money - 500);
  c.yearLog.push(`You changed your major to ${major}.`);
}

export function dropOutOfCollege(c: Character): void {
  if (!c.inCollege) return;
  c.inCollege = false;
  c.educationStage = "graduated";
  c.currentSchool = undefined;
  c.currentMajor = undefined;
  c.currentOnline = undefined;
  c.currentHousing = undefined;
  c.collegeStartAge = undefined;
  c.stats.happiness = clamp(c.stats.happiness - 10);
  c.yearLog.push("You dropped out. No degree from this one.");
  onEnterSchoolStage(c, "graduated");
}

export function graduateCollege(c: Character): void {
  if (!c.inCollege || !c.currentSchool || !c.currentMajor) return;
  const degrees = c.degrees ?? [];
  degrees.push({ school: c.currentSchool, major: c.currentMajor, online: c.currentOnline ?? false });
  c.degrees = degrees;
  c.hasCollegeDegree = true;
  c.inCollege = false;
  c.educationStage = "graduated";
  c.currentSchool = undefined;
  c.currentMajor = undefined;
  c.currentOnline = undefined;
  c.currentHousing = undefined;
  c.collegeStartAge = undefined;
  c.stats.happiness = clamp(c.stats.happiness + 20);
  c.yearLog.push("You graduated!");
  onEnterSchoolStage(c, "graduated");
}

// Called from ageUp() every year c.inCollege is true - real recurring
// tuition + housing cost, same "no bankruptcy system, so overspending has a
// real visible consequence" precedent the mortgage/car-upkeep ticks already
// set (see engine/CLAUDE.md). Also the entry point into academic
// probation: falls below the school's real probation bar, gets flagged.
export function tickCollegeCosts(c: Character): void {
  if (!c.inCollege || !c.currentSchool) return;
  const college = COLLEGES.find((cl) => cl.name === c.currentSchool);
  if (!college) return;
  const housing = COLLEGE_HOUSING.find((h) => h.key === c.currentHousing);
  const tuition = c.currentOnline ? Math.round(college.cost * 0.6) : college.cost;
  const housingCost = c.currentOnline ? 0 : housing?.costPerYear ?? 0;
  const total = tuition + housingCost;
  c.money -= total;
  c.yearLog.push(`Tuition${housingCost > 0 ? " and housing" : ""} cost you $${total.toLocaleString()} this year.`);

  if ((c.gpa ?? 4) < college.probationGpa) {
    setFlag(c, "on-probation");
  }
}

// ---------- dual entry-point actions: a button on SchoolTab AND something
// an NPC can invite a character into via a random event, sharing this exact
// same logic either way ----------

export function throwParty(c: Character): void {
  if (c.age < 13) return;
  const busted = Math.random() < 0.35;
  if (busted) {
    c.stats.happiness = clamp(c.stats.happiness - 8);
    const parent = c.relationships.find((r) => (r.type === "mother" || r.type === "father") && r.alive);
    if (parent) parent.level = clamp(parent.level - 20);
    c.yearLog.push("You threw a party and got busted. Not worth it.");
  } else {
    c.stats.happiness = clamp(c.stats.happiness + 10);
    c.relationships.forEach((r) => {
      if (r.type === "classmate" && r.alive) r.level = clamp(r.level + 5);
    });
    c.yearLog.push("You threw a party. It was a great night.");
  }
}

export function skipClass(c: Character): void {
  if (c.age < 13) return;
  const caught = Math.random() < 0.3;
  if (caught) {
    bumpGpa(c, -0.1);
    c.stats.happiness = clamp(c.stats.happiness - 3);
    const t = randomTeacher(c);
    if (t) t.level = clamp(t.level - 10);
    c.yearLog.push("You skipped class and got caught.");
  } else {
    c.stats.happiness = clamp(c.stats.happiness + 5);
    c.yearLog.push("You skipped class. No one noticed.");
  }
}

// ---------- faculty seduction (college only, same outcome-driven pattern
// Activities' Hookup uses - no graphic content, just real consequences) ----------

export function seduceFaculty(c: Character, relationshipId: string): void {
  if (!c.inCollege) {
    c.yearLog.push("Not here.");
    return;
  }
  const faculty = c.relationships.find((r) => r.id === relationshipId && r.alive && r.type === "teacher");
  if (!faculty) return;

  const wentWell = Math.random() < 0.5;
  if (wentWell) {
    faculty.level = clamp(faculty.level + 20);
    bumpGpa(c, 0.15);
    c.stats.happiness = clamp(c.stats.happiness + 8);
    c.yearLog.push(`You and ${faculty.name} have a thing now. Your grades have never looked better.`);
  } else {
    faculty.level = clamp(faculty.level - 15);
    c.stats.happiness = clamp(c.stats.happiness - 15);
    setFlag(c, "faculty-scandal");
    c.yearLog.push(`Word got out about you and ${faculty.name}. It's a real mess on campus now.`);
  }
}
