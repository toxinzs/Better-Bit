import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Character, Gender, Job, LifeEvent, WorldState } from "../types";
import { CarListing, HomeListing } from "../data/assets";
import { LoanListing, CreditCardListing } from "../data/loans";
import {
  createCharacter,
  createInitialWorldState,
  ageUp as engineAgeUp,
  resolveEvent as engineResolveEvent,
  applyActivity as engineApplyActivity,
  applyForJob as engineApplyForJob,
  quitJob as engineQuitJob,
  spendTimeWith as engineSpendTimeWith,
  haveConversation as engineHaveConversation,
  textRelationship as engineTextRelationship,
  callRelationship as engineCallRelationship,
  bootyCall as engineBootyCall,
  sendGift as engineSendGift,
  buyCar as engineBuyCar,
  sellCar as engineSellCar,
  buyHome as engineBuyHome,
  sellHome as engineSellHome,
  takeOutLoan as engineTakeOutLoan,
  openCreditCard as engineOpenCreditCard,
  payDownLoan as enginePayDownLoan,
  chargeCard as engineChargeCard,
  buyStock as engineBuyStock,
  sellStock as engineSellStock,
  setContributionRate as engineSetContributionRate,
  withdrawRetirement as engineWithdrawRetirement,
  commitCrime as engineCommitCrime,
  petitionExpungement as enginePetitionExpungement,
  Activity,
} from "../engine/lifeEngine";

const STORAGE_KEY = "@better-bit/save/v1";

export type Screen = "start" | "home" | "gameover";

type GameState = {
  screen: Screen;
  character: Character | null;
  worldState: WorldState;
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
  textRelationship: (relationshipId: string) => void;
  callRelationship: (relationshipId: string) => void;
  bootyCall: (relationshipId: string) => void;
  sendGift: (relationshipId: string, amount: number) => void;
  buyCar: (listing: CarListing) => void;
  sellCar: () => void;
  buyHome: (listing: HomeListing) => void;
  sellHome: () => void;
  takeOutLoan: (listing: LoanListing) => void;
  openCreditCard: (listing: CreditCardListing) => void;
  payDownLoan: (loanId: string, amount: number) => void;
  chargeCard: (loanId: string, amount: number) => void;
  buyStock: (ticker: string, shares: number) => void;
  sellStock: (ticker: string, shares: number) => void;
  setContributionRate: (ratePercent: number) => void;
  withdrawRetirement: (amount: number) => void;
  commitCrime: (crimeId: string) => void;
  petitionExpungement: () => void;
  restart: () => void;
};

function persist(character: Character | null, screen: Screen, worldState: WorldState) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ character, screen, worldState })).catch(() => {
    // best-effort; ignore storage errors
  });
}

