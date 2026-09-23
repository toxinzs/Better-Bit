import { Character, LifeEvent } from "../types";

// A voluntary end-of-life choice - real, adult content the same way jail
// and pregnancy-termination are: stated plainly, never depicted. Always
// gated behind a real confirm step (same chained-LifeEvent pattern
// activities.ts's hookup() uses for its protection choice) so nothing
// happens from a single accidental tap.
export function surrender(c: Character): LifeEvent | null {
  if (!c.alive) return null;
  return buildSurrenderConfirmEvent();
}

function buildSurrenderConfirmEvent(): LifeEvent {
  return {
    id: `surrender-confirm-${Date.now()}`,
    minAge: 0,
    maxAge: 200,
    text: () => "Are you sure you want to end things here? This can't be undone.",
    choices: [
      {
        label: "No, keep going",
        effect: () => {},
        resultText: () => "You decided to keep going.",
      },
      {
        label: "Yes, I'm sure",
        effect: (c) => {
          c.alive = false;
          c.causeOfDeath = "chose to end their life";
          c.yearLog.push("You chose to end things.");
          c.fullLog.push({ age: c.age, text: "You chose to end things." });
        },
      },
    ],
  };
}
