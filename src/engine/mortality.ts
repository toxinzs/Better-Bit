// Who dies and when. The player's own death odds live here (moved out of
// lifeEngine.ts so the relatives' odds can share the same shape once
// people start dying - see people.ts / funeral flow).

export function deathChance(age: number, health: number): number {
  let base: number;
  if (age < 45) base = 0.0005;
  else if (age < 60) base = 0.004;
  else if (age < 70) base = 0.015;
  else if (age < 80) base = 0.04;
  else if (age < 90) base = 0.1;
  else if (age < 100) base = 0.25;
  else base = 0.5;

  if (health <= 0) base += 0.35;
  else if (health < 15) base += 0.12;
  else if (health < 30) base += 0.04;

  return Math.min(base, 0.95);
}
