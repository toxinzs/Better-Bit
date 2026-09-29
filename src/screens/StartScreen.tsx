import React, { useMemo, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGameStore } from "../state/gameStore";
import Button from "../components/Button";
import Card from "../components/Card";
import WhatsNewModal from "../components/WhatsNewModal";
import { Appearance, Gender, RegionKey } from "../types";
import { randomFirstName, randomLastName } from "../data/names";
import { REGIONS } from "../data/regions";
import { citiesFor, cityByKey } from "../data/cities";
import {
  BUILDS, EYE_COLORS, FACIAL_HAIR, HAIR_COLORS, HAIR_COLOR_NAMES, HAIR_STYLES, HEIGHTS, SKIN_TONES, appearanceFromSeed,
} from "../data/appearance";
import { CLASSES } from "../data/traits";
import { quirkDef } from "../data/traits";
import { createCharacter } from "../engine/lifeEngine";
import { ageOf } from "../engine/people";
import { APP_VERSION } from "../version";
import { colors, fonts, fontSize, radii, spacing } from "../theme";
import Avatar from "../components/Avatar";
import GradientBg from "../components/GradientBg";
import ThemePicker from "../components/ThemePicker";
import { FadeInUp } from "../motion";

const GENDER_OPTIONS: { key: Gender; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "female", label: "Female", icon: "female" },
  { key: "male", label: "Male", icon: "male" },
  { key: "nonbinary", label: "Other", icon: "person" },
];

const REGION_OPTIONS = Object.values(REGIONS);
const FLAGS: Record<RegionKey, string> = { us: "🇺🇸", uk: "🇬🇧", nigeria: "🇳🇬", japan: "🇯🇵", brazil: "🇧🇷", canada: "🇨🇦", australia: "🇦🇺", germany: "🇩🇪", france: "🇫🇷", india: "🇮🇳", mexico: "🇲🇽", southkorea: "🇰🇷" };

const STEPS = ["Who are you?", "Where are you born?", "Your family", "How do you look?", "Ready?"] as const;

const PREVIEW_AGES = [1, 8, 16, 30, 55, 80];

