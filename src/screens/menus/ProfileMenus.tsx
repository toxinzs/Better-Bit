import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useGameStore } from "../../state/gameStore";
import MenuScreen from "../../nav/MenuScreen";
import Card from "../../components/Card";
import Chip from "../../components/Chip";
import Avatar, { moodFor } from "../../components/Avatar";
import Sparkline from "../../components/Sparkline";
import { getRegion } from "../../data/regions";
import { cityByKey } from "../../data/cities";
import { cityOf } from "../../engine/where";
import { totalNetWorth } from "../../engine/lifeEngine";
import { talentsKnown, traitWords } from "../../engine/character";
import { CLASSES, TALENTS, quirkDef, talentWord } from "../../data/traits";
import { EYE_COLORS, HAIR_COLOR_NAMES } from "../../data/appearance";
import { SKILL_LABELS } from "../../data/skills";
import { UPBRINGING_BLURB } from "../../engine/education";
import { colors, fonts, fontSize, spacing } from "../../theme";
import { StatKey } from "../../types";

const STAGE: Record<string, string> = {
  none: "Not in school yet",
  elementary: "Elementary school",
  middle: "Middle school",
  high: "High school",
  college: "College",
  graduated: "Finished school",
};

const SKILL_NAMES: Record<string, string> = SKILL_LABELS;

const money = (n: number) => `${n < 0 ? "-" : ""}$${Math.abs(Math.round(n)).toLocaleString()}`;