export const useGameStore = create<GameState>((set, get) => ({
  screen: "start",
  character: null,
  worldState: createInitialWorldState(),
  pendingEvent: null,
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          character: Character | null;
          screen: Screen;
          worldState?: WorldState;
        };
        const worldState = parsed.worldState ?? createInitialWorldState();
        if (parsed.character) {
          set({ character: parsed.character, screen: parsed.screen, worldState, hydrated: true });
          return;
        }
        set({ worldState, hydrated: true });
        return;
      }
    } catch {
      // ignore corrupt/missing save
    }
    set({ hydrated: true });
  },

  startNewLife: (firstName, lastName, gender) => {
    const character = createCharacter(firstName, lastName, gender);
    set({ character, screen: "home", pendingEvent: null });
    persist(character, "home", get().worldState);
  },

  ageUp: () => {
    const character = get().character;
    const worldState = get().worldState;
    if (!character || !character.alive) return;
    const result = engineAgeUp(character, worldState);
    if (result.died) {
      set({ character: { ...character }, worldState: { ...worldState }, screen: "gameover" });
      persist(character, "gameover", worldState);
      return;
    }
    set({
      character: { ...character },
      worldState: { ...worldState },
      pendingEvent: result.pendingEvent ?? null,
    });
    persist(character, "home", worldState);
  },

  chooseEventOption: (choiceIndex) => {
    const { character, pendingEvent, worldState } = get();
    if (!character || !pendingEvent) return;
    // a chained follow-up (e.g. the court sequence) becomes the next
    // pendingEvent instead of clearing it - same EventModal, next screen
    const next = engineResolveEvent(character, worldState, pendingEvent, choiceIndex);
    set({ character: { ...character }, pendingEvent: next ?? null });
    persist(character, get().screen, worldState);
  },

  applyForJob: (job) => {
    const character = get().character;
    if (!character) return;
    engineApplyForJob(character, job);
    set({ character: { ...character } });
    persist(character, get().screen, get().worldState);
  },

  quitJob: () => {
    const character = get().character;
    if (!character) return;
    engineQuitJob(character);
    set({ character: { ...character } });
    persist(character, get().screen, get().worldState);
  },

  doActivity: (activity) => {
    const character = get().character;
    if (!character) return;
    engineApplyActivity(character, activity);
    set({ character: { ...character } });
    persist(character, get().screen, get().worldState);
  },

  spendTimeWith: (relationshipId) => {
    const character = get().character;
    if (!character) return;
    engineSpendTimeWith(character, relationshipId);
    set({ character: { ...character } });
    persist(character, get().screen, get().worldState);
  },

  haveConversation: (relationshipId) => {
    const character = get().character;
    if (!character) return;
    engineHaveConversation(character, relationshipId);
    set({ character: { ...character } });
    persist(character, get().screen, get().worldState);
  },

  textRelationship: (relationshipId) => {
    const character = get().character;
    if (!character) return;
    engineTextRelationship(character, relationshipId);
    set({ character: { ...character } });
    persist(character, get().screen, get().worldState);
  },

  callRelationship: (relationshipId) => {
    const character = get().character;
    if (!character) return;
    engineCallRelationship(character, relationshipId);
    set({ character: { ...character } });
    persist(character, get().screen, get().worldState);
  },

  bootyCall: (relationshipId) => {
    const character = get().character;
    if (!character) return;
    engineBootyCall(character, relationshipId);
    set({ character: { ...character } });
    persist(character, get().screen, get().worldState);
  },

  sendGift: (relationshipId, amount) => {
    const character = get().character;
    if (!character) return;
    engineSendGift(character, relationshipId, amount);
    set({ character: { ...character } });
    persist(character, get().screen, get().worldState);
  },

  buyCar: (listing) => {
    const character = get().character;
    if (!character) return;
    engineBuyCar(character, listing);
    set({ character: { ...character } });
    persist(character, get().screen, get().worldState);
  },

  sellCar: () => {
    const character = get().character;
    if (!character) return;
    engineSellCar(character);
    set({ character: { ...character } });
    persist(character, get().screen, get().worldState);
  },

  buyHome: (listing) => {
    const character = get().character;
    if (!character) return;
    engineBuyHome(character, listing);
    set({ character: { ...character } });
    persist(character, get().screen, get().worldState);
  },

  sellHome: () => {
    const character = get().character;
    if (!character) return;
    engineSellHome(character);
    set({ character: { ...character } });
    persist(character, get().screen, get().worldState);
  },

  takeOutLoan: (listing) => {
    const character = get().character;
    if (!character) return;
    engineTakeOutLoan(character, listing);
    set({ character: { ...character } });
    persist(character, get().screen, get().worldState);
  },

  openCreditCard: (listing) => {
    const character = get().character;
    if (!character) return;
    engineOpenCreditCard(character, listing);
    set({ character: { ...character } });
    persist(character, get().screen, get().worldState);
  },

  payDownLoan: (loanId, amount) => {
    const character = get().character;
    if (!character) return;
    enginePayDownLoan(character, loanId, amount);
    set({ character: { ...character } });
    persist(character, get().screen, get().worldState);
  },

  chargeCard: (loanId, amount) => {
    const character = get().character;
    if (!character) return;
    engineChargeCard(character, loanId, amount);
    set({ character: { ...character } });
    persist(character, get().screen, get().worldState);
  },

  buyStock: (ticker, shares) => {
    const character = get().character;
    const worldState = get().worldState;
    if (!character) return;
    engineBuyStock(character, worldState, ticker, shares);
    set({ character: { ...character } });
    persist(character, get().screen, worldState);
  },

  sellStock: (ticker, shares) => {
    const character = get().character;
    const worldState = get().worldState;
    if (!character) return;
    engineSellStock(character, worldState, ticker, shares);
    set({ character: { ...character } });
    persist(character, get().screen, worldState);
  },

  setContributionRate: (ratePercent) => {
    const character = get().character;
    if (!character) return;
    engineSetContributionRate(character, ratePercent);
    set({ character: { ...character } });
    persist(character, get().screen, get().worldState);
  },

  withdrawRetirement: (amount) => {
    const character = get().character;
    if (!character) return;
    engineWithdrawRetirement(character, amount);
    set({ character: { ...character } });
    persist(character, get().screen, get().worldState);
  },

  commitCrime: (crimeId) => {
    const character = get().character;
    const worldState = get().worldState;
    if (!character) return;
    // if caught, this returns a synthetic arrest LifeEvent - reuse the same
    // pendingEvent/EventModal machinery ageUp() already uses for choices
    const arrestEvent = engineCommitCrime(character, crimeId, worldState);
    set({ character: { ...character }, pendingEvent: arrestEvent ?? get().pendingEvent });
    persist(character, get().screen, worldState);
  },

  petitionExpungement: () => {
    const character = get().character;
    if (!character) return;
    enginePetitionExpungement(character);
    set({ character: { ...character } });
    persist(character, get().screen, get().worldState);
  },

  restart: () => {
    set({ screen: "start", character: null, pendingEvent: null });
    persist(null, "start", get().worldState);
  },
}));
