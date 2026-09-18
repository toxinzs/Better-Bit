import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Character, Gender, Job, LifeEvent } from "../types";
import { createCharacter, ageUp as engineAgeUp, resolveEvent as engineResolveEvent } from "../engine/lifeEngine";
import { clamp } from "../engine/util";

const STORAGE_KEY = "@better-bit/save/v1";

export type Screen = "start" | "home" | "gameover";

type GameState = {
  screen: Screen;
  character: Character | null;
  pendingEvent: LifeEvent | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  startNewLife: (firstName: string, lastName: string, gender: Gender) => void;
  ageUp: () => void;
  chooseEventOption: (choiceIndex: number) => void;
  applyForJob: (job: Job) => void;
  quitJob: () => void;
  doActivity: (activity: "gym" | "doctor" | "family") => void;
  restart: () => void;
};

function persist(character: Character | null, screen: Screen) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ character, screen })).catch(() => {
    // best-effort; ignore storage errors
  });
}

export const useGameStore = create<GameState>((set, get) => ({
  screen: "start",
  character: null,
  pendingEvent: null,
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { character: Character | null; screen: Screen };
        if (parsed.character) {
          set({ character: parsed.character, screen: parsed.screen, hydrated: true });
          return;
        }
      }
    } catch {
      // ignore corrupt/missing save
    }
    set({ hydrated: true });
  },

  startNewLife: (firstName, lastName, gender) => {
    const character = createCharacter(firstName, lastName, gender);
    set({ character, screen: "home", pendingEvent: null });
    persist(character, "home");
  },

  ageUp: () => {
    const character = get().character;
    if (!character || !character.alive) return;
    const result = engineAgeUp(character);
    if (result.died) {
      set({ character: { ...character }, screen: "gameover" });
      persist(character, "gameover");
      return;
    }
    set({
      character: { ...character },
      pendingEvent: result.pendingEvent ?? null,
    });
    persist(character, "home");
  },

  chooseEventOption: (choiceIndex) => {
    const { character, pendingEvent } = get();
    if (!character || !pendingEvent) return;
    engineResolveEvent(character, pendingEvent, choiceIndex);
    set({ character: { ...character }, pendingEvent: null });
    persist(character, get().screen);
  },

  applyForJob: (job) => {
    const character = get().character;
    if (!character) return;
    character.job = job;
    character.yearLog.push(`You got a job as a ${job.title}!`);
    set({ character: { ...character } });
    persist(character, get().screen);
  },

  quitJob: () => {
    const character = get().character;
    if (!character) return;
    character.job = null;
    character.yearLog.push("You quit your job.");
    set({ character: { ...character } });
    persist(character, get().screen);
  },

  doActivity: (activity) => {
    const character = get().character;
    if (!character) return;
    if (activity === "gym") {
      character.stats.health = clamp(character.stats.health + 5);
      character.stats.looks = clamp(character.stats.looks + 2);
      character.stats.happiness = clamp(character.stats.happiness - 1);
      character.yearLog.push("You hit the gym.");
    } else if (activity === "doctor") {
      if (character.money >= 150) {
        character.money -= 150;
        character.stats.health = clamp(character.stats.health + 8);
        character.yearLog.push("You visited the doctor for a checkup. -$150");
      } else {
        character.yearLog.push("You couldn't afford a doctor's visit.");
      }
    } else if (activity === "family") {
      character.relationships.forEach((r) => {
        if (r.alive && (r.type === "mother" || r.type === "father" || r.type === "child" || r.type === "partner")) {
          r.level = clamp(r.level + 5);
        }
      });
      character.stats.happiness = clamp(character.stats.happiness + 4);
      character.yearLog.push("You spent quality time with family.");
    }
    set({ character: { ...character } });
    persist(character, get().screen);
  },

  restart: () => {
    set({ screen: "start", character: null, pendingEvent: null });
    persist(null, "start");
  },
}));
