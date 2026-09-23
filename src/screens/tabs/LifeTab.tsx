import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGameStore } from "../../state/gameStore";
import StatBar from "../../components/StatBar";
import Card from "../../components/Card";
import { colors, fonts, fontSize } from "../../theme";
import { tabStyles } from "./sharedStyles";

const CONDITION_META: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  recession: { label: "Recession", icon: "trending-down", color: colors.danger },
  boom: { label: "Economic Boom", icon: "trending-up", color: colors.primary },
  war: { label: "War", icon: "flash", color: colors.danger },
  pandemic: { label: "Pandemic", icon: "medkit", color: colors.gold },
};

export default function LifeTab() {
  const character = useGameStore((s) => s.character);
  const worldState = useGameStore((s) => s.worldState);

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
        <View style={styles.headerRow}>
          <Ionicons name="pulse" size={18} color={colors.health} />
          <Text style={tabStyles.sectionTitle}>This year</Text>
        </View>
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
        <View style={styles.headerRow}>
          <Ionicons name="globe" size={18} color={colors.health} />
          <Text style={tabStyles.sectionTitle}>World News</Text>
        </View>
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
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
