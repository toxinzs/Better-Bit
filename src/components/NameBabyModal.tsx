import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Character, Relationship } from "../types";
import { colors, fonts, fontSize, radii, spacing } from "../theme";
import { randomFirstName } from "../data/names";
import ModalBase from "./ModalBase";
import { PersonAvatar } from "./Avatar";

// A real naming prompt for a just-born baby - shown whenever
// character.pendingBabyId is set (see tickPregnancy() and the store's
// nameBaby action). It announces the baby's gender and offers a few names
// from your region's name pool to pick from (or type your own).
export default function NameBabyModal({
  baby,
  character,
  onSubmit,
}: {
  baby?: Relationship;
  character: Character;
  onSubmit: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const [round, setRound] = useState(0);

  const gender = baby?.gender ?? "female";
  const word = gender === "male" ? "boy" : gender === "female" ? "girl" : "baby";
  const her = gender === "male" ? "him" : gender === "female" ? "her" : "them";

  const suggestions = useMemo(() => {
    const out = new Set<string>();
    let guard = 0;
    while (out.size < 6 && guard++ < 60) out.add(randomFirstName(gender, character.originRegion));
    return Array.from(out);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, gender, character.originRegion]);

  return (
    <ModalBase icon="happy">
      <View style={styles.hero}>
        {baby ? (
          <View style={styles.avatar}>
            <PersonAvatar name={baby.name} id={baby.id} type="child" gender={baby.gender} region={character.originRegion} size={54} />
          </View>
        ) : null}
        <Text style={styles.headline}>It's a {word}!</Text>
      </View>
      <Text style={styles.text}>What do you want to name {her}?</Text>

      <View style={styles.chips}>
        {suggestions.map((s) => (
          <TouchableOpacity key={s} accessibilityRole="button" activeOpacity={0.7} style={[styles.chip, name === s && styles.chipOn]} onPress={() => setName(s)}>
            <Text style={[styles.chipText, name === s && { color: colors.primaryText }]}>{s}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="More names" activeOpacity={0.7} style={styles.chip} onPress={() => setRound((n) => n + 1)}>
          <Ionicons name="shuffle" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Or type a name"
        placeholderTextColor={colors.textMuted}
        value={name}
        onChangeText={setName}
      />
      <TouchableOpacity
        accessibilityRole="button"
        activeOpacity={0.7}
        style={[styles.confirmBtn, !name.trim() && styles.confirmBtnDisabled]}
        disabled={!name.trim()}
        onPress={() => onSubmit(name)}
      >
        <Text style={styles.confirmText}>Name {her}</Text>
      </TouchableOpacity>
    </ModalBase>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: "center", marginBottom: spacing.md },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: spacing.sm,
  },
  headline: { color: colors.textPrimary, fontFamily: fonts.extraBold, fontSize: fontSize.xl + 4 },
  text: {
    color: colors.textSecondary,
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, justifyContent: "center", marginBottom: spacing.md },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fontSize.md },
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
  confirmBtnDisabled: { opacity: 0.4 },
  confirmText: { color: colors.primaryText, fontFamily: fonts.bold, fontSize: fontSize.base },
});
