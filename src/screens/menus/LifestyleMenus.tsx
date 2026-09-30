import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGameStore } from "../../state/gameStore";
import { useNav } from "../../nav/navStore";
import MenuScreen, { MenuRow } from "../../nav/MenuScreen";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Chip from "../../components/Chip";
import { DIETS, ROUTINES, bmiWord, checkupCost, dietDef, ensureBody, routineDef } from "../../engine/body";
import { SUBSTANCES, addictionOf, canUse, levelWord, minAgeFor, quitChance, rehabCost, substanceDef } from "../../engine/addiction";
import { FAITHS, faithDef } from "../../engine/mind";
import { HOBBIES, HobbyCat, MAX_ACTIVE, hobbyDef } from "../../data/hobbies";
import { activeHobbies, canShowcase, canTakeUp, hobbyCost, levelWord as hobbyWord, scaleFor } from "../../engine/hobbies";
import { ACHIEVEMENTS, ACH_CATS } from "../../data/achievements";
import { lifeScore } from "../../engine/achievements";
import { fitnessWord, stressWord } from "../../engine/health";
import { ageOf } from "../../engine/people";
import { oddsWord } from "../../engine/immigration";
import { colors, fonts, fontSize, radii, spacing } from "../../theme";
import { ms } from "./menuStyles";
import type { Character, Relationship } from "../../types";

const money = (n: number) => `$${Math.round(Math.abs(n)).toLocaleString()}`;

