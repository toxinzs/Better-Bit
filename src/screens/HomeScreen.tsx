import React, { useState } from "react";
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGameStore } from "../state/gameStore";
import EventModal from "../components/EventModal";
import TextThreadModal from "../components/TextThreadModal";
import LifeTab from "./tabs/LifeTab";
import PeopleTab from "./tabs/PeopleTab";
import CareerTab from "./tabs/CareerTab";
import { colors, fonts, fontSize, radii, spacing } from "../theme";

type Tab = "life" | "people" | "career";

const TABS: { key: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "life", label: "Life", icon: "pulse" },
  { key: "people", label: "People", icon: "people" },
  { key: "career", label: "Career", icon: "briefcase" },
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
            <Text style={styles.metaText}>Age {character.age}</Text>
            <Text style={styles.metaDivider}>·</Text>
            <Text style={styles.metaText}>{character.job ? character.job.title : "Unemployed"}</Text>
          </View>
        </View>
        <View style={styles.moneyPill}>
          <Ionicons name="cash" size={14} color={colors.primary} />
          <Text style={styles.moneyText}>${character.money.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.tabContent}>
        {tab === "life" && <LifeTab />}
        {tab === "people" && <PeopleTab onOpenThread={setViewingThreadId} />}
        {tab === "career" && <CareerTab />}
      </View>

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
        <TouchableOpacity accessibilityRole="button" activeOpacity={0.8} style={styles.ageBtn} onPress={ageUp}>
          <Text style={styles.ageBtnText}>Age Up</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.primaryText} />
        </TouchableOpacity>
      </View>

      {pendingEvent && (
        <EventModal event={pendingEvent} character={character} world={worldState} onChoose={chooseEventOption} />
      )}

      {viewingThread && (
        <TextThreadModal
          relationship={viewingThread}
          money={character.money}
          onText={() => textRelationship(viewingThread.id)}
          onCall={() => callRelationship(viewingThread.id)}
          onBootyCall={() => bootyCall(viewingThread.id)}
          onSendGift={(amount) => sendGift(viewingThread.id, amount)}
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
