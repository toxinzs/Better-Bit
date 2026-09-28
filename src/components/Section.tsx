import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Card from "./Card";
import { colors, fonts, fontSize, spacing } from "../theme";

// A card with an icon+title header that can collapse - the main tool for
// decluttering long tabs (Money, Activities) without hiding anything.
export default function Section({
  title,
  icon,
  color = colors.primary,
  summary,
  defaultOpen = true,
  collapsible = true,
  children,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  summary?: string;
  defaultOpen?: boolean;
  collapsible?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const showBody = !collapsible || open;

  return (
    <Card style={styles.card}>
      <TouchableOpacity
        accessibilityRole="button"
        activeOpacity={collapsible ? 0.7 : 1}
        disabled={!collapsible}
        onPress={() => setOpen((o) => !o)}
        style={styles.header}
      >
        <View style={[styles.iconWrap, { backgroundColor: color + "22" }]}>
          <Ionicons name={icon} size={16} color={color} />
        </View>
        <Text style={styles.title}>{title}</Text>
        {summary ? <Text style={styles.summary}>{summary}</Text> : null}
        {collapsible && <Ionicons name={open ? "chevron-up" : "chevron-down"} size={16} color={colors.textMuted} />}
      </TouchableOpacity>
      {showBody && <View style={styles.body}>{children}</View>}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: fontSize.lg,
  },
  summary: {
    color: colors.textSecondary,
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
});