function Bar({ value, color }: { value: number; color: string }) {
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${Math.max(3, Math.min(100, value))}%`, backgroundColor: color }]} />
    </View>
  );
}

function Opt({ icon, title, sub, on, disabled, onPress, right }: { icon: string; title: string; sub?: string; on?: boolean; disabled?: boolean; onPress: () => void; right?: string }) {
  return (
    <TouchableOpacity accessibilityRole="button" activeOpacity={0.7} disabled={disabled} style={[styles.opt, on && styles.optOn, disabled && { opacity: 0.45 }]} onPress={onPress}>
      <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={18} color={on ? colors.primary : colors.textSecondary} />
      <View style={{ flex: 1 }}>
        <Text style={styles.optTitle}>{title}</Text>
        {sub ? <Text style={styles.optSub}>{sub}</Text> : null}
      </View>
      {right ? <Text style={styles.optRight}>{right}</Text> : null}
      {on ? <Ionicons name="checkmark-circle" size={18} color={colors.primary} /> : null}
    </TouchableOpacity>
  );
}

// ---------- body ----------

export function BodyMenu() {
  const character = useGameStore((s) => s.character);
  const setDiet = useGameStore((x) => x.setDiet);
  const setRoutine = useGameStore((x) => x.setRoutine);
  const doCheckup = useGameStore((x) => x.doCheckup);
  const push = useNav((x) => x.push);
  if (!character) return null;
  ensureBody(character);
  const c = character;
  const scale = scaleFor(c);
  const cost = checkupCost(c);
  return (
    <MenuScreen title="Body & Fitness" icon="barbell" color={colors.health}>
      <Card>
        <Text style={styles.title}>{bmiWord(c.bmi ?? 23)}</Text>
        <Text style={styles.sub}>{fitnessWord(c.fitness ?? 50)} · {stressWord(c.stress ?? 25)}</Text>
        <Text style={styles.label}>Fitness</Text>
        <Bar value={c.fitness ?? 50} color={colors.health} />
        <Text style={[ms.note, { marginTop: spacing.sm }]}>What you eat and how you move decide your weight, your energy, your looks and how likely you are to get ill.</Text>
      </Card>
      {c.age >= 12 ? (
        <>
          <Card>
            <Text style={ms.subheading}>What you eat</Text>
            {DIETS.map((d) => (
              <Opt key={d.key} icon={d.icon} title={d.label} sub={d.blurb} on={(c.diet ?? "normal") === d.key} onPress={() => setDiet(d.key)} right={c.age >= 18 && d.cost !== 0 ? `${d.cost < 0 ? "saves " : ""}${money(d.cost * scale)}/yr` : undefined} />
            ))}
          </Card>
          <Card>
            <Text style={ms.subheading}>How you move</Text>
            {ROUTINES.map((r) => (
              <Opt key={r.key} icon={r.icon} title={r.label} sub={r.blurb} on={(c.routine ?? "none") === r.key} onPress={() => setRoutine(r.key)} right={c.age >= 18 && r.cost > 0 ? `${money(r.cost * scale)}/yr` : undefined} />
            ))}
            {c.routine === "intense" && <Text style={[ms.note, { marginTop: spacing.xs }]}>Training this hard raises your risk of injury.</Text>}
          </Card>
        </>
      ) : (
        <Card><Text style={ms.note}>Your family looks after what you eat and how much you play. From 12 you'll have a say.</Text></Card>
      )}
      <Card>
        <Text style={ms.subheading}>Prevention</Text>
        <Text style={ms.note}>A yearly check-up can catch problems early and takes the edge off worry.</Text>
        <Button label={`Book a check-up (${money(cost)})`} icon="medkit" size="sm" disabled={c.checkupAge === c.age || c.money < cost} onPress={doCheckup} style={{ marginTop: spacing.sm, alignSelf: "flex-start" }} />
      </Card>
      <MenuRow icon="medkit" color={colors.health} title="Health & Wellbeing" summary="Doctor, treatment, insurance" onPress={() => push("health")} />
    </MenuScreen>
  );
}

// ---------- mind & habits ----------

export function MindMenu() {
  const character = useGameStore((s) => s.character);
  const setFaith = useGameStore((x) => x.setFaith);
  const togglePractising = useGameStore((x) => x.togglePractising);
  const toggleMeditation = useGameStore((x) => x.toggleMeditation);
  const toggleVolunteering = useGameStore((x) => x.toggleVolunteering);
  const push = useNav((x) => x.push);
  if (!character) return null;
  const c = character;
  const hookedN = (c.addictions ?? []).filter((a) => a.level >= substanceDef(a.key).hook && !a.quitting).length;
  return (
    <MenuScreen title="Mind & Habits" icon="leaf" color={colors.teal}>
      <Card>
        <Text style={styles.title}>{stressWord(c.stress ?? 25)}</Text>
        <Text style={ms.note}>Your mind takes care of you when you take care of it: quiet time, people who believe in you, and giving something back.</Text>
      </Card>
      <MenuRow icon="beer" color={colors.danger} title="Habits & dependence" summary={hookedN > 0 ? `${hookedN} you're struggling with` : "Alcohol, smoking, gambling, screens..."} onPress={() => push("habits")} />
      <MenuRow icon="chatbubbles" color={colors.love} title="Therapy" summary="Talk to a professional" onPress={() => push("health")} />
      <Card>
        <Text style={ms.subheading}>Daily practice</Text>
        <Opt icon="flower" title="Meditation" sub="A few quiet minutes every day. Lowers stress, steadies the mind." on={!!c.meditating} disabled={c.age < 10} onPress={toggleMeditation} />
        <Opt icon="hand-left" title="Volunteering" sub="Give your time. Feels good, builds contacts, softens you." on={!!c.volunteering} disabled={c.age < 14} onPress={toggleVolunteering} />
      </Card>
      <Card>
        <Text style={ms.subheading}>Faith & meaning</Text>
        <View style={styles.chips}>
          {FAITHS.map((f) => (
            <TouchableOpacity key={f.key} accessibilityRole="button" activeOpacity={0.75} style={[styles.chip, c.faith === f.key && styles.chipOn]} onPress={() => setFaith(f.key)}>
              <Text style={[styles.chipText, c.faith === f.key && { color: colors.primary }]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {c.faith && c.faith !== "none" ? (
          <Opt icon="people" title={`Take part in ${faithDef(c.faith)?.place || "your community"}`} sub="Regular worship or gatherings: community, comfort, new friends." on={!!c.practising} onPress={togglePractising} />
        ) : null}
      </Card>
    </MenuScreen>
  );
}

export function HabitsMenu() {
  const character = useGameStore((s) => s.character);
  const useSubstance = useGameStore((x) => x.useSubstance);
  const quitSubstance = useGameStore((x) => x.quitSubstance);
  if (!character) return null;
  const c = character;
  return (
    <MenuScreen title="Habits & dependence" icon="beer" color={colors.danger}>
      <Text style={ms.note}>Anything can become a habit, and some things become a hold. Watch how your life changes if you let it.</Text>
      {SUBSTANCES.map((s) => {
        const a = addictionOf(c, s.key);
        const chk = canUse(c, s.key);
        const hooked = !!a && a.level >= s.hook && !a.quitting;
        const min = minAgeFor(c, s.key);
        return (
          <Card key={s.key}>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{s.label}</Text>
                <Text style={styles.sub}>{s.blurb}</Text>
              </View>
              {a && a.level >= 5 ? <Chip label={a.quitting ? `Clean ${a.clean ?? 0}y` : levelWord(a.level, s.hook)} color={a.quitting ? colors.primary : a.level >= s.hook ? colors.danger : colors.gold} /> : null}
            </View>
            {a && a.level >= 5 ? (<><Text style={styles.label}>Dependence</Text><Bar value={a.level} color={a.quitting ? colors.primary : colors.danger} /></>) : null}
            {c.age < min ? (
              <Text style={[ms.note, { marginTop: spacing.sm }]}>Not until {min}.</Text>
            ) : (
              <View style={ms.btnRow}>
                <Button label={s.use} icon={s.icon as keyof typeof Ionicons.glyphMap} size="sm" variant="ghost" disabled={!chk.ok} onPress={() => useSubstance(s.key)} />
              </View>
            )}
            {!chk.ok && c.age >= min && chk.reason ? <Text style={styles.optSub}>{chk.reason}</Text> : null}
            {hooked ? (
              <View style={{ marginTop: spacing.sm }}>
                <Text style={ms.subheading}>Getting help</Text>
                <View style={ms.btnRow}>
                  <Button label={`Go cold turkey · ${oddsWord(quitChance(c, s.key, "cold")).toLowerCase()}`} size="sm" variant="secondary" onPress={() => quitSubstance(s.key, "cold")} />
                  <Button label={`Support group · ${oddsWord(quitChance(c, s.key, "group")).toLowerCase()}`} size="sm" variant="secondary" onPress={() => quitSubstance(s.key, "group")} />
                  <Button label={`Rehab ${money(rehabCost(c))} · ${oddsWord(quitChance(c, s.key, "rehab")).toLowerCase()}`} size="sm" variant="primary" disabled={c.money < rehabCost(c)} onPress={() => quitSubstance(s.key, "rehab")} />
                </View>
              </View>
            ) : null}
          </Card>
        );
      })}
    </MenuScreen>
  );
}

// ---------- hobbies ----------

const CAT_LABEL: Record<HobbyCat, string> = { sport: "Sport & fitness", creative: "Creative", mind: "Mind", outdoor: "Outdoors", tech: "Tech & games", craft: "Crafts & making" };

export function HobbiesMenu() {
  const character = useGameStore((s) => s.character);
  const takeUp = useGameStore((x) => x.takeUpHobby);
  const drop = useGameStore((x) => x.dropHobby);
  const showcase = useGameStore((x) => x.hobbyShowcase);
  if (!character) return null;
  const c = character;
  const active = activeHobbies(c);
  const past = Object.entries(c.hobbies ?? {}).filter(([, h]) => !h.active && h.level >= 10).map(([k]) => k);
  const cats = Array.from(new Set(HOBBIES.map((h) => h.cat)));
  return (
    <MenuScreen title="Hobbies" icon="color-palette" color={colors.looks}>
      <Text style={ms.note}>Pick up to {MAX_ACTIVE} at a time. They grow with practice, and the good ones turn into races, gigs, shows and sales.</Text>
      {active.length > 0 ? (
        <Card>
          <Text style={ms.subheading}>Your hobbies</Text>
          {active.map((k) => {
            const def = hobbyDef(k)!;
            const h = c.hobbies![k];
            const sc = def.showcase ? canShowcase(c, k) : null;
            const next = def.milestones.find((m) => !(h.done ?? []).includes(m.id));
            return (
              <View key={k} style={ms.rowBlock}>
                <View style={styles.rowBetween}>
                  <Text style={ms.ownedName}>{def.label}</Text>
                  <Text style={styles.optRight}>{hobbyWord(h.level)} · {Math.round(h.level)}</Text>
                </View>
                <Bar value={h.level} color={colors.looks} />
                {next ? <Text style={styles.optSub}>Next: {next.text.replace(/^You /, "you ")} (at {next.level})</Text> : <Text style={styles.optSub}>You've done everything there is to do here.</Text>}
                <View style={ms.btnRow}>
                  {def.showcase ? <Button label={`${def.showcase.label} (${money(def.showcase.cost * scaleFor(c))})`} size="sm" variant="primary" disabled={!sc?.ok} onPress={() => showcase(k)} /> : null}
                  <Button label="Give up" size="sm" variant="ghost" onPress={() => drop(k)} />
                </View>
                {def.showcase && !sc?.ok && sc?.reason && sc.reason !== "n/a" ? <Text style={styles.optSub}>{sc.reason}</Text> : null}
              </View>
            );
          })}
        </Card>
      ) : null}
      {past.length > 0 ? (
        <Card>
          <Text style={ms.subheading}>Rusty</Text>
          <View style={styles.chips}>
            {past.map((k) => (
              <TouchableOpacity key={k} accessibilityRole="button" style={styles.chip} onPress={() => takeUp(k)}><Text style={styles.chipText}>{hobbyDef(k)!.label} ({Math.round(c.hobbies![k].level)})</Text></TouchableOpacity>
            ))}
          </View>
        </Card>
      ) : null}
      {cats.map((cat) => (
        <Card key={cat}>
          <Text style={ms.subheading}>{CAT_LABEL[cat]}</Text>
          {HOBBIES.filter((h) => h.cat === cat && !active.includes(h.key)).map((def) => {
            const chk = canTakeUp(c, def);
            return <Opt key={def.key} icon={def.icon} title={def.label} sub={chk.ok ? def.blurb : chk.reason} disabled={!chk.ok} onPress={() => takeUp(def.key)} right={c.age >= 18 ? `${money(hobbyCost(c, def))}/yr` : undefined} />;
          })}
        </Card>
      ))}
    </MenuScreen>
  );
}

// ---------- achievements ----------

export function AchievementsMenu() {
  const character = useGameStore((s) => s.character);
  const toggleBucket = useGameStore((x) => x.toggleBucket);
  const [cat, setCat] = React.useState<string>("all");
  if (!character) return null;
  const c = character;
  const have = c.achievements ?? {};
  const bucket = (c.bucket ?? []).map((k) => ACHIEVEMENTS.find((a) => a.key === k)).filter((a): a is (typeof ACHIEVEMENTS)[number] => !!a);
  const list = ACHIEVEMENTS.filter((a) => cat === "all" || a.cat === cat).sort((a, b) => Number(have[b.key] !== undefined) - Number(have[a.key] !== undefined));
  return (
    <MenuScreen title="Achievements" icon="trophy" color={colors.gold}>
      <Card>
        <Text style={styles.title}>{Object.keys(have).length} of {ACHIEVEMENTS.length}</Text>
        <Text style={styles.sub}>Life score {lifeScore(c)}</Text>
        <Bar value={(Object.keys(have).length / ACHIEVEMENTS.length) * 100} color={colors.gold} />
      </Card>
      {bucket.length > 0 && (
        <Card>
          <Text style={ms.subheading}>Bucket list</Text>
          {bucket.map((a) => {
            const done = have[a.key] !== undefined;
            const p = a.progress?.(c);
            return (
              <View key={a.key} style={styles.achRow}>
                <Ionicons name={done ? "checkmark-circle" : "flag"} size={18} color={done ? colors.primary : colors.gold} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.optTitle}>{a.label}</Text>
                  <Text style={styles.optSub}>{done ? `Done at ${have[a.key]}` : p ? `${Math.min(p[0], p[1]).toLocaleString()} / ${p[1].toLocaleString()}` : a.hint}</Text>
                </View>
              </View>
            );
          })}
        </Card>
      )}
      <View style={styles.chips}>
        {["all", ...ACH_CATS].map((k) => (
          <TouchableOpacity key={k} accessibilityRole="button" activeOpacity={0.75} style={[styles.chip, cat === k && styles.chipOn]} onPress={() => setCat(k)}>
            <Text style={[styles.chipText, cat === k && { color: colors.primary }]}>{k === "all" ? "All" : k}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Card>
        {list.map((a) => {
          const done = have[a.key] !== undefined;
          const p = a.progress?.(c);
          const pinned = (c.bucket ?? []).includes(a.key);
          return (
            <TouchableOpacity key={a.key} accessibilityRole="button" activeOpacity={0.7} style={styles.achRow} onPress={() => !done && toggleBucket(a.key)}>
              <View style={[styles.achIcon, done && { backgroundColor: colors.gold + "33" }]}>
                <Ionicons name={a.icon as keyof typeof Ionicons.glyphMap} size={18} color={done ? colors.gold : colors.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optTitle, !done && { color: colors.textSecondary }]}>{a.label}</Text>
                <Text style={styles.optSub}>{done ? `Earned at ${have[a.key]} · +${a.points}` : `${a.hint}${p ? ` · ${Math.min(p[0], p[1]).toLocaleString()}/${p[1].toLocaleString()}` : ""}`}</Text>
              </View>
              {!done && <Ionicons name={pinned ? "flag" : "flag-outline"} size={18} color={pinned ? colors.gold : colors.textMuted} />}
            </TouchableOpacity>
          );
        })}
      </Card>
      <Text style={ms.note}>Tap a locked achievement to pin it to your bucket list.</Text>
    </MenuScreen>
  );
}

// ---------- family tree ----------

function Person({ c, r }: { c: Character; r: Relationship }) {
  const age = ageOf(c, r);
  return (
    <View style={styles.treeRow}>
      <View style={[styles.dotP, !r.alive && { backgroundColor: colors.textMuted }]} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.optTitle, !r.alive && { color: colors.textMuted }]}>{r.name}</Text>
        <Text style={styles.optSub}>{r.alive ? `${age}` : `died at ${age}`}{r.gender ? ` · ${r.gender === "nonbinary" ? "nonbinary" : r.gender}` : ""}{r.married ? " · married to you" : r.type === "partner" ? " · partner" : ""}</Text>
      </View>
    </View>
  );
}

export function TreeMenu() {
  const character = useGameStore((s) => s.character);
  if (!character) return null;
  const c = character;
  const of = (...t: string[]) => c.relationships.filter((r) => t.includes(r.type) && r.status !== "placed").sort((a, b) => ageOf(c, b) - ageOf(c, a));
  const groups: [string, Relationship[]][] = [
    ["Parents", of("mother", "father")],
    ["Partner", of("partner")],
    ["Siblings", of("sibling")],
    ["Children", of("child")],
    ["Grandchildren", of("grandchild")],
  ];
  return (
    <MenuScreen title="Family tree" icon="git-network" color={colors.looks}>
      <Card>
        <Text style={styles.title}>{c.firstName} {c.lastName}</Text>
        <Text style={styles.sub}>Age {c.age} · {c.gender}</Text>
      </Card>
      {groups.map(([label, members]) =>
        members.length === 0 ? null : (
          <Card key={label}>
            <Text style={ms.subheading}>{label}</Text>
            {members.map((r) => <Person key={r.id} c={c} r={r} />)}
          </Card>
        ),
      )}
    </MenuScreen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fontSize.lg },
  sub: { color: colors.textMuted, fontFamily: fonts.semiBold, fontSize: fontSize.sm, marginTop: 2 },
  label: { color: colors.textSecondary, fontFamily: fonts.semiBold, fontSize: fontSize.sm, marginTop: spacing.md, marginBottom: 4 },
  track: { height: 7, borderRadius: 4, backgroundColor: colors.surfaceRaised, overflow: "hidden", marginTop: 4 },
  fill: { height: 7, borderRadius: 4 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
  opt: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.surfaceRaised, marginTop: spacing.sm, borderWidth: 1, borderColor: "transparent" },
  optOn: { borderColor: colors.primary },
  optTitle: { color: colors.textPrimary, fontFamily: fonts.semiBold, fontSize: fontSize.base },
  optSub: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: fontSize.sm, marginTop: 1 },
  optRight: { color: colors.textSecondary, fontFamily: fonts.semiBold, fontSize: fontSize.sm },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginVertical: spacing.sm },
  chip: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radii.pill, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: "transparent" },
  chipOn: { borderColor: colors.primary, backgroundColor: colors.primary + "18" },
  chipText: { color: colors.textSecondary, fontFamily: fonts.semiBold, fontSize: fontSize.md },
  achRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm },
  achIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.surfaceRaised, alignItems: "center", justifyContent: "center" },
  treeRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: 6 },
  dotP: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
});
