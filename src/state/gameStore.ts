import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Character, Gender, Job, LifeEvent, SkillKey, WorldState } from "../types";
import { CarListing, HomeListing } from "../data/assets";
import { LoanListing, CreditCardListing } from "../data/loans";
import { VenueKey, VacationKey, ConceptionMethod } from "../data/activities";
import { ClubKey, HousingListing } from "../data/school";
import {
  createCharacter,
  createInitialWorldState,
  ageUp as engineAgeUp,
  resolveEvent as engineResolveEvent,
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
  applyVenue as engineApplyVenue,
  visitDoctor as engineVisitDoctor,
  takeLesson as engineTakeLesson,
  pursueDatingCandidate as enginePursueDatingCandidate,
  goOnBlindDate as engineGoOnBlindDate,
  hookup as engineHookup,
  toggleBirthControl as engineToggleBirthControl,
  getSterilized as engineGetSterilized,
  tryConception as engineTryConception,
  takeVacation as engineTakeVacation,
  joinClub as engineJoinClub,
  facultyAction as engineFacultyAction,
  enrollInCollege as engineEnrollInCollege,
  changeMajor as engineChangeMajor,
  dropOutOfCollege as engineDropOutOfCollege,
  seduceFaculty as engineSeduceFaculty,
  attack as engineAttack,
  DatingCandidate,
} from "../engine/lifeEngine";

const STORAGE_KEY = "@better-bit/save/v1";

export type Screen = "start" | "home" | "gameover";

type GameState = {
  screen: Screen;
  character: Character | null;
  worldState: WorldState;
  pendingEvent: LifeEvent | null;
  // The new lines an action just added to the year's log, shown as a
  // dismissible result popup (ActionResultModal) instead of the player
  // having to check the Life tab's log to see what happened - see
  // applyToCharacter() below. Never set by ageUp() itself (the "This year"
  // card already covers a natural year passing) or while a pendingEvent
  // chain continues (the next EventModal screen covers it instead).
  actionResultLines: string[] | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  startNewLife: (firstName: string, lastName: string, gender: Gender) => void;
  ageUp: () => void;
  chooseEventOption: (choiceIndex: number) => void;
  clearActionResult: () => void;
  nameBaby: (name: string) => void;
  applyForJob: (job: Job) => void;
  quitJob: () => void;
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
  doVenue: (venue: VenueKey) => void;
  visitDoctor: () => void;
  takeLesson: (skill: SkillKey) => void;
  pursueDatingCandidate: (candidate: DatingCandidate) => void;
  goOnBlindDate: () => void;
  hookup: () => void;
  toggleBirthControl: () => void;
  getSterilized: () => void;
  tryConception: (method: ConceptionMethod) => void;
  takeVacation: (vacation: VacationKey) => void;
  joinClub: (club: ClubKey) => void;
  facultyAction: (relationshipId: string, kind: "suckup" | "insult" | "report") => void;
  enrollInCollege: (school: string, major: string, online: boolean, housing: HousingListing["key"]) => void;
  changeMajor: (major: string) => void;
  dropOutOfCollege: () => void;
  seduceFaculty: (relationshipId: string) => void;
  attack: (relationshipId: string) => void;
  restart: () => void;
};

function persist(character: Character | null, screen: Screen, worldState: WorldState) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ character, screen, worldState })).catch(() => {
    // best-effort; ignore storage errors
  });
}

