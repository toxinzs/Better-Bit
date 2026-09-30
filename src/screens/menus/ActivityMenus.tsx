import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGameStore } from "../../state/gameStore";
import { useNav } from "../../nav/navStore";
import MenuScreen, { MenuRow } from "../../nav/MenuScreen";
import Card from "../../components/Card";
import Button from "../../components/Button";
import StatBar from "../../components/StatBar";
import CrimeTab from "../tabs/CrimeTab";
import { generateDatingCandidates, DatingCandidate } from "../../engine/lifeEngine";
import {
  availableVenues, availableLessons, VACATIONS, CONCEPTION_METHODS, STERILIZATION_COST, VenueKey, LessonDef,
} from "../../data/activities";
import { getRegion } from "../../data/regions";
import { SKILL_LABELS } from "../../data/skills";
import { coverageLine, fitnessWord, insurancePremium, medicalBill, playerConditionDef, stressWord, treatmentCost } from "../../engine/health";
import { colors, spacing } from "../../theme";
import { tabStyles } from "../tabs/sharedStyles";
import { ms } from "./menuStyles";
import { cityOf } from "../../engine/where";
import { COUNTRIES } from "../../data/countries";

const VENUE_ICONS: Record<VenueKey, keyof typeof Ionicons.glyphMap> = {
  park: "leaf", beach: "sunny", worship: "moon", library: "book", museum: "color-palette", gym: "barbell",
  movies: "film", mall: "cart", concert: "musical-notes", spa: "water", bar: "beer", club: "disc", casino: "game-controller",
};
const LESSON_ICONS: Partial<Record<LessonDef["key"], keyof typeof Ionicons.glyphMap>> = {
  music: "musical-notes", singing: "mic", art: "brush", martialArts: "fitness", acting: "film",
};
const LESSON_LABELS: Partial<Record<LessonDef["key"], string>> = {
  music: "Music", singing: "Singing", art: "Art", martialArts: "Martial Arts", acting: "Acting",
};
const VACATION_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  weekend: "airplane", beach: "boat", international: "earth",
};

// ---------- the hub ----------

export function ActivitiesHub() {
  const character = useGameStore((s) => s.character);
  const push = useNav((s) => s.push);
  if (!character) return null;
  const skills = Object.keys(character.skills ?? {}).length;
  const partnered = character.relationships.some((r) => r.type === "partner" && r.alive);
  const canDate = character.age >= 18;
  const venues = availableVenues(character.age, getRegion(character.originRegion).legalAges).length;

  return (
    <ScrollView contentContainerStyle={tabStyles.scroll} showsVerticalScrollIndicator={false}>
      <MenuRow icon="home" color={colors.gold} title="Home & Moving" summary={`${cityOf(character).name}, ${getRegion(character.originRegion).label}`} delay={0} onPress={() => push("place")} />
      <MenuRow icon="location" color={colors.happiness} title="Outings & Venues" summary={`${venues} places to go`} delay={0} onPress={() => push("venues")} />
      <MenuRow icon="medkit" color={colors.health} title="Health & Wellbeing" summary="Doctor, therapy" delay={40} onPress={() => push("health")} />
      <MenuRow icon="ribbon" color={colors.smarts} title="Lessons & Skills" summary={skills > 0 ? `${skills} skill${skills === 1 ? "" : "s"}` : "Learn something new"} delay={80} onPress={() => push("lessons")} />
      <MenuRow
        icon="heart" color={colors.love} title="Love & Dating"
        summary={partnered ? "In a relationship" : canDate ? "Single" : "Opens through school"}
        disabled={false} delay={120} onPress={() => push("dating")}
      />
      <MenuRow icon="egg" color={colors.looks} title="Family Planning" summary={canDate ? "Birth control, fertility" : "Adults only"} delay={160} onPress={() => push("fertility")} />
      <MenuRow icon="earth" color={colors.teal} title="Across Borders" summary={(character.citizenships ?? [character.birthRegion ?? character.originRegion ?? "us"]).map((r) => COUNTRIES[r].flag).join(" ") + (character.visaApp ? " · application pending" : " · move, travel, citizenship")} delay={190} onPress={() => push("abroad")} />
      <MenuRow icon="airplane" color={colors.teal} title="Vacations" summary="Get away for a while" delay={200} onPress={() => push("vacations")} />
      <MenuRow icon="shield" color={colors.danger} title="Crime & Justice" summary={character.criminalRecord ? "You have a record" : character.inJail ? "Incarcerated" : "Stay out of trouble"} delay={240} onPress={() => push("crime")} />
      <MenuRow icon="alert-circle" color={colors.textSecondary} title="End of the Road" summary="If it's all too much" delay={280} onPress={() => push("endroad")} />
    </ScrollView>
  );
}

