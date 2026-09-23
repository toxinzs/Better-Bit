import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGameStore } from "../../state/gameStore";
import { generateDatingCandidates, DatingCandidate } from "../../engine/lifeEngine";
import Card from "../../components/Card";
import Button from "../../components/Button";
import StatBar from "../../components/StatBar";
import { availableVenues, availableLessons, VACATIONS, CONCEPTION_METHODS, STERILIZATION_COST } from "../../data/activities";
import { getRegion } from "../../data/regions";
import { VenueKey, LessonDef } from "../../data/activities";
import { colors, fonts, fontSize, radii, spacing } from "../../theme";
import { tabStyles } from "./sharedStyles";

const VENUE_ICONS: Record<VenueKey, keyof typeof Ionicons.glyphMap> = {
  park: "leaf",
  beach: "sunny",
  worship: "moon",
  library: "book",
  museum: "color-palette",
  gym: "barbell",
  movies: "film",
  mall: "cart",
  concert: "musical-notes",
  spa: "water",
  bar: "beer",
  club: "disc",
  casino: "game-controller",
};

const LESSON_ICONS: Record<LessonDef["key"], keyof typeof Ionicons.glyphMap> = {
  music: "musical-notes",
  singing: "mic",
  art: "brush",
  martialArts: "fitness",
  acting: "film",
};

const LESSON_STAT_LABELS: Record<LessonDef["key"], string> = {
  music: "Music",
  singing: "Singing",
  art: "Art",
  martialArts: "Martial Arts",
  acting: "Acting",
};

const VACATION_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  weekend: "airplane",
  beach: "boat",
  international: "earth",
};

