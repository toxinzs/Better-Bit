import React, { useState } from "react";
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useGameStore } from "../state/gameStore";
import EventModal from "../components/EventModal";
import TextThreadModal from "../components/TextThreadModal";
import LifeTab from "./tabs/LifeTab";
import PeopleTab from "./tabs/PeopleTab";
import CareerTab from "./tabs/CareerTab";

type Tab = "life" | "people" | "career";

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "life", label: "Life", icon: "📋" },
  { key: "people", label: "People", icon: "👥" },
  { key: "career", label: "Career", icon: "💼" },
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
        <Text style={styles.name}>
          {character.firstName} {character.lastName}
        </Text>
        <Text style={styles.meta}>
          Age {character.age} · {character.job ? character.job.title : "Unemployed"} · $
          {character.money.toLocaleString()}
        </Text>
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
              style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
              onPress={() => setTab(t.key)}
            >
              <Text style={styles.tabIcon}>{t.icon}</Text>
              <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity accessibilityRole="button" style={styles.ageBtn} onPress={ageUp}>
          <Text style={styles.ageBtnText}>Age Up →</Text>
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
    backgroundColor: "#12121c",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a3a",
  },
  name: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
  },
  meta: {
    fontSize: 13,
    color: "#aaa",
    marginTop: 2,
  },
  tabContent: {
    flex: 1,
  },
  bottomArea: {
    backgroundColor: "#0e0e16",
    borderTopWidth: 1,
    borderTopColor: "#2a2a3a",
    paddingTop: 8,
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  tabBar: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#181824",
  },
  tabBtnActive: {
    backgroundColor: "#232336",
  },
  tabIcon: {
    fontSize: 16,
  },
  tabLabel: {
    fontSize: 11,
    color: "#888",
    marginTop: 2,
    fontWeight: "600",
  },
  tabLabelActive: {
    color: "#fff",
  },
  ageBtn: {
    backgroundColor: "#2ecc71",
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: "center",
  },
  ageBtnText: {
    color: "#0b1a10",
    fontSize: 14,
    fontWeight: "800",
  },
});