export default function StartScreen() {
  const beginLife = useGameStore((s) => s.beginLife);
  const [step, setStep] = useState(-1); // -1 = landing
  const [gender, setGender] = useState<Gender>("female");
  const [region, setRegion] = useState<RegionKey>("us");
  const [cityKey, setCityKey] = useState<string | undefined>(undefined);
  const [firstName, setFirstName] = useState(() => randomFirstName("female", "us"));
  const [lastName, setLastName] = useState(() => randomLastName("us"));
  const [seed, setSeed] = useState(() => Date.now() % 999983);
  const [nonce, setNonce] = useState(0);
  const [appearance, setAppearance] = useState<Appearance>(() => appearanceFromSeed(Date.now() % 999983, "female", "us"));
  const [previewAge, setPreviewAge] = useState(16);
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [showThemes, setShowThemes] = useState(false);

  const setApp = (patch: Partial<Appearance>) => setAppearance((a) => ({ ...a, ...patch }));
  const rerollLook = () => setAppearance(appearanceFromSeed((Math.random() * 999983) | 0, gender, region));

  // the family you meet on step 3 is the family you get: built once from the
  // choices so far, rebuilt only if those change or you ask for another roll
  const family = useMemo(
    () => createCharacter(firstName.trim() || "Alex", lastName.trim() || "Smith", gender, region, seed, { appearance, birthCity: cityKey }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [firstName, lastName, gender, region, seed, nonce, cityKey],
  );

  const begin = () => {
    family.appearance = appearance;
    beginLife(family);
  };

  const chooseGender = (g: Gender) => {
    setGender(g);
    setAppearance(appearanceFromSeed(seed, g, region));
  };
  const chooseRegion = (r: RegionKey) => {
    setRegion(r);
    setAppearance(appearanceFromSeed(seed, gender, r));
  };

  if (step < 0) {
    return (
      <SafeAreaView style={styles.root}>
        <GradientBg id="startBg" from={colors.gradStart} to={colors.background} radius={0} vertical style={StyleSheet.absoluteFill} />
        <View style={styles.landing}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Change theme" activeOpacity={0.7} style={styles.themeBtn} onPress={() => setShowThemes(true)}>
            <Ionicons name="color-palette" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <View style={styles.logoWrap}>
            <View style={styles.logoBadge}>
              <Ionicons name="infinite" size={30} color={colors.primaryText} />
            </View>
            <Text style={styles.title}>Better Bit</Text>
            <Text style={styles.subtitle}>A life, from birth.</Text>
          </View>
          <View style={styles.previewWrap}>
            <Avatar character={{ gender, originRegion: region, avatarSeed: seed, appearance, age: 30 }} size={112} />
          </View>
          <Button label="Start a new life" icon="arrow-forward" variant="primary" size="lg" onPress={() => setStep(0)} style={styles.wide} />
          <TouchableOpacity accessibilityRole="button" activeOpacity={0.7} onPress={() => setShowWhatsNew(true)} style={styles.versionRow}>
            <Text style={styles.versionText}>v{APP_VERSION} · What's New</Text>
          </TouchableOpacity>
        </View>
        {showWhatsNew && <WhatsNewModal onClose={() => setShowWhatsNew(false)} />}
        {showThemes && <ThemePicker onClose={() => setShowThemes(false)} />}
      </SafeAreaView>
    );
  }

  const mother = family.relationships.find((r) => r.type === "mother");
  const father = family.relationships.find((r) => r.type === "father");
  const cls = CLASSES[family.background!.wealthClass];

  return (
    <SafeAreaView style={styles.root}>
      <GradientBg id="startBg2" from={colors.gradStart} to={colors.background} radius={0} vertical style={StyleSheet.absoluteFill} />
      <View style={styles.wizHeader}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Back" activeOpacity={0.7} style={styles.back} onPress={() => setStep(step - 1)}>
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.stepTitle}>{STEPS[step]}</Text>
          <View style={styles.dots}>
            {STEPS.map((_, i) => (
              <View key={i} style={[styles.dot, i <= step && { backgroundColor: colors.primary }]} />
            ))}
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.wizBody} showsVerticalScrollIndicator={false}>
        {step === 0 && (
          <FadeInUp>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderRow}>
              {GENDER_OPTIONS.map((g) => (
                <TouchableOpacity
                  accessibilityRole="button"
                  key={g.key}
                  activeOpacity={0.7}
                  style={[styles.genderBtn, gender === g.key && styles.active]}
                  onPress={() => chooseGender(g.key)}
                >
                  <Ionicons name={g.icon} size={20} color={gender === g.key ? colors.primaryText : colors.textSecondary} />
                  <Text style={[styles.genderText, gender === g.key && styles.activeText]}>{g.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Name</Text>
            <TextInput style={styles.input} placeholder="First name" placeholderTextColor={colors.textMuted} value={firstName} onChangeText={setFirstName} />
            <TextInput style={styles.input} placeholder="Last name" placeholderTextColor={colors.textMuted} value={lastName} onChangeText={setLastName} />
            <Button
              label="Random name"
              icon="dice"
              variant="ghost"
              onPress={() => {
                setFirstName(randomFirstName(gender, region));
                setLastName(randomLastName(region));
              }}
              style={{ alignSelf: "flex-start" }}
            />
          </FadeInUp>
        )}

        {step === 1 && (
          <FadeInUp>
            <Text style={styles.hint}>Where you're born shapes your family, your money, the schools and jobs around you, and the names of the people you'll meet.</Text>
            {REGION_OPTIONS.map((r) => (
              <TouchableOpacity
                accessibilityRole="button"
                key={r.key}
                activeOpacity={0.75}
                style={[styles.regionCard, region === r.key && styles.regionCardActive]}
                onPress={() => {
                  chooseRegion(r.key);
                  setCityKey(undefined);
                  setFirstName(randomFirstName(gender, r.key));
                  setLastName(randomLastName(r.key));
                }}
              >
                <Text style={styles.flag}>{FLAGS[r.key]}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.regionName}>{r.label}</Text>
                  <Text style={styles.regionSub}>
                    {r.costOfLivingTier === "high" ? "High cost of living" : r.costOfLivingTier === "low" ? "Low cost of living" : "Average cost of living"} · drive at {r.legalAges.driving}
                  </Text>
                </View>
                {region === r.key && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
              </TouchableOpacity>
            ))}
            <Card>
              <Text style={styles.cardKicker}>Which city?</Text>
              <Text style={styles.cardText}>Big cities pay more and cost more; small towns are cheaper and safer. Or leave it to fate.</Text>
              <View style={styles.cityWrap}>
                {[{ key: undefined as string | undefined, name: "Surprise me" }, ...citiesFor(region)].map((c) => (
                  <TouchableOpacity accessibilityRole="button" key={c.key ?? "random"} activeOpacity={0.75} style={[styles.cityChip, cityKey === c.key && styles.cityChipOn]} onPress={() => setCityKey(c.key)}>
                    <Text style={[styles.cityChipText, cityKey === c.key && { color: colors.primary }]}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>
          </FadeInUp>
        )}

        {step === 2 && (
          <FadeInUp>
            <Text style={styles.hint}>
              You're {firstName.trim() || "Alex"} {lastName.trim() || "Smith"}, born in {cityByKey(family.birthCity)?.name}, {REGIONS[region].label}. This is the family you're born into.
            </Text>
            <Card>
              <Text style={styles.cardKicker}>Your family</Text>
              <Text style={[styles.classTitle, { color: colors.primary }]}>{cls.label}</Text>
              <Text style={styles.cardText}>{cls.blurb}</Text>
              <Text style={[styles.cardText, { fontFamily: fonts.semiBold, marginTop: spacing.sm }]}>"{family.background!.parentValues}"</Text>
            </Card>
            {[mother, father].map(
              (p) =>
                p && (
                  <Card key={p.id} style={styles.parentRow}>
                    <Ionicons name={p.gender === "female" ? "woman" : "man"} size={26} color={colors.looks} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.parentName}>{p.name}</Text>
                      <Text style={styles.regionSub}>
                        {p.type === "mother" ? "Mother" : "Father"} · {ageOf(family, p)} · {p.job}
                      </Text>
                    </View>
                  </Card>
                ),
            )}
            <Card>
              <Text style={styles.cardKicker}>Born with</Text>
              <Text style={styles.cardText}>
                {family.quirks!.map((q) => quirkDef(q)?.label ?? q).join(" · ")}
              </Text>
              <Text style={styles.regionSub}>Your personality and talents show themselves as you grow up.</Text>
            </Card>
            <Button label="Roll a different family" icon="refresh" variant="secondary" onPress={() => { setSeed((Math.random() * 999983) | 0); setNonce((n) => n + 1); }} />
          </FadeInUp>
        )}

        {step === 3 && (
          <FadeInUp>
            <View style={styles.previewWrapLg}>
              <Avatar character={{ gender, originRegion: region, avatarSeed: seed, appearance, age: previewAge }} size={150} />
            </View>
            <View style={styles.chipRow}>
              {PREVIEW_AGES.map((a) => (
                <TouchableOpacity accessibilityRole="button" key={a} style={[styles.miniChip, previewAge === a && styles.active]} onPress={() => setPreviewAge(a)}>
                  <Text style={[styles.miniChipText, previewAge === a && styles.activeText]}>Age {a}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Button label="Randomise look" icon="dice" variant="ghost" onPress={rerollLook} style={{ alignSelf: "center" }} />

            <Text style={styles.label}>Skin</Text>
            <View style={styles.swatchRow}>
              {SKIN_TONES.map((c) => (
                <Swatch key={c} color={c} active={appearance.skin === c} onPress={() => setApp({ skin: c })} label={`Skin ${c}`} />
              ))}
            </View>
            <Text style={styles.label}>Hair style</Text>
            <View style={styles.chipRow}>
              {HAIR_STYLES.map((h) => (
                <TouchableOpacity accessibilityRole="button" key={h.key} style={[styles.miniChip, appearance.hairStyle === h.key && styles.active]} onPress={() => setApp({ hairStyle: h.key, balding: 0 })}>
                  <Text style={[styles.miniChipText, appearance.hairStyle === h.key && styles.activeText]}>{h.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Hair colour</Text>
            <View style={styles.swatchRow}>
              {HAIR_COLORS.map((c) => (
                <Swatch key={c} color={c} active={appearance.hairColor === c} onPress={() => setApp({ hairColor: c })} label={HAIR_COLOR_NAMES[c] ?? c} />
              ))}
            </View>
            <Text style={styles.label}>Eyes</Text>
            <View style={styles.swatchRow}>
              {Object.entries(EYE_COLORS).map(([k, v]) => (
                <Swatch key={k} color={v.hex} active={appearance.eyes === k} onPress={() => setApp({ eyes: k })} label={v.label} />
              ))}
            </View>
            <Text style={styles.label}>Facial hair (shows from 16)</Text>
            <View style={styles.chipRow}>
              {FACIAL_HAIR.map((f) => (
                <TouchableOpacity accessibilityRole="button" key={f.key} style={[styles.miniChip, appearance.facialHair === f.key && styles.active]} onPress={() => setApp({ facialHair: f.key })}>
                  <Text style={[styles.miniChipText, appearance.facialHair === f.key && styles.activeText]}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Extras</Text>
            <View style={styles.chipRow}>
              <TouchableOpacity accessibilityRole="button" style={[styles.miniChip, appearance.glasses && styles.active]} onPress={() => setApp({ glasses: !appearance.glasses })}>
                <Text style={[styles.miniChipText, appearance.glasses && styles.activeText]}>Glasses</Text>
              </TouchableOpacity>
              <TouchableOpacity accessibilityRole="button" style={[styles.miniChip, appearance.freckles && styles.active]} onPress={() => setApp({ freckles: !appearance.freckles })}>
                <Text style={[styles.miniChipText, appearance.freckles && styles.activeText]}>Freckles</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.label}>Build</Text>
            <View style={styles.chipRow}>
              {BUILDS.map((b) => (
                <TouchableOpacity accessibilityRole="button" key={b} style={[styles.miniChip, appearance.build === b && styles.active]} onPress={() => setApp({ build: b })}>
                  <Text style={[styles.miniChipText, appearance.build === b && styles.activeText]}>{b[0].toUpperCase() + b.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Height</Text>
            <View style={styles.chipRow}>
              {HEIGHTS.map((h) => (
                <TouchableOpacity accessibilityRole="button" key={h} style={[styles.miniChip, appearance.height === h && styles.active]} onPress={() => setApp({ height: h })}>
                  <Text style={[styles.miniChipText, appearance.height === h && styles.activeText]}>{h[0].toUpperCase() + h.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </FadeInUp>
        )}

        {step === 4 && (
          <FadeInUp>
            <View style={styles.previewWrapLg}>
              <Avatar character={{ gender, originRegion: region, avatarSeed: seed, appearance, age: 18 }} size={150} />
            </View>
            <Text style={styles.confirmName}>
              {firstName.trim() || "Alex"} {lastName.trim() || "Smith"}
            </Text>
            <Text style={[styles.hint, { textAlign: "center" }]}>
              {gender === "nonbinary" ? "Nonbinary" : gender === "male" ? "Male" : "Female"} · born in {cityByKey(family.birthCity)?.name}, {REGIONS[region].label} · {cls.label.toLowerCase()} family
            </Text>
            <Text style={[styles.hint, { textAlign: "center" }]}>Your life starts at age 0. Every choice from here is yours.</Text>
          </FadeInUp>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {step < STEPS.length - 1 ? (
          <Button label="Next" icon="arrow-forward" variant="primary" size="lg" onPress={() => setStep(step + 1)} style={styles.wide} />
        ) : (
          <Button label="Begin Life" icon="sparkles" variant="primary" size="lg" onPress={begin} style={styles.wide} />
        )}
      </View>
    </SafeAreaView>
  );
}

function Swatch({ color, active, onPress, label }: { color: string; active: boolean; onPress: () => void; label: string }) {
  return (
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} activeOpacity={0.7} onPress={onPress} style={[styles.swatch, { backgroundColor: color }, active && styles.swatchActive]}>
      {active && <Ionicons name="checkmark" size={16} color="#fff" />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  landing: { zIndex: 1, flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  themeBtn: {
    position: "absolute", top: spacing.lg, right: spacing.lg, width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", zIndex: 5,
  },
  logoWrap: { alignItems: "center", marginBottom: spacing.xxl },
  logoBadge: { width: 56, height: 56, borderRadius: radii.xl, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
  title: { fontSize: fontSize.display, fontFamily: fonts.extraBold, color: colors.textPrimary },
  subtitle: { fontSize: fontSize.base, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 2 },
  previewWrap: {
    width: 128, height: 128, borderRadius: 64, backgroundColor: colors.surfaceRaised, borderWidth: 2, borderColor: colors.primary + "88",
    overflow: "hidden", alignItems: "center", justifyContent: "center", marginBottom: spacing.xxl,
  },
  previewWrapLg: {
    width: 170, height: 170, borderRadius: 85, backgroundColor: colors.surfaceRaised, borderWidth: 2, borderColor: colors.primary + "88",
    overflow: "hidden", alignItems: "center", justifyContent: "center", alignSelf: "center", marginBottom: spacing.md,
  },
  wide: { width: "100%", maxWidth: 340, alignSelf: "center" },
  versionRow: { marginTop: spacing.lg, padding: spacing.sm },
  versionText: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: fontSize.sm },

  wizHeader: { zIndex: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.sm, paddingVertical: spacing.sm },
  back: { width: 44, height: 40, alignItems: "flex-start", justifyContent: "center", paddingLeft: 6 },
  stepTitle: { color: colors.textPrimary, fontFamily: fonts.extraBold, fontSize: fontSize.xl },
  dots: { flexDirection: "row", gap: 6, marginTop: 6 },
  dot: { width: 28, height: 4, borderRadius: 2, backgroundColor: colors.border },
  wizBody: { zIndex: 1, padding: spacing.lg, paddingBottom: spacing.xxl, width: "100%", maxWidth: 480, alignSelf: "center" },
  footer: { zIndex: 1, padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },

  label: { color: colors.textMuted, fontFamily: fonts.bold, fontSize: fontSize.sm, textTransform: "uppercase", marginTop: spacing.lg, marginBottom: spacing.sm },
  hint: { color: colors.textSecondary, fontFamily: fonts.semiBold, fontSize: fontSize.md, lineHeight: 20, marginBottom: spacing.md },
  genderRow: { flexDirection: "row", gap: spacing.sm },
  genderBtn: {
    flex: 1, alignItems: "center", paddingVertical: spacing.md, borderRadius: radii.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 4,
  },
  genderText: { color: colors.textSecondary, fontFamily: fonts.semiBold, fontSize: fontSize.sm },
  active: { backgroundColor: colors.primary, borderColor: colors.primary },
  activeText: { color: colors.primaryText },
  input: {
    width: "100%", backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, color: colors.textPrimary,
    fontFamily: fonts.regular, paddingHorizontal: spacing.md + 2, paddingVertical: spacing.md, marginBottom: spacing.sm + 2, fontSize: fontSize.lg,
  },
  regionCard: {
    flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md + 2, marginBottom: spacing.sm,
  },
  regionCardActive: { borderColor: colors.primary, backgroundColor: colors.primary + "18" },
  flag: { fontSize: 30 },
  cityWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md },
  cityChip: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radii.pill ?? 20, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: "transparent" },
  cityChipOn: { borderColor: colors.primary, backgroundColor: colors.primary + "18" },
  cityChipText: { color: colors.textSecondary, fontFamily: fonts.semiBold, fontSize: fontSize.md },
  regionName: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fontSize.lg },
  regionSub: { color: colors.textSecondary, fontFamily: fonts.semiBold, fontSize: fontSize.sm, marginTop: 2 },
  cardKicker: { color: colors.textMuted, fontFamily: fonts.bold, fontSize: fontSize.sm, textTransform: "uppercase", marginBottom: 4 },
  classTitle: { fontFamily: fonts.extraBold, fontSize: fontSize.xl + 2, marginBottom: 4 },
  cardText: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fontSize.md, lineHeight: 20 },
  parentRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  parentName: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fontSize.lg },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.sm },
  miniChip: { paddingVertical: 7, paddingHorizontal: spacing.md, borderRadius: radii.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  miniChipText: { color: colors.textSecondary, fontFamily: fonts.semiBold, fontSize: fontSize.sm },
  swatchRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  swatch: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "transparent" },
  swatchActive: { borderColor: colors.primary },
  confirmName: { color: colors.textPrimary, fontFamily: fonts.extraBold, fontSize: fontSize.display - 6, textAlign: "center", marginBottom: spacing.sm },
});
