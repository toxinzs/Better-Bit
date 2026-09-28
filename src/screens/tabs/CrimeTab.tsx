import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGameStore } from "../../state/gameStore";
import Card from "../../components/Card";
import { FadeInUp } from "../../motion";
import { availableCrimes, CrimeDef } from "../../data/crimes";
import {
  successChance,
  canPetitionExpungement,
  hasActiveCondition,
  EXPUNGEMENT_FEE,
  EXPUNGEMENT_ELIGIBLE_YEARS,
} from "../../engine/lifeEngine";
import { colors, fonts, fontSize, radii, spacing } from "../../theme";
import { tabStyles } from "./sharedStyles";

const TIER_META: Record<CrimeDef["tier"], { label: string; color: string }> = {
  petty: { label: "Petty", color: colors.gold },
  moderate: { label: "Moderate", color: colors.danger },
  serious: { label: "Serious", color: colors.danger },
};

export default function CrimeTab() {
  const character = useGameStore((s) => s.character);
  const worldState = useGameStore((s) => s.worldState);
  const commitCrime = useGameStore((s) => s.commitCrime);
  const petitionExpungement = useGameStore((s) => s.petitionExpungement);

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
  const crackdown = hasActiveCondition(worldState, "crackdown");
  const cleanYears = character.recordCleanYears ?? 0;
  const eligibleForExpungement = canPetitionExpungement(character);

  return (
    <ScrollView contentContainerStyle={tabStyles.scroll}>
      <Card>
        <Text style={tabStyles.logLine}>
          Real risk, real reward. Get caught and it's a real trial: plead for a lighter deal, or fight it and risk worse.
        </Text>
        {crackdown && (
          <View style={styles.recordBadge}>
            <Ionicons name="alert-circle" size={14} color={colors.danger} />
            <Text style={styles.recordBadgeText}>Police are cracking down — odds are worse right now</Text>
          </View>
        )}
        {character.criminalRecord && (
          <View style={styles.recordBadge}>
            <Ionicons name="warning" size={14} color={colors.danger} />
            <Text style={styles.recordBadgeText}>You have a criminal record</Text>
          </View>
        )}
      </Card>

      {character.criminalRecord && (
        <Card>
          <Text style={tabStyles.sectionTitle}>Your Record</Text>
          <Text style={tabStyles.logLine}>
            {cleanYears}/{EXPUNGEMENT_ELIGIBLE_YEARS} clean years since your last conviction.
          </Text>
          {eligibleForExpungement ? (
            <TouchableOpacity
              accessibilityRole="button"
              activeOpacity={0.7}
              style={styles.commitBtn}
              onPress={petitionExpungement}
            >
              <Ionicons name="document-text" size={14} color={colors.textPrimary} />
              <Text style={styles.commitBtnText}>Petition to expunge (${EXPUNGEMENT_FEE.toLocaleString()})</Text>
            </TouchableOpacity>
          ) : (
            <Text style={tabStyles.logLine}>
              Eligible for expungement after {EXPUNGEMENT_ELIGIBLE_YEARS} clean years.
            </Text>
          )}
        </Card>
      )}

      {crimes.length === 0 && (
        <Card>
          <Text style={tabStyles.logLine}>Too young for any of this yet.</Text>
        </Card>
      )}

      {crimes.map((crime, idx) => {
        const tier = TIER_META[crime.tier];
        const chance = Math.round(successChance(crime, character.stats.smarts, worldState) * 100);
        const oddsColor = chance >= 65 ? colors.primary : chance >= 45 ? colors.gold : colors.danger;
        return (
          <FadeInUp key={crime.id} delay={Math.min(idx, 8) * 50}>
          <Card style={{ ...styles.crimeCard, borderLeftColor: tier.color }}>
            <View style={styles.headerRow}>
              <Text style={styles.crimeLabel}>{crime.label}</Text>
              <View style={[styles.tierBadge, { borderColor: tier.color }]}>
                <Text style={[styles.tierText, { color: tier.color }]}>{tier.label}</Text>
              </View>
            </View>
            <View style={styles.oddsRow}>
              <Text style={styles.oddsLabel}>Odds</Text>
              <View style={styles.oddsTrack}>
                <View style={[styles.oddsFill, { width: `${chance}%`, backgroundColor: oddsColor }]} />
              </View>
              <Text style={[styles.oddsValue, { color: oddsColor }]}>{chance}%</Text>
            </View>
            <View style={styles.facts}>
              <View style={styles.fact}>
                <Ionicons name="cash" size={13} color={colors.primary} />
                <Text style={styles.factText}>{crime.rewardMax > 0 ? `Up to $${crime.rewardMax.toLocaleString()}` : "No payout"}</Text>
              </View>
              <View style={styles.fact}>
                <Ionicons name="lock-closed" size={13} color={colors.danger} />
                <Text style={styles.factText}>
                  {crime.sentenceMaxYears > 0 ? `${crime.sentenceMinYears}-${crime.sentenceMaxYears} yr if caught` : "No time"}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              activeOpacity={0.7}
              style={styles.commitBtn}
              onPress={() => commitCrime(crime.id)}
            >
              <Ionicons name="flash" size={15} color={colors.textPrimary} />
              <Text style={styles.commitBtnText}>Do it</Text>
            </TouchableOpacity>
          </Card>
          </FadeInUp>
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
  crimeCard: {
    borderLeftWidth: 4,
  },
  oddsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  oddsLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.semiBold,
    fontSize: fontSize.sm,
    width: 36,
  },
  oddsTrack: {
    flex: 1,
    height: 7,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceRaised,
    overflow: "hidden",
  },
  oddsFill: {
    height: "100%",
    borderRadius: radii.pill,
  },
  oddsValue: {
    fontFamily: fonts.extraBold,
    fontSize: fontSize.md,
    width: 40,
    textAlign: "right",
  },
  facts: {
    flexDirection: "row",
    gap: spacing.lg,
    marginTop: spacing.sm + 2,
  },
  fact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  factText: {
    color: colors.textSecondary,
    fontFamily: fonts.semiBold,
    fontSize: fontSize.sm,
  },
  commitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
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
