import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useGameStore } from "../../state/gameStore";
import { MIN_AGE_CONVERSATION } from "../../engine/lifeStage";
import { tabStyles } from "./sharedStyles";

const RELATION_LABEL: Record<string, string> = {
  mother: "Mother",
  father: "Father",
  sibling: "Sibling",
  friend: "Friend",
  partner: "Partner",
  child: "Child",
  ex: "Ex",
};

export default function PeopleTab({ onOpenThread }: { onOpenThread: (relationshipId: string) => void }) {
  const character = useGameStore((s) => s.character);
  const spendTimeWith = useGameStore((s) => s.spendTimeWith);
  const haveConversation = useGameStore((s) => s.haveConversation);

  if (!character) return null;

  const relationships = character.relationships.filter((r) => r.alive);

  return (
    <ScrollView contentContainerStyle={tabStyles.scroll}>
      <View style={tabStyles.card}>
        <Text style={tabStyles.sectionTitle}>Relationships</Text>
        {relationships.length === 0 && <Text style={tabStyles.logLine}>No one in your life yet.</Text>}
        {relationships.map((r) => (
          <View key={r.id} style={styles.relBlock}>
            <View style={styles.relRow}>
              <Text style={styles.relName}>
                {r.name} ({RELATION_LABEL[r.type] ?? r.type})
              </Text>
              <Text style={styles.relLevel}>{Math.round(r.level)}</Text>
            </View>
            <View style={styles.relActions}>
              {r.type === "ex" ? (
                <TouchableOpacity accessibilityRole="button" style={styles.relActionBtn} onPress={() => onOpenThread(r.id)}>
                  <Text style={styles.relActionText}>💬 Messages</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity accessibilityRole="button" style={styles.relActionBtn} onPress={() => spendTimeWith(r.id)}>
                    <Text style={styles.relActionText}>Spend Time</Text>
                  </TouchableOpacity>
                  {character.age >= MIN_AGE_CONVERSATION && (
                    <TouchableOpacity accessibilityRole="button" style={styles.relActionBtn} onPress={() => haveConversation(r.id)}>
                      <Text style={styles.relActionText}>Talk</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity accessibilityRole="button" style={styles.relActionBtn} onPress={() => onOpenThread(r.id)}>
                    <Text style={styles.relActionText}>💬</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  relBlock: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#26263a",
  },
  relRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  relName: {
    color: "#ddd",
    fontSize: 13,
  },
  relLevel: {
    color: "#7fd6a0",
    fontSize: 13,
    fontWeight: "700",
  },
  relActions: {
    flexDirection: "row",
    gap: 8,
  },
  relActionBtn: {
    backgroundColor: "#232336",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  relActionText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
