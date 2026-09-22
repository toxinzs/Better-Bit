import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useGameStore } from "../../state/gameStore";
import StatBar from "../../components/StatBar";
import { MIN_AGE_GYM, MIN_AGE_LIBRARY } from "../../engine/lifeStage";
import { tabStyles } from "./sharedStyles";

const CONDITION_LABEL: Record<string, string> = {
  recession: "📉 Recession",
  boom: "📈 Economic Boom",
  war: "⚔️ War",
  pandemic: "🦠 Pandemic",
};

export default function LifeTab() {
  const character = useGameStore((s) => s.character);
  const worldState = useGameStore((s) => s.worldState);
  const doActivity = useGameStore((s) => s.doActivity);

  if (!character) return null;

  return (
    <ScrollView contentContainerStyle={tabStyles.scroll}>
      <View style={tabStyles.card}>
        <StatBar label="Health" value={character.stats.health} />
        <StatBar label="Happiness" value={character.stats.happiness} />
        <StatBar label="Smarts" value={character.stats.smarts} />
        <StatBar label="Looks" value={character.stats.looks} />
      </View>

      <View style={tabStyles.card}>
        <Text style={tabStyles.sectionTitle}>Activities</Text>
        <View style={styles.activityRow}>
          {character.age >= MIN_AGE_GYM && (
            <TouchableOpacity accessibilityRole="button" style={styles.activityBtn} onPress={() => doActivity("gym")}>
              <Text style={styles.activityText}>🏋️ Gym</Text>
            </TouchableOpacity>
          )}
          {character.age >= MIN_AGE_LIBRARY && (
            <TouchableOpacity accessibilityRole="button" style={styles.activityBtn} onPress={() => doActivity("library")}>
              <Text style={styles.activityText}>📚 Library</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity accessibilityRole="button" style={styles.activityBtn} onPress={() => doActivity("doctor")}>
            <Text style={styles.activityText}>🩺 Doctor</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={tabStyles.card}>
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
      </View>

      <View style={tabStyles.card}>
        <Text style={tabStyles.sectionTitle}>World News</Text>
        {worldState.log.map((line, i) => (
          <Text key={`news-${i}`} style={tabStyles.logLine}>
            • {line}
          </Text>
        ))}
        {worldState.activeCondition ? (
          <Text style={tabStyles.logLine}>
            {CONDITION_LABEL[worldState.activeCondition.kind] ?? worldState.activeCondition.kind} — year{" "}
            {worldState.year - worldState.activeCondition.startYear + 1} of ~
            {worldState.activeCondition.endsYear - worldState.activeCondition.startYear}
          </Text>
        ) : worldState.log.length === 0 ? (
          <Text style={tabStyles.logLine}>All quiet on the economic front.</Text>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  activityRow: {
    flexDirection: "row",
    gap: 8,
  },
  activityBtn: {
    flex: 1,
    backgroundColor: "#232336",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  activityText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
