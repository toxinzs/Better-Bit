import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGameStore } from "../../state/gameStore";
import Card from "../../components/Card";
import Chip from "../../components/Chip";
import { FadeInUp } from "../../motion";
import { PersonAvatar } from "../../components/Avatar";
import { Character, Relationship, RelationType, RegionKey } from "../../types";
import PersonSheet from "../../components/PersonSheet";
import AmountPicker from "../../components/AmountPicker";
import { askCeiling, askChance, giveCeiling } from "../../engine/lifeEngine";
import type { ActionKey } from "../../engine/lifeEngine";
import { jobLine } from "../../engine/people";
import { playSound } from "../../sound";
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
  classmate: { label: "Classmate", color: colors.smarts },
  coworker: { label: "Coworker", color: colors.smarts },
  grandchild: { label: "Grandchild", color: colors.smarts },
};

const GROUPS: { title: string; icon: keyof typeof Ionicons.glyphMap; color: string; types: RelationType[] }[] = [
  { title: "Partner", icon: "heart", color: colors.love, types: ["partner"] },
  { title: "Family", icon: "home", color: colors.looks, types: ["mother", "father", "sibling", "child", "grandchild"] },
  { title: "Friends", icon: "happy", color: colors.happiness, types: ["friend"] },
  { title: "Classmates", icon: "school", color: colors.smarts, types: ["classmate"] },
  { title: "Work", icon: "briefcase", color: colors.smarts, types: ["coworker"] },
  { title: "Exes", icon: "flame", color: colors.danger, types: ["ex"] },
];

function levelColor(level: number): string {
  if (level < 35) return colors.danger;
  if (level < 65) return colors.happiness;
  return colors.primary;
}

export default function PeopleTab({ onOpenThread }: { onOpenThread: (relationshipId: string) => void }) {
  const character = useGameStore((s) => s.character);
  const personAction = useGameStore((s) => s.personAction);
  const pendingEvent = useGameStore((s) => s.pendingEvent);
  const actionResultLines = useGameStore((s) => s.actionResultLines);
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [showMemorial, setShowMemorial] = useState(false);
  const [picker, setPicker] = useState<{ kind: "giveMoney" | "askMoney"; id: string } | null>(null);

  if (!character) return null;

  // The school roster (classmates, teachers) is shown here too so a crush or
  // a friend-to-be is one tap away; teachers stay in the School tab.
  const relationships = character.relationships.filter((r) => r.alive && r.type !== "teacher");
  const sheetRel = sheetId ? character.relationships.find((r) => r.id === sheetId && (r.alive || r.diedAge !== undefined)) : undefined;
  const memorial = character.relationships.filter(
    (r) => !r.alive && r.diedAge !== undefined && r.type !== "classmate" && r.type !== "teacher",
  );
  const pickerRel = picker ? character.relationships.find((r) => r.id === picker.id && r.alive) : undefined;

  // The sheet steps aside while a popup (a conversation, a result) is up and
  // comes back, refreshed, once it's dismissed.
  const sheetVisible = !!sheetRel && !pendingEvent && !actionResultLines && !picker;

  const doAction = (key: ActionKey) => {
    if (!sheetRel) return;
    playSound("choice");
    personAction(sheetRel.id, key);
  };

  const teenDatingOpen = character.age >= 13 && character.age < 18 && !relationships.some((r) => r.type === "partner");

  return (
    <>
      <ScrollView contentContainerStyle={tabStyles.scroll}>
        {relationships.length === 0 && (
          <Card style={styles.empty}>
            <Ionicons name="people" size={24} color={colors.looks} />
            <Text style={styles.emptyTitle}>No one in your life yet</Text>
          </Card>
        )}
        {teenDatingOpen && (
          <Card style={styles.hint}>
            <Ionicons name="heart-circle" size={20} color={colors.love} />
            <Text style={styles.hintText}>
              Dating is open. Tap a classmate or friend your age and choose Ask Out - or wait, someone might ask you.
            </Text>
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
                  <PersonCard c={character} r={r} region={character.originRegion} onOpen={() => setSheetId(r.id)} />
                </FadeInUp>
              ))}
            </View>
          );
        })}
        {memorial.length > 0 && (
          <View style={styles.group}>
            <TouchableOpacity accessibilityRole="button" activeOpacity={0.7} style={styles.groupHeader} onPress={() => setShowMemorial((v) => !v)}>
              <Ionicons name="rose" size={15} color={colors.textSecondary} />
              <Text style={styles.groupTitle}>In memory</Text>
              <Text style={styles.groupCount}>{memorial.length}</Text>
              <Ionicons name={showMemorial ? "chevron-up" : "chevron-down"} size={15} color={colors.textMuted} />
            </TouchableOpacity>
            {showMemorial &&
              memorial.map((r) => (
                <Card key={r.id} style={styles.person}>
                  <TouchableOpacity accessibilityRole="button" activeOpacity={0.7} style={styles.personRow} onPress={() => setSheetId(r.id)}>
                    <View style={[styles.avatarWrap, { borderColor: colors.border, opacity: 0.55 }]}>
                      <PersonAvatar name={r.name} id={r.id} type={r.type} gender={r.gender} region={character.originRegion} size={46} />
                    </View>
                    <View style={styles.personBody}>
                      <Text style={styles.personName} numberOfLines={1}>{r.name}</Text>
                      <Text style={styles.subline}>
                        {(RELATION_META[r.type]?.label ?? r.type)} · died at {r.diedAge}
                        {r.causeOfDeath ? ` · ${r.causeOfDeath}` : ""}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                </Card>
              ))}
          </View>
        )}
      </ScrollView>

      {sheetVisible && sheetRel && (
        <PersonSheet
          character={character}
          rel={sheetRel}
          onClose={() => setSheetId(null)}
          onAction={doAction}
          onMoney={(kind) => setPicker({ kind, id: sheetRel.id })}
          onMessages={() => {
            setSheetId(null);
            onOpenThread(sheetRel.id);
          }}
        />
      )}

      {picker && pickerRel && picker.kind === "giveMoney" && (
        <AmountPicker
          title={`Give ${pickerRel.name.split(" ")[0]} money`}
          subtitle={`You have $${Math.floor(character.money).toLocaleString()}`}
          min={5}
          max={giveCeiling(character)}
          confirmLabel="Give"
          onConfirm={(amt) => {
            setPicker(null);
            playSound("choice");
            personAction(pickerRel.id, "giveMoney", amt);
          }}
          onCancel={() => setPicker(null)}
        />
      )}
      {picker && pickerRel && picker.kind === "askMoney" && (
        <AmountPicker
          title={`Ask ${pickerRel.name.split(" ")[0]} for money`}
          subtitle="The more you ask, the harder it is to say yes"
          min={10}
          max={askCeiling(character, pickerRel)}
          confirmLabel="Ask"
          caption={(amt) => {
            const p = askChance(character, pickerRel, amt);
            return p > 0.6
              ? { text: "Likely to say yes", color: colors.primary }
              : p > 0.35
                ? { text: "Could go either way", color: colors.happiness }
                : { text: "Unlikely", color: colors.danger };
          }}
          onConfirm={(amt) => {
            setPicker(null);
            playSound("choice");
            personAction(pickerRel.id, "askMoney", amt);
          }}
          onCancel={() => setPicker(null)}
        />
      )}
    </>
  );
}

