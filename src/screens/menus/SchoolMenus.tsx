import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGameStore } from "../../state/gameStore";
import { useNav } from "../../nav/navStore";
import MenuScreen, { MenuRow } from "../../nav/MenuScreen";
import Card from "../../components/Card";
import Chip from "../../components/Chip";
import Button from "../../components/Button";
import { CLUBS } from "../../data/school";
import { CLIQUE_INFO, SCHOOL_KINDS, eduSystem, gradeLabel, stageLabel, subjectsFor } from "../../data/education";
import { getRegion } from "../../data/regions";
import { SKILL_LABELS } from "../../data/skills";
import {
  MAX_ACTIVITIES, UPBRINGING_BLURB, clubStatus, effortLevel, gedCost, hasDiploma, inK12, popularityWord, recommendedTrack, schoolOptions, teacherList,
} from "../../engine/education";
import { colors, fonts, fontSize, radii, spacing } from "../../theme";
import { ms } from "./menuStyles";
import { tabStyles } from "../tabs/sharedStyles";

const ord = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;
const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

// ---------------------------------------------------------------- the hub

export function SchoolMenu() {
  const c = useGameStore((s) => s.character);
  const push = useNav((s) => s.push);
  if (!c) return null;
  const region = c.originRegion;
  const card = c.reportCards?.[c.reportCards.length - 1];
  const k12 = inK12(c);
  const label = stageLabel(region, c.educationStage);
  const acts = c.schoolActivities?.length ?? 0;
  return (
    <MenuScreen title="School & Education" icon="school" color={colors.looks}>
      <Card>
        <Text style={ms.subheading}>Right now</Text>
        <Text style={styles.heroTitle}>{label}</Text>
        {c.school ? <Text style={styles.heroSub}>{c.school.name}</Text> : null}
        <Text style={styles.heroSub}>{eduSystem(region).blurb}</Text>
      </Card>
      {c.age < 5 ? (
        <Card>
          <Text style={ms.note}>You're not old enough for school yet. It starts at 5.</Text>
        </Card>
      ) : (
        <>
          <MenuRow icon="document-text" color={colors.looks} title="Report card" summary={card ? `${card.gpa.toFixed(1)} GPA · ${ord(card.rank)} of ${card.classSize}` : `GPA ${(c.gpa ?? 3).toFixed(2)}`} delay={0} onPress={() => push("reportcard")} />
          {k12 && (
            <>
              <MenuRow icon="book" color={colors.smarts} title="Study & help" summary={`${c.studyMode === "hard" ? "Studying hard" : c.studyMode === "slack" ? "Taking it easy" : "Normal pace"}${c.track ? ` · plan: ${c.track}` : ""}`} delay={40} onPress={() => push("study")} />
              <MenuRow icon="business" color={colors.primary} title="My school" summary={c.school ? `${SCHOOL_KINDS[c.school.kind].label} · quality ${Math.round(c.school.quality)}` : "-"} delay={80} onPress={() => push("myschool")} />
              <MenuRow icon="people" color={colors.love} title="Social life" summary={`${popularityWord(c.popularity ?? 50)}${c.clique ? ` · ${c.clique}` : ""}${c.bullying?.role === "victim" ? " · being bullied" : ""}`} badge={c.bullying ? "!" : undefined} delay={120} onPress={() => push("schoolsocial")} />
              <MenuRow icon="trophy" color={colors.happiness} title="Clubs & teams" summary={acts > 0 ? `${acts} activit${acts === 1 ? "y" : "ies"}` : "Join something"} delay={160} onPress={() => push("clubs")} />
              <MenuRow icon="ribbon" color={colors.looks} title="Teachers" summary={teacherList(c).map((t) => t.name).join(", ") || "No one yet"} delay={200} onPress={() => push("teachers")} />
            </>
          )}
          {!k12 && c.educationStage !== "college" && (
            <MenuRow icon="business" color={colors.primary} title="My school" summary={c.diploma === "none" ? "No diploma - GED available" : "Finished school"} delay={80} onPress={() => push("myschool")} />
          )}
          {(c.age >= 16 || c.inCollege) && (
            <MenuRow icon="school" color={colors.smarts} title="College & beyond" summary={c.higher ? `${c.higher.major} · ${c.higher.institution}` : (c.degrees?.length ?? 0) > 0 ? `${c.degrees![c.degrees!.length - 1].major}` : "Exams, applications, trades"} delay={240} onPress={() => push("college")} />
          )}
        </>
      )}
      {c.upbringing && (
        <Card>
          <Text style={ms.subheading}>How you were raised</Text>
          <Text style={ms.note}>{UPBRINGING_BLURB[c.upbringing]}</Text>
        </Card>
      )}
    </MenuScreen>
  );
}

