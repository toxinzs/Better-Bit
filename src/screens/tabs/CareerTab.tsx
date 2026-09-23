import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGameStore } from "../../state/gameStore";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { availableJobs } from "../../data/jobs";
import { effectiveSalary, takeHomePay } from "../../engine/lifeEngine";
import { colors, fonts, fontSize, spacing } from "../../theme";
import { tabStyles } from "./sharedStyles";

export default function CareerTab() {
  const character = useGameStore((s) => s.character);
  const worldState = useGameStore((s) => s.worldState);
  const applyForJob = useGameStore((s) => s.applyForJob);
  const quitJob = useGameStore((s) => s.quitJob);

  if (!character) return null;

  const jobs = availableJobs(character.age, character.stats.smarts, character.hasCollegeDegree, character.criminalRecord ?? false);

  return (
    <ScrollView contentContainerStyle={tabStyles.scroll}>
      <Card>
        <View style={styles.currentRow}>
          <Ionicons name="briefcase" size={18} color={colors.smarts} />
          <Text style={tabStyles.sectionTitle}>
            {character.inJail ? "Incarcerated" : character.job ? character.job.title : "Unemployed"}
          </Text>
        </View>
        {character.job && (
          <>
            <Text style={styles.takeHomeLine}>
              ${effectiveSalary(character.job, worldState, character.originRegion).toLocaleString()}/yr gross · $
              {takeHomePay(effectiveSalary(character.job, worldState, character.originRegion), character.originRegion).toLocaleString()}/yr take-home
            </Text>
            <Button label="Quit current job" icon="exit" variant="danger" onPress={quitJob} />
          </>
        )}
        {character.criminalRecord && (
          <Text style={styles.recordLine}>
            You have a criminal record — some jobs won't consider you.
          </Text>
        )}
      </Card>

      {character.inJail ? (
        <Card>
          <Text style={tabStyles.sectionTitle}>Open positions</Text>
          <Text style={tabStyles.logLine}>You can't work from behind bars.</Text>
        </Card>
      ) : (
        <Card>
          <Text style={tabStyles.sectionTitle}>Open positions</Text>
          {jobs.length === 0 && <Text style={tabStyles.logLine}>No jobs available yet.</Text>}
          {jobs.map((job) => {
            const gross = effectiveSalary(job, worldState, character.originRegion);
            return (
              <TouchableOpacity accessibilityRole="button" activeOpacity={0.7} key={job.title} style={styles.jobRow} onPress={() => applyForJob(job)}>
                <View>
                  <Text style={styles.jobTitle}>{job.title}</Text>
                  <Text style={styles.jobSub}>${takeHomePay(gross, character.originRegion).toLocaleString()}/yr take-home</Text>
                </View>
                <Text style={styles.jobSalary}>${gross.toLocaleString()}/yr</Text>
              </TouchableOpacity>
            );
          })}
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  currentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  takeHomeLine: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
  },
  recordLine: {
    color: colors.danger,
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
  },
  jobSub: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
  },
  jobRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  jobTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.regular,
    fontSize: fontSize.base,
  },
  jobSalary: {
    color: colors.primary,
    fontSize: fontSize.base,
    fontFamily: fonts.bold,
  },
});
