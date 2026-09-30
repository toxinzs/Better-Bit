import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Character, Gender, JobKind, LifeEvent, Lifestyle, RentKey, VisaRoute, SchoolKind, StudyMode, RegionKey, SkillKey, WorldState } from "../types";
import type { CreationOptions } from "../engine/lifeEngine";
import { CarListing, HomeListing } from "../data/assets";
import { LoanListing, CreditCardListing } from "../data/loans";
import { VenueKey, VacationKey, ConceptionMethod } from "../data/activities";
import { ClubKey, HousingListing } from "../data/school";
import {
  createCharacter,
  createInitialWorldState,
  ageUp as engineAgeUp,
  resolveEvent as engineResolveEvent,
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
  changeMajor as engineChangeMajor,
  dropOutOfCollege as engineDropOutOfCollege,
  seduceFaculty as engineSeduceFaculty,
  attack as engineAttack,
  surrender as engineSurrender,
  seeTherapist as engineSeeTherapist,
  runPersonAction as engineRunPersonAction,
  ActionKey,
  DatingCandidate,
} from "../engine/lifeEngine";

import { ensurePeople } from "../engine/people";
import {
  applyToGrad as engineApplyToGrad,
  applyToUniversities as engineApplyToUniversities,
  askForLetter as engineAskForLetter,
  setHousing as engineSetHousing,
  sitExam as engineSitExam,
  startTrade as engineStartTrade,
  transferTo as engineTransferTo,
} from "../engine/higher";
import {
  askTeacherForHelp as engineAskTeacherForHelp,
  changeSchool as engineChangeSchool,
  dropOutOfSchool as engineDropOutOfSchool,
  quitClub as engineQuitClub,
  respondToBullying as engineRespondToBullying,
  seeCounsellor as engineSeeCounsellor,
  setStudyMode as engineSetStudyMode,
  switchClique as engineSwitchClique,
  takeGED as engineTakeGED,
  ensureSchool,
} from "../engine/education";
import type { BullyAction } from "../engine/education";
import { doGig as engineDoGig, quitWork as engineQuitWork, startApplication as engineStartApplication } from "../engine/jobs";
import type { Listing } from "../engine/jobs";
import { buyInsurance as engineBuyInsurance, treatCondition as engineTreatCondition } from "../engine/health";
import { nextDecisionEvent } from "../engine/decisionQueue";
import { afterBuyHome, afterSellHome, ensureLocation, moveBackHome, moveTo, rentPlace, setLifestyle } from "../engine/location";
import { cityByKey } from "../data/cities";
import { apply as engineApplyVisa, ensureAbroad, leaveVoluntarily as engineLeaveAbroad, naturalize as engineNaturalize, returnTo as engineReturnTo, sendMoneyHome as engineSendMoneyHome, studyLanguage as engineStudyLanguage, takeTrip as engineTakeTrip, withdraw as engineWithdrawVisa } from "../engine/immigration";
import type { LanguageKey } from "../data/countries";
import { askForPromotion, askForRaise, doNetwork as engineNetwork, retire, setWorkMode, takeCourse as engineCourse, toggleUnion } from "../engine/career";
import { expand, fireStaff, hire, marketing, sellBusiness, closeBusiness, startBusiness } from "../engine/business";
import { buyRental, declareBankruptcy, sellRental } from "../engine/wealth";
import type { RentalListing } from "../engine/wealth";

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
  startNewLife: (firstName: string, lastName: string, gender: Gender, region: RegionKey, avatarSeed?: number, options?: CreationOptions) => void;
  // begin with a character the creation flow already built (so the family
  // revealed on screen is the one you actually get)
  beginLife: (character: Character) => void;
  ageUp: () => void;
  chooseEventOption: (choiceIndex: number) => void;
  clearActionResult: () => void;
  nameBaby: (name: string) => void;
  startApplication: (listing: Listing) => void;
  quitWork: (kind: JobKind) => void;
  doGig: (key: string) => void;
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
  moveToCity: (cityKey: string, rentKey?: RentKey) => void;
  rentPlace: (rentKey: RentKey) => void;
  moveBackHome: () => void;
  setLifestyle: (key: Lifestyle) => void;
  setWorkMode: (mode: "coast" | "steady" | "grind") => void;
  askRaise: () => void;
  askPromotion: () => void;
  doNetwork: () => void;
  takeCourse: () => void;
  toggleUnion: () => void;
  retireNow: () => void;
  startBusiness: (key: string, name: string) => void;
  hireStaff: () => void;
  fireStaff: () => void;
  bizMarketing: () => void;
  expandBiz: () => void;
  sellBiz: () => void;
  closeBiz: () => void;
  buyRental: (listing: RentalListing) => void;
  sellRental: (index: number) => void;
  declareBankruptcy: () => void;
  applyVisa: (dest: RegionKey, route: VisaRoute, cityKey?: string) => void;
  withdrawVisa: () => void;
  naturalise: () => void;
  returnHomeAbroad: (dest?: RegionKey) => void;
  takeTrip: (dest: RegionKey) => void;
  studyLanguage: (lang: LanguageKey) => void;
  sendMoneyHome: (amount: number) => void;
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
  changeMajor: (major: string) => void;
  dropOutOfCollege: () => void;
  sitExam: (prep: boolean) => void;
  askForLetter: (teacherId: string) => void;
  applyToUniversities: (ids: string[], major: string) => void;
  applyToGrad: (ids: string[], programme: string) => void;
  startTrade: (programme: string) => void;
  setHousing: (key: "dorm" | "greek" | "apartment" | "commute") => void;
  transferTo: (instId: string) => void;
  seduceFaculty: (relationshipId: string) => void;
  attack: (relationshipId: string) => void;
  surrender: () => void;
  seeTherapist: () => void;
  setStudyMode: (mode: StudyMode) => void;
  askTeacherForHelp: (relationshipId: string) => void;
  seeCounsellor: () => void;
  changeSchool: (kind: SchoolKind) => void;
  respondToBullying: (action: BullyAction) => void;
  dropOutOfSchool: () => void;
  takeGED: () => void;
  quitClub: (label: string) => void;
  switchClique: (clique: string) => void;
  treatCondition: (key: string) => void;
  buyInsurance: () => void;
  personAction: (relationshipId: string, key: ActionKey, amount?: number) => void;
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
            // saves from before people had ages/genders/etc. get them
            // backfilled deterministically; a decision the player still owed
            // an answer to when they closed the app comes back too
            ensurePeople(parsed.character);
            ensureSchool(parsed.character);
            ensureLocation(parsed.character);
            ensureAbroad(parsed.character);
            const pendingEvent = parsed.screen === "home" ? nextDecisionEvent(parsed.character, worldState) : null;
            set({ character: parsed.character, screen: parsed.screen, worldState, pendingEvent, hydrated: true });
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

    startNewLife: (firstName, lastName, gender, region, avatarSeed, options) => {
      const character = createCharacter(firstName, lastName, gender, region, avatarSeed, options);
      set({ character, screen: "home", pendingEvent: null, actionResultLines: null });
      persist(character, "home", get().worldState);
    },

    beginLife: (character) => {
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
      // an event choice can end the character's own life (Surrender's
      // confirm step) - check the same way attack()'s direct action does,
      // since nothing else here would otherwise notice and route to gameover.
      if (!character.alive) {
        set({ character: { ...character }, worldState: { ...worldState }, screen: "gameover", pendingEvent: null, actionResultLines: null });
        persist(character, "gameover", worldState);
        return;
      }
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
      // a first name alone gets the family name, like the suggestions do
      if (baby && trimmed) baby.name = trimmed.includes(" ") ? trimmed : `${trimmed} ${character.lastName}`;
      character.pendingBabyId = undefined;
      set({ character: { ...character } });
      persist(character, get().screen, get().worldState);
    },

    // an application becomes a chained interview popup (see engine/jobs.ts)
    startApplication: (listing) => {
      if (get().pendingEvent || get().character?.pendingBabyId) return;
      applyChained((c, world) => engineStartApplication(c, world, listing));
    },
    quitWork: (kind) => applyToCharacter((c) => engineQuitWork(c, kind)),
    doGig: (key) => applyToCharacter((c) => engineDoGig(c, key)),
    spendTimeWith: (relationshipId) => applyToCharacter((c) => engineSpendTimeWith(c, relationshipId)),
    haveConversation: (relationshipId) => applyToCharacter((c) => engineHaveConversation(c, relationshipId)),
    textRelationship: (relationshipId) => applyToCharacter((c) => engineTextRelationship(c, relationshipId)),
    callRelationship: (relationshipId) => applyToCharacter((c) => engineCallRelationship(c, relationshipId)),
    bootyCall: (relationshipId) => applyToCharacter((c) => engineBootyCall(c, relationshipId)),
    sendGift: (relationshipId, amount) => applyToCharacter((c) => engineSendGift(c, relationshipId, amount)),
    buyCar: (listing) => applyToCharacter((c) => engineBuyCar(c, listing)),
    sellCar: () => applyToCharacter((c) => engineSellCar(c)),
    buyHome: (listing) => applyToCharacter((c) => { if (engineBuyHome(c, listing)) afterBuyHome(c); }),
    sellHome: () => applyToCharacter((c) => { engineSellHome(c); afterSellHome(c); }),
    moveToCity: (cityKey, rentKey) => applyToCharacter((c) => { const city = cityByKey(cityKey); if (city) moveTo(c, city, rentKey); }),
    rentPlace: (rentKey) => applyToCharacter((c) => { rentPlace(c, rentKey); }),
    moveBackHome: () => applyToCharacter((c) => { moveBackHome(c); }),
    setWorkMode: (mode) => applyToCharacter((c) => { setWorkMode(c, mode); }),
    askRaise: () => applyToCharacterWithWorld((c, w) => { askForRaise(c, w); }),
    askPromotion: () => applyToCharacterWithWorld((c, w) => { askForPromotion(c, w); }),
    doNetwork: () => applyToCharacter((c) => { engineNetwork(c); }),
    takeCourse: () => applyToCharacter((c) => { engineCourse(c); }),
    toggleUnion: () => applyToCharacter((c) => { toggleUnion(c); }),
    retireNow: () => applyToCharacter((c) => { retire(c); }),
    startBusiness: (key, name) => applyToCharacter((c) => { startBusiness(c, key, name); }),
    hireStaff: () => applyToCharacter((c) => { hire(c); }),
    fireStaff: () => applyToCharacter((c) => { fireStaff(c); }),
    bizMarketing: () => applyToCharacterWithWorld((c, w) => { marketing(c, w); }),
    expandBiz: () => applyToCharacter((c) => { expand(c); }),
    sellBiz: () => applyToCharacter((c) => { sellBusiness(c); }),
    closeBiz: () => applyToCharacter((c) => { closeBusiness(c); }),
    buyRental: (listing) => applyToCharacter((c) => { buyRental(c, listing); }),
    sellRental: (index) => applyToCharacter((c) => { sellRental(c, index); }),
    declareBankruptcy: () => applyToCharacter((c) => { declareBankruptcy(c); }),
    applyVisa: (dest, route, cityKey) => applyToCharacter((c) => { engineApplyVisa(c, dest, route, cityKey); }),
    withdrawVisa: () => applyToCharacter((c) => { engineWithdrawVisa(c); }),
    naturalise: () => applyToCharacter((c) => { engineNaturalize(c); }),
    returnHomeAbroad: (dest) => applyToCharacter((c) => { if (dest) engineReturnTo(c, dest); else engineLeaveAbroad(c); }),
    takeTrip: (dest) => applyToCharacter((c) => { engineTakeTrip(c, dest); }),
    studyLanguage: (lang) => applyToCharacter((c) => { engineStudyLanguage(c, lang); }),
    sendMoneyHome: (amount) => applyToCharacter((c) => { engineSendMoneyHome(c, amount); }),
    setLifestyle: (key) => applyToCharacter((c) => { setLifestyle(c, key); }),
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
    seeTherapist: () => applyToCharacter((c) => engineSeeTherapist(c)),
    setStudyMode: (mode) => applyToCharacter((c) => engineSetStudyMode(c, mode)),
    askTeacherForHelp: (id) => applyToCharacter((c) => engineAskTeacherForHelp(c, id)),
    seeCounsellor: () => applyChained((c) => engineSeeCounsellor(c)),
    changeSchool: (kind) => applyToCharacter((c) => engineChangeSchool(c, kind)),
    respondToBullying: (action) => applyToCharacter((c) => engineRespondToBullying(c, action)),
    dropOutOfSchool: () => applyToCharacter((c) => engineDropOutOfSchool(c)),
    takeGED: () => applyToCharacter((c) => engineTakeGED(c)),
    quitClub: (label) => applyToCharacter((c) => engineQuitClub(c, label)),
    switchClique: (clique) => applyToCharacter((c) => engineSwitchClique(c, clique)),
    treatCondition: (key) => applyToCharacter((c) => engineTreatCondition(c, key)),
    buyInsurance: () => applyToCharacter((c) => engineBuyInsurance(c)),
    takeLesson: (skill) => applyToCharacter((c) => engineTakeLesson(c, skill)),
    pursueDatingCandidate: (candidate) => applyToCharacter((c) => enginePursueDatingCandidate(c, candidate)),
    goOnBlindDate: () => applyToCharacter((c) => engineGoOnBlindDate(c)),
    toggleBirthControl: () => applyToCharacter((c) => engineToggleBirthControl(c)),
    getSterilized: () => applyToCharacter((c) => engineGetSterilized(c)),
    tryConception: (method) => applyToCharacter((c) => engineTryConception(c, method)),
    takeVacation: (vacation) => applyToCharacter((c) => engineTakeVacation(c, vacation)),
    joinClub: (club) => applyToCharacter((c) => engineJoinClub(c, club)),
    facultyAction: (relationshipId, kind) => applyToCharacter((c) => engineFacultyAction(c, relationshipId, kind)),
    changeMajor: (major) => applyToCharacter((c) => engineChangeMajor(c, major)),
    dropOutOfCollege: () => applyToCharacter((c) => engineDropOutOfCollege(c)),
    sitExam: (prep) => applyToCharacter((c) => engineSitExam(c, prep)),
    askForLetter: (id) => applyToCharacter((c) => engineAskForLetter(c, id)),
    applyToUniversities: (ids, major) => applyChained((c) => engineApplyToUniversities(c, ids, major)),
    applyToGrad: (ids, prog) => applyChained((c) => engineApplyToGrad(c, ids, prog)),
    startTrade: (key) => applyToCharacter((c) => engineStartTrade(c, key)),
    setHousing: (key) => applyToCharacter((c) => engineSetHousing(c, key)),
    transferTo: (id) => applyToCharacter((c) => engineTransferTo(c, id)),
    seduceFaculty: (relationshipId) => applyToCharacter((c) => engineSeduceFaculty(c, relationshipId)),

    // hookup/commitCrime/surrender/attack can all chain a real multi-step
    // choice (protection screen, arrest/trial, manslaughter charge, the
    // surrender confirm) - see applyChained() above.
    hookup: () => applyChained((c) => engineHookup(c)),
    commitCrime: (crimeId) => applyChained((c, world) => engineCommitCrime(c, crimeId, world)),
    surrender: () => applyChained((c) => engineSurrender(c)),
    // one entry point for everything on a person's sheet (talk, gifts, money,
    // outings...) - conversations/pickers come back as chained popups
    personAction: (relationshipId, key, amount) => {
      // the sheet is hidden while a popup is up, but never let an action
      // replace a decision that's still waiting for an answer
      if (get().pendingEvent || get().character?.pendingBabyId) return;
      applyChained((c, world) => engineRunPersonAction(c, world, relationshipId, key, amount));
    },

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
