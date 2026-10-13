// Each stretch of life leans a different colour, so the header and the life card quietly change
// as you grow up and grow old.
export function stageTint(age: number): string {
  if (age <= 2) return "#f9a8d4";
  if (age <= 12) return "#fcd34d";
  if (age <= 17) return "#a78bfa";
  if (age <= 29) return "#38bdf8";
  if (age <= 49) return "#34d399";
  if (age <= 64) return "#fb923c";
  return "#fda4af";
}
