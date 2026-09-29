import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Character, WorldState } from "../types";
import { GigDef } from "../data/gigs";
import { Listing, Requirement, canApply, canGig, gigCap, gigReqs, requirements } from "../engine/jobs";
import { effectiveSalary, takeHomePay } from "../engine/lifeEngine";
import ModalBase from "./ModalBase";
import Button from "./Button";
import Chip from "./Chip";
import { colors, fonts, fontSize, radii, spacing } from "../theme";

const noFocusRing = { outlineStyle: "none", outlineWidth: 0 } as object;
const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

function Stars({ n }: { n: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons key={i} name={n >= i ? "star" : n >= i - 0.5 ? "star-half" : "star-outline"} size={13} color={colors.gold} />
      ))}
    </View>
  );
}

function Reqs({ items }: { items: Requirement[] }) {
  return (
    <View style={{ gap: 6 }}>
      {items.map((r) => (
        <View key={r.label} style={styles.reqRow}>
          <Ionicons name={r.met ? "checkmark-circle" : "close-circle"} size={18} color={r.met ? colors.primary : colors.danger} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.reqLabel, !r.met && { color: colors.danger }]}>{r.label}</Text>
            {!r.met && r.note ? <Text style={styles.reqNote}>{r.note}</Text> : null}
          </View>
        </View>
      ))}
    </View>
  );
}

// The popup behind tapping a job: who the employer is, what it pays, what it
// asks of you (checked live), what a day looks like - and Apply.
export function JobDetailModal({
  listing,
  character,
  world,
  onClose,
  onApply,
}: {
  listing: Listing;
  character: Character;
  world: WorldState;
  onClose: () => void;
  onApply: () => void;
}) {
  const { height } = useWindowDimensions();
  const job = listing.job;
  const co = job.company!;
  const region = character.originRegion;
  const gross = effectiveSalary(job, world, region);
  const net = takeHomePay(gross, region);
  const can = canApply(character, listing);
  const reqs = requirements(character, job);
  const diff = listing.difficulty;
  const compet = diff >= 70 ? "Very competitive" : diff >= 45 ? "Competitive" : diff >= 25 ? "Some competition" : "Easy to get into";
  return (
    <ModalBase icon="briefcase" iconColor={colors.smarts}>
      <ScrollView style={[{ maxHeight: height * 0.7 }, noFocusRing]} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{job.title}</Text>
        <View style={styles.coRow}>
          <Text style={styles.coName}>{co.name}</Text>
          <Stars n={co.stars} />
        </View>
        <View style={styles.chips}>
          <Chip label={co.size.toUpperCase()} color={colors.smarts} />
          <Chip label={co.industry.toUpperCase()} color={colors.looks} />
          <Chip label={job.kind === "parttime" ? "PART-TIME" : "FULL-TIME"} color={colors.primary} />
        </View>
        <Text style={styles.blurb}>{co.blurb}</Text>

        <View style={styles.tiles}>
          <View style={styles.tile}>
            <Text style={styles.tileLabel}>Pay</Text>
            <Text style={styles.tileValue}>{money(gross)}</Text>
            <Text style={styles.tileSub}>per year · {money(net)} after tax</Text>
          </View>
          <View style={styles.tile}>
            <Text style={styles.tileLabel}>Hours</Text>
            <Text style={styles.tileValue}>{job.hours ?? 40}</Text>
            <Text style={styles.tileSub}>per week</Text>
          </View>
        </View>

        <Text style={styles.heading}>What they ask for</Text>
        <Reqs items={reqs} />
        <Text style={styles.note}>{compet} - about {Math.max(1, Math.round(diff / 12))} strong candidates for every opening.</Text>

        {job.day ? (
          <>
            <Text style={styles.heading}>A typical day</Text>
            <Text style={styles.body}>{job.day}</Text>
          </>
        ) : null}
        {job.growth ? (
          <>
            <Text style={styles.heading}>Where it leads</Text>
            <Text style={styles.body}>{job.growth}</Text>
          </>
        ) : null}

        <Text style={styles.heading}>Working here</Text>
        <Text style={styles.body}>{co.culture}</Text>
        <Text style={[styles.body, { marginTop: 4 }]}>Commute: {co.commute}.</Text>
        <View style={[styles.chips, { marginTop: spacing.sm }]}>
          {co.benefits.map((b) => (
            <Chip key={b} label={b} color={colors.happiness} />
          ))}
        </View>

        {!can.ok && can.reason ? <Text style={styles.blocked}>{can.reason}</Text> : null}
      </ScrollView>
      <View style={styles.actions}>
        <Button label="Close" variant="ghost" onPress={onClose} style={{ flex: 1 }} />
        <Button label="Apply" icon="paper-plane" variant="primary" disabled={!can.ok} onPress={onApply} style={{ flex: 1 }} />
      </View>
    </ModalBase>
  );
}

