import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, fontSize, radii } from "../theme";

export default function Chip({ label, color = colors.textSecondary }: { label: string; color?: string }) {
  return (
    <View style={[styles.chip, { backgroundColor: color + "22", borderColor: color + "55" }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: "flex-start",
  },
  text: {
    fontFamily: fonts.bold,
    fontSize: fontSize.xs,
  },
});
