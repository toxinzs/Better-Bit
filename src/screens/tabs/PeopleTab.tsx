import React, { useRef, useState } from "react";
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGameStore } from "../../state/gameStore";
import Card from "../../components/Card";
import Chip from "../../components/Chip";
import { FadeInUp } from "../../motion";
import { PersonAvatar } from "../../components/Avatar";
import { Relationship, RelationType, RegionKey } from "../../types";
import { MIN_AGE_CONVERSATION } from "../../engine/lifeStage";
import { colors, fonts, fontSize, radii, spacing } from "../../theme";
import { tabStyles } from "./sharedStyles";

const RELATION_META: Record<string, { label: string; color: string }> = {
  mother: { label: "Mother", color: colors.looks },
  father: { label: "Father", color: colors.looks },
  sibling: { label: "Sibling", color: colors.looks },
  friend: { label: "Friend", color: colors.happiness },
  partner: { label: "Partner", color: colors.love },
  child: { label: "Child", color: colors.smarts },
  ex: { label: "Ex", color: colors.danger },
};

const GROUPS: { title: string; icon: keyof typeof Ionicons.glyphMap; color: string; types: RelationType[] }[] = [
  { title: "Partner", icon: "heart", color: colors.love, types: ["partner"] },
  { title: "Family", icon: "home", color: colors.looks, types: ["mother", "father", "sibling", "child"] },
  { title: "Friends", icon: "happy", color: colors.happiness, types: ["friend"] },
  { title: "Exes", icon: "flame", color: colors.danger, types: ["ex"] },
];

function levelColor(level: number): string {
  if (level < 35) return colors.danger;
  if (level < 65) return colors.happiness;
  return colors.primary;
}

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
      {relationships.length === 0 && (
        <Card style={styles.empty}>
          <Ionicons name="people" size={24} color={colors.looks} />
          <Text style={styles.emptyTitle}>No one in your life yet</Text>
        </Card>
      )}
      {GROUPS.map((g) => {
        const members = relationships.filter((r) => g.types.includes(r.type)).sort((a, b) => b.level - a.level);
        if (members.length === 0) return null;
        return (
          <View key={g.title} style={styles.group}>
            <View style={styles.groupHeader}>
              <Ionicons name={g.icon} size={15} color={g.color} />
              <Text style={styles.groupTitle}>{g.title}</Text>
              <Text style={styles.groupCount}>{members.length}</Text>
            </View>
            {members.map((r, idx) => (
              <FadeInUp key={r.id} delay={Math.min(idx, 8) * 50}>
              <PersonCard
                r={r}
                region={character.originRegion}
                expanded={expandedIds.has(r.id)}
                onToggle={() => toggle(r.id)}
                canTalk={character.age >= MIN_AGE_CONVERSATION}
                onSpendTime={() => spendTimeWith(r.id)}
                onTalk={() => haveConversation(r.id)}
                onOpenThread={() => onOpenThread(r.id)}
              />
              </FadeInUp>
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
}

function PersonCard({
  r,
  region,
  expanded,
  onToggle,
  canTalk,
  onSpendTime,
  onTalk,
  onOpenThread,
}: {
  r: Relationship;
  region?: RegionKey;
  expanded: boolean;
  onToggle: () => void;
  canTalk: boolean;
  onSpendTime: () => void;
  onTalk: () => void;
  onOpenThread: () => void;
}) {
  const meta = RELATION_META[r.type] ?? { label: r.type, color: colors.textSecondary };
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

  const lc = levelColor(r.level);

  return (
    <Card style={styles.person}>
      <TouchableOpacity accessibilityRole="button" activeOpacity={0.7} style={styles.personRow} onPress={handleToggle}>
        <View style={[styles.avatarWrap, { borderColor: meta.color + "88" }]}>
          <PersonAvatar name={r.name} type={r.type} region={region} size={46} />
        </View>
        <View style={styles.personBody}>
          <View style={styles.nameRow}>
            <Text style={styles.personName} numberOfLines={1}>
              {r.name}
            </Text>
            {r.married ? <Chip label="MARRIED" color={colors.love} /> : r.engaged ? <Chip label="ENGAGED" color={colors.love} /> : null}
          </View>
          <View style={styles.metaRow}>
            <Chip label={meta.label.toUpperCase()} color={meta.color} />
            <Text style={[styles.levelText, { color: lc }]}>{Math.round(r.level)}</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.max(3, Math.min(100, r.level))}%`, backgroundColor: lc }]} />
          </View>
        </View>
        <Animated.View
          style={{ transform: [{ rotate: chevronAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] }) }] }}
        >
          <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
        </Animated.View>
      </TouchableOpacity>

      {expanded && (
        <Animated.View style={[styles.actions, { opacity: fadeAnim }]}>
          {r.type === "ex" ? (
            <TouchableOpacity accessibilityRole="button" activeOpacity={0.7} style={styles.actionBtn} onPress={onOpenThread}>
              <Ionicons name="chatbubble-ellipses" size={15} color={colors.textPrimary} />
              <Text style={styles.actionText}>Messages</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity accessibilityRole="button" activeOpacity={0.7} style={styles.actionBtn} onPress={onSpendTime}>
                <Ionicons name="time" size={15} color={colors.textPrimary} />
                <Text style={styles.actionText}>Spend Time</Text>
              </TouchableOpacity>
              {canTalk && (
                <TouchableOpacity accessibilityRole="button" activeOpacity={0.7} style={styles.actionBtn} onPress={onTalk}>
                  <Ionicons name="chatbox" size={15} color={colors.textPrimary} />
                  <Text style={styles.actionText}>Talk</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity accessibilityRole="button" activeOpacity={0.7} style={styles.iconBtn} onPress={onOpenThread}>
                <Ionicons name="chatbubble-ellipses" size={17} color={colors.textPrimary} />
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: "center",
    gap: 8,
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    color: colors.textSecondary,
    fontFamily: fonts.semiBold,
    fontSize: fontSize.base,
  },
  group: {
    marginBottom: spacing.sm,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  groupTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.extraBold,
    fontSize: fontSize.base,
    letterSpacing: 0.5,
  },
  groupCount: {
    color: colors.textMuted,
    fontFamily: fonts.bold,
    fontSize: fontSize.sm,
  },
  person: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  personRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    backgroundColor: colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  personBody: {
    flex: 1,
    gap: 5,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  personName: {
    flexShrink: 1,
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: fontSize.base + 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  levelText: {
    fontFamily: fonts.extraBold,
    fontSize: fontSize.md,
  },
  track: {
    height: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceRaised,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: radii.pill,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.md,
    paddingVertical: spacing.sm + 2,
  },
  actionText: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: fontSize.md,
  },
  iconBtn: {
    width: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.md,
  },
});
