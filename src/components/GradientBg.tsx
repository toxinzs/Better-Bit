import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

// A gradient-filled container built on react-native-svg (already a
// dependency) so there's no extra native module to worry about on web.
// `id` must be unique per on-screen instance.
export default function GradientBg({
  id,
  from,
  to,
  radius = 16,
  vertical = false,
  style,
  children,
}: {
  id: string;
  from: string;
  to: string;
  radius?: number;
  vertical?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  return (
    <View style={[{ borderRadius: radius, overflow: "hidden" }, style]}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id={id} x1="0" y1="0" x2={vertical ? "0" : "1"} y2="1">
              <Stop offset="0" stopColor={from} />
              <Stop offset="1" stopColor={to} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
        </Svg>
      </View>
      {children}
    </View>
  );
}
