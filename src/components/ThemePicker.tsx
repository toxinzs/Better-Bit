import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ModalBase from "./ModalBase";
import GradientBg from "./GradientBg";
import { THEMES, THEME_IDS, ThemeId, applyTheme, colors, currentThemeId, fonts, fontSize, radii, spacing } from "../theme";

// Each card previews its own palette (not the active one) so you can see
// what you're choosing. Picking one saves it and reloads the app.
export default function ThemePicker({ onClose }: { onClose: () => void }) {
  return (
    <ModalBase>
      <View style={styles.headerRow}>
        <View style={styles.badge}>
          <Ionicons name="color-palette" size={20} color={colors.gold} />
        </View>
        <Text style={styles.title}>Choose a look</Text>
        <TouchableOpacity accessibilityRole="button" activeOpacity={0.7} onPress={onClose} style={styles.closeBtn}>
          <Ionicons name="close" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      <View style={styles.grid}>
        {THEME_IDS.map((id) => (
          <ThemeCard key={id} id={id} active={id === currentThemeId} />
        ))}
      </View>
    </ModalBase>
  );
}

function ThemeCard({ id, active }: { id: ThemeId; active: boolean }) {
  const t = THEMES[id];
  const p = t.palette;
  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.8}
      onPress={() => (active ? undefined : applyTheme(id))}
      style={[styles.card, { borderColor: active ? colors.primary : colors.border }]}
    >
      <GradientBg id={`theme-${id}`} from={p.gradHeader} to={p.background} radius={radii.md} vertical style={styles.preview}>
        <View style={[styles.mockCard, { backgroundColor: p.surface, borderColor: p.border }]}>
          <View style={[styles.mockLine, { backgroundColor: p.textPrimary, width: "70%" }]} />
          <View style={[styles.mockLine, { backgroundColor: p.textMuted, width: "45%" }]} />
        </View>
        <View style={styles.dots}>
          <View style={[styles.dot, { backgroundColor: p.primary }]} />
          <View style={[styles.dot, { backgroundColor: p.smarts }]} />
          <View style={[styles.dot, { backgroundColor: p.happiness }]} />
          <View style={[styles.dot, { backgroundColor: p.looks }]} />
        </View>
      </GradientBg>
      <View style={styles.labelRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{t.label}</Text>
          <Text style={styles.blurb} numberOfLines={2}>
            {t.blurb}
          </Text>
        </View>
        {active && <Ionicons name="checkmark-circle" size={18} color={colors.primary} />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  title: {
    flex: 1,
    color: colors.textPrimary,
    fontFamily: fonts.extraBold,
    fontSize: fontSize.xl,
  },
  closeBtn: {
    padding: 4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm + 2,
  },
  card: {
    width: "47.5%",
    borderRadius: radii.lg,
    borderWidth: 2,
    padding: 6,
    backgroundColor: colors.surfaceRaised,
  },
  preview: {
    height: 78,
    padding: 8,
    justifyContent: "space-between",
  },
  mockCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 6,
    gap: 4,
  },
  mockLine: {
    height: 5,
    borderRadius: 3,
  },
  dots: {
    flexDirection: "row",
    gap: 5,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 2,
  },
  label: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: fontSize.base,
  },
  blurb: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: fontSize.xs,
  },
});
