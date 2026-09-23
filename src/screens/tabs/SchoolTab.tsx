import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGameStore } from "../../state/gameStore";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { Relationship } from "../../types";
import { availableColleges, availableClubs, COLLEGE_HOUSING, MAJORS } from "../../data/school";
import { colors, fonts, fontSize, radii, spacing } from "../../theme";
import { tabStyles } from "./sharedStyles";

const STAGE_LABEL: Record<string, string> = {
  none: "Not in school yet",
  elementary: "Elementary School",
  middle: "Middle School",
  high: "High School",
  college: "College",
  graduated: "Not currently enrolled",
};

export default function SchoolTab() {
  const character = useGameStore((s) => s.character);
  const joinClub = useGameStore((s) => s.joinClub);
  const facultyAction = useGameStore((s) => s.facultyAction);
  const enrollInCollege = useGameStore((s) => s.enrollInCollege);
  const changeMajor = useGameStore((s) => s.changeMajor);
  const dropOutOfCollege = useGameStore((s) => s.dropOutOfCollege);
  const seduceFaculty = useGameStore((s) => s.seduceFaculty);
  const attack = useGameStore((s) => s.attack);

  const [selectedMajor, setSelectedMajor] = useState(MAJORS[0]);
  const [selectedHousing, setSelectedHousing] = useState<typeof COLLEGE_HOUSING[number]["key"]>("dorm");
  const [online, setOnline] = useState(false);

  if (!character) return null;

  const classmates = character.relationships.filter((r) => r.type === "classmate" && r.alive);
  const teachers = character.relationships.filter((r) => r.type === "teacher" && r.alive);
  const stageLabel = STAGE_LABEL[character.educationStage] ?? character.educationStage;
  const isK12 = character.educationStage === "middle" || character.educationStage === "high";
  const gpa = character.gpa;
  const colleges = availableColleges(gpa ?? 0);
  const degrees = character.degrees ?? [];

  return (
    <ScrollView contentContainerStyle={tabStyles.scroll}>
      {character.onAnkleMonitor && (
        <Card style={styles.monitorCard}>
          <Ionicons name="radio" size={18} color={colors.danger} />
          <Text style={styles.monitorText}>
            On an ankle monitor — {character.monitorYearsLeft} year{character.monitorYearsLeft === 1 ? "" : "s"} left
          </Text>
        </Card>
      )}

      <Card>
        <View style={styles.headerRow}>
          <Ionicons name="school" size={18} color={colors.smarts} />
          <Text style={tabStyles.sectionTitle}>{stageLabel}</Text>
        </View>
        {gpa != null && (
          <Text style={tabStyles.logLine}>GPA: {gpa.toFixed(2)}</Text>
        )}
        {character.clique && <Text style={tabStyles.logLine}>Clique: {character.clique}</Text>}
        {(character.schoolActivities ?? []).length > 0 && (
          <Text style={tabStyles.logLine}>Activities: {(character.schoolActivities ?? []).join(", ")}</Text>
        )}
        {character.greekHouse && <Text style={tabStyles.logLine}>Greek house: {character.greekHouse}</Text>}
      </Card>

      {isK12 && (
        <Card>
          <Text style={tabStyles.sectionTitle}>Clubs</Text>
          <View style={styles.grid}>
            {availableClubs(character.age).map((club) => {
              const joined = (character.schoolActivities ?? []).includes(club.label);
              return (
                <TouchableOpacity
                  key={club.key}
                  accessibilityRole="button"
                  activeOpacity={0.7}
                  style={[styles.gridBtn, joined && styles.gridBtnDisabled]}
                  disabled={joined}
                  onPress={() => joinClub(club.key)}
                >
                  <Text style={styles.gridLabel}>{club.label}</Text>
                  {joined && <Text style={styles.gridSub}>Joined</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>
      )}

      {(classmates.length > 0 || teachers.length > 0) && (
        <Card>
          <Text style={tabStyles.sectionTitle}>Classmates & Faculty</Text>
          {classmates.map((cm) => (
            <PersonRow key={cm.id} r={cm} onAttack={() => attack(cm.id)} />
          ))}
          {teachers.map((t) => (
            <PersonRow
              key={t.id}
              r={t}
              isFaculty
              onAttack={() => attack(t.id)}
              onSuckUp={() => facultyAction(t.id, "suckup")}
              onInsult={() => facultyAction(t.id, "insult")}
              onReport={() => facultyAction(t.id, "report")}
              onSeduce={character.inCollege ? () => seduceFaculty(t.id) : undefined}
            />
          ))}
        </Card>
      )}

      {character.inCollege ? (
        <Card>
          <Text style={tabStyles.sectionTitle}>Enrolled</Text>
          <Text style={tabStyles.logLine}>
            {character.currentSchool} — {character.currentMajor}
            {character.currentOnline ? " (online)" : ""}
          </Text>
          <Text style={styles.subheading}>Change major</Text>
          <View style={styles.grid}>
            {MAJORS.filter((m) => m !== character.currentMajor).map((m) => (
              <TouchableOpacity key={m} accessibilityRole="button" activeOpacity={0.7} style={styles.gridBtnWide} onPress={() => changeMajor(m)}>
                <Text style={styles.gridLabel}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Button label="Drop out" icon="exit" variant="danger" onPress={dropOutOfCollege} style={styles.inlineBtn} />
        </Card>
      ) : (
        (character.educationStage === "graduated" || character.educationStage === "college") && (
          <Card>
            <Text style={tabStyles.sectionTitle}>Enroll in College</Text>
            <Text style={styles.subheading}>Major</Text>
            <View style={styles.grid}>
              {MAJORS.map((m) => (
                <TouchableOpacity
                  key={m}
                  accessibilityRole="button"
                  activeOpacity={0.7}
                  style={[styles.gridBtnWide, selectedMajor === m && styles.gridBtnActive]}
                  onPress={() => setSelectedMajor(m)}
                >
                  <Text style={styles.gridLabel}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.subheading}>Housing</Text>
            <View style={styles.grid}>
              {COLLEGE_HOUSING.map((h) => (
                <TouchableOpacity
                  key={h.key}
                  accessibilityRole="button"
                  activeOpacity={0.7}
                  style={[styles.gridBtnWide, selectedHousing === h.key && styles.gridBtnActive]}
                  onPress={() => setSelectedHousing(h.key)}
                >
                  <Text style={styles.gridLabel}>{h.label}</Text>
                  <Text style={styles.gridSub}>${h.costPerYear.toLocaleString()}/yr</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              activeOpacity={0.7}
              style={[styles.onlineToggle, online && styles.gridBtnActive]}
              onPress={() => setOnline(!online)}
            >
              <Ionicons name={online ? "checkbox" : "square-outline"} size={16} color={colors.textPrimary} />
              <Text style={styles.gridLabel}>Study online instead (cheaper, no housing, can work)</Text>
            </TouchableOpacity>

            <Text style={styles.subheading}>Pick a school</Text>
            {colleges.length === 0 && <Text style={tabStyles.logLine}>Your GPA doesn't meet any school's bar yet.</Text>}
            {colleges.map((cl) => (
              <TouchableOpacity
                key={cl.name}
                accessibilityRole="button"
                activeOpacity={0.7}
                style={styles.listingRow}
                onPress={() => enrollInCollege(cl.name, selectedMajor, online, selectedHousing)}
              >
                <View>
                  <Text style={styles.listingName}>{cl.name}</Text>
                  <Text style={styles.listingSub}>GPA {cl.minGpa}+ required</Text>
                </View>
                <Text style={styles.listingPrice}>${cl.cost.toLocaleString()}/yr</Text>
              </TouchableOpacity>
            ))}
          </Card>
        )
      )}

      {degrees.length > 0 && (
        <Card>
          <Text style={tabStyles.sectionTitle}>Degrees</Text>
          {degrees.map((d, i) => (
            <Text key={i} style={tabStyles.logLine}>
              • {d.major}, {d.school}
              {d.online ? " (online)" : ""}
            </Text>
          ))}
        </Card>
      )}
    </ScrollView>
  );
}

function PersonRow({
  r,
  isFaculty,
  onAttack,
  onSuckUp,
  onInsult,
  onReport,
  onSeduce,
}: {
  r: Relationship;
  isFaculty?: boolean;
  onAttack: () => void;
  onSuckUp?: () => void;
  onInsult?: () => void;
  onReport?: () => void;
  onSeduce?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={styles.personBlock}>
      <TouchableOpacity accessibilityRole="button" activeOpacity={0.7} style={styles.personRow} onPress={() => setExpanded(!expanded)}>
        <View style={styles.personNameWrap}>
          <Ionicons name={isFaculty ? "school" : "person"} size={14} color={colors.textSecondary} />
          <Text style={styles.personName}>
            {r.name} <Text style={styles.personType}>({isFaculty ? "Faculty" : "Classmate"})</Text>
          </Text>
        </View>
        <Text style={styles.personLevel}>{Math.round(r.level)}</Text>
      </TouchableOpacity>
      {expanded && (
        <View style={styles.personActions}>
          {isFaculty ? (
            <>
              <ActionBtn label="Suck Up" icon="happy" onPress={onSuckUp!} />
              <ActionBtn label="Insult" icon="sad" onPress={onInsult!} />
              <ActionBtn label="Report" icon="megaphone" onPress={onReport!} />
              {onSeduce && <ActionBtn label="Seduce" icon="heart" onPress={onSeduce} />}
            </>
          ) : null}
          <ActionBtn label="Attack" icon="flash" danger onPress={onAttack} />
        </View>
      )}
    </View>
  );
}

function ActionBtn({
  label,
  icon,
  danger,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  danger?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.7}
      style={[styles.actionBtn, danger && styles.actionBtnDanger]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={13} color={danger ? colors.danger : colors.textPrimary} />
      <Text style={[styles.actionBtnText, danger && { color: colors.danger }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  monitorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  monitorText: {
    color: colors.danger,
    fontFamily: fonts.semiBold,
    fontSize: fontSize.sm,
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  gridBtn: {
    width: "31%",
    alignItems: "center",
    backgroundColor: colors.surfaceRaised,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    gap: 2,
  },
  gridBtnWide: {
    alignItems: "center",
    backgroundColor: colors.surfaceRaised,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    gap: 2,
  },
  gridBtnActive: {
    backgroundColor: colors.primaryDark,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  gridBtnDisabled: {
    opacity: 0.4,
  },
  gridLabel: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontFamily: fonts.semiBold,
    textAlign: "center",
  },
  gridSub: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontFamily: fonts.regular,
  },
  onlineToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surfaceRaised,
    padding: spacing.sm + 2,
    borderRadius: radii.md,
    marginBottom: spacing.sm,
  },
  subheading: {
    color: colors.textMuted,
    fontFamily: fonts.semiBold,
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  listingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listingName: {
    color: colors.textPrimary,
    fontFamily: fonts.regular,
    fontSize: fontSize.base,
  },
  listingSub: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
  },
  listingPrice: {
    color: colors.primary,
    fontFamily: fonts.bold,
    fontSize: fontSize.base,
  },
  inlineBtn: {
    marginTop: spacing.sm,
    alignSelf: "flex-start",
  },
  personBlock: {
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  personRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs + 2,
  },
  personNameWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  personName: {
    color: colors.textPrimary,
    fontFamily: fonts.semiBold,
    fontSize: fontSize.base,
  },
  personType: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
  },
  personLevel: {
    color: colors.primary,
    fontSize: fontSize.base,
    fontFamily: fonts.bold,
  },
  personActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingBottom: spacing.sm,
    paddingTop: 2,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.surfaceRaised,
    paddingVertical: 7,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radii.sm,
  },
  actionBtnDanger: {
    backgroundColor: colors.dangerDark,
  },
  actionBtnText: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontFamily: fonts.semiBold,
  },
});
