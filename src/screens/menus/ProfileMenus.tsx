import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useGameStore } from "../../state/gameStore";
import MenuScreen from "../../nav/MenuScreen";
import Card from "../../components/Card";
import Chip from "../../components/Chip";
import Avatar, { moodFor } from "../../components/Avatar";
import Sparkline from "../../components/Sparkline";
import { getRegion } from "../../data/regions";
import { totalNetWorth } from "../../engine/lifeEngine";
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

const SKILL_NAMES: Record<string, string> = {
  music: "Music",
  singing: "Singing",
  art: "Art",
  martialArts: "Martial arts",
  acting: "Acting",
};

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
        <Text style={styles.sub}>Born in {region.label}</Text>
      </Card>

      <Card>
        <Text style={styles.heading}>Right now</Text>
        <Row label="Occupation" value={job} />
        <Row label="School" value={STAGE[character.educationStage] ?? character.educationStage} />
        {character.gpa != null && character.age >= 5 && <Row label="GPA" value={character.gpa.toFixed(2)} />}
        {character.currentSchool && <Row label="Attending" value={character.currentSchool} />}
        <Row label="Net worth" value={money(totalNetWorth(character, world))} />
        <Row label="Living in" value={region.label} last />
      </Card>

      {(character.degrees?.length ?? 0) > 0 && (
        <Card>
          <Text style={styles.heading}>Degrees</Text>
          {character.degrees!.map((d, i) => (
            <Row key={i} label={d.major} value={d.school} last={i === character.degrees!.length - 1} />
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
      "How likely you are to survive each year - low health gets dangerous fast.",
      "Falling below 30 makes illness and hospital stays much more likely.",
      "Doctor visits, the gym and a healthy lifestyle raise it. Age wears it down.",
    ],
  },
  happiness: {
    title: "Happiness",
    color: colors.happiness,
    icon: "happy",
    affects: [
      "Your mood shows on your face.",
      "Time with people you love, achievements and fun keep it up.",
      "Loss, arguments and hard times pull it down.",
    ],
  },
  smarts: {
    title: "Smarts",
    color: colors.smarts,
    icon: "school",
    affects: [
      "Your grades and how far you can go in school.",
      "Which jobs you qualify for, and how much they pay.",
      "Studying, reading and lessons raise it.",
    ],
  },
  looks: {
    title: "Looks",
    color: colors.looks,
    icon: "sparkles",
    affects: [
      "First impressions: dating, some jobs and how people treat you.",
      "The gym, care for yourself and good health help; time and neglect fade it.",
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
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  axis: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.md },
  axisText: { color: colors.textMuted, fontFamily: fonts.semiBold, fontSize: fontSize.xs },
  bullet: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fontSize.md, lineHeight: 20, marginBottom: 4 },
});