// ---------------------------------------------------------------- report card

export function ReportCardMenu() {
  const c = useGameStore((s) => s.character);
  if (!c) return null;
  const region = c.originRegion;
  const cards = (c.reportCards ?? []).slice().reverse();
  const card = cards[0];
  const subs = card ? subjectsFor(card.stage) : [];
  const sys = eduSystem(region);
  return (
    <MenuScreen title="Report card" icon="document-text" color={colors.looks}>
      {card ? (
        <>
          <Card style={{ alignItems: "center" }}>
            <Text style={ms.subheading}>{card.school ?? "Last year"} · age {card.age}</Text>
            <Text style={styles.bigGpa}>{card.gpa.toFixed(1)}</Text>
            <Text style={ms.note}>{sys.gradeWord} of 4.0</Text>
            <View style={{ flexDirection: "row", gap: 6, marginTop: spacing.sm }}>
              <Chip label={`${ord(card.rank)} OF ${card.classSize}`} color={colors.smarts} />
              {card.honor ? <Chip label="HONOUR ROLL" color={colors.gold} /> : null}
            </View>
            <Text style={[ms.note, { marginTop: spacing.md, fontStyle: "italic", textAlign: "center" }]}>"{card.note}"</Text>
          </Card>
          <Card>
            <Text style={ms.subheading}>Subjects</Text>
            {subs.map((s) => {
              const g = card.grades[s.key] ?? 0;
              return (
                <View key={s.key} style={{ marginBottom: spacing.sm }}>
                  <View style={styles.subjHead}>
                    <Text style={ms.listingName}>{s.label}</Text>
                    <Text style={[ms.ownedValue, { color: g >= 75 ? colors.primary : g < 55 ? colors.danger : colors.textPrimary }]}>{gradeLabel(region, g)}</Text>
                  </View>
                  <View style={styles.track}>
                    <View style={[styles.fill, { width: `${g}%`, backgroundColor: g >= 75 ? colors.primary : g < 55 ? colors.danger : colors.smarts }]} />
                  </View>
                </View>
              );
            })}
          </Card>
        </>
      ) : (
        <Card>
          <Text style={ms.note}>No report card yet - your first arrives at the end of your first school year.</Text>
        </Card>
      )}
      <Card>
        <Text style={ms.subheading}>Your record</Text>
        <View style={ms.statRow}>
          <Text style={ms.listingName}>Overall {sys.gradeWord}</Text>
          <Text style={ms.ownedValue}>{(c.gpa ?? 3).toFixed(2)}</Text>
        </View>
        <View style={ms.statRow}>
          <Text style={ms.listingName}>Behaviour</Text>
          <Text style={ms.ownedValue}>{(c.conduct ?? 80) >= 70 ? "Good" : (c.conduct ?? 80) >= 45 ? "Mixed" : "Trouble"}</Text>
        </View>
        <View style={ms.statRow}>
          <Text style={ms.listingName}>Suspensions</Text>
          <Text style={ms.ownedValue}>{c.suspensions ?? 0}</Text>
        </View>
        <View style={[ms.statRow, { borderBottomWidth: 0, marginBottom: 0, paddingBottom: 0 }]}>
          <Text style={ms.listingName}>Diploma</Text>
          <Text style={ms.ownedValue}>{c.diploma === "diploma" ? "Earned" : c.diploma === "ged" ? "GED" : c.diploma === "none" ? "None" : inK12(c) ? "In progress" : "-"}</Text>
        </View>
      </Card>
      {cards.length > 1 && (
        <Card>
          <Text style={ms.subheading}>Earlier years</Text>
          {cards.slice(1, 10).map((k) => (
            <View key={k.age} style={ms.rowBlock}>
              <Text style={ms.ownedName}>
                Age {k.age} · {k.gpa.toFixed(1)} GPA
              </Text>
              <Text style={ms.listingSub}>
                {ord(k.rank)} of {k.classSize}
                {k.honor ? " · honour roll" : ""}
              </Text>
            </View>
          ))}
        </Card>
      )}
    </MenuScreen>
  );
}

// ---------------------------------------------------------------- study & help

const MODES: { key: "slack" | "normal" | "hard"; title: string; blurb: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "hard", title: "Study hard", blurb: "Better grades and a sharper mind - at the cost of free time, stress and some happiness.", icon: "flame" },
  { key: "normal", title: "Keep a steady pace", blurb: "A balanced year. Grades follow your smarts and habits.", icon: "walk" },
  { key: "slack", title: "Take it easy", blurb: "More fun and less stress - but your grades will slide.", icon: "cafe" },
];

