import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Character, LifeEvent } from "../types";

export default function EventModal({
  event,
  character,
  onChoose,
}: {
  event: LifeEvent;
  character: Character;
  onChoose: (choiceIndex: number) => void;
}) {
  return (
    <Modal transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.text}>{event.text(character)}</Text>
          <View style={styles.choices}>
            {event.choices?.map((choice, i) => (
              <TouchableOpacity accessibilityRole="button" key={i} style={styles.choiceBtn} onPress={() => onChoose(i)}>
                <Text style={styles.choiceText}>{choice.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#1e1e2c",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 420,
    borderWidth: 1,
    borderColor: "#3a3a4d",
  },
  text: {
    color: "#fff",
    fontSize: 17,
    lineHeight: 24,
    marginBottom: 20,
  },
  choices: {
    gap: 10,
  },
  choiceBtn: {
    backgroundColor: "#2ecc71",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  choiceText: {
    color: "#0b1a10",
    fontWeight: "700",
    fontSize: 15,
    textAlign: "center",
  },
});
