import React, { useEffect, useRef } from "react";
import { Animated, Modal, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, shadow, spacing } from "../theme";

// Shared overlay/card/badge/entrance-animation chrome for every modal in
// the app - EventModal, ActionResultModal, NameBabyModal, WhatsNewModal
// were all independently copy-pasting this exact shape. Pass `icon` for
// the standard centered badge, or omit it and build your own header (see
// WhatsNewModal, whose header row is genuinely different).
export default function ModalBase({
  children,
  cardStyle,
  icon,
  iconColor = colors.gold,
}: {
  children: React.ReactNode;
  cardStyle?: StyleProp<ViewStyle>;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
}) {
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
        <Animated.View style={[styles.card, cardStyle, { opacity, transform: [{ scale }] }]}>
          {icon && (
            <View style={styles.badge}>
              <Ionicons name={icon} size={20} color={iconColor} />
            </View>
          )}
          {children}
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
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
});