export function StudyMenu() {
  const c = useGameStore((s) => s.character);
  const setStudyMode = useGameStore((s) => s.setStudyMode);
  const askHelp = useGameStore((s) => s.askTeacherForHelp);
  const seeCounsellor = useGameStore((s) => s.seeCounsellor);
  if (!c) return null;
  const mode = c.studyMode ?? "normal";
  const teachers = teacherList(c);
  const rec = recommendedTrack(c);
  return (
    <MenuScreen title="Study & help" icon="book" color={colors.smarts}>
      <Card>
        <Text style={ms.subheading}>How hard are you working?</Text>
        {MODES.map((m) => {
          const on = mode === m.key;
          return (
            <TouchableOpacity accessibilityRole="button" key={m.key} activeOpacity={0.8} style={[styles.mode, on && { borderColor: colors.smarts, backgroundColor: colors.smarts + "18" }]} onPress={() => setStudyMode(m.key)}>
              <Ionicons name={m.icon} size={22} color={on ? colors.smarts : colors.textMuted} />
              <View style={{ flex: 1 }}>
                <Text style={ms.ownedName}>{m.title}</Text>
                <Text style={ms.listingSub}>{m.blurb}</Text>
              </View>
              {on && <Ionicons name="checkmark-circle" size={20} color={colors.smarts} />}
            </TouchableOpacity>
          );
        })}
        <Text style={[ms.note, { marginTop: spacing.sm }]}>Your effort right now: {Math.round(effortLevel(c))}/100. Effort, smarts, your school, your teachers, stress and bullying all decide your grades.</Text>
      </Card>

      <Card>
        <Text style={ms.subheading}>Ask for help</Text>
        {teachers.length === 0 ? (
          <Text style={ms.note}>You don't have a teacher to ask right now.</Text>
        ) : (
          teachers.map((t) => (
            <View key={t.id} style={ms.rowBlock}>
              <Text style={ms.ownedName}>{t.name}</Text>
              <Text style={ms.listingSub}>Extra help lifts your grades this year.</Text>
              <Button label="Stay after class" icon="school" variant="secondary" onPress={() => askHelp(t.id)} style={ms.inlineBtn} />
            </View>
          ))
        )}
      </Card>

      <Card>
        <Text style={ms.subheading}>Guidance counsellor</Text>
        <Text style={ms.note}>
          {c.age < 13 ? "The counsellor sees students from 13." : c.track ? `Your plan: ${c.track}. You can revisit it each year.` : "Talk about what comes after school."}
          {c.age >= 13 ? ` They'd probably suggest: ${rec}.` : ""}
        </Text>
        {c.age >= 13 && <Button label="Book a session" icon="compass" variant="secondary" onPress={seeCounsellor} style={ms.inlineBtn} />}
      </Card>
    </MenuScreen>
  );
}

// ---------------------------------------------------------------- my school

