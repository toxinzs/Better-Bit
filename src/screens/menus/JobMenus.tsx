import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGameStore } from "../../state/gameStore";
import MenuScreen from "../../nav/MenuScreen";
import Card from "../../components/Card";
import Chip from "../../components/Chip";
import Button from "../../components/Button";
import SegmentedControl from "../../components/SegmentedControl";
import { GigDetailModal, JobDetailModal } from "../../components/JobDetailModal";
import { FadeInUp } from "../../motion";
import { GIGS, GigDef } from "../../data/gigs";
import { MAX_APPS_PER_YEAR, Listing, canApply, canGig, gigCap, gigGateAge, listingsFor } from "../../engine/jobs";
import { effectiveSalary, takeHomePay } from "../../engine/lifeEngine";
import { getRegion } from "../../data/regions";
import { colors, fonts, fontSize, radii, spacing } from "../../theme";
import { ms } from "./menuStyles";

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;
type Tab = "parttime" | "fulltime" | "gigs";

function repWord(r: number) {
  return r >= 75 ? "In demand" : r >= 50 ? "Well known" : r >= 25 ? "Getting known" : "Unknown";
}

export function FindWorkMenu() {
  const character = useGameStore((s) => s.character);
  const world = useGameStore((s) => s.worldState);
  const startApplication = useGameStore((s) => s.startApplication);
  const doGig = useGameStore((s) => s.doGig);
  const [tab, setTab] = useState<Tab>(character && character.age < 18 ? "parttime" : "fulltime");
  const [openListing, setOpenListing] = useState<Listing | null>(null);
  const [openGig, setOpenGig] = useState<GigDef | null>(null);

  const age = character?.age ?? 0;
  const parttime = useMemo(() => (character ? listingsFor(character, world, "parttime") : []), [character?.age, character?.avatarSeed, world.activeCondition]);
  const fulltime = useMemo(() => (character ? listingsFor(character, world, "fulltime") : []), [character?.age, character?.avatarSeed, world.activeCondition]);
  if (!character) return null;
  const wa = getRegion(character.originRegion).workAge;
  const list = tab === "parttime" ? parttime : fulltime;
  const tooYoung = tab === "parttime" ? age < wa.parttime : tab === "fulltime" ? age < wa.fulltime : age < wa.light;

  const region = character.originRegion;
  return (
    <MenuScreen title="Find Work" icon="search" color={colors.smarts} scroll={false}>
      <SegmentedControl
        options={[
          { key: "parttime", label: "Part-time" },
          { key: "fulltime", label: "Full-time" },
          { key: "gigs", label: "Gigs" },
        ]}
        value={tab}
        onChange={setTab}
        accent={colors.smarts}
      />
      <ScrollBody>
        <Card>
          <Text style={ms.note}>
            {getRegion(region).label}: odd jobs from {wa.light}, part-time jobs from {wa.parttime}, full-time from {wa.fulltime}.
            {tab === "gigs"
              ? ` Gigs this year: ${character.gigsThisYear ?? 0}/${gigCap(character)} · Reputation: ${repWord(character.gigRep ?? 0)}.`
              : ` Applications this year: ${character.appsThisYear ?? 0}/${MAX_APPS_PER_YEAR}.`}
          </Text>
        </Card>

        {tooYoung ? (
          <Card>
            <Text style={ms.note}>
              You're too young for {tab === "gigs" ? "odd jobs" : tab === "parttime" ? "a part-time job" : "a full-time career"} where you live. It opens at {tab === "gigs" ? wa.light : tab === "parttime" ? wa.parttime : wa.fulltime}.
            </Text>
          </Card>
        ) : tab === "gigs" ? (
          GIGS.map((g, i) => {
            const can = canGig(character, g);
            const locked = age < gigGateAge(character, g);
            return (
              <FadeInUp key={g.key} delay={Math.min(i, 8) * 40}>
                <TouchableOpacity accessibilityRole="button" activeOpacity={0.75} style={[styles.jobCard, !can.ok && { opacity: locked ? 0.4 : 0.75 }]} onPress={() => setOpenGig(g)}>
                  <View style={[styles.jobIcon, { backgroundColor: colors.happiness + "22" }]}>
                    <Ionicons name={g.icon as keyof typeof Ionicons.glyphMap} size={20} color={colors.happiness} />
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={styles.jobTitle}>{g.label}</Text>
                    <Text style={styles.jobSub} numberOfLines={1}>
                      {locked ? `Opens at ${gigGateAge(character, g)}` : `${money(Math.max(0, g.pay[0]))}-${money(g.pay[1])} a gig`}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </FadeInUp>
            );
          })
        ) : list.length === 0 ? (
          <Card>
            <Text style={ms.note}>Nothing to show yet.</Text>
          </Card>
        ) : (
          list.map((l, i) => {
            const g = effectiveSalary(l.job, world, region);
            const can = canApply(character, l);
            const co = l.job.company!;
            return (
              <FadeInUp key={l.key} delay={Math.min(i, 8) * 40}>
                <TouchableOpacity accessibilityRole="button" activeOpacity={0.75} style={[styles.jobCard, !can.ok && { opacity: 0.7 }]} onPress={() => setOpenListing(l)}>
                  <View style={styles.jobIcon}>
                    <Ionicons name="briefcase-outline" size={18} color={colors.smarts} />
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={styles.jobTitle}>{l.job.title}</Text>
                    <Text style={styles.jobSub} numberOfLines={1}>
                      {co.name}
                    </Text>
                    <View style={styles.chipRow}>
                      {!can.ok ? <Chip label="REQUIREMENTS" color={colors.danger} /> : <Chip label="QUALIFIED" color={colors.primary} />}
                      {l.job.hours ? <Text style={styles.jobSub}>{l.job.hours} hrs/wk</Text> : null}
                    </View>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.jobSalary}>{money(g)}</Text>
                    <Text style={styles.jobPer}>/yr · {money(takeHomePay(g, region))} net</Text>
                  </View>
                </TouchableOpacity>
              </FadeInUp>
            );
          })
        )}
      </ScrollBody>

      {openListing && (
        <JobDetailModal
          listing={openListing}
          character={character}
          world={world}
          onClose={() => setOpenListing(null)}
          onApply={() => {
            const l = openListing;
            setOpenListing(null);
            startApplication(l);
          }}
        />
      )}
      {openGig && (
        <GigDetailModal
          gig={openGig}
          character={character}
          onClose={() => setOpenGig(null)}
          onDo={() => {
            const g = openGig;
            setOpenGig(null);
            doGig(g.key);
          }}
        />
      )}
    </MenuScreen>
  );
}