export function ProfileMenu() {
  const character = useGameStore((s) => s.character);
  const world = useGameStore((s) => s.worldState);
  if (!character) return null;
  const region = getRegion(character.originRegion);
  const alive = character.relationships.filter((r) => r.alive && r.type !== "classmate" && r.type !== "teacher");
  const skills = Object.entries(character.skills ?? {}).filter(([, v]) => (v ?? 0) > 0);
  const job = character.inJail ? "Incarcerated" : character.job ? `${character.job.title} · $${character.job.salary.toLocaleString()}/yr` : character.inCollege ? "Student" : "Unemployed";

  return (
    <MenuScreen title="Profile" icon="person" color={colors.primary}>
      <Card style={styles.hero}>
        <Avatar character={character} size={120} mood={moodFor(character.stats.happiness)} />
        <Text style={styles.name}>
          {character.firstName} {character.lastName}
        </Text>
        <Text style={styles.sub}>
          {character.alive ? `Age ${character.age}` : `Died at ${character.age}`} · {character.gender === "nonbinary" ? "Nonbinary" : character.gender === "male" ? "Male" : "Female"}
        </Text>
        <Text style={styles.sub}>Born in {cityByKey(character.birthCity)?.name ? `${cityByKey(character.birthCity)!.name}, ` : ""}{getRegion(character.birthRegion ?? character.originRegion).label}</Text>
      </Card>

      <Card>
        <Text style={styles.heading}>Right now</Text>
        <Row label="Occupation" value={job} />
        <Row label="School" value={STAGE[character.educationStage] ?? character.educationStage} />
        {character.gpa != null && character.age >= 5 && <Row label="GPA" value={character.gpa.toFixed(2)} />}
        {character.currentSchool && <Row label="Attending" value={character.currentSchool} />}
        <Row label="Net worth" value={money(totalNetWorth(character, world))} />
        <Row label="Living in" value={`${cityOf(character).name}, ${region.label}`} />
        <Row label="Home" value={character.residence?.housing === "rent" ? "Renting" : character.residence?.housing === "own" ? "Owner" : character.residence?.housing === "homeless" ? "No fixed home" : "With family"} last />
      </Card>

      <Card>
        <Text style={styles.heading}>Personality</Text>
        {traitWords(character).length > 0 ? (
          <View style={styles.chips}>
            {traitWords(character).map((t) => (
              <Chip key={t.label} label={t.label} color={t.tone === "good" ? colors.primary : t.tone === "bad" ? colors.danger : colors.textSecondary} />
            ))}
          </View>
        ) : (
          <Text style={styles.sub}>Pretty middle-of-the-road - no strong extremes yet.</Text>
        )}
        {(character.quirks ?? []).map((q) => (
          <View key={q} style={styles.quirk}>
            <Text style={styles.quirkName}>{quirkDef(q)?.label ?? q}</Text>
            <Text style={styles.quirkBlurb}>{quirkDef(q)?.blurb}</Text>
          </View>
        ))}
      </Card>

      <Card>
        <Text style={styles.heading}>Talents</Text>
        {talentsKnown(character) && character.talents ? (
          TALENTS.map((t) => {
            const v = character.talents![t.key];
            return (
              <View key={t.key} style={styles.talent}>
                <View style={styles.talentHead}>
                  <Text style={styles.rowLabel}>{t.label}</Text>
                  <Text style={[styles.rowValue, { color: v >= 62 ? colors.primary : v < 40 ? colors.textMuted : colors.textPrimary }]}>{talentWord(v)}</Text>
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${v}%`, backgroundColor: v >= 62 ? colors.primary : colors.smarts }]} />
                </View>
              </View>
            );
          })
        ) : (
          <Text style={styles.sub}>You're still too young to know what you're good at. It shows up as you grow.</Text>
        )}
      </Card>

      {character.background && (
        <Card>
          <Text style={styles.heading}>Where you come from</Text>
          <Row label="Family" value={CLASSES[character.background.wealthClass].label} />
          <Text style={styles.quirkBlurb}>{CLASSES[character.background.wealthClass].blurb}</Text>
          <Text style={[styles.quirkBlurb, { marginTop: spacing.sm, fontFamily: fonts.semiBold }]}>"{character.background.parentValues}"</Text>
          {character.upbringing ? <Text style={[styles.quirkBlurb, { marginTop: spacing.sm }]}>{UPBRINGING_BLURB[character.upbringing]}</Text> : null}
        </Card>
      )}

      {character.appearance && (
        <Card>
          <Text style={styles.heading}>Appearance</Text>
          <Row label="Height" value={character.appearance.height[0].toUpperCase() + character.appearance.height.slice(1)} />
          <Row label="Build" value={character.appearance.build[0].toUpperCase() + character.appearance.build.slice(1)} />
          <Row label="Eyes" value={EYE_COLORS[character.appearance.eyes]?.label ?? character.appearance.eyes} />
          <Row label="Hair" value={character.age >= 62 ? "Silver" : HAIR_COLOR_NAMES[character.appearance.hairColor] ?? "Dark"} last />
        </Card>
      )}

      {(character.degrees?.length ?? 0) > 0 && (
        <Card>
          <Text style={styles.heading}>Degrees</Text>
          {character.degrees!.map((d, i) => (
            <Row key={i} label={d.major} value={`${d.school}${d.honors ? ` · ${d.honors}` : ""}`} last={i === character.degrees!.length - 1} />
          ))}
        </Card>
      )}

      {skills.length > 0 && (
        <Card>
          <Text style={styles.heading}>Skills</Text>
          <View style={styles.chips}>
            {skills.map(([k, v]) => (
              <Chip key={k} label={`${SKILL_NAMES[k] ?? k} ${Math.round(v ?? 0)}`} color={colors.smarts} />
            ))}
          </View>
        </Card>
      )}

      <Card>
        <Text style={styles.heading}>Life so far</Text>
        <Row label="Living relatives & friends" value={String(alive.length)} />
        <Row label="Children" value={String(character.relationships.filter((r) => r.type === "child").length)} />
        <Row label="Criminal record" value={character.criminalRecord ? "Yes" : "Clean"} last />
      </Card>
    </MenuScreen>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, last && { borderBottomWidth: 0, marginBottom: 0, paddingBottom: 0 }]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

// ---------- stat detail ----------

const STAT_INFO: Record<StatKey, { title: string; color: string; icon: "heart" | "happy" | "school" | "sparkles"; affects: string[] }> = {
  health: {
    title: "Health",
    color: colors.health,
    icon: "heart",
    affects: [
      "How likely you are to survive each year - and illnesses you carry multiply that risk.",
      "Below 35 you miss work (lower pay) and feel miserable.",
      "Stress and poor fitness wear it down. The gym, doctors, treatment and rest build it back.",
    ],
  },
  happiness: {
    title: "Happiness",
    color: colors.happiness,
    icon: "happy",
    affects: [
      "Your mood shows on your face.",
      "Time with people you love, achievements and fun lift it. Very high happiness slowly settles back.",
      "Stress, money worries, loneliness, poor health and loss pull it down - some personalities feel that more.",
    ],
  },
  smarts: {
    title: "Smarts",
    color: colors.smarts,
    icon: "school",
    affects: [
      "Your grades and how far you can go in school.",
      "Which jobs you qualify for.",
      "Effort in school (disciplined and academic people do more of it), reading and curiosity raise it.",
    ],
  },
  looks: {
    title: "Looks",
    color: colors.looks,
    icon: "sparkles",
    affects: [
      "First impressions: dating, some jobs and how people treat you.",
      "Staying fit, spa days and taking care of yourself help.",
      "Time takes some of it, and so does letting yourself go.",
    ],
  },
};

const word = (v: number) => (v >= 85 ? "Excellent" : v >= 65 ? "Good" : v >= 45 ? "Okay" : v >= 25 ? "Poor" : "Critical");

export function StatDetailMenu({ stat }: { stat: StatKey }) {
  const character = useGameStore((s) => s.character);
  if (!character) return null;
  const info = STAT_INFO[stat] ?? STAT_INFO.health;
  const value = Math.round(character.stats[stat]);
  const hist = (character.statHistory ?? []).map((h) => ({ age: h.age, v: h[stat] }));
  const series = [...hist.map((h) => h.v), value];
  const peak = series.length ? Math.max(...series) : value;
  const low = series.length ? Math.min(...series) : value;
  const first = hist.length ? hist[0].v : value;
  const trend = value - first;

  return (
    <MenuScreen title={info.title} icon={info.icon} color={info.color}>
      <Card style={styles.hero}>
        <Text style={[styles.big, { color: info.color }]}>{value}</Text>
        <Text style={styles.sub}>{word(value)}</Text>
      </Card>
      <Card>
        <Text style={styles.heading}>Over your life</Text>
        {series.length >= 2 ? (
          <>
            <Sparkline values={series} color={info.color} />
            <View style={styles.axis}>
              <Text style={styles.axisText}>Age {hist[0]?.age ?? 0}</Text>
              <Text style={styles.axisText}>Age {character.age}</Text>
            </View>
            <Row label="Highest" value={String(Math.round(peak))} />
            <Row label="Lowest" value={String(Math.round(low))} />
            <Row label="Change since the start" value={`${trend >= 0 ? "+" : ""}${Math.round(trend)}`} last />
          </>
        ) : (
          <Text style={styles.sub}>Check back after a few birthdays - your history builds year by year.</Text>
        )}
      </Card>
      {(() => {
        const notes = character.statNotes?.[stat] ?? [];
        return (
          <Card>
            <Text style={styles.heading}>This year</Text>
            {notes.length === 0 ? (
              <Text style={styles.sub}>Nothing in particular moved it.</Text>
            ) : (
              notes
                .slice()
                .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
                .map((n, i, arr) => (
                  <Row key={n.reason} label={n.reason} value={`${n.delta > 0 ? "+" : ""}${n.delta}`} last={i === arr.length - 1} />
                ))
            )}
          </Card>
        );
      })()}
      <Card>
        <Text style={styles.heading}>What it does</Text>
        {info.affects.map((a, i) => (
          <Text key={i} style={styles.bullet}>
            • {a}
          </Text>
        ))}
      </Card>
    </MenuScreen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: "center", gap: 4 },
  name: { color: colors.textPrimary, fontFamily: fonts.extraBold, fontSize: fontSize.xl + 2, marginTop: spacing.sm },
  sub: { color: colors.textSecondary, fontFamily: fonts.semiBold, fontSize: fontSize.md },
  big: { fontFamily: fonts.extraBold, fontSize: 52 },
  heading: { color: colors.textMuted, fontFamily: fonts.bold, fontSize: fontSize.sm, textTransform: "uppercase", marginBottom: spacing.sm },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingBottom: spacing.sm,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLabel: { color: colors.textSecondary, fontFamily: fonts.semiBold, fontSize: fontSize.md },
  rowValue: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fontSize.md, flexShrink: 1, textAlign: "right" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.sm },
  quirk: { marginTop: spacing.sm },
  quirkName: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fontSize.md },
  quirkBlurb: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fontSize.md, lineHeight: 19 },
  talent: { marginBottom: spacing.sm },
  talentHead: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.surfaceRaised, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 3 },
  axis: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.md },
  axisText: { color: colors.textMuted, fontFamily: fonts.semiBold, fontSize: fontSize.xs },
  bullet: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fontSize.md, lineHeight: 20, marginBottom: 4 },
});
