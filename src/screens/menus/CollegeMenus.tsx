import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGameStore } from "../../state/gameStore";
import { useNav } from "../../nav/navStore";
import MenuScreen, { MenuRow } from "../../nav/MenuScreen";
import Card from "../../components/Card";
import Chip from "../../components/Chip";
import Button from "../../components/Button";
import { MAJOR_DEFS, majorDef } from "../../data/majors";
import { GRAD_PROGRAMMES, HOUSING, TRADE_PROGRAMMES, institutionById, institutionsFor } from "../../data/institutions";
import { EXAMS, formatExam } from "../../data/admissions";
import { getRegion } from "../../data/regions";
import {
  admitProbability, applicationWindow, bestExam, compositeScore, estimateOffer, examCanSit, extracurricularScore, gradEligibility, gradMajor, housingCost,
  lastBachelor, letterStrength, netTuition, prepCost, standingOf, tradeInstitution, tradeOffer, yearlyCosts,
} from "../../engine/higher";
import { degreeLevel } from "../../engine/degrees";
import { teacherList } from "../../engine/education";
import { colors, fonts, fontSize, radii, spacing } from "../../theme";
import { ms } from "./menuStyles";
import { tabStyles } from "../tabs/sharedStyles";

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;
const STANDING_COLOR = { safety: colors.primary, match: colors.smarts, reach: colors.happiness, long: colors.danger } as const;
const LEVEL_LABEL: Record<string, string> = { certificate: "Certificate", associate: "Associate / diploma", bachelor: "Bachelor's", master: "Master's", professional: "Professional degree", doctorate: "Doctorate" };

function Standing({ p }: { p: number }) {
  const s = standingOf(p);
  return <Chip label={`${s.label.toUpperCase()} · ${Math.round(p * 100)}%`} color={STANDING_COLOR[s.key]} />;
}

function Bar({ v, color = colors.smarts }: { v: number; color?: string }) {
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${Math.max(0, Math.min(100, v))}%`, backgroundColor: color }]} />
    </View>
  );
}

// ---------------------------------------------------------------- hub

export function CollegeHub() {
  const c = useGameStore((s) => s.character);
  const push = useNav((s) => s.push);
  if (!c) return null;
  const h = c.higher;
  const win = applicationWindow(c);
  const best = bestExam(c);
  const student = (c.loans ?? []).find((l) => l.kind === "student");
  const degrees = c.degrees ?? [];
  const hasBachelor = degrees.some((d) => degreeLevel(d) === "bachelor" || degreeLevel(d) === "master");
  return (
    <MenuScreen title="College & beyond" icon="school" color={colors.smarts}>
      {h ? (
        <>
          <Card>
            <Text style={ms.subheading}>{h.level === "certificate" ? "Your programme" : "You're studying"}</Text>
            <Text style={styles.heroTitle}>{h.major}</Text>
            <Text style={styles.heroSub}>{h.institution}</Text>
            <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
              <Chip label={`YEAR ${Math.min(h.done + 1, h.years)} OF ${h.years}`} color={colors.smarts} />
              <Chip label={`${h.gpa.toFixed(1)} GPA`} color={h.gpa >= 3.3 ? colors.primary : h.gpa < 2 ? colors.danger : colors.happiness} />
              {h.deans > 0 ? <Chip label={`DEAN'S LIST ×${h.deans}`} color={colors.gold} /> : null}
              {h.probation > 0 ? <Chip label="ON PROBATION" color={colors.danger} /> : null}
            </View>
            <View style={{ marginTop: spacing.md }}>
              <Bar v={(h.done / h.years) * 100} />
            </View>
          </Card>
          <MenuRow icon="book" color={colors.smarts} title="Study habits" summary={c.studyMode === "hard" ? "Studying hard" : c.studyMode === "slack" ? "Taking it easy" : "Steady pace"} delay={0} onPress={() => push("study")} />
          <MenuRow icon="home" color={colors.love} title="Campus life" summary={h.online ? "Studying online" : HOUSING.find((x) => x.key === h.housing)?.label} delay={30} onPress={() => push("campus")} />
          <MenuRow icon="cash" color={colors.primary} title="Money & aid" summary={`You pay about ${money(yearlyCosts(c).youPay)} a year`} delay={60} onPress={() => push("collegemoney")} />
          <MenuRow icon="ribbon" color={colors.looks} title="My degree" summary="Major, transfer, drop out" delay={90} onPress={() => push("degree")} />
        </>
      ) : (
        <>
          <MenuRow icon="create" color={colors.smarts} title={`Entrance exam (${EXAMS[c.originRegion ?? "us"].name})`} summary={best ? `Best: ${formatExam(c.originRegion, best.score)}` : "Not taken yet"} delay={0} onPress={() => push("exam")} />
          <MenuRow icon="paper-plane" color={colors.primary} title="Apply to university" summary={win.ok ? "Choose a major and up to 5 schools" : win.reason} disabled={false} delay={30} onPress={() => push("apply")} />
          <MenuRow icon="hammer" color={colors.happiness} title="Trades & apprenticeships" summary="Certificates, and earn while you learn" delay={60} onPress={() => push("trades")} />
          {hasBachelor && <MenuRow icon="ribbon" color={colors.looks} title="Grad school" summary="Master's, MBA, law, medicine, PhD" delay={90} onPress={() => push("grad")} />}
        </>
      )}
      <MenuRow icon="document-text" color={colors.textSecondary} title="Transcript & degrees" summary={degrees.length ? `${degrees.length} qualification${degrees.length > 1 ? "s" : ""}` : "None yet"} delay={120} onPress={() => push("transcript")} />
      {student && (
        <MenuRow icon="card" color={colors.danger} title="Student loan" summary={`${money(student.balance)} · ${Math.round(student.apr * 1000) / 10}% interest${student.deferred ? " · on hold while you study" : ""}`} delay={150} onPress={() => push("loans")} />
      )}
    </MenuScreen>
  );
}

