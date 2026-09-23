import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CHANGELOG } from "../version";
import { colors, fonts, fontSize, radii, spacing } from "../theme";
import ModalBase from "./ModalBase";

export default function WhatsNewModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalBase cardStyle={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.badge}>
          <Ionicons name="rocket" size={20} color={colors.gold} />
        </View>
        <Text style={styles.title}>What's New</Text>
        <TouchableOpacity accessibilityRole="button" activeOpacity={0.7} onPress={onClose} style={styles.closeBtn}>
          <Ionicons name="close" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {CHANGELOG.map((entry) => (
          <View key={entry.version} style={styles.entry}>
            <View style={styles.versionRow}>
              <Text style={styles.versionTag}>v{entry.version}</Text>
              <Text style={styles.entryTitle}>{entry.title}</Text>
            </View>
            {entry.highlights.map((h, i) => (
              <View key={i} style={styles.highlightRow}>
                <Ionicons name="sparkles" size={12} color={colors.primary} style={styles.highlightIcon} />
                <Text style={styles.highlightText}>{h}</Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </ModalBase>
  );
}

const styles = StyleSheet.create({
  card: {
    maxHeight: "80%",
  },
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
    color: colors.textPrimary,
    fontFamily: fonts.extraBold,
    fontSize: fontSize.xl,
    flex: 1,
  },
  closeBtn: {
    padding: 4,
  },
  scroll: {
    maxHeight: 420,
  },
  entry: {
    marginBottom: spacing.lg,
  },
  versionRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  versionTag: {
    color: colors.primary,
    fontFamily: fonts.extraBold,
    fontSize: fontSize.base,
  },
  entryTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: fontSize.lg,
  },
  highlightRow: {
    flexDirection: "row",
    marginBottom: spacing.xs + 2,
  },
  highlightIcon: {
    marginTop: 4,
    marginRight: spacing.xs + 2,
  },
  highlightText: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: fontSize.base,
    lineHeight: 20,
    flex: 1,
  },
});
