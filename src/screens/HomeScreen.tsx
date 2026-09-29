import React, { useEffect, useRef, useState } from "react";
import { Animated, Pressable, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGameStore } from "../state/gameStore";
import EventModal from "../components/EventModal";
import TextThreadModal from "../components/TextThreadModal";
import ActionResultModal from "../components/ActionResultModal";
import NameBabyModal from "../components/NameBabyModal";
import Avatar, { moodFor } from "../components/Avatar";
import { Confetti, CountUp, FadeInUp, FloatingDelta, Pop } from "../motion";
import GradientBg from "../components/GradientBg";
import StatStrip from "../components/StatStrip";
import ThemePicker from "../components/ThemePicker";
import LifeTab from "./tabs/LifeTab";
import PeopleTab from "./tabs/PeopleTab";
import AssetsTab from "./tabs/AssetsTab";
import WorkTab from "./tabs/WorkTab";
import DoTab from "./tabs/DoTab";
import { getRegion } from "../data/regions";
import { colors, fonts, fontSize, radii, spacing } from "../theme";
import { playSound } from "../sound";

const MILESTONES: Record<number, string> = {
  1: "Happy 1st birthday!",
  5: "Off to school!",
  10: "Double digits!",
  13: "You're a teenager!",
  16: "Sweet sixteen!",
  18: "You're an adult now!",
  21: "Twenty-one!",
  25: "A quarter century!",
  30: "Thirty!",
  40: "Forty!",
  50: "Fifty and fabulous!",
  60: "Sixty!",
  65: "Retirement age!",
  70: "Seventy years!",
  80: "Eighty!",
  90: "Ninety!",
  100: "A whole century!",
};

type Tab = "life" | "do" | "people" | "work" | "money";

const TABS: { key: Tab; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { key: "life", label: "Life", icon: "pulse", color: colors.health },
  { key: "do", label: "Activities", icon: "sparkles", color: colors.happiness },
  { key: "people", label: "People", icon: "people", color: colors.looks },
  { key: "work", label: "Work", icon: "briefcase", color: colors.smarts },
  { key: "money", label: "Money", icon: "wallet", color: colors.primary },
];

export default function HomeScreen() {
  const character = useGameStore((s) => s.character);
  const worldState = useGameStore((s) => s.worldState);
  const pendingEvent = useGameStore((s) => s.pendingEvent);
  const actionResultLines = useGameStore((s) => s.actionResultLines);
  const clearActionResult = useGameStore((s) => s.clearActionResult);
  const nameBaby = useGameStore((s) => s.nameBaby);
  const ageUp = useGameStore((s) => s.ageUp);
  const chooseEventOption = useGameStore((s) => s.chooseEventOption);
  const [tab, setTab] = useState<Tab>("life");
  const [viewingThreadId, setViewingThreadId] = useState<string | null>(null);
  const [showThemes, setShowThemes] = useState(false);
  const [confetti, setConfetti] = useState(0);
  const [milestone, setMilestone] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(0);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 1, friction: 9, tension: 70, useNativeDriver: true }),
    ]).start();
  }, [tab, fadeAnim, slideAnim]);

  const ageScale = useRef(new Animated.Value(1)).current;
  const prevAge = useRef(character?.age);
  useEffect(() => {
    if (character && prevAge.current !== character.age) {
      ageScale.setValue(1.4);
      Animated.spring(ageScale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
      prevAge.current = character.age;
      const label = MILESTONES[character.age];
      if (label && character.alive) {
        setMilestone(label);
        setConfetti((n) => n + 1);
      } else {
        setMilestone(null);
      }
    }
  }, [character?.age, ageScale]);

  // dismiss the banner on its own timer, independent of the age effect, so
  // aging again can't strand it on screen
  useEffect(() => {
    if (!milestone) return;
    const t = setTimeout(() => setMilestone(null), 2600);
    return () => clearTimeout(t);
  }, [milestone]);

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
  const region = getRegion(character.originRegion);
  const activeTab = TABS.find((t) => t.key === tab)!;

  return (
    <SafeAreaView style={styles.container}>
      <GradientBg id="homeHeader" from={colors.gradHeader} to={colors.surface} radius={0} vertical style={styles.header}>
        <View style={styles.identityRow}>
          <View style={styles.avatarRing}>
            <Pop trigger={character.age} strength={1.18}>
              <Avatar character={character} size={50} mood={moodFor(character.stats.happiness)} />
            </Pop>
          </View>
          <View style={styles.identityText}>
            <Text style={styles.name} numberOfLines={1}>
              {character.firstName} {character.lastName}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>Age </Text>
              <Animated.Text style={[styles.metaText, styles.ageValue, { transform: [{ scale: ageScale }] }]}>
                {character.age}
              </Animated.Text>
              <Text style={styles.metaDivider}>·</Text>
              <Text style={styles.metaText} numberOfLines={1}>
                {character.inJail ? "Incarcerated" : character.job ? character.job.title : character.inCollege ? "Student" : "Unemployed"}
              </Text>
            </View>
            <Text style={styles.regionText}>{region.label}</Text>
          </View>
          <View style={styles.moneyPill}>
            <Ionicons name="cash" size={14} color={colors.primary} />
            <CountUp value={character.money} style={styles.moneyText} />
            <FloatingDelta
              value={character.money}
              format={(d) => `${d > 0 ? "+" : "-"}$${Math.abs(d).toLocaleString()}`}
              style={styles.moneyDelta}
            />
          </View>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Change theme" activeOpacity={0.7} style={styles.themeBtn} onPress={() => setShowThemes(true)}>
            <Ionicons name="color-palette" size={17} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </GradientBg>
      <StatStrip stats={character.stats} />

      <Animated.View
        style={[
          styles.tabContent,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] },
        ]}
      >
        {tab === "life" && <LifeTab />}
        {tab === "do" && <DoTab />}
        {tab === "people" && <PeopleTab onOpenThread={setViewingThreadId} />}
        {tab === "work" && <WorkTab initial={character.inCollege || character.age < 18 ? "school" : "job"} />}
        {tab === "money" && <AssetsTab />}
      </Animated.View>

      <View style={styles.bottomArea}>
        <Pressable accessibilityRole="button" onPress={handleAgeUp} onPressIn={ageBtnPressIn} onPressOut={ageBtnPressOut}>
          <Animated.View style={{ transform: [{ scale: ageBtnScale }] }}>
            <GradientBg id="ageBtn" from={colors.primary} to={colors.primaryDeep} radius={radii.lg} style={styles.ageBtn}>
              <View style={styles.ageBtnInner}>
                <Text style={styles.ageBtnText}>Age Up</Text>
                <View style={styles.ageBtnPill}>
                  <Pop trigger={character.age}>
                    <Text style={styles.ageBtnPillText}>{character.age + 1}</Text>
                  </Pop>
                  <Ionicons name="arrow-forward" size={14} color={colors.primaryText} />
                </View>
              </View>
            </GradientBg>
          </Animated.View>
        </Pressable>
        <View style={styles.tabBar}>
          {TABS.map((t) => (
            <TabButton key={t.key} tab={t} active={tab === t.key} activeColor={activeTab.color} onPress={() => setTab(t.key)} />
          ))}
        </View>
      </View>

      {confetti > 0 && <Confetti key={confetti} />}
      {milestone && (
        <FadeInUp key={milestone} distance={-18} style={styles.milestone}>
          <Ionicons name="gift" size={16} color={colors.gold} />
          <Text style={styles.milestoneText}>{milestone}</Text>
        </FadeInUp>
      )}

      {showThemes && <ThemePicker onClose={() => setShowThemes(false)} />}

      {character.pendingBabyId ? (
        <NameBabyModal onSubmit={nameBaby} />
      ) : pendingEvent ? (
        <EventModal key={pendingEvent.id} event={pendingEvent} character={character} world={worldState} onChoose={handleChoose} />
      ) : actionResultLines ? (
        <ActionResultModal lines={actionResultLines} onClose={clearActionResult} />
      ) : null}

      {viewingThread && (
        <TextThreadModal relationship={viewingThread} onClose={() => setViewingThreadId(null)} />
      )}
    </SafeAreaView>
  );
}

