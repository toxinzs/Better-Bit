import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGameStore } from "../../state/gameStore";
import GradientBg from "../../components/GradientBg";
import Card from "../../components/Card";
import Chip from "../../components/Chip";
import { getRegion } from "../../data/regions";
import { getLifeStage } from "../../engine/lifeEngine";
import { Character, YearRecord } from "../../types";
import { colors, fonts, fontSize, radii, spacing } from "../../theme";

type LineKind = { icon: keyof typeof Ionicons.glyphMap; color: string };

// Cheap keyword tagging so a wall of text reads as a story with visual
// rhythm (money, love, school, health...) instead of identical bullets.
const KINDS: { test: RegExp; kind: LineKind }[] = [
  { test: /\b(arrest\w*|police|jail\w*|prison|court|crime|sentence\w*|monitor|convicted|lawyer|trial)\b/i, kind: { icon: "shield", color: colors.danger } },
  { test: /\$|\b(paid|pay|salary|tax|taxes|loan|bought|sold|rent|stock\w*|money|credit|debt|cash|bill|wallet|lottery|invest\w*)\b/i, kind: { icon: "cash", color: colors.primary } },
  { test: /\b(hired|job|interview|promotion|promoted|boss|career|coworker\w*|quit|fired|office|shift|raise)\b/i, kind: { icon: "briefcase", color: colors.smarts } },
  { test: /\b(love|partner|date|dating|wedding|married|marry|kiss\w*|romantic|crush|engaged|anniversary|matched|spark|proposal)\b/i, kind: { icon: "heart", color: "#ff6b9d" } },
  { test: /\b(baby|child|kid|kids|born|mother|father|sibling|family|parent\w*|grand\w*|passed away)\b/i, kind: { icon: "people", color: colors.looks } },
  { test: /\b(school|class|classes|teacher|grade|college|homework|exam|degree|graduat\w*|gpa|professor|study|studied)\b/i, kind: { icon: "school", color: colors.smarts } },
  { test: /\b(sick|doctor|hospital|injur\w*|ill|illness|health|surgery|flu|virus|fever|checkup|medical)\b/i, kind: { icon: "medkit", color: colors.health } },
  { test: /\b(friend|friends|party|fun|laugh\w*|trip|vacation|concert|beach|hung out|motivated|dream|dance\w*)\b/i, kind: { icon: "happy", color: colors.happiness } },
];
const DEFAULT_KIND: LineKind = { icon: "chatbubble-ellipses", color: colors.textSecondary };

function kindFor(text: string): LineKind {
  return KINDS.find((k) => k.test.test(text))?.kind ?? DEFAULT_KIND;
}

// Newest-first list of past years. New saves have lifeLog; older saves only
// have fullLog (event lines), so group that by age as a fallback.
function history(c: Character): YearRecord[] {
  if (c.lifeLog && c.lifeLog.length > 0) return [...c.lifeLog].reverse();
  const byAge = new Map<number, string[]>();
  for (const e of c.fullLog) {
    if (e.age >= c.age) continue;
    byAge.set(e.age, [...(byAge.get(e.age) ?? []), e.text]);
  }
  return [...byAge.entries()].map(([age, lines]) => ({ age, lines })).sort((a, b) => b.age - a.age);
}

const PAGE = 10;