function ScrollBody({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }} showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  );
}

// ---------------------------------------------------------------- occupation

function JobCard({ title, kind, job, gross, net, onQuit }: { title: string; kind: "parttime" | "fulltime"; job: NonNullable<ReturnType<typeof useGameStore.getState>["character"]>["job"]; gross: number; net: number; onQuit: () => void }) {
  if (!job) return null;
  const co = job.company;
  return (
    <Card>
      <Text style={ms.subheading}>{title}</Text>
      <Text style={styles.heroTitle}>{job.title}</Text>
      {co ? <Text style={styles.coName}>{co.name} · {co.industry}</Text> : null}
      <View style={styles.tiles}>
        <View style={styles.tile}>
          <Text style={styles.tileLabel}>Gross</Text>
          <Text style={styles.tileValue}>{money(gross)}</Text>
          <Text style={styles.tileSub}>per year</Text>
        </View>
        <View style={styles.tile}>
          <Text style={styles.tileLabel}>Take-home</Text>
          <Text style={[styles.tileValue, { color: colors.primary }]}>{money(net)}</Text>
          <Text style={styles.tileSub}>{job.hours ? `${job.hours} hrs/wk` : "after tax"}</Text>
        </View>
      </View>
      {co ? <Text style={ms.note}>{co.culture}</Text> : null}
      <Button label={kind === "parttime" ? "Quit part-time job" : "Quit job"} icon="exit" variant="danger" onPress={onQuit} style={ms.inlineBtn} />
    </Card>
  );
}

