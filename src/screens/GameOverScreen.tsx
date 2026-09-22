import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGameStore } from "../state/gameStore";
import Card from "../components/Card";
import Button from "../components/Button";
import { colors, fonts, fontSize, spacing } from "../theme";
import { totalNetWorth } from "../engine/lifeEngine";

export default function GameOverScreen() {
  const character = useGameStore((s) => s.character);
  const worldState = useGameStore((s) => s.worldState);
  const restart = useGameStore((s) => s.restart);

  if (!character) return null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerWrap}>
          <View style={styles.badge}>
            <Ionicons name="flower" size={26} color={colors.textPrimary} />
          </View>
          <Text style={styles.title}>End of the line</Text>
          <Text style={styles.subtitle}>
            {character.firstName} {character.lastName} lived to {character.age}
            {character.causeOfDeath ? ` (${character.causeOfDeath})` : ""}.
          </Text>
        </View>

        <Card>
          <Text style={styles.sectionTitle}>Life summary</Text>
          <SummaryRow icon="briefcase" label="Final job" value={character.job ? character.job.title : "Unemployed"} />
          <SummaryRow icon="cash" label="Net worth" value={`$${totalNetWorth(character, worldState).toLocaleString()}`} />
          {character.car && <SummaryRow icon="car-sport" label="Car" value={character.car.name} />}
          {character.home && <SummaryRow icon="home" label="Home" value={character.home.name} />}
          <SummaryRow
            icon="school"
            label="Education"
            value={character.hasCollegeDegree ? "College graduate" : character.educationStage}
          />
          <SummaryRow
            icon="people"
            label="Relationships left behind"
            value={String(character.relationships.filter((r) => r.alive).length)}
          />
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Life story</Text>
          {character.fullLog.map((entry, i) => (
            <Text key={i} style={styles.line}>
              <Text style={styles.lineAge}>[{entry.age}] </Text>
              {entry.text}
            </Text>
          ))}
        </Card>

        <Button label="Start a new life" icon="refresh" variant="primary" size="lg" onPress={restart} style={styles.restartBtn} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <View style={styles.summaryLabelWrap}>
        <Ionicons name={icon} size={15} color={colors.textSecondary} />
        <Text style={styles.summaryLabel}>{label}</Text>
      </View>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  headerWrap: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.xxl,
    fontFamily: fonts.extraBold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: fontSize.base,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.xs,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: fontSize.lg,
    marginBottom: spacing.sm + 2,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs + 2,
  },
  summaryLabelWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: fontSize.base,
  },
  summaryValue: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: fontSize.base,
  },
  line: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    lineHeight: 20,
    marginBottom: 4,
  },
  lineAge: {
    color: colors.textMuted,
    fontFamily: fonts.semiBold,
  },
  restartBtn: {
    marginTop: spacing.sm,
  },
});
