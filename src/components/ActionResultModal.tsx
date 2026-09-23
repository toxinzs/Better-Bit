import React, { useEffect, useRef } from "react";
import { Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, fontSize, radii, spacing } from "../theme";

// The generic "here's what happened" popup - shown after any action that
// pushed new lines to the year's log, instead of the player having to go
// check the Life tab to see what an action actually did. See
// gameStore.ts's applyToCharacter()/applyChained() for how this gets filled.
export default function ActionResultModal({ lines, onClose }: { lines: string[]; onClose: () => void }) {
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [scale, opacity]);

  return (
    <Modal transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}>
          <View style={styles.badge}>
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
          </View>
          {lines.map((line, i) => (
            <Text key={i} style={styles.text}>
              {line}
            </Text>
          ))}
          <TouchableOpacity accessibilityRole="button" activeOpacity={0.7} style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>Got it</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    width: "100%",
    maxWidth: 420,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  text: {
    color: colors.textPrimary,
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    lineHeight: 24,
    marginBottom: spacing.sm,
  },
  closeBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  closeText: {
    color: colors.primaryText,
    fontFamily: fonts.bold,
    fontSize: fontSize.base,
  },
});