// The same idea for an odd job: no company, no interview - just do it.
export function GigDetailModal({
  gig,
  character,
  onClose,
  onDo,
}: {
  gig: GigDef;
  character: Character;
  onClose: () => void;
  onDo: () => void;
}) {
  const can = canGig(character, gig);
  const reqs = gigReqs(character, gig);
  const left = Math.max(0, gigCap(character) - (character.gigsThisYear ?? 0));
  return (
    <ModalBase icon={gig.icon as keyof typeof Ionicons.glyphMap} iconColor={colors.happiness}>
      <Text style={styles.title}>{gig.label}</Text>
      <View style={styles.chips}>
        <Chip label="GIG" color={colors.happiness} />
        <Chip label={`${left} LEFT THIS YEAR`} color={colors.smarts} />
      </View>
      <Text style={styles.blurb}>{gig.blurb}</Text>
      <Text style={styles.heading}>Pay</Text>
      <Text style={styles.body}>
        Roughly {money(Math.max(0, gig.pay[0]))} - {money(gig.pay[1])} a go, more the better you are at it and the better known you are. No application, no boss.
      </Text>
      <Text style={styles.heading}>What it takes</Text>
      <Reqs items={reqs} />
      {!can.ok && can.reason ? <Text style={styles.blocked}>{can.reason}</Text> : null}
      <View style={styles.actions}>
        <Button label="Close" variant="ghost" onPress={onClose} style={{ flex: 1 }} />
        <Button label="Do it" icon="flash" variant="primary" disabled={!can.ok} onPress={onDo} style={{ flex: 1 }} />
      </View>
    </ModalBase>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.textPrimary, fontFamily: fonts.extraBold, fontSize: fontSize.xxl - 4, textAlign: "center", marginTop: spacing.sm },
  coRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 2, marginBottom: spacing.sm },
  coName: { color: colors.textSecondary, fontFamily: fonts.bold, fontSize: fontSize.base },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "center", marginBottom: spacing.sm },
  blurb: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fontSize.md, lineHeight: 20, textAlign: "center", marginBottom: spacing.md },
  tiles: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.sm },
  tile: { flex: 1, backgroundColor: colors.shade, borderRadius: radii.md, padding: spacing.md },
  tileLabel: { color: colors.textSecondary, fontFamily: fonts.semiBold, fontSize: fontSize.sm },
  tileValue: { color: colors.textPrimary, fontFamily: fonts.extraBold, fontSize: fontSize.xl, marginTop: 2 },
  tileSub: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: fontSize.xs },
  heading: { color: colors.textMuted, fontFamily: fonts.bold, fontSize: fontSize.sm, textTransform: "uppercase", marginTop: spacing.md, marginBottom: 6 },
  body: { color: colors.textPrimary, fontFamily: fonts.regular, fontSize: fontSize.md, lineHeight: 20 },
  note: { color: colors.textMuted, fontFamily: fonts.semiBold, fontSize: fontSize.sm, marginTop: spacing.sm },
  reqRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  reqLabel: { color: colors.textPrimary, fontFamily: fonts.semiBold, fontSize: fontSize.md },
  reqNote: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: fontSize.sm },
  blocked: { color: colors.danger, fontFamily: fonts.semiBold, fontSize: fontSize.md, marginTop: spacing.md },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
});
