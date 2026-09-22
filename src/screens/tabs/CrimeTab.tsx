import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGameStore } from "../../state/gameStore";
import Card from "../../components/Card";
import { availableCrimes, CrimeDef } from "../../data/crimes";
import { successChance } from "../../engine/lifeEngine";
import { colors, fonts, fontSize, radii, spacing } from "../../theme";
import { tabStyles } from "./sharedStyles";

const TIER_META: Record<CrimeDef["tier"], { label: string; color: string }> = {
  petty: { label: "Petty", color: colors.gold },
  moderate: { label: "Moderate", color: colors.danger },
  serious: { label: "Serious", color: colors.danger },
};

export default function CrimeTab() {
  const character = useGameStore((s) => s.character);
  const commitCrime = useGameStore((s) => s.commitCrime);

  if (!character) return null;

  if (character.inJail) {
    const total = character.jailYearsTotal ?? 0;
    const left = character.jailYearsLeft ?? 0;
    const served = total - left;
    return (
      <ScrollView contentContainerStyle={tabStyles.scroll}>
        <Card style={styles.jailCard}>
          <Ionicons name="lock-closed" size={28} color={colors.danger} />
          <Text style={styles.jailTitle}>Behind Bars</Text>
          <Text style={styles.jailSub}>
            {left} year{left === 1 ? "" : "s"} left on your sentence ({served}/{total} served)
          </Text>
          <Text style={tabStyles.logLine}>Parole becomes possible once you've served half your time.</Text>
        </Card>
      </ScrollView>
    );
  }

  const crimes = availableCrimes(character.age);

  return (
    <ScrollView contentContainerStyle={tabStyles.scroll}>
      <Card>
        <Text style={tabStyles.sectionTitle}>Crime</Text>
        <Text style={tabStyles.logLine}>
          Real risk, real reward. Getting caught means a record — and maybe time served.
        </Text>
        {character.criminalRecord && (
          <View style={styles.recordBadge}>
            <Ionicons name="warning" size={14} color={colors.danger} />
            <Text style={styles.recordBadgeText}>You have a criminal record</Text>
          </View>
        )}
      </Card>

      {crimes.length === 0 && (
        <Card>
          <Text style={tabStyles.logLine}>Too young for any of this yet.</Text>
        </Card>
      )}

      {crimes.map((crime) => {
        const tier = TIER_META[crime.tier];
        const chance = Math.round(successChance(crime, character.stats.smarts) * 100);
        return (
          <Card key={crime.id}>
            <View style={styles.headerRow}>
              <Text style={styles.crimeLabel}>{crime.label}</Text>
              <View style={[styles.tierBadge, { borderColor: tier.color }]}>
                <Text style={[styles.tierText, { color: tier.color }]}>{tier.label}</Text>
              </View>
            </View>
            <Text style={tabStyles.logLine}>
              {chance}% chance to pull it off
              {crime.rewardMax > 0 ? ` · up to $${crime.rewardMax.toLocaleString()}` : ""} · bail $
              {crime.bailAmount.toLocaleString()}
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              activeOpacity={0.7}
              style={styles.commitBtn}
              onPress={() => commitCrime(crime.id)}
            >
              <Ionicons name="flash" size={14} color={colors.textPrimary} />
              <Text style={styles.commitBtnText}>Do it</Text>
            </TouchableOpacity>
          </Card>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  jailCard: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  jailTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.extraBold,
    fontSize: fontSize.xl,
    marginTop: spacing.sm,
  },
  jailSub: {
    color: colors.textSecondary,
    fontFamily: fonts.semiBold,
    fontSize: fontSize.base,
    marginTop: 4,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  recordBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.sm,
  },
  recordBadgeText: {
    color: colors.danger,
    fontFamily: fonts.semiBold,
    fontSize: fontSize.sm,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs + 2,
  },
  crimeLabel: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: fontSize.lg,
    flex: 1,
  },
  tierBadge: {
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  tierText: {
    fontFamily: fonts.bold,
    fontSize: fontSize.xs,
  },
  commitBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: colors.dangerDark,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    marginTop: spacing.sm,
  },
  commitBtnText: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: fontSize.base,
  },
});
