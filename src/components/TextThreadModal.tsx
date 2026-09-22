import React from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Relationship } from "../types";
import { colors, fonts, fontSize, radii, spacing } from "../theme";

const GIFT_AMOUNT = 50;

export default function TextThreadModal({
  relationship,
  money,
  onText,
  onCall,
  onBootyCall,
  onSendGift,
  onClose,
}: {
  relationship: Relationship;
  money: number;
  onText: () => void;
  onCall: () => void;
  onBootyCall: () => void;
  onSendGift: (amount: number) => void;
  onClose: () => void;
}) {
  const isEx = relationship.type === "ex";
  const messages = relationship.messages ?? [];

  return (
    <Modal transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.phone}>
          <View style={styles.header}>
            <TouchableOpacity accessibilityRole="button" activeOpacity={0.7} onPress={onClose} style={styles.backWrap}>
              <Ionicons name="chevron-back" size={20} color={colors.primary} />
              <Text style={styles.backBtn}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.contactName}>{relationship.name}</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.thread} contentContainerStyle={styles.threadContent}>
            {messages.length === 0 ? (
              <Text style={styles.emptyText}>No messages yet.</Text>
            ) : (
              messages.map((m, i) => (
                <View
                  key={i}
                  style={[styles.bubbleRow, m.fromPlayer ? styles.bubbleRowRight : styles.bubbleRowLeft]}
                >
                  <View style={[styles.bubble, m.fromPlayer ? styles.bubbleMe : styles.bubbleThem]}>
                    <Text style={m.fromPlayer ? styles.bubbleTextMe : styles.bubbleTextThem}>{m.text}</Text>
                  </View>
                  <Text style={styles.bubbleAge}>Age {m.age}</Text>
                </View>
              ))
            )}
          </ScrollView>

          <View style={styles.actions}>
            <ActionButton icon="chatbubble" label="Text" onPress={onText} />
            {isEx && (
              <>
                <ActionButton icon="call" label="Call" onPress={onCall} />
                <ActionButton icon="flame" label="Booty Call" onPress={onBootyCall} />
                <ActionButton
                  icon="gift"
                  label={`Gift ($${GIFT_AMOUNT})`}
                  onPress={() => onSendGift(GIFT_AMOUNT)}
                  disabled={money < GIFT_AMOUNT}
                />
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.7}
      disabled={disabled}
      style={[styles.actionBtn, disabled && styles.actionBtnDisabled]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={16} color={colors.textPrimary} />
      <Text style={styles.actionText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  phone: {
    backgroundColor: colors.background,
    borderRadius: radii.xl,
    width: "100%",
    maxWidth: 420,
    maxHeight: "85%",
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backWrap: {
    flexDirection: "row",
    alignItems: "center",
    width: 60,
  },
  backBtn: {
    color: colors.primary,
    fontFamily: fonts.semiBold,
    fontSize: fontSize.base,
  },
  contactName: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: fontSize.lg,
  },
  thread: {
    minHeight: 200,
    maxHeight: 420,
    backgroundColor: colors.background,
  },
  threadContent: {
    padding: spacing.md,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: "center",
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    marginTop: spacing.xl,
  },
  bubbleRow: {
    marginBottom: spacing.sm + 2,
    maxWidth: "80%",
  },
  bubbleRowLeft: {
    alignSelf: "flex-start",
    alignItems: "flex-start",
  },
  bubbleRowRight: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  bubble: {
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 1,
  },
  bubbleThem: {
    backgroundColor: colors.bubbleThem,
    borderBottomLeftRadius: 4,
  },
  bubbleMe: {
    backgroundColor: colors.bubbleMe,
    borderBottomRightRadius: 4,
  },
  bubbleTextThem: {
    color: colors.textPrimary,
    fontFamily: fonts.regular,
    fontSize: fontSize.base,
  },
  bubbleTextMe: {
    color: colors.primaryText,
    fontFamily: fonts.regular,
    fontSize: fontSize.base,
  },
  bubbleAge: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    flexGrow: 1,
    backgroundColor: colors.surfaceRaised,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.md,
    minWidth: "45%",
  },
  actionBtnDisabled: {
    opacity: 0.4,
  },
  actionText: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontFamily: fonts.semiBold,
  },
});
