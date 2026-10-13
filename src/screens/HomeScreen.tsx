import React, { useEffect, useRef, useState } from "react";
import { creatorLabel } from "../engine/creatorCore";
import { Animated, Platform, Pressable, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGameStore } from "../state/gameStore";
import EventModal from "../components/EventModal";
import TextThreadModal from "../components/TextThreadModal";
import ActionResultModal from "../components/ActionResultModal";
import NameBabyModal from "../components/NameBabyModal";
import NoticeModal from "../components/NoticeModal";
import Avatar, { moodFor } from "../components/Avatar";
import { Confetti, CountUp, FadeInUp, FloatingDelta, Pop } from "../motion";
import GradientBg from "../components/GradientBg";
import StatStrip from "../components/StatStrip";
import LifeTab from "./tabs/LifeTab";
import PeopleHub from "./menus/PeopleHub";
import { ActivitiesHub } from "./menus/ActivityMenus";
import { AssetsHub } from "./menus/AssetMenus";
import { WorkHub } from "./menus/WorkHub";
import MenuHost from "../nav/MenuHost";
import { useNav } from "../nav/navStore";
import { getRegion } from "../data/regions";
import { colors, fonts, fontSize, mixColors, radii, spacing } from "../theme";
import { stageTint } from "../data/stageTint";
import { playSound } from "../sound";
import { settings } from "../settings";
import { cityOf } from "../engine/where";

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
  const dismissNotice = useGameStore((s) => s.dismissNotice);
  const nameBaby = useGameStore((s) => s.nameBaby);
  const ageUp = useGameStore((s) => s.ageUp);
  const chooseEventOption = useGameStore((s) => s.chooseEventOption);
  const [tab, setTab] = useState<Tab>("life");
  const viewingThreadId = useNav((s) => s.thread);
  const setViewingThreadId = useNav((s) => s.setThread);
  const stack = useNav((s) => s.stack);
  const push = useNav((s) => s.push);
  const resetNav = useNav((s) => s.reset);
  const [ffOpen, setFfOpen] = useState(false);
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
  }, [tab, stack.length, fadeAnim, slideAnim]);

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

  // a new life (or a game over) shouldn't inherit the old menu stack
  useEffect(() => () => useNav.setState({ stack: [], thread: null }), []);

  const ageBtnScale = useRef(new Animated.Value(1)).current;
  const ageBtnPressIn = () => Animated.spring(ageBtnScale, { toValue: 0.96, friction: 5, useNativeDriver: true }).start();
  const ageBtnPressOut = () => Animated.spring(ageBtnScale, { toValue: 1, friction: 4, useNativeDriver: true }).start();

  const handleAgeUp = () => {
    ageUp();
    const after = useGameStore.getState().character;
    playSound(after && !after.alive ? "gameOver" : "ageUp");
  };

  const handleAgeMany = (years: number | "event") => {
    setFfOpen(false);
    useGameStore.getState().ageUpMany(years);
    const after = useGameStore.getState().character;
    playSound(after && !after.alive ? "gameOver" : "ageUp");
  };

  const handleChoose = (choiceIndex: number) => {
    playSound("choice");
    chooseEventOption(choiceIndex);
  };

  // keyboard shortcuts on the web: Space ages up, 1-9 choose, Esc backs out, QWERT switch tabs
  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const TAB_KEYS: Record<string, Tab> = { q: "life", w: "do", e: "people", r: "work", t: "money" };
    const onKey = (e: KeyboardEvent) => {
      if (!settings.shortcuts || e.ctrlKey || e.metaKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      const onButton = !!el && el.getAttribute?.("role") === "button";
      const st = useGameStore.getState();
      const c = st.character;
      if (!c || st.screen !== "home") return;
      const confirm = e.key === "Enter" || e.key === " ";
      if (e.key === "Escape") {
        if ((c.notices ?? []).length > 0 && !c.pendingBabyId) st.dismissNotice(c.notices![0].id);
        else if (!st.pendingEvent && !c.pendingBabyId && st.actionResultLines) st.clearActionResult();
        else if (!st.pendingEvent && !c.pendingBabyId && useNav.getState().thread) useNav.getState().setThread(null);
        else if (!st.pendingEvent && !c.pendingBabyId) useNav.getState().pop();
        return;
      }
      if ((c.notices ?? []).length > 0 && !c.pendingBabyId) {
        if (confirm && !onButton) { e.preventDefault(); st.dismissNotice(c.notices![0].id); }
        return;
      }
      if (c.pendingBabyId) return;
      if (st.pendingEvent) {
        const n = Number(e.key);
        const choice = Number.isInteger(n) && n >= 1 ? st.pendingEvent.choices?.[n - 1] : undefined;
        if (choice && !choice.disabled) { e.preventDefault(); playSound("choice"); st.chooseEventOption(n - 1); }
        else if (confirm && !onButton && st.pendingEvent.choices?.length === 1 && !st.pendingEvent.choices[0].disabled) { e.preventDefault(); st.chooseEventOption(0); }
        return;
      }
      if (st.actionResultLines) {
        if (confirm && !onButton) { e.preventDefault(); st.clearActionResult(); }
        return;
      }
      if (useNav.getState().thread) return;
      const t = TAB_KEYS[e.key.toLowerCase()];
      if (t) { useNav.getState().reset(); setTab(t); return; }
      if (confirm && !onButton && useNav.getState().stack.length === 0) {
        e.preventDefault();
        st.ageUp();
        const after = useGameStore.getState().character;
        playSound(after && !after.alive ? "gameOver" : "ageUp");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!character) return null;

  const viewingThread = character.relationships.find((r) => r.id === viewingThreadId);
  const region = getRegion(character.originRegion);
  const activeTab = TABS.find((t) => t.key === tab)!;

  return (
    <SafeAreaView style={styles.container}>
      <GradientBg id="homeHeader" from={mixColors(colors.gradHeader, stageTint(character.age), colors.mode === "light" ? 0.22 : 0.3)} to={colors.surface} radius={0} vertical style={styles.header}>
        <View style={styles.identityRow}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Open profile" activeOpacity={0.8} style={styles.avatarRing} onPress={() => push("profile")}>
            <Pop trigger={character.age} strength={1.18}>
              <Avatar character={character} size={50} mood={moodFor(character.stats.happiness)} />
            </Pop>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" activeOpacity={0.8} style={styles.identityText} onPress={() => push("profile")}>
            <Text style={styles.name} numberOfLines={1}>
              {character.firstName} {character.lastName}
            </Text>
            <View style={styles.metaRow}>
              <Text style={[styles.metaText, { marginRight: 3 }]}>Age</Text>
              <Animated.Text style={[styles.metaText, styles.ageValue, { transform: [{ scale: ageScale }] }]}>
                {character.age}
              </Animated.Text>
              <Text style={styles.metaDivider}>·</Text>
              <Text style={styles.metaText} numberOfLines={1}>
                {character.inJail ? "Incarcerated" : character.job ? character.job.title : creatorLabel(character) ?? (character.inCollege ? "Student" : "Unemployed")}
              </Text>
            </View>
            <Text style={styles.regionText}>{cityOf(character).name}, {region.label}</Text>
          </TouchableOpacity>
          <View style={styles.moneyPill}>
            <Ionicons name="cash" size={14} color={colors.primary} />
            <CountUp value={character.money} style={styles.moneyText} />
            <FloatingDelta
              value={character.money}
              format={(d) => `${d > 0 ? "+" : "-"}$${Math.abs(d).toLocaleString()}`}
              style={styles.moneyDelta}
            />
          </View>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Settings" activeOpacity={0.7} style={styles.themeBtn} onPress={() => push("settings")}>
            <Ionicons name="settings" size={17} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </GradientBg>
      <StatStrip stats={character.stats} onPressStat={(stat) => push("statDetail", { stat })} />

      <Animated.View
        style={[
          styles.tabContent,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] },
        ]}
      >
        {stack.length > 0 ? (
          <MenuHost route={stack[stack.length - 1]} />
        ) : (
          <>
            {tab === "life" && <LifeTab />}
            {tab === "do" && <ActivitiesHub />}
            {tab === "people" && <PeopleHub />}
            {tab === "work" && <WorkHub />}
            {tab === "money" && <AssetsHub />}
          </>
        )}
      </Animated.View>

      <View style={styles.bottomArea}>
        {ffOpen ? (
          <FadeInUp distance={8} duration={180} style={styles.ffRow}>
            {([[5, "+5 years"], [10, "+10 years"], ["event", "Until something happens"]] as [number | "event", string][]).map(([v, label]) => (
              <TouchableOpacity key={String(v)} accessibilityRole="button" activeOpacity={0.75} style={styles.ffChip} onPress={() => handleAgeMany(v)}>
                <Ionicons name="play-forward" size={13} color={colors.primary} />
                <Text style={styles.ffText}>{label}</Text>
              </TouchableOpacity>
            ))}
          </FadeInUp>
        ) : null}
        <View style={styles.ageRow}>
          <Pressable accessibilityRole="button" style={{ flex: 1 }} onPress={handleAgeUp} onPressIn={ageBtnPressIn} onPressOut={ageBtnPressOut}>
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
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Age up several years" activeOpacity={0.75} style={[styles.ffBtn, ffOpen && { borderColor: colors.primary }]} onPress={() => setFfOpen((v) => !v)}>
            <Ionicons name={ffOpen ? "close" : "play-forward"} size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.tabBar}>
          {TABS.map((t) => (
            <TabButton key={t.key} tab={t} badge={t.key === "do" ? (character.social?.inbox.length ?? 0) + (character.social?.crisis ? 1 : 0) : 0} active={tab === t.key} activeColor={activeTab.color} onPress={() => {
              resetNav();
              setTab(t.key);
            }}
            />
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

      {(character.notices ?? []).length > 0 && !character.pendingBabyId ? (
        <NoticeModal key={character.notices![0].id} notice={character.notices![0]} remaining={character.notices!.length - 1} onClose={() => dismissNotice(character.notices![0].id)} />
      ) : character.pendingBabyId ? (
        <NameBabyModal baby={character.relationships.find((r) => r.id === character.pendingBabyId)} character={character} onSubmit={nameBaby} />
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
  badge = 0,
  onPress,
}: {
  tab: (typeof TABS)[number];
  active: boolean;
  activeColor: string;
  badge?: number;
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
        {badge > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 9 ? "9+" : badge}</Text>
          </View>
        ) : null}
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
  ageRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: spacing.sm,
  },
  ffBtn: {
    width: 54,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  ffRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  ffChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primaryDark,
    borderWidth: 1,
    borderColor: colors.primary + "55",
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.pill,
  },
  ffText: {
    color: colors.primary,
    fontFamily: fonts.bold,
    fontSize: fontSize.md,
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
  badge: {
    position: "absolute",
    top: -3,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#ffffff",
    fontFamily: fonts.extraBold,
    fontSize: 10,
  },
  tabLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
    fontFamily: fonts.bold,
  },
});