export function MySchoolMenu() {
  const c = useGameStore((s) => s.character);
  const changeSchool = useGameStore((s) => s.changeSchool);
  const dropOut = useGameStore((s) => s.dropOutOfSchool);
  const takeGED = useGameStore((s) => s.takeGED);
  if (!c) return null;
  const sys = eduSystem(c.originRegion);
  const k12 = inK12(c);
  const opts = schoolOptions(c);
  return (
    <MenuScreen title="My school" icon="business" color={colors.primary}>
      {c.school ? (
        <Card>
          <Text style={styles.heroTitle}>{c.school.name}</Text>
          <Text style={styles.heroSub}>{SCHOOL_KINDS[c.school.kind].label}</Text>
          <Text style={ms.note}>{SCHOOL_KINDS[c.school.kind].blurb}</Text>
          <View style={[styles.track, { marginTop: spacing.md }]}>
            <View style={[styles.fill, { width: `${c.school.quality}%`, backgroundColor: colors.primary }]} />
          </View>
          <Text style={[ms.listingSub, { marginTop: 4 }]}>
            School quality {Math.round(c.school.quality)}/100{c.school.tuition > 0 ? ` · fees ${money(c.school.tuition)} a year (your family pays)` : " · free"}
          </Text>
        </Card>
      ) : (
        <Card>
          <Text style={ms.note}>{c.educationStage === "college" ? "You're at college." : c.diploma === "none" ? "You left school without a diploma." : "You've finished school."}</Text>
        </Card>
      )}

      {k12 && (
        <Card>
          <Text style={ms.subheading}>Change schools</Text>
          <Text style={ms.note}>A new school means new classmates and teachers - and starting over socially.</Text>
          {opts.map((o) => (
            <View key={o.kind} style={ms.rowBlock}>
              <Text style={ms.ownedName}>{SCHOOL_KINDS[o.kind].label}</Text>
              <Text style={ms.listingSub}>{SCHOOL_KINDS[o.kind].blurb}</Text>
              {o.ok ? (
                <Button label="Transfer" icon="swap-horizontal" variant="secondary" onPress={() => changeSchool(o.kind)} style={ms.inlineBtn} />
              ) : (
                <Text style={[ms.listingSub, { color: colors.danger, marginTop: 2 }]}>{o.why}</Text>
              )}
            </View>
          ))}
        </Card>
      )}

      {k12 && (
        <Card>
          <Text style={ms.subheading}>Leaving school</Text>
          <Text style={ms.note}>
            Where you live you must stay until {sys.leavingAge}. Leave without a diploma and some jobs will be closed to you until you take the equivalency exam.
          </Text>
          <Button label="Drop out of school" icon="exit" variant="danger" onPress={dropOut} style={ms.inlineBtn} />
        </Card>
      )}

      {!k12 && c.diploma === "none" && (
        <Card>
          <Text style={ms.subheading}>High school equivalency (GED)</Text>
          <Text style={ms.note}>Sit the equivalency exam to earn the qualification employers want. Costs {money(gedCost(c))}; you can try once a year.</Text>
          <Button label="Take the exam" icon="create" variant="primary" onPress={takeGED} style={ms.inlineBtn} />
        </Card>
      )}
      {!k12 && hasDiploma(c) && c.diploma !== undefined && c.diploma !== "none" && (
        <Card>
          <Text style={ms.note}>{c.diploma === "ged" ? "You hold a high-school equivalency certificate." : "You hold your high-school diploma."}</Text>
        </Card>
      )}
    </MenuScreen>
  );
}

// ---------------------------------------------------------------- social life

export function SchoolSocialMenu() {
  const c = useGameStore((s) => s.character);
  const switchClique = useGameStore((s) => s.switchClique);
  const respond = useGameStore((s) => s.respondToBullying);
  if (!c) return null;
  const pop = c.popularity ?? 50;
  const b = c.bullying;
  return (
    <MenuScreen title="Social life" icon="people" color={colors.love}>
      <Card>
        <Text style={ms.subheading}>Where you stand</Text>
        <Text style={styles.heroTitle}>{popularityWord(pop)}</Text>
        <View style={[styles.track, { marginTop: spacing.sm }]}>
          <View style={[styles.fill, { width: `${pop}%`, backgroundColor: colors.love }]} />
        </View>
        <Text style={[ms.note, { marginTop: spacing.sm }]}>Looks, how outgoing you are, your clubs and your crowd all move this. It shapes who asks you out, who picks on you and how you feel.</Text>
      </Card>

      {b?.role === "victim" && (
        <Card style={{ borderColor: colors.danger + "88" }}>
          <Text style={[ms.subheading, { color: colors.danger }]}>You're being bullied</Text>
          <Text style={ms.note}>It's hitting your grades, your mood and your health. You don't have to sit through it.</Text>
          {[
            ["Tell a teacher", "teacher", "school"],
            ["Tell your parents", "parents", "home"],
            ["Talk to the counsellor", "counsel", "chatbubbles"],
            ["Fight back", "fight", "hand-left"],
            ["Ignore it", "ignore", "eye-off"],
          ].map(([label, action, icon]) => (
            <Button key={action} label={label} icon={icon as keyof typeof Ionicons.glyphMap} variant={action === "fight" ? "danger" : "secondary"} onPress={() => respond(action as "teacher")} style={ms.inlineBtn} />
          ))}
        </Card>
      )}
      {b?.role === "bully" && (
        <Card style={{ borderColor: colors.danger + "88" }}>
          <Text style={[ms.subheading, { color: colors.danger }]}>You've been picking on someone</Text>
          <Text style={ms.note}>People are afraid of you - and it's catching up with you. Eventually a teacher will notice.</Text>
        </Card>
      )}

      <Card>
        <Text style={ms.subheading}>Your crowd</Text>
        {Object.entries(CLIQUE_INFO).map(([name, blurb]) => {
          const on = c.clique === name;
          return (
            <TouchableOpacity accessibilityRole="button" key={name} activeOpacity={0.8} style={[styles.mode, on && { borderColor: colors.love, backgroundColor: colors.love + "18" }]} onPress={() => switchClique(name)}>
              <View style={{ flex: 1 }}>
                <Text style={ms.ownedName}>{name}</Text>
                <Text style={ms.listingSub}>{blurb}</Text>
              </View>
              {on && <Ionicons name="checkmark-circle" size={20} color={colors.love} />}
            </TouchableOpacity>
          );
        })}
      </Card>
    </MenuScreen>
  );
}