export default function LifeTab() {
  const character = useGameStore((s) => s.character);
  const worldState = useGameStore((s) => s.worldState);
  const [shown, setShown] = useState(PAGE);

  if (!character) return null;

  const region = getRegion(character.originRegion);
  const stage = getLifeStage(character.age);
  const past = history(character);
  const cond = worldState.activeCondition;
  const news = [...worldState.log];

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <GradientBg id="lifeHero" from="#1d2b4a" to="#171726" radius={radii.lg} style={styles.hero}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroAge}>{character.age}</Text>
            <Text style={styles.heroAgeLabel}>{character.age === 1 ? "year old" : "years old"}</Text>
          </View>
          <View style={styles.heroMeta}>
            <Chip label={stage.replace(/_/g, " ").toUpperCase()} color={colors.smarts} />
            <Chip label={region.label.toUpperCase()} color={colors.gold} />
            {character.appearanceFlavor ? (
              <Text style={styles.flavor}>
                {character.firstName} {character.appearanceFlavor}.
              </Text>
            ) : null}
          </View>
        </View>

        <Text style={styles.heroHeading}>This year</Text>
        {character.yearLog.map((line, i) => (
          <FeedLine key={i} text={line} big />
        ))}
      </GradientBg>

      {cond || news.length > 0 ? (
        <View style={[styles.news, cond && styles.newsAlert]}>
          <Ionicons name="globe" size={16} color={cond ? colors.gold : colors.textSecondary} />
          <View style={styles.newsBody}>
            {cond ? (
              <Text style={styles.newsTitle}>
                {cond.kind.toUpperCase()} - year {worldState.year - cond.startYear + 1} of ~{cond.endsYear - cond.startYear}
              </Text>
            ) : null}
            {news.map((n, i) => (
              <Text key={i} style={styles.newsLine}>
                {n}
              </Text>
            ))}
          </View>
        </View>
      ) : null}

      {past.length > 0 ? (
        <>
          <View style={styles.timelineHeader}>
            <Ionicons name="time" size={16} color={colors.textSecondary} />
            <Text style={styles.timelineTitle}>Your story so far</Text>
          </View>
          {past.slice(0, shown).map((y, idx) => (
            <View key={`${y.age}-${idx}`} style={styles.yearRow}>
              <View style={styles.rail}>
                <View style={styles.ageDot}>
                  <Text style={styles.ageDotText}>{y.age}</Text>
                </View>
                {idx < Math.min(shown, past.length) - 1 && <View style={styles.railLine} />}
              </View>
              <Card style={styles.yearCard}>
                {y.lines.map((line, i) => (
                  <FeedLine key={i} text={line} />
                ))}
              </Card>
            </View>
          ))}
          {shown < past.length && (
            <TouchableOpacity accessibilityRole="button" activeOpacity={0.7} style={styles.more} onPress={() => setShown((s) => s + PAGE)}>
              <Text style={styles.moreText}>Show earlier years ({past.length - shown} more)</Text>
              <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </>
      ) : (
        <Card style={styles.empty}>
          <Ionicons name="sparkles" size={22} color={colors.gold} />
          <Text style={styles.emptyTitle}>Your story starts here</Text>
          <Text style={styles.emptyText}>Tap Age Up to live your first year. Everything that happens will be written down right here.</Text>
        </Card>
      )}
    </ScrollView>
  );
}

function FeedLine({ text, big }: { text: string; big?: boolean }) {
  const k = kindFor(text);
  return (
    <View style={styles.line}>
      <View style={[styles.lineIcon, { backgroundColor: k.color + "22" }]}>
        <Ionicons name={k.icon} size={big ? 14 : 12} color={k.color} />
      </View>
      <Text style={[styles.lineText, big && styles.lineTextBig]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  hero: {
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  heroAge: {
    color: colors.textPrimary,
    fontFamily: fonts.extraBold,
    fontSize: 54,
    lineHeight: 56,
  },
  heroAgeLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.semiBold,
    fontSize: fontSize.sm,
    marginTop: -2,
  },
  heroMeta: {
    flex: 1,
    gap: 6,
  },
  flavor: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    fontStyle: "italic",
    marginTop: 2,
  },
  heroHeading: {
    color: colors.textSecondary,
    fontFamily: fonts.bold,
    fontSize: fontSize.sm,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  line: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm + 2,
    marginBottom: spacing.sm,
  },
  lineIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  lineText: {
    flex: 1,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    lineHeight: 19,
  },
  lineTextBig: {
    color: colors.textPrimary,
    fontFamily: fonts.semiBold,
    fontSize: fontSize.base,
    lineHeight: 21,
  },
  news: {
    flexDirection: "row",
    gap: spacing.sm + 2,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  newsAlert: {
    borderColor: colors.gold + "88",
    backgroundColor: colors.gold + "12",
  },
  newsBody: {
    flex: 1,
  },
  newsTitle: {
    color: colors.gold,
    fontFamily: fonts.extraBold,
    fontSize: fontSize.sm,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  newsLine: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    lineHeight: 18,
  },
  timelineHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  timelineTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: fontSize.lg,
  },
  yearRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  rail: {
    alignItems: "center",
    width: 34,
  },
  ageDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  ageDotText: {
    color: colors.textPrimary,
    fontFamily: fonts.extraBold,
    fontSize: fontSize.sm,
  },
  railLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginTop: 2,
    marginBottom: -12,
  },
  yearCard: {
    flex: 1,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
  },
  more: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: spacing.md,
  },
  moreText: {
    color: colors.textSecondary,
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
  },
  empty: {
    alignItems: "center",
    gap: 8,
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: fontSize.lg,
  },
  emptyText: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    textAlign: "center",
    lineHeight: 19,
  },
});
