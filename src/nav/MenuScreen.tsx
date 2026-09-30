import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNav } from "./navStore";
import { FadeInUp } from "../motion";
import { colors, fonts, fontSize, radii, spacing } from "../theme";

// The frame every drill-down menu shares: a back button, a title and a
// scrolling body. Pass scroll={false} when the content brings its own
// ScrollView (older tabs wrapped as menus).
export default function MenuScreen({
  title,
  icon,
  color = colors.primary,
  right,
  scroll = true,
  children,
}: {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
  right?: React.ReactNode;
  scroll?: boolean;
  children: React.ReactNode;
}) {
  const pop = useNav((s) => s.pop);
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Back" activeOpacity={0.7} style={styles.back} onPress={pop}>
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.titleWrap}>
          {icon ? (
            <View style={[styles.iconWrap, { backgroundColor: color + "22" }]}>
              <Ionicons name={icon} size={15} color={color} />
            </View>
          ) : null}
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>
        <View style={styles.right}>{right}</View>
      </View>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>{children}</View>
      )}
    </View>
  );
}

// A small caption that groups the rows of a long hub.
export function SectionLabel({ children }: { children: string }) {
  return <Text style={sectionStyles.label}>{children}</Text>;
}
const sectionStyles = StyleSheet.create({
  label: { color: colors.textMuted, fontFamily: fonts.bold, fontSize: fontSize.xs, letterSpacing: 1.2, textTransform: "uppercase", marginTop: spacing.md, marginBottom: spacing.sm, paddingHorizontal: 4 },
});

// One tappable row of a hub: icon tile, title, a live summary line, an
// optional badge and a chevron.
export function MenuRow({
  icon,
  color = colors.primary,
  title,
  summary,
  badge,
  disabled,
  delay = 0,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  title: string;
  summary?: string;
  badge?: string;
  disabled?: boolean;
  delay?: number;
  onPress: () => void;
}) {
  return (
    <FadeInUp delay={delay} distance={8}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{ disabled: !!disabled }}
        activeOpacity={0.75}
        disabled={disabled}
        style={[styles.row, disabled && { opacity: 0.45 }]}
        onPress={onPress}
      >
        <View style={[styles.rowIcon, { backgroundColor: color + "22" }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>{title}</Text>
          {summary ? (
            <Text style={styles.rowSummary} numberOfLines={1}>
              {summary}
            </Text>
          ) : null}
        </View>
        {badge ? (
          <View style={[styles.badge, { backgroundColor: color + "26" }]}>
            <Text style={[styles.badgeText, { color }]}>{badge}</Text>
          </View>
        ) : null}
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </TouchableOpacity>
    </FadeInUp>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  back: { width: 44, height: 36, alignItems: "flex-start", justifyContent: "center", paddingLeft: 6 },
  titleWrap: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  iconWrap: { width: 26, height: 26, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  title: { color: colors.textPrimary, fontFamily: fonts.extraBold, fontSize: fontSize.lg },
  right: { minWidth: 44, alignItems: "flex-end", paddingRight: 6 },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md + 2,
    marginBottom: spacing.sm,
  },
  rowIcon: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  rowTitle: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fontSize.base + 1 },
  rowSummary: { color: colors.textSecondary, fontFamily: fonts.semiBold, fontSize: fontSize.sm, marginTop: 2 },
  badge: { borderRadius: radii.pill, paddingHorizontal: 9, paddingVertical: 3 },
  badgeText: { fontFamily: fonts.extraBold, fontSize: fontSize.xs },
});