// ---------------------------------------------------------------- clubs & teams

export function ClubsMenu() {
  const c = useGameStore((s) => s.character);
  const joinClub = useGameStore((s) => s.joinClub);
  const quitClub = useGameStore((s) => s.quitClub);
  if (!c) return null;
  const mine = c.schoolActivities ?? [];
  const open = CLUBS.filter((cl) => c.age >= cl.minAge && !mine.includes(cl.label));
  const kinds: { key: string; label: string }[] = [
    { key: "sport", label: "Sports" },
    { key: "arts", label: "Music, art & drama" },
    { key: "academic", label: "Academic" },
    { key: "service", label: "Leadership & service" },
  ];
  return (
    <MenuScreen title="Clubs & teams" icon="trophy" color={colors.happiness}>
      <Card>
        <Text style={ms.subheading}>
          Your activities ({mine.length}/{MAX_ACTIVITIES})
        </Text>
        {mine.length === 0 ? (
          <Text style={ms.note}>Nothing yet. Clubs build skills, friends and popularity - and look great on applications.</Text>
        ) : (
          mine.map((label) => (
            <View key={label} style={ms.rowBlock}>
              <View style={ms.rowHead}>
                <Text style={ms.ownedName}>{label}</Text>
                <Text style={ms.listingSub}>{clubStatus(c, label)}</Text>
              </View>
              <Button label="Quit" icon="exit" variant="ghost" onPress={() => quitClub(label)} style={ms.inlineBtn} />
            </View>
          ))
        )}
      </Card>
      {kinds.map((k) => {
        const list = open.filter((cl) => cl.kind === k.key);
        if (list.length === 0) return null;
        return (
          <Card key={k.key}>
            <Text style={ms.subheading}>{k.label}</Text>
            {list.map((cl) => (
              <View key={cl.key} style={ms.rowBlock}>
                <Text style={ms.ownedName}>{cl.label}</Text>
                <Text style={ms.listingSub}>
                  {cl.blurb}
                  {cl.skill ? ` Builds ${SKILL_LABELS[cl.skill].toLowerCase()}.` : ""}
                </Text>
                <Button label={cl.tryout ? "Try out" : "Join"} icon={cl.tryout ? "flag" : "add"} variant="secondary" onPress={() => joinClub(cl.key)} style={ms.inlineBtn} />
              </View>
            ))}
          </Card>
        );
      })}
    </MenuScreen>
  );
}

// ---------------------------------------------------------------- teachers

export function TeachersMenu() {
  const c = useGameStore((s) => s.character);
  const facultyAction = useGameStore((s) => s.facultyAction);
  const askHelp = useGameStore((s) => s.askTeacherForHelp);
  if (!c) return null;
  const teachers = teacherList(c);
  return (
    <MenuScreen title="Teachers" icon="ribbon" color={colors.looks}>
      {teachers.length === 0 && (
        <Card>
          <Text style={ms.note}>No teachers right now.</Text>
        </Card>
      )}
      {teachers.map((t) => (
        <Card key={t.id}>
          <Text style={styles.heroSub}>{t.name}</Text>
          <Text style={ms.note}>How they see you: {t.level >= 70 ? "a favourite" : t.level >= 45 ? "fine" : "not a fan"}</Text>
          <View style={styles.btnRow}>
            <Button label="Ask for help" icon="help-buoy" variant="secondary" onPress={() => askHelp(t.id)} />
            <Button label="Suck up" icon="thumbs-up" variant="secondary" onPress={() => facultyAction(t.id, "suckup")} />
            <Button label="Report a classmate" icon="megaphone" variant="secondary" onPress={() => facultyAction(t.id, "report")} />
            <Button label="Tell them off" icon="flash" variant="danger" onPress={() => facultyAction(t.id, "insult")} />
          </View>
        </Card>
      ))}
    </MenuScreen>
  );
}

const styles = StyleSheet.create({
  heroTitle: { color: colors.textPrimary, fontFamily: fonts.extraBold, fontSize: fontSize.xxl - 4 },
  heroSub: { color: colors.textSecondary, fontFamily: fonts.semiBold, fontSize: fontSize.md, marginBottom: 4 },
  bigGpa: { color: colors.textPrimary, fontFamily: fonts.extraBold, fontSize: 54 },
  subjHead: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.surfaceRaised, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 3 },
  mode: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  btnRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.sm },
});

void ScrollView;
void tabStyles;
void getRegion;