// ---------------------------------------------------------------- the exam

export function ExamMenu() {
  const c = useGameStore((s) => s.character);
  const sitExam = useGameStore((s) => s.sitExam);
  const askLetter = useGameStore((s) => s.askForLetter);
  if (!c) return null;
  const d = EXAMS[c.originRegion ?? "us"];
  const can = examCanSit(c);
  const best = bestExam(c);
  const teachers = teacherList(c);
  return (
    <MenuScreen title={d.name} icon="create" color={colors.smarts}>
      <Card>
        <Text style={styles.heroTitle}>{d.name}</Text>
        <Text style={ms.note}>{d.blurb}</Text>
        <Text style={[ms.note, { marginTop: spacing.sm }]}>
          Available from {d.minAge}. Fee {money(d.cost)}. A prep course costs {money(prepCost(c))} more and adds a real edge. You can sit it once a year and universities use your best score.
        </Text>
        {best && (
          <View style={{ marginTop: spacing.md }}>
            <Text style={ms.subheading}>Your best score</Text>
            <Text style={styles.bigNumber}>{formatExam(c.originRegion, best.score)}</Text>
          </View>
        )}
        {!can.ok && <Text style={[ms.note, { color: colors.danger, marginTop: spacing.sm }]}>{can.reason}</Text>}
        <Button label={`Sit the ${d.name} (${money(d.cost)})`} icon="create" variant="secondary" disabled={!can.ok} onPress={() => sitExam(false)} style={ms.inlineBtn} />
        <Button label={`Prep course, then sit it (${money(d.cost + prepCost(c))})`} icon="school" variant="primary" disabled={!can.ok} onPress={() => sitExam(true)} style={ms.inlineBtn} />
      </Card>

      {(c.exams?.length ?? 0) > 0 && (
        <Card>
          <Text style={ms.subheading}>Results</Text>
          {c.exams!.slice().reverse().map((e, i) => (
            <View key={i} style={ms.statRow}>
              <Text style={ms.listingName}>Age {e.age}</Text>
              <Text style={ms.ownedValue}>{formatExam(c.originRegion, e.score)}</Text>
            </View>
          ))}
        </Card>
      )}

      <Card>
        <Text style={ms.subheading}>Recommendation letters</Text>
        <Text style={ms.note}>A teacher who knows you well can tip a close call. Application strength from your letters: {Math.round(letterStrength(c))}/100.</Text>
        {teachers.length === 0 ? (
          <Text style={[ms.note, { marginTop: spacing.sm }]}>You don't have a teacher to ask right now.</Text>
        ) : (
          teachers.map((t) => {
            const agreed = (c.recLetters ?? []).includes(t.id);
            return (
              <View key={t.id} style={ms.rowBlock}>
                <View style={ms.rowHead}>
                  <Text style={ms.ownedName}>{t.name}</Text>
                  <Text style={[ms.listingSub, { color: agreed ? colors.primary : colors.textMuted }]}>{agreed ? "Agreed" : t.level >= 60 ? "Likely" : "Unsure"}</Text>
                </View>
                {!agreed && <Button label="Ask for a letter" icon="mail" variant="secondary" onPress={() => askLetter(t.id)} style={ms.inlineBtn} />}
              </View>
            );
          })
        )}
      </Card>
    </MenuScreen>
  );
}

