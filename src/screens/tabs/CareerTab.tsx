import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useGameStore } from "../../state/gameStore";
import { availableJobs } from "../../data/jobs";
import { effectiveSalary } from "../../engine/lifeEngine";
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
      <View style={tabStyles.card}>
        <Text style={tabStyles.sectionTitle}>
          {character.job ? `Currently: ${character.job.title}` : "Unemployed"}
        </Text>
        {character.job && (
          <TouchableOpacity accessibilityRole="button" style={styles.quitBtn} onPress={quitJob}>
            <Text style={styles.quitText}>Quit current job</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={tabStyles.card}>
        <Text style={tabStyles.sectionTitle}>Open positions</Text>
        {jobs.length === 0 && <Text style={tabStyles.logLine}>No jobs available yet.</Text>}
        {jobs.map((job) => (
          <TouchableOpacity accessibilityRole="button" key={job.title} style={styles.jobRow} onPress={() => applyForJob(job)}>
            <Text style={styles.jobTitle}>{job.title}</Text>
            <Text style={styles.jobSalary}>${effectiveSalary(job, worldState).toLocaleString()}/yr</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  jobRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#26263a",
  },
  jobTitle: {
    color: "#fff",
    fontSize: 13,
  },
  jobSalary: {
    color: "#7fd6a0",
    fontSize: 13,
    fontWeight: "700",
  },
  quitBtn: {
    backgroundColor: "#3a2323",
    paddingVertical: 8,
    borderRadius: 8,
  },
  quitText: {
    color: "#ff8080",
    textAlign: "center",
    fontSize: 13,
    fontWeight: "600",
  },
});
