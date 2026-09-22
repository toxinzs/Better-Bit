import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGameStore } from "../../state/gameStore";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { availableJobs } from "../../data/jobs";
import { effectiveSalary } from "../../engine/lifeEngine";
import { colors, fonts, fontSize, spacing } from "../../theme";
import { tabStyles } from "./sharedStyles";

export default function CareerTab() {
  const character = useGameStore((s) => s.character);
  const worldState = useGameStore((s) => s.worldState);
  const applyForJob = useGameStore((s) => s.applyForJob);
  const quitJob = useGameStore((s) => s.quitJob);

  if (!character) return null;

  const jobs = availableJobs(character.age, character.stats.smarts, character.hasCollegeDegree);

  return (
    <ScrollView contentContainerStyle={tabStyles.scroll}>
      <Card>
        <View style={styles.currentRow}>
          <Ionicons name="briefcase" size={18} color={colors.primary} />
          <Text style={tabStyles.sectionTitle}>
            {character.job ? character.job.title : "Unemployed"}
          </Text>
        </View>
        {character.job && <Button label="Quit current job" icon="exit" variant="danger" onPress={quitJob} />}
      </Card>

      <Card>
        <Text style={tabStyles.sectionTitle}>Open positions</Text>
        {jobs.length === 0 && <Text style={tabStyles.logLine}>No jobs available yet.</Text>}
        {jobs.map((job) => (
          <TouchableOpacity accessibilityRole="button" activeOpacity={0.7} key={job.title} style={styles.jobRow} onPress={() => applyForJob(job)}>
            <Text style={styles.jobTitle}>{job.title}</Text>
            <Text style={styles.jobSalary}>${effectiveSalary(job, worldState).toLocaleString()}/yr</Text>
          </TouchableOpacity>
        ))}
      </Card>
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
