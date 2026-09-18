import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useGameStore } from "../state/gameStore";

export default function GameOverScreen() {
  const character = useGameStore((s) => s.character);
  const restart = useGameStore((s) => s.restart);

  if (!character) return null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>💀 End of the line</Text>
        <Text style={styles.subtitle}>
          {character.firstName} {character.lastName} lived to {character.age}
          {character.causeOfDeath ? ` (${character.causeOfDeath})` : ""}.
        </Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Life summary</Text>
          <Text style={styles.line}>Final job: {character.job ? character.job.title : "Unemployed"}</Text>
          <Text style={styles.line}>Net worth: ${character.money.toLocaleString()}</Text>
          <Text style={styles.line}>
            Education: {character.hasCollegeDegree ? "College graduate" : character.educationStage}
          </Text>
          <Text style={styles.line}>
            Relationships left behind: {character.relationships.filter((r) => r.alive).length}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Life story</Text>
          {character.fullLog.map((entry, i) => (
            <Text key={i} style={styles.line}>
              [{entry.age}] {entry.text}
            </Text>
          ))}
        </View>

        <TouchableOpacity accessibilityRole="button" style={styles.primaryBtn} onPress={restart}>
          <Text style={styles.primaryText}>Start a new life</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#12121c",
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: "#aaa",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#1a1a26",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2a2a3a",
  },
  sectionTitle: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
    marginBottom: 8,
  },
  line: {
    color: "#ccc",
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 3,
  },
  primaryBtn: {
    backgroundColor: "#2ecc71",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
  },
  primaryText: {
    color: "#0b1a10",
    fontWeight: "800",
    fontSize: 17,
  },
});