export function OccupationMenu() {
  const character = useGameStore((s) => s.character);
  const world = useGameStore((s) => s.worldState);
  const quitWork = useGameStore((s) => s.quitWork);
  if (!character) return null;
  const region = character.originRegion;
  const gross = character.job ? effectiveSalary(character.job, world, region) : 0;
  const pgross = character.partTime ? effectiveSalary(character.partTime, world, region) : 0;
  const nothing = !character.job && !character.partTime;
  return (
    <MenuScreen title="Occupation" icon="briefcase" color={colors.smarts}>
      {character.inJail && (
        <Card>
          <Text style={ms.note}>You're incarcerated - you can't work from behind bars.</Text>
        </Card>
      )}
      {character.job && <JobCard title="Full-time job" kind="fulltime" job={character.job} gross={gross} net={takeHomePay(gross, region)} onQuit={() => quitWork("fulltime")} />}
      {character.partTime && <JobCard title="Part-time job" kind="parttime" job={character.partTime} gross={pgross} net={takeHomePay(pgross, region)} onQuit={() => quitWork("parttime")} />}
      {nothing && !character.inJail && (
        <Card>
          <Text style={styles.heroTitle}>Unemployed</Text>
          <Text style={ms.note}>Head to Find Work for part-time jobs, full-time careers and quick gigs.</Text>
        </Card>
      )}
      <Card>
        <Text style={ms.subheading}>Odd jobs</Text>
        <View style={ms.statRow}>
          <Text style={ms.listingName}>Reputation</Text>
          <Text style={ms.ownedValue}>{repWord(character.gigRep ?? 0)}</Text>
        </View>
        <View style={[ms.statRow, { borderBottomWidth: 0, marginBottom: 0, paddingBottom: 0 }]}>
          <Text style={ms.listingName}>Gigs this year</Text>
          <Text style={ms.ownedValue}>
            {character.gigsThisYear ?? 0}/{gigCap(character)}
          </Text>
        </View>
      </Card>
      {(character.jobHistory?.length ?? 0) > 0 && (
        <Card>
          <Text style={ms.subheading}>Work history</Text>
          {character.jobHistory!
            .slice()
            .reverse()
            .slice(0, 8)
            .map((h, i) => (
              <View key={i} style={ms.rowBlock}>
                <Text style={ms.ownedName}>{h.title}</Text>
                <Text style={ms.listingSub}>
                  {h.company ? `${h.company} · ` : ""}age {h.from}-{h.to === -1 ? "now" : h.to}
                </Text>
              </View>
            ))}
        </Card>
      )}
      {character.criminalRecord && (
        <Card>
          <Text style={[ms.note, { color: colors.danger }]}>Criminal record - some employers won't consider you.</Text>
        </Card>
      )}
    </MenuScreen>
  );
}

const styles = StyleSheet.create({
  jobCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md + 2,
    marginBottom: spacing.sm,
  },
  jobIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.smarts + "1f", alignItems: "center", justifyContent: "center" },
  jobTitle: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fontSize.base + 1 },
  jobSub: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: fontSize.sm },
  chipRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  jobSalary: { color: colors.primary, fontFamily: fonts.extraBold, fontSize: fontSize.lg },
  jobPer: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: fontSize.xs },
  heroTitle: { color: colors.textPrimary, fontFamily: fonts.extraBold, fontSize: fontSize.xxl - 4 },
  coName: { color: colors.textSecondary, fontFamily: fonts.semiBold, fontSize: fontSize.md, marginBottom: spacing.sm },
  tiles: { flexDirection: "row", gap: spacing.md, marginVertical: spacing.sm },
  tile: { flex: 1, backgroundColor: colors.shade, borderRadius: radii.md, padding: spacing.md },
  tileLabel: { color: colors.textSecondary, fontFamily: fonts.semiBold, fontSize: fontSize.sm },
  tileValue: { color: colors.textPrimary, fontFamily: fonts.extraBold, fontSize: fontSize.xl, marginTop: 2 },
  tileSub: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: fontSize.xs },
});
