import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ModalBase from "./ModalBase";
import { FadeInUp } from "../motion";
import { colors, fonts, fontSize, radii, spacing } from "../theme";
import { Notice } from "../types";

const TONE: Record<Notice["tone"], { color: string; label: string }> = {
  good: { color: colors.primary, label: "GOOD NEWS" },
  bad: { color: colors.danger, label: "BAD NEWS" },
  warn: { color: colors.gold, label: "HEADS UP" },
  info: { color: colors.smarts, label: "NEWS" },
};

// A big thing happened: say so plainly, on its own, so it can't be missed.
export default function NoticeModal({ notice, remaining, onClose }: { notice: Notice; remaining: number; onClose: () => void }) {
  const t = TONE[notice.tone];
  return (
    <ModalBase>
      <View style={styles.center}>
        <View style={[styles.iconWrap, { backgroundColor: t.color + "22", borderColor: t.color }]}>
          <Ionicons name={notice.icon as keyof typeof Ionicons.glyphMap} size={34} color={t.color} />
        </View>
        <Text style={[styles.kicker, { color: t.color }]}>{t.label}</Text>
        <FadeInUp delay={80} distance={8}>
          <Text style={styles.title}>{notice.title}</Text>
        </FadeInUp>
        <FadeInUp delay={200} distance={8}>
          <Text style={styles.text}>{notice.text}</Text>
        </FadeInUp>
      </View>
      <TouchableOpacity accessibilityRole="button" activeOpacity={0.8} style={[styles.btn, { backgroundColor: t.color }]} onPress={onClose}>
        <Text style={styles.btnText}>{remaining > 0 ? `Next (${remaining} more)` : "Continue"}</Text>
      </TouchableOpacity>
    </ModalBase>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", marginBottom: spacing.lg },
  iconWrap: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", borderWidth: 2, marginBottom: spacing.md },
  kicker: { fontFamily: fonts.bold, fontSize: fontSize.xs, letterSpacing: 1.5, marginBottom: 4 },
  title: { color: colors.textPrimary, fontFamily: fonts.extraBold, fontSize: fontSize.xl, textAlign: "center", marginBottom: spacing.sm },
  text: { color: colors.textSecondary, fontFamily: fonts.semiBold, fontSize: fontSize.base, lineHeight: 23, textAlign: "center" },
  btn: { borderRadius: radii.md, paddingVertical: spacing.md, alignItems: "center" },
  btnText: { color: "#0b1220", fontFamily: fonts.bold, fontSize: fontSize.base },
});
