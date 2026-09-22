import React, { useEffect, useRef, useState } from "react";
import { Animated, Pressable, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGameStore } from "../state/gameStore";
import EventModal from "../components/EventModal";
import TextThreadModal from "../components/TextThreadModal";
import LifeTab from "./tabs/LifeTab";
import PeopleTab from "./tabs/PeopleTab";
import CareerTab from "./tabs/CareerTab";
import AssetsTab from "./tabs/AssetsTab";
import { colors, fonts, fontSize, radii, spacing } from "../theme";
import { playSound } from "../sound";

type Tab = "life" | "people" | "career" | "assets";

const TABS: { key: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "life", label: "Life", icon: "pulse" },
  { key: "people", label: "People", icon: "people" },
  { key: "career", label: "Career", icon: "briefcase" },
  { key: "assets", label: "Money", icon: "wallet" },
];

export default function HomeScreen() {
  const character = useGameStore((s) => s.character);
  const worldState = useGameStore((s) => s.worldState);
  const pendingEvent = useGameStore((s) => s.pendingEvent);
  const ageUp = useGameStore((s) => s.ageUp);
  const chooseEventOption = useGameStore((s) => s.chooseEventOption);
  const textRelationship = useGameStore((s) => s.textRelationship);
  const callRelationship = useGameStore((s) => s.callRelationship);
  const bootyCall = useGameStore((s) => s.bootyCall);
  const sendGift = useGameStore((s) => s.sendGift);
  const [tab, setTab] = useState<Tab>("life");
  const [viewingThreadId, setViewingThreadId] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }, [tab, fadeAnim]);

  const ageScale = useRef(new Animated.Value(1)).current;
  const prevAge = useRef(character?.age);
  useEffect(() => {
    if (character && prevAge.current !== character.age) {
      ageScale.setValue(1.4);
      Animated.spring(ageScale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
      prevAge.current = character.age;
    }
  }, [character?.age, ageScale]);

  const ageBtnScale = useRef(new Animated.Value(1)).current;
  const ageBtnPressIn = () => Animated.spring(ageBtnScale, { toValue: 0.96, friction: 5, useNativeDriver: true }).start();
  const ageBtnPressOut = () => Animated.spring(ageBtnScale, { toValue: 1, friction: 4, useNativeDriver: true }).start();

  const handleAgeUp = () => {
    ageUp();
    const after = useGameStore.getState().character;
    playSound(after && !after.alive ? "gameOver" : "ageUp");
  };

  const handleChoose = (choiceIndex: number) => {
    playSound("choice");
    chooseEventOption(choiceIndex);
  };

  if (!character) return null;

  const viewingThread = character.relationships.find((r) => r.id === viewingThreadId);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.name}>
            {character.firstName} {character.lastName}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>Age </Text>
            <Animated.Text style={[styles.metaText, styles.ageValue, { transform: [{ scale: ageScale }] }]}>
              {character.age}
            </Animated.Text>
            <Text style={styles.metaDivider}>·</Text>
            <Text style={styles.metaText}>{character.job ? character.job.title : "Unemployed"}</Text>
          </View>
        </View>
        <View style={styles.moneyPill}>
          <Ionicons name="cash" size={14} color={colors.primary} />
          <Text style={styles.moneyText}>${character.money.toLocaleString()}</Text>
        </View>
      </View>

      <Animated.View style={[styles.tabContent, { opacity: fadeAnim }]}>
        {tab === "life" && <LifeTab />}
        {tab === "people" && <PeopleTab onOpenThread={setViewingThreadId} />}
        {tab === "career" && <CareerTab />}
        {tab === "assets" && <AssetsTab />}
      </Animated.View>

      <View style={styles.bottomArea}>
        <View style={styles.tabBar}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.key}
              accessibilityRole="button"
              activeOpacity={0.7}
              style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
              onPress={() => setTab(t.key)}
            >
              <Ionicons name={t.icon} size={18} color={tab === t.key ? colors.primary : colors.textMuted} />
              <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Pressable accessibilityRole="button" onPress={handleAgeUp} onPressIn={ageBtnPressIn} onPressOut={ageBtnPressOut}>
          <Animated.View style={[styles.ageBtn, { transform: [{ scale: ageBtnScale }] }]}>
            <Text style={styles.ageBtnText}>Age Up</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.primaryText} />
          </Animated.View>
        </Pressable>
      </View>

      {pendingEvent && (
        <EventModal key={pendingEvent.id} event={pendingEvent} character={character} world={worldState} onChoose={handleChoose} />
      )}

      {viewingThread && (
        <TextThreadModal
          relationship={viewingThread}
          money={character.money}
          onText={() => { playSound("sent"); textRelationship(viewingThread.id); }}
          onCall={() => { playSound("sent"); callRelationship(viewingThread.id); }}
          onBootyCall={() => { playSound("sent"); bootyCall(viewingThread.id); }}
          onSendGift={(amount) => { playSound("sent"); sendGift(viewingThread.id, amount); }}
          onClose={() => setViewingThreadId(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm + 2,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  name: {
    fontSize: fontSize.xl,
    fontFamily: fonts.extraBold,
    color: colors.textPrimary,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  metaText: {
    fontSize: fontSize.md,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  ageValue: {
    fontFamily: fonts.bold,
    color: colors.textPrimary,
  },
  metaDivider: {
    color: colors.textMuted,
    marginHorizontal: 6,
  },
  moneyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  moneyText: {
    color: colors.primary,
    fontFamily: fonts.bold,
    fontSize: fontSize.md,
  },
  tabContent: {
    flex: 1,
  },
  bottomArea: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm + 2,
  },
  tabBar: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: "transparent",
  },
  tabBtnActive: {
    backgroundColor: colors.surfaceRaised,
  },
  tabLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 3,
    fontFamily: fonts.semiBold,
  },
  tabLabelActive: {
    color: colors.primary,
  },
  ageBtn: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  ageBtnText: {
    color: colors.primaryText,
    fontSize: fontSize.lg,
    fontFamily: fonts.extraBold,
  },
});
