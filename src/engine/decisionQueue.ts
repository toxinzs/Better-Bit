import { Character, LifeEvent, PendingDecision, WorldState } from "../types";
import { uid } from "./people";

// Decisions the player still owes an answer to (a funeral, a pregnancy
// choice, a restraining-order response...) live on the character as small
// serializable descriptors, not as live LifeEvent closures. That gives us:
//  - reload safety (pendingEvent isn't persisted; the queue is),
//  - several decisions in one year without dropping any,
//  - decisions that outrank random pool events in ageUp().
// A builder turns a descriptor back into a LifeEvent on demand; its terminal
// choice must call finishDecision() so the descriptor is removed only when
// the player has actually answered.

type Builder = (c: Character, world: WorldState, d: PendingDecision) => LifeEvent | null;

const builders: Record<string, Builder> = {};

export function registerDecision(kind: string, build: Builder): void {
  builders[kind] = build;
}

export function queueDecision(c: Character, d: Omit<PendingDecision, "id">): PendingDecision {
  const full: PendingDecision = { ...d, id: uid("dec") };
  (c.decisions ??= []).push(full);
  return full;
}

export function finishDecision(c: Character, id: string): void {
  c.decisions = (c.decisions ?? []).filter((d) => d.id !== id);
}

// The event for the oldest queued decision. A descriptor whose builder is
// missing or returns null (its person is gone, etc.) is dropped so it can
// never wedge the queue.
export function nextDecisionEvent(c: Character, world: WorldState): LifeEvent | null {
  const queue = c.decisions;
  while (queue && queue.length > 0) {
    const d = queue[0];
    const build = builders[d.kind];
    const event = build ? build(c, world, d) : null;
    if (event) return event;
    queue.shift();
  }
  return null;
}
