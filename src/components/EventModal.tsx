import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Character, LifeEvent, WorldState } from "../types";
import { colors, fonts, fontSize, radii, spacing } from "../theme";
import ModalBase from "./ModalBase";
import { FadeInUp } from "../motion";

export default function EventModal({
  event,
  character,
  world,
  onChoose,
}: {
  event: LifeEvent;
  character: Character;
  world: WorldState;
  onChoose: (choiceIndex: number) => void;
}) {
  return (
    <ModalBase icon="sparkles">
      <Text style={styles.text}>{event.text(character, world)}</Text>
      <View style={styles.choices}>
        {event.choices?.map((choice, i) => (
          <FadeInUp key={i} delay={260 + i * 90} distance={10}>
            <TouchableOpacity
              accessibilityRole="button"
              activeOpacity={0.7}
              style={styles.choiceBtn}
              onPress={() => onChoose(i)}
            >
              <Text style={styles.choiceText}>{choice.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </FadeInUp>
        ))}
      </View>
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
  choices: {
    gap: spacing.sm,
  },
  choiceBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
  },
  choiceText: {
    color: colors.textPrimary,
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    flex: 1,
  },
});
