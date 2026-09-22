import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGameStore } from "../../state/gameStore";
import Card from "../../components/Card";
import { MIN_AGE_CONVERSATION } from "../../engine/lifeStage";
import { colors, fonts, fontSize, radii, spacing } from "../../theme";
import { tabStyles } from "./sharedStyles";

const RELATION_META: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  mother: { label: "Mother", icon: "woman" },
  father: { label: "Father", icon: "man" },
  sibling: { label: "Sibling", icon: "people" },
  friend: { label: "Friend", icon: "happy" },
  partner: { label: "Partner", icon: "heart" },
  child: { label: "Child", icon: "body" },
  ex: { label: "Ex", icon: "flame" },
};

export default function PeopleTab({ onOpenThread }: { onOpenThread: (relationshipId: string) => void }) {
  const character = useGameStore((s) => s.character);
  const spendTimeWith = useGameStore((s) => s.spendTimeWith);
  const haveConversation = useGameStore((s) => s.haveConversation);

  if (!character) return null;

  const relationships = character.relationships.filter((r) => r.alive);

  return (
    <ScrollView contentContainerStyle={tabStyles.scroll}>
      <Card>
        <Text style={tabStyles.sectionTitle}>Relationships</Text>
        {relationships.length === 0 && <Text style={tabStyles.logLine}>No one in your life yet.</Text>}
        {relationships.map((r) => {
          const meta = RELATION_META[r.type] ?? { label: r.type, icon: "person" as const };
          return (
            <View key={r.id} style={styles.relBlock}>
              <View style={styles.relRow}>
                <View style={styles.relNameWrap}>
                  <Ionicons name={meta.icon} size={14} color={colors.textSecondary} />
                  <Text style={styles.relName}>
                    {r.name} <Text style={styles.relType}>({meta.label})</Text>
                  </Text>
                </View>
                <Text style={styles.relLevel}>{Math.round(r.level)}</Text>
              </View>
              <View style={styles.relActions}>
                {r.type === "ex" ? (
                  <TouchableOpacity accessibilityRole="button" activeOpacity={0.7} style={styles.relActionBtn} onPress={() => onOpenThread(r.id)}>
                    <Ionicons name="chatbubble-ellipses" size={14} color={colors.textPrimary} />
                    <Text style={styles.relActionText}>Messages</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity accessibilityRole="button" activeOpacity={0.7} style={styles.relActionBtn} onPress={() => spendTimeWith(r.id)}>
                      <Ionicons name="time" size={14} color={colors.textPrimary} />
                      <Text style={styles.relActionText}>Spend Time</Text>
                    </TouchableOpacity>
                    {character.age >= MIN_AGE_CONVERSATION && (
                      <TouchableOpacity accessibilityRole="button" activeOpacity={0.7} style={styles.relActionBtn} onPress={() => haveConversation(r.id)}>
                        <Ionicons name="chatbox" size={14} color={colors.textPrimary} />
                        <Text style={styles.relActionText}>Talk</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity accessibilityRole="button" activeOpacity={0.7} style={styles.relIconBtn} onPress={() => onOpenThread(r.id)}>
                      <Ionicons name="chatbubble-ellipses" size={16} color={colors.textPrimary} />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          );
        })}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  relBlock: {
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  relRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  relNameWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  relName: {
    color: colors.textPrimary,
    fontFamily: fonts.semiBold,
    fontSize: fontSize.base,
  },
  relType: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
  },
  relLevel: {
    color: colors.primary,
    fontSize: fontSize.base,
    fontFamily: fonts.bold,
  },
  relActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  relActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.surfaceRaised,
    paddingVertical: 7,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radii.sm,
  },
  relIconBtn: {
    backgroundColor: colors.surfaceRaised,
    paddingVertical: 7,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radii.sm,
  },
  relActionText: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontFamily: fonts.semiBold,
  },
});
