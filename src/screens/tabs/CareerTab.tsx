import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGameStore } from "../../state/gameStore";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Chip from "../../components/Chip";
import GradientBg from "../../components/GradientBg";
import { FadeInUp } from "../../motion";
import { availableJobs } from "../../data/jobs";
import { effectiveSalary, takeHomePay } from "../../engine/lifeEngine";
import { colors, fonts, fontSize, radii, spacing } from "../../theme";
import { tabStyles } from "./sharedStyles";

export default function CareerTab() {
  const character = useGameStore((s) => s.character);
  const worldState = useGameStore((s) => s.worldState);
  const applyForJob = useGameStore((s) => s.applyForJob);
  const quitJob = useGameStore((s) => s.quitJob);

  if (!character) return null;

  const region = character.originRegion;
  const jobs = availableJobs(character.age, character.stats.smarts, character.hasCollegeDegree, character.criminalRecord ?? false);
  const gross = character.job ? effectiveSalary(character.job, worldState, region) : 0;
  const net = character.job ? takeHomePay(gross, region) : 0;

  return (
    <ScrollView contentContainerStyle={tabStyles.scroll}>
      <GradientBg id="careerHero" from={colors.gradCareer} to={colors.surface} radius={radii.lg} style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.heroIcon}>
            <Ionicons name={character.inJail ? "lock-closed" : "briefcase"} size={22} color={colors.smarts} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroLabel}>{character.inJail ? "STATUS" : "CURRENT JOB"}</Text>
            <Text style={styles.heroTitle}>
              {character.inJail ? "Incarcerated" : character.job ? character.job.title : "Unemployed"}
            </Text>
          </View>
        </View>
        {character.job ? (
          <>
            <View style={styles.tiles}>
              <View style={styles.tile}>
                <Text style={styles.tileLabel}>Gross</Text>
                <Text style={styles.tileValue}>${gross.toLocaleString()}</Text>
                <Text style={styles.tileSub}>per year</Text>
              </View>
              <View style={styles.tile}>
                <Text style={styles.tileLabel}>Take-home</Text>
                <Text style={[styles.tileValue, { color: colors.primary }]}>${net.toLocaleString()}</Text>
                <Text style={styles.tileSub}>after tax</Text>
              </View>
            </View>
            <Button label="Quit current job" icon="exit" variant="danger" onPress={quitJob} />
          </>
        ) : !character.inJail ? (
          <Text style={styles.heroHint}>Pick a position below. Higher pay needs more smarts or a degree.</Text>
        ) : null}
        {character.criminalRecord && (
          <View style={styles.record}>
            <Ionicons name="warning" size={14} color={colors.danger} />
            <Text style={styles.recordText}>Criminal record — some jobs won't consider you.</Text>
          </View>
        )}
      </GradientBg>

      <Text style={styles.listTitle}>Open positions</Text>
      {character.inJail ? (
        <Card>
          <Text style={tabStyles.logLine}>You can't work from behind bars.</Text>
        </Card>
      ) : jobs.length === 0 ? (
        <Card>
          <Text style={tabStyles.logLine}>No jobs available yet.</Text>
        </Card>
      ) : (
        jobs.map((job, idx) => {
          const g = effectiveSalary(job, worldState, region);
          const current = character.job?.title === job.title;
          return (
            <FadeInUp key={job.title} delay={Math.min(idx, 8) * 45}>
            <TouchableOpacity
              accessibilityRole="button"
              activeOpacity={0.75}
              style={[styles.jobCard, current && styles.jobCardCurrent]}
              onPress={() => applyForJob(job)}
            >
              <View style={styles.jobIcon}>
                <Ionicons name="briefcase-outline" size={18} color={colors.smarts} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.jobTitle}>{job.title}</Text>
                <View style={styles.chips}>
                  {job.requiresCollege ? <Chip label="DEGREE" color={colors.smarts} /> : null}
                  {job.minSmarts ? <Chip label={`SMARTS ${job.minSmarts}+`} color={colors.looks} /> : null}
                  <Text style={styles.jobSub}>${takeHomePay(g, region).toLocaleString()} take-home</Text>
                </View>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.jobSalary}>${g.toLocaleString()}</Text>
                <Text style={styles.jobPer}>/yr</Text>
              </View>
            </TouchableOpacity>
            </FadeInUp>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: {
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.smarts + "22",
    alignItems: "center",
    justifyContent: "center",
  },
  heroLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.bold,
    fontSize: fontSize.xs,
    letterSpacing: 1,
  },
  heroTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.extraBold,
    fontSize: fontSize.xxl - 4,
  },
  heroHint: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    lineHeight: 19,
  },
  tiles: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  tile: {
    flex: 1,
    backgroundColor: colors.shade,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  tileLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.semiBold,
    fontSize: fontSize.sm,
  },
  tileValue: {
    color: colors.textPrimary,
    fontFamily: fonts.extraBold,
    fontSize: fontSize.xl,
    marginTop: 2,
  },
  tileSub: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: fontSize.xs,
  },
  record: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.md,
  },
  recordText: {
    color: colors.danger,
    fontFamily: fonts.semiBold,
    fontSize: fontSize.sm,
    flex: 1,
  },
  listTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.extraBold,
    fontSize: fontSize.base,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  jobCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md + 2,
    marginBottom: spacing.sm,
  },
  jobCardCurrent: {
    borderColor: colors.smarts,
  },
  jobIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.smarts + "1f",
    alignItems: "center",
    justifyContent: "center",
  },
  jobTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: fontSize.base + 1,
  },
  chips: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  jobSub: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
  },
  jobSalary: {
    color: colors.primary,
    fontFamily: fonts.extraBold,
    fontSize: fontSize.lg,
  },
  jobPer: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: fontSize.xs,
  },
});
