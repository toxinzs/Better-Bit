import React, { useMemo, useRef, useState } from "react";
import { PanResponder, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ModalBase from "./ModalBase";
import { Pop } from "../motion";
import { colors, fonts, fontSize, radii, spacing } from "../theme";

// A money slider: drag the track (or use the steppers / quick chips) to pick
// an amount. The track is logarithmic when the range is wide, so $20 and
// $20,000 are both easy to land on.

function niceStep(v: number): number {
  if (v < 50) return 1;
  if (v < 200) return 5;
  if (v < 1000) return 10;
  if (v < 5000) return 50;
  if (v < 20000) return 100;
  return 500;
}

const TRACK_H = 44;
const THUMB = 26;

export default function AmountPicker({
  title,
  subtitle,
  min,
  max,
  initial,
  confirmLabel,
  caption,
  onConfirm,
  onCancel,
}: {
  title: string;
  subtitle?: string;
  min: number;
  max: number;
  initial?: number;
  confirmLabel: string;
  // an extra line under the amount that reacts to it (e.g. "Unlikely")
  caption?: (amount: number) => { text: string; color?: string } | null;
  onConfirm: (amount: number) => void;
  onCancel: () => void;
}) {
  const lo = Math.max(1, Math.min(min, max));
  const hi = Math.max(lo, max);
  const logScale = hi / lo > 12;

  const toAmount = (t: number) => {
    const raw = logScale ? lo * Math.pow(hi / lo, t) : lo + (hi - lo) * t;
    const step = niceStep(raw);
    return Math.min(hi, Math.max(lo, Math.round(raw / step) * step));
  };
  const toT = (amt: number) => {
    if (hi === lo) return 1;
    return logScale ? Math.log(amt / lo) / Math.log(hi / lo) : (amt - lo) / (hi - lo);
  };

  const [amount, setAmount] = useState(() => Math.min(hi, Math.max(lo, initial ?? Math.round(toAmount(0.35)))));
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);
  widthRef.current = width;
  const startX = useRef(0);

  const setFromX = (x: number) => {
    const w = widthRef.current;
    if (w <= 0) return;
    setAmount(toAmount(Math.min(1, Math.max(0, x / w))));
  };

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e) => {
          startX.current = e.nativeEvent.locationX;
          setFromX(startX.current);
        },
        onPanResponderMove: (_e, g) => setFromX(startX.current + g.dx),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lo, hi, logScale],
  );

  const bump = (dir: 1 | -1) => {
    const step = niceStep(amount + (dir > 0 ? 0 : -1)) * (amount > 1000 ? 2 : 1);
    setAmount((a) => Math.min(hi, Math.max(lo, a + dir * step)));
  };

  const t = toT(amount);
  const cap = caption?.(amount);
  const chips = [0.25, 0.5, 1].map((f) => ({
    label: f === 1 ? "Max" : `${f * 100}%`,
    value: Math.min(hi, Math.max(lo, Math.round((hi * f) / niceStep(hi * f)) * niceStep(hi * f))),
  }));

  return (
    <ModalBase icon="cash">
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      <Pop trigger={Math.round(amount / Math.max(1, niceStep(amount)) / 3)} strength={1.06}>
        <Text style={styles.amount}>${amount.toLocaleString()}</Text>
      </Pop>
      <Text style={[styles.caption, cap?.color ? { color: cap.color } : null]}>{cap ? cap.text : " "}</Text>

      <View style={styles.sliderRow}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Decrease" style={styles.stepBtn} onPress={() => bump(-1)}>
          <Ionicons name="remove" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View
          style={[styles.track, { touchAction: "none" } as object]}
          onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
          {...pan.panHandlers}
          accessibilityRole="adjustable"
          accessibilityValue={{ min: lo, max: hi, now: amount }}
        >
          <View pointerEvents="none" style={styles.rail}>
            <View style={[styles.railFill, { width: `${t * 100}%` }]} />
          </View>
          <View pointerEvents="none" style={[styles.thumb, { left: Math.max(0, Math.min(width - THUMB, t * width - THUMB / 2)) }]} />
        </View>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Increase" style={styles.stepBtn} onPress={() => bump(1)}>
          <Ionicons name="add" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
      <View style={styles.rangeRow}>
        <Text style={styles.rangeText}>${lo.toLocaleString()}</Text>
        <Text style={styles.rangeText}>${hi.toLocaleString()}</Text>
      </View>

      <View style={styles.chips}>
        {chips.map((c) => (
          <TouchableOpacity key={c.label} accessibilityRole="button" style={styles.chip} onPress={() => setAmount(c.value)}>
            <Text style={styles.chipText}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity accessibilityRole="button" activeOpacity={0.8} style={styles.confirm} onPress={() => onConfirm(amount)}>
        <Text style={styles.confirmText}>{confirmLabel}</Text>
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" activeOpacity={0.7} style={styles.cancel} onPress={onCancel}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </ModalBase>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.textPrimary, fontFamily: fonts.extraBold, fontSize: fontSize.xl, textAlign: "center" },
  subtitle: { color: colors.textSecondary, fontFamily: fonts.semiBold, fontSize: fontSize.md, textAlign: "center", marginTop: 4 },
  amount: {
    color: colors.primary,
    fontFamily: fonts.extraBold,
    fontSize: 44,
    textAlign: "center",
    marginTop: spacing.lg,
  },
  caption: { color: colors.textSecondary, fontFamily: fonts.bold, fontSize: fontSize.md, textAlign: "center", minHeight: 20, marginBottom: spacing.md },
  sliderRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
  },
  track: { flex: 1, height: TRACK_H, justifyContent: "center" },
  rail: { height: 8, borderRadius: 4, backgroundColor: colors.surfaceRaised, overflow: "hidden" },
  railFill: { height: "100%", backgroundColor: colors.primary, borderRadius: 4 },
  thumb: {
    position: "absolute",
    top: (TRACK_H - THUMB) / 2,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: colors.textPrimary,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  rangeRow: { flexDirection: "row", justifyContent: "space-between", marginHorizontal: 48, marginTop: 2 },
  rangeText: { color: colors.textMuted, fontFamily: fonts.semiBold, fontSize: fontSize.xs },
  chips: { flexDirection: "row", gap: spacing.sm, justifyContent: "center", marginTop: spacing.md },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fontSize.sm },
  confirm: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  confirmText: { color: colors.primaryText, fontFamily: fonts.bold, fontSize: fontSize.base },
  cancel: { marginTop: spacing.sm, alignItems: "center", paddingVertical: spacing.sm },
  cancelText: { color: colors.textSecondary, fontFamily: fonts.semiBold, fontSize: fontSize.md },
});
