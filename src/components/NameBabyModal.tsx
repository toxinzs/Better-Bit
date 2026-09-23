import React, { useState } from "react";
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, fontSize, radii, spacing } from "../theme";

// A real naming prompt for a just-born baby, instead of it just being
// "Your child" - shown whenever character.pendingBabyId is set (see
// ageUp()'s pregnancy-to-birth step and gameStore.ts's nameBaby action).
export default function NameBabyModal({ onSubmit }: { onSubmit: (name: string) => void }) {
  const [name, setName] = useState("");

  return (
    <Modal transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.badge}>
            <Ionicons name="happy" size={20} color={colors.gold} />
          </View>
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
        </View>
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
