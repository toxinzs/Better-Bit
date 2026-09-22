import React, { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, fontSize, radii, spacing } from "../theme";

type Variant = "primary" | "secondary" | "danger" | "ghost";

export default function Button({
  label,
  icon,
  variant = "secondary",
  size = "md",
  disabled = false,
  onPress,
  style,
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  onPress: () => void;
  style?: ViewStyle;
}) {
  const variantStyle = VARIANT_STYLES[variant];
  const sizeStyle = SIZE_STYLES[size];
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => Animated.spring(scale, { toValue: 0.95, friction: 5, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }).start();

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
    >
      <Animated.View
        style={[
          styles.base,
          sizeStyle.container,
          { backgroundColor: variantStyle.background, transform: [{ scale }] },
          disabled && styles.disabled,
          style,
        ]}
      >
        {icon && <Ionicons name={icon} size={sizeStyle.iconSize} color={variantStyle.color} style={styles.icon} />}
        <Text style={[styles.label, sizeStyle.label, { color: variantStyle.color }]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

const VARIANT_STYLES: Record<Variant, { background: string; color: string }> = {
  primary: { background: colors.primary, color: colors.primaryText },
  secondary: { background: colors.surfaceRaised, color: colors.textPrimary },
  danger: { background: colors.dangerDark, color: colors.danger },
  ghost: { background: "transparent", color: colors.textSecondary },
};

const SIZE_STYLES = {
  sm: { container: { paddingVertical: spacing.xs + 2, paddingHorizontal: spacing.sm + 2 }, label: { fontSize: fontSize.sm }, iconSize: 14 },
  md: { container: { paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md }, label: { fontSize: fontSize.md }, iconSize: 16 },
  lg: { container: { paddingVertical: spacing.md + 1, paddingHorizontal: spacing.lg }, label: { fontSize: fontSize.lg }, iconSize: 20 },
};

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
  },
  icon: {
    marginRight: spacing.xs + 2,
  },
  label: {
    fontFamily: fonts.bold,
  },
  disabled: {
    opacity: 0.4,
  },
});
