import React, { useState } from "react";
import { SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useGameStore } from "../state/gameStore";
import { Gender } from "../types";
import { randomFirstName, randomLastName } from "../data/names";

export default function StartScreen() {
  const startNewLife = useGameStore((s) => s.startNewLife);
  const [gender, setGender] = useState<Gender>("nonbinary");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const reroll = () => {
    setFirstName(randomFirstName(gender));
    setLastName(randomLastName());
  };

  const begin = () => {
    const fn = firstName.trim() || randomFirstName(gender);
    const ln = lastName.trim() || randomLastName();
    startNewLife(fn, ln, gender);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Better Bit</Text>
      <Text style={styles.subtitle}>A life, from birth.</Text>

      <View style={styles.genderRow}>
        {(["female", "male", "nonbinary"] as Gender[]).map((g) => (
          <TouchableOpacity accessibilityRole="button"
            key={g}
            style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
            onPress={() => setGender(g)}
          >
            <Text style={styles.genderText}>{g === "nonbinary" ? "Other" : g[0].toUpperCase() + g.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.input}
        placeholder="First name (leave blank for random)"
        placeholderTextColor="#888"
        value={firstName}
        onChangeText={setFirstName}
      />
      <TextInput
        style={styles.input}
        placeholder="Last name (leave blank for random)"
        placeholderTextColor="#888"
        value={lastName}
        onChangeText={setLastName}
      />

      <TouchableOpacity accessibilityRole="button" style={styles.secondaryBtn} onPress={reroll}>
        <Text style={styles.secondaryText}>🎲 Randomize name</Text>
      </TouchableOpacity>

      <TouchableOpacity accessibilityRole="button" style={styles.primaryBtn} onPress={begin}>
        <Text style={styles.primaryText}>Begin Life</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#12121c",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 40,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: "#999",
    marginBottom: 32,
  },
  genderRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  genderBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#232336",
    borderWidth: 1,
    borderColor: "#333",
  },
  genderBtnActive: {
    backgroundColor: "#2ecc71",
    borderColor: "#2ecc71",
  },
  genderText: {
    color: "#fff",
    fontWeight: "600",
  },
  input: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#1c1c2a",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#333",
    color: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 15,
  },
  secondaryBtn: {
    marginTop: 4,
    marginBottom: 24,
  },
  secondaryText: {
    color: "#7fd6a0",
    fontSize: 14,
  },
  primaryBtn: {
    backgroundColor: "#2ecc71",
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 14,
  },
  primaryText: {
    color: "#0b1a10",
    fontWeight: "800",
    fontSize: 18,
  },
});
