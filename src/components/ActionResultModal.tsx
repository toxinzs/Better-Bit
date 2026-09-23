import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { colors, fonts, fontSize, radii, spacing } from "../theme";
import ModalBase from "./ModalBase";

// The generic "here's what happened" popup - shown after any action that
// pushed new lines to the year's log, instead of the player having to go
// check the Life tab to see what an action actually did. See
// gameStore.ts's applyToCharacter()/applyChained() for how this gets filled.
export default function ActionResultModal({ lines, onClose }: { lines: string[]; onClose: () => void }) {
  return (
    <ModalBase icon="checkmark-circle" iconColor={colors.primary}>
      {lines.map((line, i) => (
        <Text key={i} style={styles.text}>
          {line}
        </Text>
      ))}
      <TouchableOpacity accessibilityRole="button" activeOpacity={0.7} style={styles.closeBtn} onPress={onClose}>
        <Text style={styles.closeText}>Got it</Text>
      </TouchableOpacity>
    </ModalBase>
  );
}

const styles = StyleSheet.create({
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
