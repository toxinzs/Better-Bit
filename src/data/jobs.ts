import { Job } from "../types";

export const JOBS: Job[] = [
  { title: "Fast Food Crew Member", salary: 18000, minAge: 15 },
  { title: "Retail Associate", salary: 21000, minAge: 16 },
  { title: "Warehouse Worker", salary: 27000, minAge: 18 },
  { title: "Landscaper", salary: 29000, minAge: 16 },
  { title: "Delivery Driver", salary: 32000, minAge: 18 },
  { title: "Office Assistant", salary: 34000, minAge: 18, minSmarts: 40 },
  { title: "Bank Teller", salary: 38000, minAge: 18, minSmarts: 50, requiresCleanRecord: true },
  { title: "Electrician", salary: 52000, minAge: 20, minSmarts: 55 },
  { title: "Nurse", salary: 68000, minAge: 22, minSmarts: 65, requiresCollege: true, requiresCleanRecord: true },
  { title: "Software Engineer", salary: 95000, minAge: 21, minSmarts: 75, requiresCollege: true },
  { title: "Accountant", salary: 62000, minAge: 21, minSmarts: 65, requiresCollege: true, requiresCleanRecord: true },
  { title: "Lawyer", salary: 120000, minAge: 24, minSmarts: 85, requiresCollege: true, requiresCleanRecord: true },
  { title: "Doctor", salary: 180000, minAge: 26, minSmarts: 90, requiresCollege: true, requiresCleanRecord: true },
  { title: "Marketing Manager", salary: 74000, minAge: 23, minSmarts: 60, requiresCollege: true },
  { title: "Teacher", salary: 48000, minAge: 22, minSmarts: 60, requiresCollege: true, requiresCleanRecord: true },
];

export function availableJobs(age: number, smarts: number, hasCollegeDegree: boolean, criminalRecord: boolean): Job[] {
  return JOBS.filter(
    (j) =>
      age >= j.minAge &&
      smarts >= (j.minSmarts ?? 0) &&
      (!j.requiresCollege || hasCollegeDegree) &&
      (!j.requiresCleanRecord || !criminalRecord),
  );
}
