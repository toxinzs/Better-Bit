import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Stats } from "../types";
import { FloatingDelta, Pop } from "../motion";
import { colors, fonts, fontSize, radii, spacing } from "../theme";

const META: { key: keyof Stats; label: string; color: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "health", label: "Health", color: colors.health, icon: "heart" },
  { key: "happiness", label: "Happy", color: colors.happiness, icon: "happy" },
  { key: "smarts", label: "Smarts", color: colors.smarts, icon: "school" },
  { key: "looks", label: "Looks", color: colors.looks, icon: "sparkles" },
];

// The four core stats, always visible under the header on every tab - the
// same job BitLife's stat bars do, in about a third of the vertical space
// the old full-width StatBar card took.
export default function StatStrip({ stats }: { stats: Stats }) {
  return (
    <View style={styles.wrap}>
      {META.map((m) => (
        <Meter key={m.key} label={m.label} color={m.color} icon={m.icon} value={stats[m.key]} />
      ))}
    </View>
  );
}

function Meter({
  label,
  color,
  icon,
  value,
}: {
  label: string;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: number;
}) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const width = useRef(new Animated.Value(v)).current;

  useEffect(() => {
    Animated.timing(width, { toValue: v, duration: 450, useNativeDriver: false }).start();
  }, [v, width]);

  return (
    <View style={styles.meter}>
      <View style={styles.topRow}>
        <Ionicons name={icon} size={12} color={color} />
        <Text style={styles.label}>{label}</Text>
        <View>
          <Pop trigger={v} strength={1.3}>
            <Text style={styles.value}>{v}</Text>
          </Pop>
          <FloatingDelta value={v} style={styles.delta} />
        </View>
      </View>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            { backgroundColor: color, width: width.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }) },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  meter: {
    flex: 1,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  label: {
    flex: 1,
    color: colors.textSecondary,
    fontFamily: fonts.semiBold,
    fontSize: fontSize.xs,
  },
  value: {
    color: colors.textPrimary,
    fontFamily: fonts.extraBold,
    fontSize: fontSize.sm,
  },
  delta: {
    right: 0,
    top: -14,
    fontSize: 11,
  },
  track: {
    height: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceRaised,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: radii.pill,
  },
});