function TabButton({
  tab,
  active,
  activeColor,
  onPress,
}: {
  tab: (typeof TABS)[number];
  active: boolean;
  activeColor: string;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (active) {
      scale.setValue(0.78);
      Animated.spring(scale, { toValue: 1, friction: 3.5, tension: 160, useNativeDriver: true }).start();
    }
  }, [active, scale]);
  return (
    <TouchableOpacity accessibilityRole="button" activeOpacity={0.7} style={styles.tabBtn} onPress={onPress}>
      <Animated.View style={[styles.tabIcon, active && { backgroundColor: tab.color + "26" }, { transform: [{ scale }] }]}>
        <Ionicons name={tab.icon} size={22} color={active ? tab.color : colors.textMuted} />
      </Animated.View>
      <Text style={[styles.tabLabel, active && { color: activeColor }]}>{tab.label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  moneyDelta: {
    right: 6,
    top: -14,
  },
  milestone: {
    position: "absolute",
    top: 92,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.gold + "88",
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    zIndex: 60,
  },
  milestoneText: {
    color: colors.textPrimary,
    fontFamily: fonts.extraBold,
    fontSize: fontSize.base,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  identityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  avatarRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 2,
    borderColor: colors.primary + "88",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  identityText: {
    flex: 1,
  },
  name: {
    fontSize: fontSize.xl,
    fontFamily: fonts.extraBold,
    color: colors.textPrimary,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 1,
  },
  metaText: {
    fontSize: fontSize.md,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  ageValue: {
    fontFamily: fonts.extraBold,
    color: colors.textPrimary,
  },
  metaDivider: {
    color: colors.textMuted,
    marginHorizontal: 6,
  },
  regionText: {
    fontSize: fontSize.xs,
    fontFamily: fonts.semiBold,
    color: colors.textMuted,
    marginTop: 1,
    letterSpacing: 0.4,
  },
  moneyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.primaryDark,
    borderWidth: 1,
    borderColor: colors.primary + "55",
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radii.pill,
  },
  moneyText: {
    color: colors.primary,
    fontFamily: fonts.extraBold,
    fontSize: fontSize.base,
  },
  themeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  tabContent: {
    flex: 1,
  },
  bottomArea: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
  ageBtn: {
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    ...{ shadowColor: colors.primary, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  },
  ageBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ageBtnText: {
    color: colors.primaryText,
    fontSize: fontSize.xl,
    fontFamily: fonts.extraBold,
  },
  ageBtnPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.shade,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
  },
  ageBtnPillText: {
    color: colors.primaryText,
    fontFamily: fonts.extraBold,
    fontSize: fontSize.lg,
  },
  tabBar: {
    flexDirection: "row",
    marginTop: spacing.sm,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  tabIcon: {
    width: 46,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
    fontFamily: fonts.bold,
  },
});
