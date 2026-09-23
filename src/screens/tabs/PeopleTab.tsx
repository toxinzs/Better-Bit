import React, { useRef, useState } from "react";
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGameStore } from "../../state/gameStore";
import Card from "../../components/Card";
import { Relationship } from "../../types";
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
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  if (!character) return null;

  // Classmates/faculty live in the School tab's own roster instead, so they
  // don't get lost among family/friends/exes here - see engine/school.ts.
  const relationships = character.relationships.filter(
    (r) => r.alive && r.type !== "classmate" && r.type !== "teacher",
  );

  const toggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <ScrollView contentContainerStyle={tabStyles.scroll}>
      <Card>
        <Text style={tabStyles.sectionTitle}>Relationships</Text>
        {relationships.length === 0 && <Text style={tabStyles.logLine}>No one in your life yet.</Text>}
        {relationships.map((r) => (
          <RelationshipRow
            key={r.id}
            r={r}
            expanded={expandedIds.has(r.id)}
            onToggle={() => toggle(r.id)}
            canTalk={character.age >= MIN_AGE_CONVERSATION}
            onSpendTime={() => spendTimeWith(r.id)}
            onTalk={() => haveConversation(r.id)}
            onOpenThread={() => onOpenThread(r.id)}
          />
        ))}
      </Card>
    </ScrollView>
  );
}

function RelationshipRow({
  r,
  expanded,
  onToggle,
  canTalk,
  onSpendTime,
  onTalk,
  onOpenThread,
}: {
  r: Relationship;
  expanded: boolean;
  onToggle: () => void;
  canTalk: boolean;
  onSpendTime: () => void;
  onTalk: () => void;
  onOpenThread: () => void;
}) {
  const meta = RELATION_META[r.type] ?? { label: r.type, icon: "person" as const };
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const chevronAnim = useRef(new Animated.Value(0)).current;

  const handleToggle = () => {
    onToggle();
    Animated.timing(chevronAnim, { toValue: expanded ? 0 : 1, duration: 180, useNativeDriver: true }).start();
    if (!expanded) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }
  };

  return (
    <View style={styles.relBlock}>
      <TouchableOpacity accessibilityRole="button" activeOpacity={0.7} style={styles.relRow} onPress={handleToggle}>
        <View style={styles.relNameWrap}>
          <Ionicons name={meta.icon} size={14} color={colors.textSecondary} />
          <Text style={styles.relName}>
            {r.name} <Text style={styles.relType}>({meta.label})</Text>
          </Text>
        </View>
        <View style={styles.relRight}>
          <Text style={styles.relLevel}>{Math.round(r.level)}</Text>
          <Animated.View
            style={{ transform: [{ rotate: chevronAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] }) }] }}
          >
            <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
          </Animated.View>
        </View>
      </TouchableOpacity>

      {expanded && (
        <Animated.View style={[styles.relActions, { opacity: fadeAnim }]}>
          {r.type === "ex" ? (
            <TouchableOpacity accessibilityRole="button" activeOpacity={0.7} style={styles.relActionBtn} onPress={onOpenThread}>
              <Ionicons name="chatbubble-ellipses" size={14} color={colors.textPrimary} />
              <Text style={styles.relActionText}>Messages</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity accessibilityRole="button" activeOpacity={0.7} style={styles.relActionBtn} onPress={onSpendTime}>
                <Ionicons name="time" size={14} color={colors.textPrimary} />
                <Text style={styles.relActionText}>Spend Time</Text>
              </TouchableOpacity>
              {canTalk && (
                <TouchableOpacity accessibilityRole="button" activeOpacity={0.7} style={styles.relActionBtn} onPress={onTalk}>
                  <Ionicons name="chatbox" size={14} color={colors.textPrimary} />
                  <Text style={styles.relActionText}>Talk</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity accessibilityRole="button" activeOpacity={0.7} style={styles.relIconBtn} onPress={onOpenThread}>
                <Ionicons name="chatbubble-ellipses" size={16} color={colors.textPrimary} />
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  relBlock: {
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  relRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs + 2,
  },
  relNameWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  relRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingBottom: spacing.sm,
    paddingTop: 2,
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
