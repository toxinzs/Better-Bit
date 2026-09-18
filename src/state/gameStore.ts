import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Character, Gender, Job, LifeEvent } from "../types";
import {
  createCharacter,
  ageUp as engineAgeUp,
  resolveEvent as engineResolveEvent,
  applyActivity as engineApplyActivity,
  applyForJob as engineApplyForJob,
  quitJob as engineQuitJob,
  spendTimeWith as engineSpendTimeWith,
  haveConversation as engineHaveConversation,
  Activity,
} from "../engine/lifeEngine";

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
  doActivity: (activity: Activity) => void;
  spendTimeWith: (relationshipId: string) => void;
  haveConversation: (relationshipId: string) => void;
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
    engineApplyForJob(character, job);
    set({ character: { ...character } });
    persist(character, get().screen);
  },

  quitJob: () => {
    const character = get().character;
    if (!character) return;
    engineQuitJob(character);
    set({ character: { ...character } });
    persist(character, get().screen);
  },

  doActivity: (activity) => {
    const character = get().character;
    if (!character) return;
    engineApplyActivity(character, activity);
    set({ character: { ...character } });
    persist(character, get().screen);
  },

  spendTimeWith: (relationshipId) => {
    const character = get().character;
    if (!character) return;
    engineSpendTimeWith(character, relationshipId);
    set({ character: { ...character } });
    persist(character, get().screen);
  },

  haveConversation: (relationshipId) => {
    const character = get().character;
    if (!character) return;
    engineHaveConversation(character, relationshipId);
    set({ character: { ...character } });
    persist(character, get().screen);
  },

  restart: () => {
    set({ screen: "start", character: null, pendingEvent: null });
    persist(null, "start");
  },
}));