export const useGameStore = create<GameState>((set, get) => {
  // Shared by every simple action below: mutate the character, capture
  // whatever new lines that mutation pushed to yearLog, and surface them
  // as the result popup. This is what makes every one of these actions
  // show "here's what happened" without each one wiring that up by hand -
  // add a new action by calling this, not by hand-rolling get/set/persist.
  function applyToCharacter(mutate: (c: Character) => void) {
    const character = get().character;
    if (!character) return;
    const before = character.yearLog.length;
    mutate(character);
    const newLines = character.yearLog.slice(before);
    set({
      character: { ...character },
      actionResultLines: newLines.length > 0 ? newLines : get().actionResultLines,
    });
    persist(character, get().screen, get().worldState);
  }

  function applyToCharacterWithWorld(mutate: (c: Character, world: WorldState) => void) {
    const character = get().character;
    const worldState = get().worldState;
    if (!character) return;
    const before = character.yearLog.length;
    mutate(character, worldState);
    const newLines = character.yearLog.slice(before);
    set({
      character: { ...character },
      actionResultLines: newLines.length > 0 ? newLines : get().actionResultLines,
    });
    persist(character, get().screen, worldState);
  }

  // For an action that can chain a pendingEvent (a real multi-step choice,
  // e.g. hookup's protection screen or a caught crime's arrest sequence):
  // show the next EventModal screen instead of the result popup while the
  // chain continues, and only surface the popup once it actually resolves.
  function applyChained(mutate: (c: Character, world: WorldState) => LifeEvent | null | undefined) {
    const character = get().character;
    const worldState = get().worldState;
    if (!character) return;
    const before = character.yearLog.length;
    const next = mutate(character, worldState);
    const newLines = character.yearLog.slice(before);
    set({
      character: { ...character },
      pendingEvent: next ?? get().pendingEvent,
      actionResultLines: !next && newLines.length > 0 ? newLines : get().actionResultLines,
    });
    persist(character, get().screen, worldState);
  }

  return {
    screen: "start",
    character: null,
    worldState: createInitialWorldState(),
    pendingEvent: null,
    actionResultLines: null,
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
      set({ character, screen: "home", pendingEvent: null, actionResultLines: null });
      persist(character, "home", get().worldState);
    },

    ageUp: () => {
      const character = get().character;
      const worldState = get().worldState;
      if (!character || !character.alive) return;
      const result = engineAgeUp(character, worldState);
      if (result.died) {
        set({ character: { ...character }, worldState: { ...worldState }, screen: "gameover", actionResultLines: null });
        persist(character, "gameover", worldState);
        return;
      }
      set({
        character: { ...character },
        worldState: { ...worldState },
        pendingEvent: result.pendingEvent ?? null,
        actionResultLines: null,
      });
      persist(character, "home", worldState);
    },

    chooseEventOption: (choiceIndex) => {
      const { character, pendingEvent, worldState } = get();
      if (!character || !pendingEvent) return;
      const before = character.yearLog.length;
      // a chained follow-up (e.g. the court sequence) becomes the next
      // pendingEvent instead of clearing it - same EventModal, next screen
      const next = engineResolveEvent(character, worldState, pendingEvent, choiceIndex);
      const newLines = character.yearLog.slice(before);
      set({
        character: { ...character },
        pendingEvent: next ?? null,
        actionResultLines: !next && newLines.length > 0 ? newLines : get().actionResultLines,
      });
      persist(character, get().screen, worldState);
    },

    clearActionResult: () => set({ actionResultLines: null }),

    nameBaby: (name) => {
      const character = get().character;
      if (!character || !character.pendingBabyId) return;
      const baby = character.relationships.find((r) => r.id === character.pendingBabyId);
      const trimmed = name.trim();
      if (baby && trimmed) baby.name = trimmed;
      character.pendingBabyId = undefined;
      set({ character: { ...character } });
      persist(character, get().screen, get().worldState);
    },

    applyForJob: (job) => applyToCharacter((c) => engineApplyForJob(c, job)),
    quitJob: () => applyToCharacter((c) => engineQuitJob(c)),
    spendTimeWith: (relationshipId) => applyToCharacter((c) => engineSpendTimeWith(c, relationshipId)),
    haveConversation: (relationshipId) => applyToCharacter((c) => engineHaveConversation(c, relationshipId)),
    textRelationship: (relationshipId) => applyToCharacter((c) => engineTextRelationship(c, relationshipId)),
    callRelationship: (relationshipId) => applyToCharacter((c) => engineCallRelationship(c, relationshipId)),
    bootyCall: (relationshipId) => applyToCharacter((c) => engineBootyCall(c, relationshipId)),
    sendGift: (relationshipId, amount) => applyToCharacter((c) => engineSendGift(c, relationshipId, amount)),
    buyCar: (listing) => applyToCharacter((c) => engineBuyCar(c, listing)),
    sellCar: () => applyToCharacter((c) => engineSellCar(c)),
    buyHome: (listing) => applyToCharacter((c) => engineBuyHome(c, listing)),
    sellHome: () => applyToCharacter((c) => engineSellHome(c)),
    takeOutLoan: (listing) => applyToCharacter((c) => engineTakeOutLoan(c, listing)),
    openCreditCard: (listing) => applyToCharacter((c) => engineOpenCreditCard(c, listing)),
    payDownLoan: (loanId, amount) => applyToCharacter((c) => enginePayDownLoan(c, loanId, amount)),
    chargeCard: (loanId, amount) => applyToCharacter((c) => engineChargeCard(c, loanId, amount)),
    buyStock: (ticker, shares) => applyToCharacterWithWorld((c, world) => engineBuyStock(c, world, ticker, shares)),
    sellStock: (ticker, shares) => applyToCharacterWithWorld((c, world) => engineSellStock(c, world, ticker, shares)),
    setContributionRate: (ratePercent) => applyToCharacter((c) => engineSetContributionRate(c, ratePercent)),
    withdrawRetirement: (amount) => applyToCharacter((c) => engineWithdrawRetirement(c, amount)),
    petitionExpungement: () => applyToCharacter((c) => enginePetitionExpungement(c)),
    doVenue: (venue) => applyToCharacter((c) => engineApplyVenue(c, venue)),
    visitDoctor: () => applyToCharacter((c) => engineVisitDoctor(c)),
    takeLesson: (skill) => applyToCharacter((c) => engineTakeLesson(c, skill)),
    pursueDatingCandidate: (candidate) => applyToCharacter((c) => enginePursueDatingCandidate(c, candidate)),
    goOnBlindDate: () => applyToCharacter((c) => engineGoOnBlindDate(c)),
    toggleBirthControl: () => applyToCharacter((c) => engineToggleBirthControl(c)),
    getSterilized: () => applyToCharacter((c) => engineGetSterilized(c)),
    tryConception: (method) => applyToCharacter((c) => engineTryConception(c, method)),
    takeVacation: (vacation) => applyToCharacter((c) => engineTakeVacation(c, vacation)),
    joinClub: (club) => applyToCharacter((c) => engineJoinClub(c, club)),
    facultyAction: (relationshipId, kind) => applyToCharacter((c) => engineFacultyAction(c, relationshipId, kind)),
    enrollInCollege: (school, major, online, housing) =>
      applyToCharacter((c) => engineEnrollInCollege(c, school, major, online, housing)),
    changeMajor: (major) => applyToCharacter((c) => engineChangeMajor(c, major)),
    dropOutOfCollege: () => applyToCharacter((c) => engineDropOutOfCollege(c)),
    seduceFaculty: (relationshipId) => applyToCharacter((c) => engineSeduceFaculty(c, relationshipId)),

    // hookup/commitCrime/attack can all chain a real multi-step choice
    // (protection screen, arrest/trial, manslaughter charge) - see
    // applyChained() above.
    hookup: () => applyChained((c) => engineHookup(c)),
    commitCrime: (crimeId) => applyChained((c, world) => engineCommitCrime(c, crimeId, world)),

    attack: (relationshipId) => {
      const character = get().character;
      const worldState = get().worldState;
      if (!character) return;
      const before = character.yearLog.length;
      // a rare tragic escalation can end the character's own life, same as
      // a natural ageUp() death - check for it the same way that path does.
      const followUp = engineAttack(character, relationshipId);
      if (!character.alive) {
        set({ character: { ...character }, worldState: { ...worldState }, screen: "gameover", actionResultLines: null });
        persist(character, "gameover", worldState);
        return;
      }
      const newLines = character.yearLog.slice(before);
      set({
        character: { ...character },
        pendingEvent: followUp ?? get().pendingEvent,
        actionResultLines: !followUp && newLines.length > 0 ? newLines : get().actionResultLines,
      });
      persist(character, get().screen, worldState);
    },

    restart: () => {
      set({ screen: "start", character: null, pendingEvent: null, actionResultLines: null });
      persist(null, "start", get().worldState);
    },
  };
});
