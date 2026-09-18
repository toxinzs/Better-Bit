import React from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Relationship } from "../types";

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
            <TouchableOpacity accessibilityRole="button" onPress={onClose}>
              <Text style={styles.backBtn}>‹ Back</Text>
            </TouchableOpacity>
            <Text style={styles.contactName}>{relationship.name}</Text>
            <View style={{ width: 50 }} />
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
            <TouchableOpacity accessibilityRole="button" style={styles.actionBtn} onPress={onText}>
              <Text style={styles.actionText}>💬 Text</Text>
            </TouchableOpacity>
            {isEx && (
              <>
                <TouchableOpacity accessibilityRole="button" style={styles.actionBtn} onPress={onCall}>
                  <Text style={styles.actionText}>📞 Call</Text>
                </TouchableOpacity>
                <TouchableOpacity accessibilityRole="button" style={styles.actionBtn} onPress={onBootyCall}>
                  <Text style={styles.actionText}>🔥 Booty Call</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  style={[styles.actionBtn, money < GIFT_AMOUNT && styles.actionBtnDisabled]}
                  onPress={() => onSendGift(GIFT_AMOUNT)}
                >
                  <Text style={styles.actionText}>🎁 Gift (${GIFT_AMOUNT})</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  phone: {
    backgroundColor: "#0e0e16",
    borderRadius: 20,
    width: "100%",
    maxWidth: 420,
    maxHeight: "85%",
    borderWidth: 1,
    borderColor: "#2a2a3a",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a3a",
    backgroundColor: "#161622",
  },
  backBtn: {
    color: "#4a9eff",
    fontSize: 15,
    width: 50,
  },
  contactName: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  thread: {
    minHeight: 200,
    maxHeight: 420,
    backgroundColor: "#0e0e16",
  },
  threadContent: {
    padding: 14,
  },
  emptyText: {
    color: "#666",
    textAlign: "center",
    fontSize: 13,
    marginTop: 20,
  },
  bubbleRow: {
    marginBottom: 10,
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
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  bubbleThem: {
    backgroundColor: "#2a2a3a",
    borderBottomLeftRadius: 4,
  },
  bubbleMe: {
    backgroundColor: "#2ecc71",
    borderBottomRightRadius: 4,
  },
  bubbleTextThem: {
    color: "#eee",
    fontSize: 14,
  },
  bubbleTextMe: {
    color: "#0b1a10",
    fontSize: 14,
  },
  bubbleAge: {
    color: "#666",
    fontSize: 10,
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#2a2a3a",
    backgroundColor: "#161622",
  },
  actionBtn: {
    flexGrow: 1,
    backgroundColor: "#232336",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    minWidth: "45%",
  },
  actionBtnDisabled: {
    opacity: 0.4,
  },
  actionText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
});
