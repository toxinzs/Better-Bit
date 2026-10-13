import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";
import GradientBg from "./GradientBg";
import { Scene } from "../data/eventScenes";
import { colors, fonts, fontSize, mixColors, radii, spacing } from "../theme";

// The picture at the top of a life-event popup: a tinted gradient, a few soft shapes and a big
// icon for the kind of moment it is.
let uid = 0;
export default function SceneBanner({ scene, age }: { scene: Scene; age: number }) {
  const id = React.useRef(`scene-${uid++}`).current;
  const from = mixColors(colors.surface, scene.color, 0.38);
  const to = mixColors(colors.surface, scene.color, 0.1);
  return (
    <GradientBg id={id} from={from} to={to} radius={radii.lg} style={styles.wrap}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%" viewBox="0 0 300 76" preserveAspectRatio="xMaxYMid slice">
          <Circle cx={262} cy={28} r={46} fill={scene.color} opacity={0.16} />
          <Circle cx={226} cy={64} r={26} fill={scene.color} opacity={0.12} />
          <Circle cx={292} cy={72} r={20} fill={scene.color} opacity={0.14} />
          <Circle cx={188} cy={14} r={8} fill={scene.color} opacity={0.2} />
        </Svg>
      </View>
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: scene.color + "33", borderColor: scene.color + "66" }]}>
          <Ionicons name={scene.icon as keyof typeof Ionicons.glyphMap} size={22} color={scene.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.label, { color: scene.color }]}>{scene.label.toUpperCase()}</Text>
          <Text style={styles.age}>Age {age}</Text>
        </View>
        <Ionicons name={scene.icon as keyof typeof Ionicons.glyphMap} size={46} color={scene.color} style={styles.big} />
      </View>
    </GradientBg>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md },
  iconWrap: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  label: { fontFamily: fonts.extraBold, fontSize: fontSize.sm, letterSpacing: 1.4 },
  age: { color: colors.textSecondary, fontFamily: fonts.semiBold, fontSize: fontSize.sm, marginTop: 1 },
  big: { opacity: 0.28, marginRight: spacing.xs },
});
