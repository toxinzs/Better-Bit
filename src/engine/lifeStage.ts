export type LifeStage = "baby" | "child" | "teen" | "adult" | "senior";

export function getLifeStage(age: number): LifeStage {
  if (age <= 4) return "baby";
  if (age <= 12) return "child";
  if (age <= 17) return "teen";
  if (age <= 64) return "adult";
  return "senior";
}

export const MIN_AGE_CONVERSATION = 5;
