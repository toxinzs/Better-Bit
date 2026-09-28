import React, { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, Easing, StyleProp, StyleSheet, TextStyle, View, ViewStyle } from "react-native";
import { colors, fonts, fontSize } from "./theme";

// Small, reusable motion helpers so screens can feel alive without each one
// hand-rolling Animated code.

// Fades and slides its children up when it mounts. Give lists an increasing
// `delay` (index * ~45ms) for a staggered cascade. Change `key` to replay.
export function FadeInUp({
  children,
  delay = 0,
  distance = 14,
  duration = 320,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  distance?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [v, delay, duration]);
  return (
    <Animated.View
      style={[
        style,
        { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }] },
      ]}
    >
      {children}
    </Animated.View>
  );
}

// A quick springy scale pulse whenever `trigger` changes.
export function Pop({
  trigger,
  children,
  strength = 1.25,
  style,
}: {
  trigger: unknown;
  children: React.ReactNode;
  strength?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    scale.setValue(strength);
    Animated.spring(scale, { toValue: 1, friction: 4, tension: 140, useNativeDriver: true }).start();
  }, [trigger, scale, strength]);
  return <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>;
}

// A number that counts up or down to its new value.
export function CountUp({
  value,
  prefix = "$",
  style,
  duration = 700,
}: {
  value: number;
  prefix?: string;
  style?: StyleProp<TextStyle>;
  duration?: number;
}) {
  const anim = useRef(new Animated.Value(value)).current;
  const [shown, setShown] = useState(value);
  useEffect(() => {
    const id = anim.addListener(({ value: v }) => setShown(Math.round(v)));
    Animated.timing(anim, { toValue: value, duration, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    return () => anim.removeListener(id);
  }, [value, anim, duration]);
  return (
    <Animated.Text style={style}>
      {shown < 0 ? "-" : ""}
      {prefix}
      {Math.abs(shown).toLocaleString()}
    </Animated.Text>
  );
}

// Shows "+5" / "-$300" floating up and fading whenever `value` changes.
export function FloatingDelta({
  value,
  format = (n: number) => `${n > 0 ? "+" : "-"}${Math.abs(n)}`,
  goodIsUp = true,
  style,
}: {
  value: number;
  format?: (delta: number) => string;
  goodIsUp?: boolean;
  style?: StyleProp<TextStyle>;
}) {
  const prev = useRef(value);
  const [item, setItem] = useState<{ key: number; text: string; color: string } | null>(null);
  useEffect(() => {
    const diff = Math.round(value - prev.current);
    prev.current = value;
    if (diff === 0) return;
    const good = goodIsUp ? diff > 0 : diff < 0;
    setItem({ key: Date.now(), text: format(diff), color: good ? colors.primary : colors.danger });
  }, [value, format, goodIsUp]);
  if (!item) return null;
  return <FloatText key={item.key} text={item.text} color={item.color} style={style} />;
}

function FloatText({ text, color, style }: { text: string; color: string; style?: StyleProp<TextStyle> }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 1100, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [v]);
  return (
    <Animated.Text
      pointerEvents="none"
      style={[
        styles.float,
        style,
        {
          color,
          opacity: v.interpolate({ inputRange: [0, 0.15, 0.7, 1], outputRange: [0, 1, 1, 0] }),
          transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -22] }) }],
        },
      ]}
    >
      {text}
    </Animated.Text>
  );
}

// A brief color flash over its children when `trigger` changes.
export function Flash({ trigger, color, children, style }: { trigger: unknown; color: string; children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const v = useRef(new Animated.Value(0)).current;
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    v.setValue(1);
    Animated.timing(v, { toValue: 0, duration: 700, useNativeDriver: true }).start();
  }, [trigger, v]);
  return (
    <View style={style}>
      {children}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: color, opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0, 0.35] }), borderRadius: 999 }]} />
    </View>
  );
}

// A burst of falling confetti for birthdays and milestones.
export function Confetti({ onDone }: { onDone?: () => void }) {
  const { width, height } = Dimensions.get("window");
  const palette = [colors.primary, colors.gold, colors.love, colors.smarts, colors.looks, colors.happiness];
  const parts = useRef(
    Array.from({ length: 34 }, (_, i) => ({
      x: Math.random() * width,
      drift: (Math.random() - 0.5) * 140,
      delay: Math.random() * 350,
      duration: 1500 + Math.random() * 900,
      size: 6 + Math.random() * 6,
      spin: (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 360),
      color: palette[i % palette.length],
      round: i % 3 === 0,
      v: new Animated.Value(0),
    })),
  ).current;

  useEffect(() => {
    Animated.parallel(
      parts.map((p) =>
        Animated.timing(p.v, { toValue: 1, duration: p.duration, delay: p.delay, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ),
    ).start(() => onDone?.());
  }, [parts, onDone]);

  return (
    <View pointerEvents="none" style={styles.confetti}>
      {parts.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: "absolute",
            left: p.x,
            top: -20,
            width: p.size,
            height: p.round ? p.size : p.size * 1.6,
            borderRadius: p.round ? p.size / 2 : 2,
            backgroundColor: p.color,
            opacity: p.v.interpolate({ inputRange: [0, 0.1, 0.85, 1], outputRange: [0, 1, 1, 0] }),
            transform: [
              { translateY: p.v.interpolate({ inputRange: [0, 1], outputRange: [0, height * 0.85] }) },
              { translateX: p.v.interpolate({ inputRange: [0, 1], outputRange: [0, p.drift] }) },
              { rotate: p.v.interpolate({ inputRange: [0, 1], outputRange: ["0deg", `${p.spin}deg`] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  float: {
    position: "absolute",
    right: 0,
    top: -2,
    fontFamily: fonts.extraBold,
    fontSize: fontSize.md,
  },
  confetti: {
    ...StyleSheet.absoluteFill,
    zIndex: 50,
    overflow: "hidden",
  },
});
