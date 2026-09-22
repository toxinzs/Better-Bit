import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, fontSize, radii, spacing } from "../theme";

const STAT_META: Record<string, { color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  Health: { color: colors.health, icon: "heart" },
  Happiness: { color: colors.happiness, icon: "happy" },
  Smarts: { color: colors.smarts, icon: "school" },
  Looks: { color: colors.looks, icon: "sparkles" },
};

export default function StatBar({ label, value }: { label: string; value: number }) {
  const meta = STAT_META[label] ?? { color: colors.primary, icon: "ellipse" as const };
  return (
    <View style={styles.row}>
      <View style={styles.labelWrap}>
        <Ionicons name={meta.icon} size={13} color={meta.color} style={styles.icon} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: meta.color }]} />
      </View>
      <Text style={styles.value}>{Math.round(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6,
  },
  labelWrap: {
    flexDirection: "row",
    alignItems: "center",
    width: 92,
  },
  icon: {
    marginRight: 5,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontFamily: fonts.semiBold,
  },
  track: {
    flex: 1,
    height: 10,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.pill,
    overflow: "hidden",
    marginHorizontal: spacing.sm,
  },
  fill: {
    height: "100%",
    borderRadius: radii.pill,
  },
  value: {
    width: 30,
    textAlign: "right",
    fontSize: fontSize.md,
    color: colors.textPrimary,
    fontFamily: fonts.bold,
  },
});