// ---------- venues ----------

export function VenuesMenu() {
  const character = useGameStore((s) => s.character);
  const doVenue = useGameStore((s) => s.doVenue);
  if (!character) return null;
  const venues = availableVenues(character.age, getRegion(character.originRegion).legalAges);
  return (
    <MenuScreen title="Outings & Venues" icon="location" color={colors.happiness}>
      <Text style={ms.note}>Pick somewhere to spend your time. Each outing costs a little and changes how you feel.</Text>
      <Card>
        <View style={ms.grid}>
          {venues.map((v) => (
            <TouchableOpacity
              key={v.key}
              accessibilityRole="button"
              activeOpacity={0.7}
              style={[ms.gridBtn, v.cost > 0 && character.money < v.cost && ms.gridBtnDisabled]}
              onPress={() => doVenue(v.key)}
            >
              <Ionicons name={VENUE_ICONS[v.key]} size={20} color={colors.textPrimary} />
              <Text style={ms.gridLabel}>{v.label}</Text>
              <Text style={ms.gridSub}>{v.cost > 0 ? `$${v.cost}` : "Free"}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>
    </MenuScreen>
  );
}

// ---------- health ----------

export function HealthMenu() {
  const character = useGameStore((s) => s.character);
  const visitDoctor = useGameStore((s) => s.visitDoctor);
  const seeTherapist = useGameStore((s) => s.seeTherapist);
  const treatCondition = useGameStore((s) => s.treatCondition);
  const buyInsurance = useGameStore((s) => s.buyInsurance);
  if (!character) return null;
  const region = getRegion(character.originRegion);
  const conditions = character.conditions ?? [];
  const stress = character.stress ?? 25;
  const fitness = character.fitness ?? 50;
  const doctorCost = medicalBill(character, 150);
  const canBuyCover = region.healthcare !== "public" && character.age >= 18 && !character.job;
  return (
    <MenuScreen title="Health & Wellbeing" icon="medkit" color={colors.health}>
      <Card>
        <Text style={ms.subheading}>How you're doing</Text>
        <View style={ms.statRow}>
          <Text style={ms.listingName}>Health</Text>
          <Text style={ms.ownedValue}>{Math.round(character.stats.health)}</Text>
        </View>
        <View style={ms.statRow}>
          <Text style={ms.listingName}>Stress</Text>
          <Text style={[ms.ownedValue, { color: stress >= 70 ? colors.danger : stress >= 45 ? colors.happiness : colors.health }]}>{stressWord(stress)}</Text>
        </View>
        <View style={[ms.statRow, { borderBottomWidth: 0, marginBottom: 0, paddingBottom: 0 }]}>
          <Text style={ms.listingName}>Fitness</Text>
          <Text style={[ms.ownedValue, { color: fitness >= 60 ? colors.health : fitness < 30 ? colors.danger : colors.happiness }]}>{fitnessWord(fitness)}</Text>
        </View>
      </Card>

      {conditions.length > 0 && (
        <Card>
          <Text style={ms.subheading}>Conditions</Text>
          {conditions.map((cond) => {
            const def = playerConditionDef(cond.key);
            const cost = treatmentCost(character, cond.key);
            return (
              <View key={cond.key} style={ms.rowBlock}>
                <View style={ms.rowHead}>
                  <Text style={ms.ownedName}>{def ? def.label[0].toUpperCase() + def.label.slice(1) : cond.key}</Text>
                  <Text style={[ms.listingSub, { color: cond.treated ? colors.health : colors.danger }]}>{cond.treated ? "Treated" : "Untreated"}</Text>
                </View>
                {!cond.treated && <Button label={`Get treatment ($${cost.toLocaleString()})`} icon="medkit" variant="secondary" onPress={() => treatCondition(cond.key)} style={ms.inlineBtn} />}
              </View>
            );
          })}
        </Card>
      )}

      <Card>
        <Text style={ms.subheading}>Care</Text>
        <Text style={ms.note}>{coverageLine(character)}</Text>
        <Button label={`See a Doctor ($${doctorCost.toLocaleString()})`} icon="medkit" variant="secondary" onPress={visitDoctor} style={ms.inlineBtn} />
        <Button label="See a Therapist ($120)" icon="chatbubbles" variant="secondary" onPress={seeTherapist} style={ms.inlineBtn} />
        {canBuyCover && (
          <Button
            label={character.insured ? "Drop private insurance" : `Buy private insurance ($${insurancePremium(character).toLocaleString()}/yr)`}
            icon="shield-checkmark"
            variant="secondary"
            onPress={buyInsurance}
            style={ms.inlineBtn}
          />
        )}
      </Card>

      <Card>
        <Text style={ms.note}>The gym, the park and time off ease stress and build fitness. Ignore both and your health, mood and looks pay for it.</Text>
      </Card>
    </MenuScreen>
  );
}

// ---------- lessons ----------

export function LessonsMenu() {
  const character = useGameStore((s) => s.character);
  const takeLesson = useGameStore((s) => s.takeLesson);
  if (!character) return null;
  const lessons = availableLessons(character.age);
  const skills = character.skills ?? {};
  const has = Object.keys(skills).length > 0;
  return (
    <MenuScreen title="Lessons & Skills" icon="ribbon" color={colors.smarts}>
      {has && (
        <Card>
          <Text style={tabStyles.sectionTitle}>Your skills</Text>
          <View style={ms.skillsWrap}>
            {(Object.keys(skills) as LessonDef["key"][]).map((key) => (
              <StatBar key={key} label={SKILL_LABELS[key]} value={skills[key] ?? 0} />
            ))}
          </View>
        </Card>
      )}
      <Card>
        <Text style={tabStyles.sectionTitle}>Take a lesson</Text>
        <View style={ms.grid}>
          {lessons.map((l) => (
            <TouchableOpacity
              key={l.key}
              accessibilityRole="button"
              activeOpacity={0.7}
              style={[ms.gridBtn, character.money < l.cost && ms.gridBtnDisabled]}
              onPress={() => takeLesson(l.key)}
            >
              <Ionicons name={LESSON_ICONS[l.key]} size={20} color={colors.textPrimary} />
              <Text style={ms.gridLabel}>{l.label}</Text>
              <Text style={ms.gridSub}>${l.cost}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>
    </MenuScreen>
  );
}

// ---------- dating ----------

export function DatingMenu() {
  const character = useGameStore((s) => s.character);
  const pursue = useGameStore((s) => s.pursueDatingCandidate);
  const blind = useGameStore((s) => s.goOnBlindDate);
  const hookup = useGameStore((s) => s.hookup);
  const [candidates, setCandidates] = useState<DatingCandidate[] | null>(null);
  if (!character) return null;
  const partnered = character.relationships.some((r) => r.type === "partner" && r.alive);
  const canDate = character.age >= 18;
  return (
    <MenuScreen title="Love & Dating" icon="heart" color={colors.love}>
      <Card>
        {!canDate ? (
          <Text style={tabStyles.logLine}>
            Dating apps are for adults. Romance starts at school - open People and tap a classmate or friend your age.
          </Text>
        ) : partnered ? (
          <Text style={tabStyles.logLine}>You're already seeing someone - open People to spend time together.</Text>
        ) : (
          <>
            <View style={ms.btnRow}>
              <Button label="Browse Dating App" icon="heart" size="sm" variant="secondary" onPress={() => setCandidates(generateDatingCandidates(character.originRegion))} />
              <Button label="Blind Date" icon="help-circle" size="sm" variant="secondary" onPress={blind} />
            </View>
            {candidates && (
              <View style={ms.list}>
                {candidates.map((cand, i) => (
                  <View key={i} style={ms.rowBlock}>
                    <View style={ms.rowHead}>
                      <Text style={ms.ownedName}>{cand.name}</Text>
                      <Text style={ms.ownedValue}>{cand.appeal}% appeal</Text>
                    </View>
                    <Text style={tabStyles.logLine}>{cand.vibe}</Text>
                    <View style={ms.btnRow}>
                      <Button label="Pursue" icon="heart" size="sm" onPress={() => { pursue(cand); setCandidates(null); }} />
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
        {canDate && <Button label="Hookup" icon="flame" variant="danger" onPress={hookup} style={ms.inlineBtn} />}
      </Card>
    </MenuScreen>
  );
}

// ---------- family planning ----------

export function FertilityMenu() {
  const character = useGameStore((s) => s.character);
  const toggle = useGameStore((s) => s.toggleBirthControl);
  const sterilize = useGameStore((s) => s.getSterilized);
  const conceive = useGameStore((s) => s.tryConception);
  if (!character) return null;
  const canDate = character.age >= 18;
  return (
    <MenuScreen title="Family Planning" icon="egg" color={colors.looks}>
      <Card>
        {!canDate ? (
          <Text style={tabStyles.logLine}>Not applicable yet.</Text>
        ) : (
          <>
            <View style={ms.btnRow}>
              <Button label={character.usingBirthControl ? "Stop Birth Control" : "Start Birth Control"} icon="shield-checkmark" size="sm" variant="secondary" onPress={toggle} />
              <Button label={character.sterilized ? "Sterilized" : `Get Sterilized ($${STERILIZATION_COST})`} icon="lock-closed" size="sm" variant="secondary" disabled={character.sterilized} onPress={sterilize} />
            </View>
            {!character.sterilized && (
              <View style={ms.list}>
                <Text style={ms.subheading}>Assisted conception</Text>
                {CONCEPTION_METHODS.map((m) => (
                  <TouchableOpacity
                    key={m.key}
                    accessibilityRole="button"
                    activeOpacity={0.7}
                    style={[ms.listingRow, character.money < m.cost && ms.listingDisabled]}
                    onPress={() => conceive(m.key)}
                  >
                    <View>
                      <Text style={ms.listingName}>{m.label}</Text>
                      <Text style={ms.listingSub}>{Math.round(m.successChance * 100)}% chance</Text>
                    </View>
                    <Text style={ms.listingPrice}>${m.cost.toLocaleString()}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </Card>
    </MenuScreen>
  );
}

// ---------- vacations ----------

export function VacationsMenu() {
  const character = useGameStore((s) => s.character);
  const go = useGameStore((s) => s.takeVacation);
  if (!character) return null;
  return (
    <MenuScreen title="Vacations" icon="airplane" color={colors.teal}>
      <Card>
        {VACATIONS.map((v) => (
          <TouchableOpacity
            key={v.key}
            accessibilityRole="button"
            activeOpacity={0.7}
            style={[ms.listingRow, character.money < v.cost && ms.listingDisabled]}
            onPress={() => go(v.key)}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <Ionicons name={VACATION_ICONS[v.key]} size={16} color={colors.textSecondary} />
              <Text style={ms.listingName}>{v.label}</Text>
            </View>
            <Text style={ms.listingPrice}>${v.cost.toLocaleString()}</Text>
          </TouchableOpacity>
        ))}
      </Card>
    </MenuScreen>
  );
}

// ---------- end of the road ----------

export function EndRoadMenu() {
  const surrender = useGameStore((s) => s.surrender);
  return (
    <MenuScreen title="End of the Road" icon="alert-circle" color={colors.danger}>
      <Card>
        <Text style={tabStyles.logLine}>If it's become too much, you can choose to end things here.</Text>
        <Button label="Surrender" icon="flag" variant="danger" onPress={surrender} style={ms.inlineBtn} />
      </Card>
    </MenuScreen>
  );
}

// ---------- crime (the existing tab, wrapped) ----------

export function CrimeMenu() {
  return (
    <MenuScreen title="Crime & Justice" icon="shield" color={colors.danger} scroll={false}>
      <CrimeTab />
    </MenuScreen>
  );
}