function PersonCard({ c, r, region, onOpen }: { c: Character; r: Relationship; region?: RegionKey; onOpen: () => void }) {
  const meta = RELATION_META[r.type] ?? { label: r.type, color: colors.textSecondary };
  const lc = levelColor(r.level);
  const ledger = r.ledger ?? 0;

  return (
    <Card style={styles.person}>
      <TouchableOpacity accessibilityRole="button" activeOpacity={0.7} style={styles.personRow} onPress={onOpen}>
        <View style={[styles.avatarWrap, { borderColor: meta.color + "88" }]}>
          <PersonAvatar name={r.name} id={r.id} type={r.type} gender={r.gender} region={region} size={46} />
        </View>
        <View style={styles.personBody}>
          <View style={styles.nameRow}>
            <Text style={styles.personName} numberOfLines={1}>
              {r.name}
            </Text>
            {r.married ? <Chip label="MARRIED" color={colors.love} /> : r.engaged ? <Chip label="ENGAGED" color={colors.love} /> : null}
            {ledger !== 0 ? <Chip label={ledger < 0 ? "YOU OWE" : "OWES YOU"} color={ledger < 0 ? colors.danger : colors.primary} /> : null}
          </View>
          <View style={styles.metaRow}>
            <View style={styles.metaLeft}>
              <Chip label={meta.label.toUpperCase()} color={meta.color} />
              <Text style={styles.subline} numberOfLines={1}>
                {jobLine(c, r)}
              </Text>
            </View>
            <Text style={[styles.levelText, { color: lc }]}>{Math.round(r.level)}</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.max(3, Math.min(100, r.level))}%`, backgroundColor: lc }]} />
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </TouchableOpacity>
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
  hint: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  hintText: {
    flex: 1,
    color: colors.textSecondary,
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    lineHeight: 19,
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
  metaLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  subline: {
    flexShrink: 1,
    color: colors.textSecondary,
    fontFamily: fonts.semiBold,
    fontSize: fontSize.sm,
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
