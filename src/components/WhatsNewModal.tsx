import React, { useEffect, useRef } from "react";
import { Animated, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CHANGELOG } from "../version";
import { colors, fonts, fontSize, radii, spacing } from "../theme";

export default function WhatsNewModal({ onClose }: { onClose: () => void }) {
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [scale, opacity]);

  return (
    <Modal transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}>
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
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    width: "100%",
    maxWidth: 420,
    maxHeight: "80%",
    borderWidth: 1,
    borderColor: colors.border,
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
