import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
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
  const clamped = Math.max(0, Math.min(100, value));

  const width = useRef(new Animated.Value(clamped)).current;
  const valueScale = useRef(new Animated.Value(1)).current;
  const prevValue = useRef(clamped);

  useEffect(() => {
    Animated.timing(width, {
      toValue: clamped,
      duration: 450,
      useNativeDriver: false,
    }).start();

    if (prevValue.current !== clamped) {
      valueScale.setValue(1.35);
      Animated.spring(valueScale, { toValue: 1, friction: 4, useNativeDriver: false }).start();
      prevValue.current = clamped;
    }
  }, [clamped, width, valueScale]);

  return (
    <View style={styles.row}>
      <View style={styles.labelWrap}>
        <Ionicons name={meta.icon} size={13} color={meta.color} style={styles.icon} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: meta.color,
              width: width.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }),
            },
          ]}
        />
      </View>
      <Animated.Text style={[styles.value, { transform: [{ scale: valueScale }] }]}>{Math.round(clamped)}</Animated.Text>
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
