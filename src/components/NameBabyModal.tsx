import React, { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity } from "react-native";
import { colors, fonts, fontSize, radii, spacing } from "../theme";
import ModalBase from "./ModalBase";

// A real naming prompt for a just-born baby, instead of it just being
// "Your child" - shown whenever character.pendingBabyId is set (see
// ageUp()'s pregnancy-to-birth step and gameStore.ts's nameBaby action).
export default function NameBabyModal({ onSubmit }: { onSubmit: (name: string) => void }) {
  const [name, setName] = useState("");

  return (
    <ModalBase icon="happy">
      <Text style={styles.text}>Your baby was born! What do you want to name them?</Text>
      <TextInput
        style={styles.input}
        placeholder="Baby's name"
        placeholderTextColor={colors.textMuted}
        value={name}
        onChangeText={setName}
        autoFocus
      />
      <TouchableOpacity
        accessibilityRole="button"
        activeOpacity={0.7}
        style={[styles.confirmBtn, !name.trim() && styles.confirmBtnDisabled]}
        disabled={!name.trim()}
        onPress={() => onSubmit(name)}
      >
        <Text style={styles.confirmText}>Name them</Text>
      </TouchableOpacity>
    </ModalBase>
  );
}

const styles = StyleSheet.create({
  text: {
    color: colors.textPrimary,
    fontFamily: fonts.semiBold,
    fontSize: fontSize.xl,
    lineHeight: 26,
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    fontFamily: fonts.regular,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    fontSize: fontSize.lg,
  },
  confirmBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  confirmBtnDisabled: {
    opacity: 0.4,
  },
  confirmText: {
    color: colors.primaryText,
    fontFamily: fonts.bold,
    fontSize: fontSize.base,
  },
});
