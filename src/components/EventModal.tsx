import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Character, LifeEvent, WorldState } from "../types";
import { colors, fonts, fontSize, radii, spacing } from "../theme";
import ModalBase from "./ModalBase";
import { FadeInUp } from "../motion";
import { PersonAvatar } from "./Avatar";
import { ageOf } from "../engine/people";

// On web the modal auto-focuses its first focusable child - the scroll area -
// and Chrome draws a white focus ring around it.
const noFocusRing = { outlineStyle: "none", outlineWidth: 0 } as object;

// Cap the stagger so a 9-choice popup doesn't take two seconds to finish
// appearing.
const stagger = (i: number) => 260 + Math.min(i, 5) * 80;

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
  const { height } = useWindowDimensions();
  const whoId = typeof event.who === "function" ? event.who(character) : event.who;
  const who = whoId ? character.relationships.find((r) => r.id === whoId) : undefined;

  return (
    <ModalBase icon={who || event.banner ? undefined : "sparkles"}>
      {event.banner && (
        <View style={styles.banner}>
          <View style={styles.bannerIcon}>
            <Ionicons name={(event.banner.icon as keyof typeof Ionicons.glyphMap) ?? "briefcase"} size={20} color={colors.smarts} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle} numberOfLines={1}>
              {event.banner.title}
            </Text>
            {event.banner.subtitle ? (
              <Text style={styles.whoSub} numberOfLines={1}>
                {event.banner.subtitle}
              </Text>
            ) : null}
          </View>
          {event.banner.step ? (
            <View style={styles.stepChip}>
              <Text style={styles.stepText}>{event.banner.step}</Text>
            </View>
          ) : null}
        </View>
      )}
      {who && (
        <View style={styles.whoRow}>
          <View style={styles.whoAvatar}>
            <PersonAvatar name={who.name} id={who.id} type={who.type} gender={who.gender} region={character.originRegion} age={ageOf(character, who)} size={44} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.whoName} numberOfLines={1}>
              {who.name}
            </Text>
            <Text style={styles.whoSub}>
              {who.type[0].toUpperCase() + who.type.slice(1)} · {ageOf(character, who)}
              {who.alive ? "" : " · deceased"}
            </Text>
          </View>
        </View>
      )}
      <ScrollView style={[{ maxHeight: height * 0.62 }, noFocusRing]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.text}>{event.text(character, world)}</Text>
        <View style={styles.choices}>
          {event.choices?.map((choice, i) => {
            const danger = choice.tone === "danger";
            const good = choice.tone === "good";
            return (
              <FadeInUp key={i} delay={stagger(i)} distance={10}>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !!choice.disabled }}
                  disabled={choice.disabled}
                  activeOpacity={0.7}
                  style={[
                    styles.choiceBtn,
                    danger && { borderColor: colors.danger + "88" },
                    good && { borderColor: colors.primary + "88" },
                    choice.disabled && { opacity: 0.4 },
                  ]}
                  onPress={() => onChoose(i)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.choiceText, danger && { color: colors.danger }]}>{choice.label}</Text>
                    {choice.sublabel ? <Text style={styles.choiceSub}>{choice.sublabel}</Text> : null}
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </FadeInUp>
            );
          })}
        </View>
      </ScrollView>
    </ModalBase>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  bannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.smarts + "22",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.extraBold,
    fontSize: fontSize.lg,
  },
  stepChip: {
    backgroundColor: colors.smarts + "22",
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  stepText: {
    color: colors.smarts,
    fontFamily: fonts.bold,
    fontSize: fontSize.xs,
  },
  whoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  whoAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  whoName: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: fontSize.base,
  },
  whoSub: {
    color: colors.textSecondary,
    fontFamily: fonts.semiBold,
    fontSize: fontSize.sm,
  },
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
  },
  choiceSub: {
    color: colors.textSecondary,
    fontFamily: fonts.semiBold,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
});