export default function ActivitiesTab() {
  const character = useGameStore((s) => s.character);
  const doVenue = useGameStore((s) => s.doVenue);
  const visitDoctor = useGameStore((s) => s.visitDoctor);
  const takeLesson = useGameStore((s) => s.takeLesson);
  const pursueDatingCandidate = useGameStore((s) => s.pursueDatingCandidate);
  const goOnBlindDate = useGameStore((s) => s.goOnBlindDate);
  const hookup = useGameStore((s) => s.hookup);
  const toggleBirthControl = useGameStore((s) => s.toggleBirthControl);
  const getSterilized = useGameStore((s) => s.getSterilized);
  const tryConception = useGameStore((s) => s.tryConception);
  const takeVacation = useGameStore((s) => s.takeVacation);
  const surrender = useGameStore((s) => s.surrender);

  const [candidates, setCandidates] = useState<DatingCandidate[] | null>(null);

  if (!character) return null;

  const venues = availableVenues(character.age, getRegion(character.originRegion).legalAges);
  const lessons = availableLessons(character.age);
  const skills = character.skills ?? {};
  const hasSkills = Object.keys(skills).length > 0;
  const hasPartner = character.relationships.some((r) => r.type === "partner" && r.alive);
  const canDate = character.age >= 18;

  return (
    <ScrollView contentContainerStyle={tabStyles.scroll}>
      <Card>
        <Text style={tabStyles.sectionTitle}>Venues</Text>
        <View style={styles.grid}>
          {venues.map((v) => (
            <TouchableOpacity
              key={v.key}
              accessibilityRole="button"
              activeOpacity={0.7}
              style={[styles.gridBtn, v.cost > 0 && character.money < v.cost && styles.gridBtnDisabled]}
              onPress={() => doVenue(v.key)}
            >
              <Ionicons name={VENUE_ICONS[v.key]} size={20} color={colors.textPrimary} />
              <Text style={styles.gridLabel}>{v.label}</Text>
              <Text style={styles.gridSub}>{v.cost > 0 ? `$${v.cost}` : "Free"}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button label="See a Doctor ($150)" icon="medkit" variant="secondary" onPress={visitDoctor} style={styles.inlineBtn} />
      </Card>

      <Card>
        <Text style={tabStyles.sectionTitle}>Lessons</Text>
        {hasSkills && (
          <View style={styles.skillsWrap}>
            {(Object.keys(skills) as LessonDef["key"][]).map((key) => (
              <StatBar key={key} label={LESSON_STAT_LABELS[key]} value={skills[key] ?? 0} />
            ))}
          </View>
        )}
        <View style={styles.grid}>
          {lessons.map((l) => (
            <TouchableOpacity
              key={l.key}
              accessibilityRole="button"
              activeOpacity={0.7}
              style={[styles.gridBtn, character.money < l.cost && styles.gridBtnDisabled]}
              onPress={() => takeLesson(l.key)}
            >
              <Ionicons name={LESSON_ICONS[l.key]} size={20} color={colors.textPrimary} />
              <Text style={styles.gridLabel}>{l.label}</Text>
              <Text style={styles.gridSub}>${l.cost}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      <Card>
        <View style={styles.headerRow}>
          <Ionicons name="heart" size={18} color={colors.primary} />
          <Text style={tabStyles.sectionTitle}>Dating</Text>
        </View>

        {!canDate ? (
          <Text style={tabStyles.logLine}>Too young to date yet.</Text>
        ) : hasPartner ? (
          <Text style={tabStyles.logLine}>
            You're already seeing someone — visit them in People to spend time together.
          </Text>
        ) : (
          <>
            <View style={styles.loanBtnRow}>
              <Button
                label="Browse Dating App"
                icon="heart"
                size="sm"
                variant="secondary"
                onPress={() => setCandidates(generateDatingCandidates(character.originRegion))}
              />
              <Button label="Blind Date" icon="help-circle" size="sm" variant="secondary" onPress={goOnBlindDate} />
            </View>

            {candidates && (
              <View style={styles.candidateList}>
                {candidates.map((cand, i) => (
                  <View key={i} style={styles.loanRow}>
                    <View style={styles.loanHeaderRow}>
                      <Text style={styles.ownedName}>{cand.name}</Text>
                      <Text style={styles.ownedValue}>{cand.appeal}% appeal</Text>
                    </View>
                    <Text style={tabStyles.logLine}>{cand.vibe}</Text>
                    <View style={styles.loanBtnRow}>
                      <Button
                        label="Pursue"
                        icon="heart"
                        size="sm"
                        onPress={() => {
                          pursueDatingCandidate(cand);
                          setCandidates(null);
                        }}
                      />
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {canDate && (
          <Button label="Hookup" icon="flame" variant="danger" onPress={hookup} style={styles.inlineBtn} />
        )}
      </Card>

      <Card>
        <View style={styles.headerRow}>
          <Ionicons name="medkit" size={18} color={colors.primary} />
          <Text style={tabStyles.sectionTitle}>Fertility</Text>
        </View>

        {!canDate ? (
          <Text style={tabStyles.logLine}>Not applicable yet.</Text>
        ) : (
          <>
            <View style={styles.loanBtnRow}>
              <Button
                label={character.usingBirthControl ? "Stop Birth Control" : "Start Birth Control"}
                icon="shield-checkmark"
                size="sm"
                variant="secondary"
                onPress={toggleBirthControl}
              />
              <Button
                label={character.sterilized ? "Sterilized" : `Get Sterilized ($${STERILIZATION_COST})`}
                icon="lock-closed"
                size="sm"
                variant="secondary"
                disabled={character.sterilized}
                onPress={getSterilized}
              />
            </View>

            {!character.sterilized && (
              <View style={styles.candidateList}>
                <Text style={styles.subheading}>Assisted conception</Text>
                {CONCEPTION_METHODS.map((m) => (
                  <TouchableOpacity
                    key={m.key}
                    accessibilityRole="button"
                    activeOpacity={0.7}
                    style={[styles.listingRow, character.money < m.cost && styles.listingDisabled]}
                    onPress={() => tryConception(m.key)}
                  >
                    <View>
                      <Text style={styles.listingName}>{m.label}</Text>
                      <Text style={styles.listingSub}>{Math.round(m.successChance * 100)}% chance</Text>
                    </View>
                    <Text style={styles.listingPrice}>${m.cost.toLocaleString()}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </Card>

      <Card>
        <View style={styles.headerRow}>
          <Ionicons name="airplane" size={18} color={colors.primary} />
          <Text style={tabStyles.sectionTitle}>Vacations</Text>
        </View>
        {VACATIONS.map((v) => (
          <TouchableOpacity
            key={v.key}
            accessibilityRole="button"
            activeOpacity={0.7}
            style={[styles.listingRow, character.money < v.cost && styles.listingDisabled]}
            onPress={() => takeVacation(v.key)}
          >
            <View style={styles.headerRow}>
              <Ionicons name={VACATION_ICONS[v.key]} size={16} color={colors.textSecondary} />
              <Text style={styles.listingName}>{v.label}</Text>
            </View>
            <Text style={styles.listingPrice}>${v.cost.toLocaleString()}</Text>
          </TouchableOpacity>
        ))}
      </Card>

      <Card>
        <View style={styles.headerRow}>
          <Ionicons name="alert-circle" size={18} color={colors.danger} />
          <Text style={tabStyles.sectionTitle}>End of the Road</Text>
        </View>
        <Text style={tabStyles.logLine}>If it's become too much, you can choose to end things here.</Text>
        <Button label="Surrender" icon="flag" variant="danger" onPress={surrender} style={styles.surrenderBtn} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  surrenderBtn: {
    marginTop: spacing.sm,
  },
  gridBtn: {
    width: "31%",
    alignItems: "center",
    backgroundColor: colors.surfaceRaised,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    gap: 4,
  },
  gridBtnDisabled: {
    opacity: 0.4,
  },
  gridLabel: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontFamily: fonts.semiBold,
    textAlign: "center",
  },
  gridSub: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontFamily: fonts.regular,
  },
  inlineBtn: {
    marginTop: spacing.md,
    alignSelf: "flex-start",
  },
  skillsWrap: {
    marginBottom: spacing.sm,
  },
  loanBtnRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xs + 2,
  },
  candidateList: {
    marginTop: spacing.sm,
  },
  loanRow: {
    marginBottom: spacing.sm + 2,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  loanHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  ownedName: {
    color: colors.textPrimary,
    fontFamily: fonts.semiBold,
    fontSize: fontSize.base,
  },
  ownedValue: {
    color: colors.primary,
    fontFamily: fonts.bold,
    fontSize: fontSize.base,
  },
  subheading: {
    color: colors.textMuted,
    fontFamily: fonts.semiBold,
    fontSize: fontSize.sm,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  listingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listingDisabled: {
    opacity: 0.4,
  },
  listingName: {
    color: colors.textPrimary,
    fontFamily: fonts.regular,
    fontSize: fontSize.base,
  },
  listingSub: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
  },
  listingPrice: {
    color: colors.primary,
    fontFamily: fonts.bold,
    fontSize: fontSize.base,
  },
});
