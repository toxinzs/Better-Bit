import React, { useState } from "react";
import { SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGameStore } from "../state/gameStore";
import Button from "../components/Button";
import WhatsNewModal from "../components/WhatsNewModal";
import { Gender, RegionKey } from "../types";
import { randomFirstName, randomLastName } from "../data/names";
import { REGIONS } from "../data/regions";
import { APP_VERSION } from "../version";
import { colors, fonts, fontSize, radii, spacing } from "../theme";

const GENDER_OPTIONS: { key: Gender; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "female", label: "Female", icon: "female" },
  { key: "male", label: "Male", icon: "male" },
  { key: "nonbinary", label: "Other", icon: "person" },
];

const REGION_OPTIONS = Object.values(REGIONS);

export default function StartScreen() {
  const startNewLife = useGameStore((s) => s.startNewLife);
  const [gender, setGender] = useState<Gender>("nonbinary");
  const [region, setRegion] = useState<RegionKey>("us");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showWhatsNew, setShowWhatsNew] = useState(false);

  const reroll = () => {
    setFirstName(randomFirstName(gender, region));
    setLastName(randomLastName(region));
  };

  const begin = () => {
    const fn = firstName.trim() || randomFirstName(gender, region);
    const ln = lastName.trim() || randomLastName(region);
    startNewLife(fn, ln, gender, region);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logoWrap}>
        <View style={styles.logoBadge}>
          <Ionicons name="infinite" size={30} color={colors.primaryText} />
        </View>
        <Text style={styles.title}>Better Bit</Text>
        <Text style={styles.subtitle}>A life, from birth.</Text>
      </View>

      <View style={styles.genderRow}>
        {GENDER_OPTIONS.map((g) => (
          <TouchableOpacity
            accessibilityRole="button"
            key={g.key}
            activeOpacity={0.7}
            style={[styles.genderBtn, gender === g.key && styles.genderBtnActive]}
            onPress={() => setGender(g.key)}
          >
            <Ionicons name={g.icon} size={20} color={gender === g.key ? colors.primaryText : colors.textSecondary} />
            <Text style={[styles.genderText, gender === g.key && styles.genderTextActive]}>{g.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.regionRow}>
        {REGION_OPTIONS.map((r) => (
          <TouchableOpacity
            accessibilityRole="button"
            key={r.key}
            activeOpacity={0.7}
            style={[styles.regionBtn, region === r.key && styles.regionBtnActive]}
            onPress={() => setRegion(r.key)}
          >
            <Text style={[styles.regionText, region === r.key && styles.regionTextActive]}>{r.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.input}
        placeholder="First name (leave blank for random)"
        placeholderTextColor={colors.textMuted}
        value={firstName}
        onChangeText={setFirstName}
      />
      <TextInput
        style={styles.input}
        placeholder="Last name (leave blank for random)"
        placeholderTextColor={colors.textMuted}
        value={lastName}
        onChangeText={setLastName}
      />

      <Button label="Randomize name" icon="dice" variant="ghost" onPress={reroll} style={styles.rerollBtn} />
      <Button label="Begin Life" icon="arrow-forward" variant="primary" size="lg" onPress={begin} style={styles.beginBtn} />

      <TouchableOpacity accessibilityRole="button" activeOpacity={0.7} onPress={() => setShowWhatsNew(true)} style={styles.versionRow}>
        <Text style={styles.versionText}>v{APP_VERSION} · What's New</Text>
      </TouchableOpacity>

      {showWhatsNew && <WhatsNewModal onClose={() => setShowWhatsNew(false)} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  logoWrap: {
    alignItems: "center",
    marginBottom: spacing.xxl,
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: radii.xl,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.display,
    fontFamily: fonts.extraBold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: fontSize.base,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    marginTop: 2,
  },
  genderRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  genderBtn: {
    alignItems: "center",
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  genderBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  genderText: {
    color: colors.textSecondary,
    fontFamily: fonts.semiBold,
    fontSize: fontSize.sm,
  },
  genderTextActive: {
    color: colors.primaryText,
  },
  regionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.xs,
    marginBottom: spacing.lg,
    maxWidth: 340,
  },
  regionBtn: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  regionBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  regionText: {
    color: colors.textSecondary,
    fontFamily: fonts.semiBold,
    fontSize: fontSize.sm,
  },
  regionTextActive: {
    color: colors.primaryText,
  },
  input: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    fontFamily: fonts.regular,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm + 2,
    fontSize: fontSize.lg,
  },
  rerollBtn: {
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  beginBtn: {
    width: "100%",
    maxWidth: 340,
  },
  versionRow: {
    marginTop: spacing.lg,
    padding: spacing.sm,
  },
  versionText: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
  },
});