// ---------------------------------------------------------------- applying

export function ApplyMenu({ mode = "bachelor" }: { mode?: "bachelor" | "grad" }) {
  const c = useGameStore((s) => s.character);
  const apply = useGameStore((s) => s.applyToUniversities);
  const applyGrad = useGameStore((s) => s.applyToGrad);
  const pop = useNav((s) => s.pop);
  const enrolled = !!c?.higher;
  // once you've chosen a place, go back to the college hub, which now shows your course
  useEffect(() => {
    if (enrolled) pop();
  }, [enrolled, pop]);
  const [major, setMajor] = useState(() => c?.currentMajor ?? "Business");
  const [prog, setProg] = useState("masters");
  const [picked, setPicked] = useState<string[]>([]);
  const insts = useMemo(() => institutionsFor(c?.originRegion).filter((i) => !i.trade && (mode === "bachelor" || !i.online)), [c?.originRegion, mode]);
  if (!c) return null;
  const win = mode === "bachelor" ? applicationWindow(c) : { ok: !c.higher && c.appliedAge !== c.age, reason: c.appliedAge === c.age ? "You've already applied this year." : "You're already enrolled." };
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 5 ? p : [...p, id]));
  const gp = GRAD_PROGRAMMES.find((p) => p.key === prog)!;
  const gradEl = gradEligibility(c, gp);
  const gpa = mode === "grad" ? lastBachelor(c)?.gpa ?? c.gpa ?? 3 : undefined;
  const md = majorDef(major);
  const ok = win.ok && picked.length > 0 && (mode === "bachelor" || gradEl.ok);
  return (
    <MenuScreen title={mode === "grad" ? "Grad school" : "Apply to university"} icon={mode === "grad" ? "ribbon" : "paper-plane"} color={colors.primary}>
      <Card>
        <Text style={ms.subheading}>Your application</Text>
        <View style={ms.statRow}>
          <Text style={ms.listingName}>{mode === "grad" ? "Degree GPA" : "GPA"}</Text>
          <Text style={ms.ownedValue}>{(gpa ?? c.gpa ?? 3).toFixed(2)}</Text>
        </View>
        {mode === "bachelor" && (
          <View style={ms.statRow}>
            <Text style={ms.listingName}>{EXAMS[c.originRegion ?? "us"].name}</Text>
            <Text style={ms.ownedValue}>{bestExam(c) ? formatExam(c.originRegion, bestExam(c)!.score) : "Not taken"}</Text>
          </View>
        )}
        <View style={ms.statRow}>
          <Text style={ms.listingName}>Activities & leadership</Text>
          <Text style={ms.ownedValue}>{Math.round(extracurricularScore(c))}/100</Text>
        </View>
        <View style={[ms.statRow, { borderBottomWidth: 0, marginBottom: 0, paddingBottom: 0 }]}>
          <Text style={ms.listingName}>Recommendation letters</Text>
          <Text style={ms.ownedValue}>{Math.round(letterStrength(c))}/100</Text>
        </View>
        {!win.ok && <Text style={[ms.note, { color: colors.danger, marginTop: spacing.sm }]}>{win.reason}</Text>}
      </Card>

      {mode === "bachelor" ? (
        <Card>
          <Text style={ms.subheading}>What do you want to study?</Text>
          <View style={styles.chipWrap}>
            {MAJOR_DEFS.map((m) => (
              <TouchableOpacity accessibilityRole="button" key={m.label} activeOpacity={0.8} style={[styles.pick, major === m.label && styles.pickOn]} onPress={() => setMajor(m.label)}>
                <Text style={[styles.pickText, major === m.label && { color: colors.primaryText }]}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {md && (
            <View style={{ marginTop: spacing.md }}>
              <Text style={ms.ownedName}>{md.label}</Text>
              <Text style={ms.listingSub}>{md.blurb}</Text>
              <Text style={[ms.listingSub, { marginTop: 4 }]}>
                Difficulty {md.difficulty}/100 · leads to {md.field.toLowerCase()} · pay {md.pay >= 1.15 ? "high" : md.pay >= 0.98 ? "solid" : "modest"}
              </Text>
            </View>
          )}
        </Card>
      ) : (
        <Card>
          <Text style={ms.subheading}>Which programme?</Text>
          {GRAD_PROGRAMMES.map((p) => {
            const el = gradEligibility(c, p);
            return (
              <TouchableOpacity accessibilityRole="button" key={p.key} activeOpacity={0.8} style={[styles.mode, prog === p.key && styles.modeOn]} onPress={() => setProg(p.key)}>
                <View style={{ flex: 1 }}>
                  <Text style={ms.ownedName}>{p.label}</Text>
                  <Text style={ms.listingSub}>{p.blurb} {p.years} year{p.years > 1 ? "s" : ""}.</Text>
                  {!el.ok && <Text style={[ms.listingSub, { color: colors.danger }]}>{el.reasons[0]}</Text>}
                </View>
                {prog === p.key && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
              </TouchableOpacity>
            );
          })}
        </Card>
      )}

      <Card>
        <Text style={ms.subheading}>Where? Pick up to {mode === "grad" ? 4 : 5} ({picked.length} chosen)</Text>
        {insts.map((i) => {
          let p: number;
          let offer;
          if (mode === "grad") {
            const bar = Math.max(i.bar * 0.85, (gp.minGpa / 4) * 100 - 6);
            p = admitProbability(c, i, gpa, bar);
            offer = { tuition: Math.round(i.cost * gp.cost), net: Math.round(i.cost * gp.cost) };
          } else {
            p = admitProbability(c, i);
            const o = estimateOffer(c, i, major);
            offer = { tuition: o.tuition, net: netTuition(o) };
          }
          const on = picked.includes(i.id);
          return (
            <TouchableOpacity accessibilityRole="button" key={i.id} activeOpacity={0.8} style={[styles.mode, on && styles.modeOn]} onPress={() => toggle(i.id)}>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={ms.ownedName}>{i.name}</Text>
                <Text style={ms.listingSub}>{i.blurb}</Text>
                <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                  <Standing p={p} />
                  <Text style={ms.listingSub}>
                    {offer.tuition === 0 ? "Free tuition" : `${money(offer.tuition)}/yr`}
                    {offer.net < offer.tuition ? ` · ~${money(offer.net)} after aid` : ""}
                  </Text>
                </View>
              </View>
              {on && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
            </TouchableOpacity>
          );
        })}
      </Card>

      <Button
        label={picked.length ? `Submit ${picked.length} application${picked.length > 1 ? "s" : ""}` : "Choose where to apply"}
        icon="paper-plane"
        variant="primary"
        size="lg"
        disabled={!ok}
        onPress={() => (mode === "grad" ? applyGrad(picked, prog) : apply(picked, major))}
      />
      {mode === "grad" && !gradEl.ok && <Text style={[ms.note, { color: colors.danger, marginTop: spacing.sm }]}>{gradEl.reasons.join(" · ")}</Text>}
      <Text style={[ms.note, { marginTop: spacing.md }]}>
        Results arrive straight away. Applying widely with a mix of safe, likely and ambitious choices gives you the best chance of at least one offer.
      </Text>
    </MenuScreen>
  );
}

export function GradMenu() {
  return <ApplyMenu mode="grad" />;
}

// ---------------------------------------------------------------- trades

export function TradesMenu() {
  const c = useGameStore((s) => s.character);
  const startTrade = useGameStore((s) => s.startTrade);
  const pop = useNav((s) => s.pop);
  const enrolledNow = !!c?.higher;
  useEffect(() => {
    if (enrolledNow) pop();
  }, [enrolledNow, pop]);
  if (!c) return null;
  const inst = tradeInstitution(c);
  return (
    <MenuScreen title="Trades & apprenticeships" icon="hammer" color={colors.happiness}>
      <Card>
        <Text style={ms.note}>
          {inst ? `${inst.name}: ${inst.blurb}` : "No trade school near you."} A certificate proves your skills; an apprenticeship pays you a wage while you learn.
        </Text>
        {c.higher && <Text style={[ms.note, { color: colors.danger, marginTop: spacing.sm }]}>You're already enrolled somewhere.</Text>}
      </Card>
      {TRADE_PROGRAMMES.map((p) => {
        const o = tradeOffer(c, p);
        const eligible = (c.gpa ?? 3) >= p.minGpa && c.age >= 16 && !c.higher && c.educationStage !== "middle" && c.educationStage !== "elementary";
        const net = o ? Math.max(0, o.tuition - o.family) : 0;
        return (
          <Card key={p.key}>
            <Text style={ms.ownedName}>{p.label}</Text>
            <Text style={ms.listingSub}>{p.blurb}</Text>
            <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
              <Chip label={`${p.years} YEAR${p.years > 1 ? "S" : ""}`} color={colors.smarts} />
              <Chip label={p.wage ? `PAID ${money(p.wage)}/YR` : net > 0 ? `${money(net)}/YR` : "COVERED"} color={p.wage ? colors.primary : colors.happiness} />
              <Chip label={`GPA ${p.minGpa.toFixed(1)}+`} color={(c.gpa ?? 3) >= p.minGpa ? colors.primary : colors.danger} />
            </View>
            <Button label="Enrol" icon="add" variant="secondary" disabled={!eligible} onPress={() => startTrade(p.key)} style={ms.inlineBtn} />
          </Card>
        );
      })}
    </MenuScreen>
  );
}

// ---------------------------------------------------------------- on campus

export function CampusMenu() {
  const c = useGameStore((s) => s.character);
  const setHousing = useGameStore((s) => s.setHousing);
  const push = useNav((s) => s.push);
  if (!c || !c.higher) return null;
  const h = c.higher;
  const inst = institutionById(h.instId);
  return (
    <MenuScreen title="Campus life" icon="home" color={colors.love}>
      <Card>
        <Text style={styles.heroSub}>{inst?.name}</Text>
        <Text style={ms.note}>{inst?.blurb}</Text>
        {c.greekHouse ? <Text style={[ms.note, { marginTop: spacing.sm }]}>Greek house: {c.greekHouse}</Text> : null}
      </Card>
      <Card>
        <Text style={ms.subheading}>Where you live</Text>
        {h.online ? (
          <Text style={ms.note}>You study online, from home.</Text>
        ) : (
          HOUSING.map((x) => {
            const on = h.housing === x.key;
            const blocked = x.key !== "commute" && !inst?.housing;
            return (
              <TouchableOpacity accessibilityRole="button" key={x.key} activeOpacity={0.8} disabled={blocked} style={[styles.mode, on && styles.modeOn, blocked && { opacity: 0.4 }]} onPress={() => setHousing(x.key)}>
                <View style={{ flex: 1 }}>
                  <Text style={ms.ownedName}>{x.label}</Text>
                  <Text style={ms.listingSub}>{x.costPerYear === 0 ? "Free" : `${money(x.costPerYear)} a year`}{blocked ? " · not offered here" : ""}</Text>
                </View>
                {on && <Ionicons name="checkmark-circle" size={20} color={colors.love} />}
              </TouchableOpacity>
            );
          })
        )}
      </Card>
      <MenuRow icon="trophy" color={colors.happiness} title="Clubs & teams" summary={`${c.schoolActivities?.length ?? 0} activities`} onPress={() => push("clubs")} />
      <MenuRow icon="people" color={colors.love} title="Classmates" summary="Friends, crushes and study partners" onPress={() => push("peopleGroup", { group: "classmates" })} />
      <MenuRow icon="ribbon" color={colors.looks} title="Faculty" summary="Ask for help, or a letter" onPress={() => push("teachers")} />
    </MenuScreen>
  );
}

// ---------------------------------------------------------------- money

export function CollegeMoneyMenu() {
  const c = useGameStore((s) => s.character);
  const push = useNav((s) => s.push);
  if (!c || !c.higher) return null;
  const cost = yearlyCosts(c);
  const student = (c.loans ?? []).find((l) => l.kind === "student");
  return (
    <MenuScreen title="Money & aid" icon="cash" color={colors.primary}>
      <Card>
        <Text style={ms.subheading}>Each year</Text>
        {[
          ["Tuition", money(cost.tuition)],
          ["Scholarships & grants", `-${money(cost.scholarship)}`],
          ["Family contribution", `-${money(cost.family)}`],
          ["Housing", money(cost.housing)],
          ...(cost.wage > 0 ? [["Your wage / stipend", `+${money(cost.wage)}`]] : []),
        ].map(([label, value], i) => (
          <View key={label} style={ms.statRow}>
            <Text style={ms.listingName}>{label}</Text>
            <Text style={ms.ownedValue}>{value}</Text>
          </View>
        ))}
        <View style={[ms.statRow, { borderBottomWidth: 0, marginBottom: 0, paddingBottom: 0 }]}>
          <Text style={ms.ownedName}>You pay</Text>
          <Text style={[ms.ownedValue, { fontSize: fontSize.lg }]}>{money(cost.youPay)}</Text>
        </View>
      </Card>
      <Card>
        <Text style={ms.note}>
          Every year your cash pays first. If that isn't enough, the rest goes on a student loan. Interest builds while you study and repayments start when you leave.
        </Text>
        {student ? (
          <>
            <Text style={[ms.ownedName, { marginTop: spacing.md }]}>Student loan: {money(student.balance)}</Text>
            <Text style={ms.listingSub}>{Math.round(student.apr * 1000) / 10}% interest · {student.deferred ? "payments start after you leave" : `${money(student.minPayment)} a year`}</Text>
            <Button label="See loans" icon="card" variant="secondary" onPress={() => push("loans")} style={ms.inlineBtn} />
          </>
        ) : (
          <Text style={[ms.note, { marginTop: spacing.sm }]}>No student debt so far.</Text>
        )}
      </Card>
    </MenuScreen>
  );
}

// ---------------------------------------------------------------- my degree

export function DegreeMenu() {
  const c = useGameStore((s) => s.character);
  const changeMajor = useGameStore((s) => s.changeMajor);
  const transferTo = useGameStore((s) => s.transferTo);
  const dropOut = useGameStore((s) => s.dropOutOfCollege);
  if (!c || !c.higher) return null;
  const h = c.higher;
  const md = majorDef(h.major);
  const others = institutionsFor(c.originRegion).filter((i) => !i.trade && i.id !== h.instId && !i.online);
  return (
    <MenuScreen title="My degree" icon="ribbon" color={colors.looks}>
      <Card>
        <Text style={styles.heroTitle}>{h.major}</Text>
        <Text style={ms.note}>{LEVEL_LABEL[h.level]} · {h.institution}</Text>
        {md && <Text style={[ms.note, { marginTop: 4 }]}>{md.blurb} Leads to {md.field.toLowerCase()}.</Text>}
        <View style={{ marginTop: spacing.md }}>
          <Bar v={(h.done / h.years) * 100} />
          <Text style={[ms.listingSub, { marginTop: 4 }]}>{h.done} of {h.years} years done · {h.gpa.toFixed(2)} GPA</Text>
        </View>
      </Card>
      {(h.level === "bachelor" || h.level === "associate") && (
        <Card>
          <Text style={ms.subheading}>Change major</Text>
          <Text style={ms.note}>Costs a small fee, and adds a year if you're two or more years in.</Text>
          <View style={[styles.chipWrap, { marginTop: spacing.sm }]}>
            {MAJOR_DEFS.filter((m) => m.label !== h.major).map((m) => (
              <TouchableOpacity accessibilityRole="button" key={m.label} activeOpacity={0.8} style={styles.pick} onPress={() => changeMajor(m.label)}>
                <Text style={styles.pickText}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>
      )}
      {(h.level === "bachelor" || h.level === "associate") && h.done >= 1 && others.length > 0 && (
        <Card>
          <Text style={ms.subheading}>Transfer</Text>
          {others.map((i) => (
            <View key={i.id} style={ms.rowBlock}>
              <Text style={ms.ownedName}>{i.name}</Text>
              <View style={{ flexDirection: "row", gap: 6, marginTop: 4 }}>
                <Standing p={admitProbability(c, i, h.gpa)} />
              </View>
              <Button label="Apply to transfer" icon="swap-horizontal" variant="secondary" onPress={() => transferTo(i.id)} style={ms.inlineBtn} />
            </View>
          ))}
        </Card>
      )}
      <Card>
        <Text style={ms.subheading}>Leaving</Text>
        <Text style={ms.note}>Drop out and you keep any debt, but not the degree.</Text>
        <Button label="Drop out" icon="exit" variant="danger" onPress={dropOut} style={ms.inlineBtn} />
      </Card>
    </MenuScreen>
  );
}

// ---------------------------------------------------------------- transcript

export function TranscriptMenu() {
  const c = useGameStore((s) => s.character);
  if (!c) return null;
  const degrees = c.degrees ?? [];
  return (
    <MenuScreen title="Transcript & degrees" icon="document-text" color={colors.textSecondary}>
      {c.higher && (
        <Card>
          <Text style={ms.subheading}>In progress</Text>
          <Text style={ms.ownedName}>{c.higher.major}</Text>
          <Text style={ms.listingSub}>{c.higher.institution} · year {Math.min(c.higher.done + 1, c.higher.years)} of {c.higher.years} · {c.higher.gpa.toFixed(2)} GPA</Text>
        </Card>
      )}
      <Card>
        <Text style={ms.subheading}>Qualifications</Text>
        {degrees.length === 0 ? (
          <Text style={ms.note}>No degrees or certificates yet.</Text>
        ) : (
          degrees.map((d, i) => (
            <View key={i} style={ms.rowBlock}>
              <Text style={ms.ownedName}>{d.major}</Text>
              <Text style={ms.listingSub}>
                {LEVEL_LABEL[d.level ?? "bachelor"]} · {d.school}
                {d.online ? " (online)" : ""}
              </Text>
              <Text style={ms.listingSub}>
                {d.gpa != null ? `${d.gpa.toFixed(2)} GPA` : ""}
                {d.honors ? ` · ${d.honors}` : ""}
                {d.age != null ? ` · age ${d.age}` : ""}
              </Text>
            </View>
          ))
        )}
      </Card>
      <Card>
        <Text style={ms.subheading}>School record</Text>
        <View style={ms.statRow}>
          <Text style={ms.listingName}>High school</Text>
          <Text style={ms.ownedValue}>{c.diploma === "diploma" ? "Diploma" : c.diploma === "ged" ? "GED" : c.diploma === "none" ? "None" : "-"}</Text>
        </View>
        <View style={[ms.statRow, { borderBottomWidth: 0, marginBottom: 0, paddingBottom: 0 }]}>
          <Text style={ms.listingName}>Internships</Text>
          <Text style={ms.ownedValue}>{c.internships ?? 0}</Text>
        </View>
      </Card>
    </MenuScreen>
  );
}

const styles = StyleSheet.create({
  heroTitle: { color: colors.textPrimary, fontFamily: fonts.extraBold, fontSize: fontSize.xxl - 4 },
  heroSub: { color: colors.textSecondary, fontFamily: fonts.semiBold, fontSize: fontSize.md, marginBottom: 4 },
  bigNumber: { color: colors.textPrimary, fontFamily: fonts.extraBold, fontSize: 40 },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.surfaceRaised, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 3 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  pick: { paddingVertical: 6, paddingHorizontal: 11, borderRadius: radii.pill, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border },
  pickOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  pickText: { color: colors.textSecondary, fontFamily: fonts.semiBold, fontSize: fontSize.sm },
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
  modeOn: { borderColor: colors.primary, backgroundColor: colors.primary + "18" },
});

void ScrollView;
void tabStyles;
void getRegion;
void compositeScore;
void gradMajor;
void housingCost;
