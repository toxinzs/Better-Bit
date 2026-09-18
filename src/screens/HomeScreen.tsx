import React, { useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useGameStore } from "../state/gameStore";
import StatBar from "../components/StatBar";
import EventModal from "../components/EventModal";
import { availableJobs } from "../data/jobs";
import { MIN_AGE_GYM, MIN_AGE_LIBRARY, MIN_AGE_CONVERSATION } from "../engine/lifeStage";
import { effectiveSalary } from "../engine/lifeEngine";

const RELATION_LABEL: Record<string, string> = {
  mother: "Mother",
  father: "Father",
  sibling: "Sibling",
  friend: "Friend",
  partner: "Partner",
  child: "Child",
};

const CONDITION_LABEL: Record<string, string> = {
  recession: "📉 Recession",
  boom: "📈 Economic Boom",
  war: "⚔️ War",
  pandemic: "🦠 Pandemic",
};

export default function HomeScreen() {
  const character = useGameStore((s) => s.character);
  const worldState = useGameStore((s) => s.worldState);
  const pendingEvent = useGameStore((s) => s.pendingEvent);
  const ageUp = useGameStore((s) => s.ageUp);
  const chooseEventOption = useGameStore((s) => s.chooseEventOption);
  const applyForJob = useGameStore((s) => s.applyForJob);
  const quitJob = useGameStore((s) => s.quitJob);
  const doActivity = useGameStore((s) => s.doActivity);
  const spendTimeWith = useGameStore((s) => s.spendTimeWith);
  const haveConversation = useGameStore((s) => s.haveConversation);
  const [showCareers, setShowCareers] = useState(false);

  if (!character) return null;

  const jobs = availableJobs(character.age, character.stats.smarts, character.hasCollegeDegree);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.name}>
            {character.firstName} {character.lastName}
          </Text>
          <Text style={styles.meta}>
            Age {character.age} · {character.job ? character.job.title : "Unemployed"} · $
            {character.money.toLocaleString()}
          </Text>
        </View>

        <View style={styles.card}>
          <StatBar label="Health" value={character.stats.health} />
          <StatBar label="Happiness" value={character.stats.happiness} />
          <StatBar label="Smarts" value={character.stats.smarts} />
          <StatBar label="Looks" value={character.stats.looks} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>This year</Text>
          {character.yearLog.length === 0 ? (
            <Text style={styles.logLine}>Nothing happened yet.</Text>
          ) : (
            character.yearLog.map((line, i) => (
              <Text key={i} style={styles.logLine}>
                • {line}
              </Text>
            ))
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>World News</Text>
          {worldState.log.map((line, i) => (
            <Text key={`news-${i}`} style={styles.logLine}>
              • {line}
            </Text>
          ))}
          {worldState.activeCondition ? (
            <Text style={styles.logLine}>
              {CONDITION_LABEL[worldState.activeCondition.kind] ?? worldState.activeCondition.kind} — year{" "}
              {worldState.year - worldState.activeCondition.startYear + 1} of ~
              {worldState.activeCondition.endsYear - worldState.activeCondition.startYear}
            </Text>
          ) : worldState.log.length === 0 ? (
            <Text style={styles.logLine}>All quiet on the economic front.</Text>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Relationships</Text>
          {character.relationships.filter((r) => r.alive).map((r) => (
            <View key={r.id} style={styles.relBlock}>
              <View style={styles.relRow}>
                <Text style={styles.relName}>
                  {r.name} ({RELATION_LABEL[r.type] ?? r.type})
                </Text>
                <Text style={styles.relLevel}>{Math.round(r.level)}</Text>
              </View>
              <View style={styles.relActions}>
                <TouchableOpacity
                  accessibilityRole="button"
                  style={styles.relActionBtn}
                  onPress={() => spendTimeWith(r.id)}
                >
                  <Text style={styles.relActionText}>Spend Time</Text>
                </TouchableOpacity>
                {character.age >= MIN_AGE_CONVERSATION && (
                  <TouchableOpacity
                    accessibilityRole="button"
                    style={styles.relActionBtn}
                    onPress={() => haveConversation(r.id)}
                  >
                    <Text style={styles.relActionText}>Talk</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <TouchableOpacity accessibilityRole="button" onPress={() => setShowCareers((v) => !v)}>
            <Text style={styles.sectionTitle}>Careers {showCareers ? "▲" : "▼"}</Text>
          </TouchableOpacity>
          {showCareers && (
            <View>
              {character.job && (
                <TouchableOpacity accessibilityRole="button" style={styles.quitBtn} onPress={quitJob}>
                  <Text style={styles.quitText}>Quit current job</Text>
                </TouchableOpacity>
              )}
              {jobs.length === 0 && <Text style={styles.logLine}>No jobs available yet.</Text>}
              {jobs.map((job) => (
                <TouchableOpacity accessibilityRole="button" key={job.title} style={styles.jobRow} onPress={() => applyForJob(job)}>
                  <Text style={styles.jobTitle}>{job.title}</Text>
                  <Text style={styles.jobSalary}>${effectiveSalary(job, worldState).toLocaleString()}/yr</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.actionBar}>
        {character.age >= MIN_AGE_GYM && (
          <TouchableOpacity accessibilityRole="button" style={styles.smallBtn} onPress={() => doActivity("gym")}>
            <Text style={styles.smallBtnText}>🏋️ Gym</Text>
          </TouchableOpacity>
        )}
        {character.age >= MIN_AGE_LIBRARY && (
          <TouchableOpacity accessibilityRole="button" style={styles.smallBtn} onPress={() => doActivity("library")}>
            <Text style={styles.smallBtnText}>📚 Library</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity accessibilityRole="button" style={styles.smallBtn} onPress={() => doActivity("doctor")}>
          <Text style={styles.smallBtnText}>🩺 Doctor</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" style={styles.ageBtn} onPress={ageUp}>
          <Text style={styles.ageBtnText}>Age Up →</Text>
        </TouchableOpacity>
      </View>

      {pendingEvent && (
        <EventModal event={pendingEvent} character={character} world={worldState} onChoose={chooseEventOption} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#12121c",
  },
  scroll: {
    padding: 16,
    paddingBottom: 12,
  },
  header: {
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
  },
  meta: {
    fontSize: 14,
    color: "#aaa",
    marginTop: 2,
  },
  card: {
    backgroundColor: "#1a1a26",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#2a2a3a",
  },
  sectionTitle: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
    marginBottom: 8,
  },
  logLine: {
    color: "#ccc",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 4,
  },
  relBlock: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#26263a",
  },
  relRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  relName: {
    color: "#ddd",
    fontSize: 13,
  },
  relLevel: {
    color: "#7fd6a0",
    fontSize: 13,
    fontWeight: "700",
  },
  relActions: {
    flexDirection: "row",
    gap: 8,
  },
  relActionBtn: {
    backgroundColor: "#232336",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  relActionText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
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
    marginBottom: 8,
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
  actionBar: {
    flexDirection: "row",
    padding: 12,
    gap: 8,
    backgroundColor: "#0e0e16",
    borderTopWidth: 1,
    borderTopColor: "#2a2a3a",
  },
  smallBtn: {
    flex: 1,
    backgroundColor: "#232336",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  smallBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  ageBtn: {
    flex: 1.4,
    backgroundColor: "#2ecc71",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  ageBtnText: {
    color: "#0b1a10",
    fontSize: 13,
    fontWeight: "800",
  },
});
