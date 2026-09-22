import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGameStore } from "../../state/gameStore";
import StatBar from "../../components/StatBar";
import Card from "../../components/Card";
import { MIN_AGE_GYM, MIN_AGE_LIBRARY } from "../../engine/lifeStage";
import { colors, fonts, fontSize, radii, spacing } from "../../theme";
import { tabStyles } from "./sharedStyles";

const CONDITION_META: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  recession: { label: "Recession", icon: "trending-down", color: colors.danger },
  boom: { label: "Economic Boom", icon: "trending-up", color: colors.primary },
  war: { label: "War", icon: "flash", color: colors.danger },
  pandemic: { label: "Pandemic", icon: "medkit", color: colors.gold },
};

const ACTIVITIES: { key: "gym" | "library" | "doctor"; label: string; icon: keyof typeof Ionicons.glyphMap; minAge?: number }[] = [
  { key: "gym", label: "Gym", icon: "barbell", minAge: MIN_AGE_GYM },
  { key: "library", label: "Library", icon: "book", minAge: MIN_AGE_LIBRARY },
  { key: "doctor", label: "Doctor", icon: "medkit" },
];

export default function LifeTab() {
  const character = useGameStore((s) => s.character);
  const worldState = useGameStore((s) => s.worldState);
  const doActivity = useGameStore((s) => s.doActivity);

  if (!character) return null;

  const condition = worldState.activeCondition ? CONDITION_META[worldState.activeCondition.kind] : null;

  return (
    <ScrollView contentContainerStyle={tabStyles.scroll}>
      <Card>
        <StatBar label="Health" value={character.stats.health} />
        <StatBar label="Happiness" value={character.stats.happiness} />
        <StatBar label="Smarts" value={character.stats.smarts} />
        <StatBar label="Looks" value={character.stats.looks} />
      </Card>

      <Card>
        <Text style={tabStyles.sectionTitle}>Activities</Text>
        <View style={styles.activityRow}>
          {ACTIVITIES.filter((a) => !a.minAge || character.age >= a.minAge).map((a) => (
            <TouchableOpacity
              key={a.key}
              accessibilityRole="button"
              activeOpacity={0.7}
              style={styles.activityBtn}
              onPress={() => doActivity(a.key)}
            >
              <Ionicons name={a.icon} size={20} color={colors.textPrimary} />
              <Text style={styles.activityText}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      <Card>
        <Text style={tabStyles.sectionTitle}>This year</Text>
        {character.yearLog.length === 0 ? (
          <Text style={tabStyles.logLine}>Nothing happened yet.</Text>
        ) : (
          character.yearLog.map((line, i) => (
            <Text key={i} style={tabStyles.logLine}>
              • {line}
            </Text>
          ))
        )}
      </Card>

      <Card>
        <Text style={tabStyles.sectionTitle}>World News</Text>
        {worldState.log.map((line, i) => (
          <Text key={`news-${i}`} style={tabStyles.logLine}>
            • {line}
          </Text>
        ))}
        {condition ? (
          <View style={styles.conditionRow}>
            <Ionicons name={condition.icon} size={15} color={condition.color} />
            <Text style={[styles.conditionText, { color: condition.color }]}>
              {condition.label} — year {worldState.year - worldState.activeCondition!.startYear + 1} of ~
              {worldState.activeCondition!.endsYear - worldState.activeCondition!.startYear}
            </Text>
          </View>
        ) : worldState.log.length === 0 ? (
          <Text style={tabStyles.logLine}>All quiet on the economic front.</Text>
        ) : null}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  activityRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  activityBtn: {
    flex: 1,
    alignItems: "center",
    backgroundColor: colors.surfaceRaised,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    gap: 5,
  },
  activityText: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontFamily: fonts.semiBold,
  },
  conditionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  conditionText: {
    fontFamily: fonts.bold,
    fontSize: fontSize.md,
  },
});
