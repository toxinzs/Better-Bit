import React, { useEffect, useRef } from "react";
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Character, Relationship } from "../types";
import ModalBase from "./ModalBase";
import Chip from "./Chip";
import { PersonAvatar } from "./Avatar";
import { FadeInUp } from "../motion";
import { ActionCategory, ActionDef, ActionKey, actionsFor } from "../engine/interactions";
import { ageOf, healthWord, jobLine } from "../engine/people";
import { colors, fonts, fontSize, radii, spacing } from "../theme";

const TYPE_LABEL: Record<string, string> = {
  mother: "Mother", father: "Father", sibling: "Sibling", friend: "Friend", partner: "Partner",
  child: "Child", ex: "Ex", classmate: "Classmate", teacher: "Teacher", coworker: "Coworker", grandchild: "Grandchild",
};

const CAT_ORDER: ActionCategory[] = ["Connect", "Outings", "Money", "Romance"];
const CAT_COLOR: Record<ActionCategory, string> = {
  Connect: colors.smarts, Outings: colors.happiness, Money: colors.primary, Romance: colors.love,
};

function levelColor(level: number): string {
  if (level < 35) return colors.danger;
  if (level < 65) return colors.happiness;
  return colors.primary;
}

export default function PersonSheet({
  character,
  rel,
  onClose,
  onAction,
  onMoney,
  onMessages,
}: {
  character: Character;
  rel: Relationship;
  onClose: () => void;
  onAction: (key: ActionKey) => void;
  onMoney: (kind: "giveMoney" | "askMoney") => void;
  onMessages: () => void;
}) {
  const { height } = useWindowDimensions();
  const actions = actionsFor(character, rel);
  const lc = levelColor(rel.level);

  const bar = useRef(new Animated.Value(rel.level)).current;
  useEffect(() => {
    Animated.timing(bar, { toValue: rel.level, duration: 500, useNativeDriver: false }).start();
  }, [rel.level, bar]);

  const ledger = rel.ledger ?? 0;
  const age = ageOf(character, rel);
  const isMinor = age < 18;

  const press = (a: ActionDef) => {
    if (a.state !== "available") return;
    if (a.key === "giveMoney" || a.key === "askMoney") onMoney(a.key);
    else onAction(a.key);
  };

  return (
    <ModalBase cardStyle={styles.card}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close" style={styles.close} onPress={onClose}>
        <Ionicons name="close" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
      <ScrollView style={{ maxHeight: height * 0.78 }} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={[styles.avatarRing, { borderColor: lc }]}>
            <PersonAvatar name={rel.name} id={rel.id} type={rel.type} gender={rel.gender} region={character.originRegion} size={68} />
          </View>
          <Text style={styles.name} numberOfLines={2}>{rel.name}</Text>
          <Text style={styles.sub}>
            {TYPE_LABEL[rel.type] ?? rel.type} · {jobLine(character, rel)}
          </Text>
          <View style={styles.chips}>
            <Chip label={healthWord(rel.health).toUpperCase()} color={(rel.health ?? 80) >= 50 ? colors.health : colors.danger} />
            {rel.married ? <Chip label="MARRIED" color={colors.love} /> : rel.engaged ? <Chip label="ENGAGED" color={colors.love} /> : null}
            {rel.type === "partner" && isMinor ? <Chip label="DATING" color={colors.love} /> : null}
            {(rel.traits ?? []).slice(0, 2).map((t) => (
              <Chip key={t} label={t.toUpperCase()} color={colors.textSecondary} />
            ))}
          </View>
        </View>

        <View style={styles.levelRow}>
          <Text style={styles.levelLabel}>Bond</Text>
          <Text style={[styles.levelNum, { color: lc }]}>{Math.round(rel.level)}</Text>
        </View>
        <View style={styles.track}>
          <Animated.View
            style={[styles.fill, { backgroundColor: lc, width: bar.interpolate({ inputRange: [0, 100], outputRange: ["2%", "100%"] }) }]}
          />
        </View>
        {ledger !== 0 && (
          <Text style={[styles.ledger, { color: ledger < 0 ? colors.danger : colors.primary }]}>
            {ledger < 0 ? `You owe them $${Math.round(-ledger).toLocaleString()}` : `They owe you $${Math.round(ledger).toLocaleString()}`}
          </Text>
        )}

        {CAT_ORDER.map((cat) => {
          const list = actions.filter((a) => a.cat === cat);
          if (list.length === 0) return null;
          return (
            <View key={cat} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: CAT_COLOR[cat] }]}>{cat.toUpperCase()}</Text>
              <View style={styles.grid}>
                {list.map((a, i) => (
                  <FadeInUp key={a.key} delay={Math.min(i, 6) * 40} distance={6} style={styles.cell}>
                    <ActionButton a={a} color={CAT_COLOR[cat]} onPress={() => press(a)} />
                  </FadeInUp>
                ))}
              </View>
            </View>
          );
        })}

        <TouchableOpacity accessibilityRole="button" activeOpacity={0.7} style={styles.messages} onPress={onMessages}>
          <Ionicons name="chatbubble-ellipses" size={16} color={colors.textPrimary} />
          <Text style={styles.messagesText}>Messages</Text>
        </TouchableOpacity>
      </ScrollView>
    </ModalBase>
  );
}

