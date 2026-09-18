import React from "react";
import { StyleSheet, Text, View } from "react-native";

const COLORS: Record<string, string> = {
  Health: "#e74c3c",
  Happiness: "#f1c40f",
  Smarts: "#3498db",
  Looks: "#9b59b6",
};

export default function StatBar({ label, value }: { label: string; value: number }) {
  const color = COLORS[label] ?? "#2ecc71";
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.value}>{Math.round(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  label: {
    width: 84,
    fontSize: 13,
    color: "#ddd",
    fontWeight: "600",
  },
  track: {
    flex: 1,
    height: 12,
    backgroundColor: "#2b2b3a",
    borderRadius: 6,
    overflow: "hidden",
    marginHorizontal: 8,
  },
  fill: {
    height: "100%",
    borderRadius: 6,
  },
  value: {
    width: 32,
    textAlign: "right",
    fontSize: 13,
    color: "#fff",
    fontWeight: "700",
  },
});
