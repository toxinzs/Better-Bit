import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, fontSize, radii, spacing } from "../theme";

export type Segment<T extends string> = { key: T; label: string; icon?: keyof typeof Ionicons.glyphMap };

// Pill-style switcher used where two related screens share one bottom tab
// (Work = Job/School, Activities = Fun/Crime).
export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accent = colors.primary,
}: {
  options: Segment<T>[];
  value: T;
  onChange: (key: T) => void;
  accent?: string;
}) {
  return (
    <View style={styles.wrap}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <TouchableOpacity
            key={o.key}
            accessibilityRole="button"
            activeOpacity={0.8}
            onPress={() => onChange(o.key)}
            style={[styles.seg, active && { backgroundColor: accent }]}
          >
            {o.icon && <Ionicons name={o.icon} size={15} color={active ? colors.primaryText : colors.textSecondary} />}
            <Text style={[styles.label, active && styles.labelActive]}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    padding: 4,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  seg: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: spacing.sm + 1,
    borderRadius: radii.pill,
  },
  label: {
    color: colors.textSecondary,
    fontFamily: fonts.bold,
    fontSize: fontSize.md,
  },
  labelActive: {
    color: colors.primaryText,
  },
});