function ActionButton({ a, color, onPress }: { a: ActionDef; color: string; onPress: () => void }) {
  const locked = a.state === "locked";
  const capped = a.state === "capped";
  const dim = locked || capped;
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={a.label}
      accessibilityState={{ disabled: dim }}
      activeOpacity={0.7}
      disabled={dim}
      style={[styles.action, { borderColor: dim ? colors.border : color + "66" }, dim && { opacity: 0.45 }]}
      onPress={onPress}
    >
      <Ionicons name={a.icon as keyof typeof Ionicons.glyphMap} size={18} color={dim ? colors.textMuted : color} />
      <View style={{ flex: 1 }}>
        <Text style={styles.actionLabel} numberOfLines={1}>{a.label}</Text>
        {locked ? (
          <Text style={styles.actionHint} numberOfLines={1}>{a.reason}</Text>
        ) : a.cap > 1 ? (
          <View style={styles.pips}>
            {Array.from({ length: a.cap }).map((_, i) => (
              <View key={i} style={[styles.pip, { backgroundColor: i < a.used ? color : colors.border }]} />
            ))}
          </View>
        ) : capped ? (
          <Text style={styles.actionHint}>Done this year</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.lg, maxWidth: 440 },
  close: { position: "absolute", top: 10, right: 10, zIndex: 5, padding: 6 },
  hero: { alignItems: "center", marginBottom: spacing.md, paddingTop: spacing.xs },
  avatarRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    backgroundColor: colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  name: { color: colors.textPrimary, fontFamily: fonts.extraBold, fontSize: fontSize.xl, marginTop: spacing.sm, textAlign: "center" },
  sub: { color: colors.textSecondary, fontFamily: fonts.semiBold, fontSize: fontSize.md, marginTop: 2 },
  chips: { flexDirection: "row", gap: 6, flexWrap: "wrap", justifyContent: "center", marginTop: spacing.sm },
  levelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  levelLabel: { color: colors.textSecondary, fontFamily: fonts.bold, fontSize: fontSize.sm, letterSpacing: 0.5 },
  levelNum: { fontFamily: fonts.extraBold, fontSize: fontSize.lg },
  track: { height: 8, borderRadius: radii.pill, backgroundColor: colors.surfaceRaised, overflow: "hidden", marginTop: 2 },
  fill: { height: "100%", borderRadius: radii.pill },
  ledger: { fontFamily: fonts.bold, fontSize: fontSize.sm, marginTop: 6, textAlign: "center" },
  section: { marginTop: spacing.md },
  sectionTitle: { fontFamily: fonts.extraBold, fontSize: fontSize.xs, letterSpacing: 1, marginBottom: 6 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  cell: { width: "48.5%" },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm + 2,
    minHeight: 46,
  },
  actionLabel: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fontSize.md },
  actionHint: { color: colors.textMuted, fontFamily: fonts.semiBold, fontSize: 10, marginTop: 1 },
  pips: { flexDirection: "row", gap: 3, marginTop: 3 },
  pip: { width: 12, height: 4, borderRadius: 2 },
  messages: {
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.md,
    paddingVertical: spacing.sm + 2,
  },
  messagesText: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fontSize.md },
});
