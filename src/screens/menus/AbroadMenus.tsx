import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGameStore } from "../../state/gameStore";
import { useNav } from "../../nav/navStore";
import MenuScreen, { MenuRow } from "../../nav/MenuScreen";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Chip from "../../components/Chip";
import { COUNTRIES, LANGUAGE_LABEL, LanguageKey, country, openWord } from "../../data/countries";
import { citiesFor, cityByKey } from "../../data/cities";
import { getRegion } from "../../data/regions";
import { RegionKey, VisaRoute } from "../../types";
import { ROUTE_LABEL, ensureAbroad, isAbroad, isCitizen, langLevel, languageWord, lessonCost, naturalizeCheck, oddsWord, passportStrength, routesFor, statusLabel, tripCheck } from "../../engine/immigration";
import { cityOf, livingIndex } from "../../engine/where";
import { colors, fonts, fontSize, radii, spacing } from "../../theme";
import { ms } from "./menuStyles";

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;
const ALL = Object.keys(COUNTRIES) as RegionKey[];
const label = (r: RegionKey) => getRegion(r).label;

function Bar({ value, color }: { value: number; color: string }) {
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${Math.max(3, Math.min(100, value))}%`, backgroundColor: color }]} />
    </View>
  );
}

// ---------- the hub ----------

export function AbroadHub() {
  const character = useGameStore((s) => s.character);
  const withdrawVisa = useGameStore((s) => s.withdrawVisa);
  const push = useNav((s) => s.push);
  if (!character) return null;
  ensureAbroad(character);
  const abroad = isAbroad(character);
  const c = character;
  const imm = c.immigration;
  const app = c.visaApp;
  const nat = abroad ? naturalizeCheck(c) : null;
  const home = (c.citizenships ?? []).find((r) => r !== c.originRegion);
  const nLangs = Object.values(c.languages ?? {}).filter((v) => (v ?? 0) >= 25).length;
  return (
    <MenuScreen title="Across Borders" icon="earth" color={colors.teal}>
      <Card>
        <View style={styles.flagRow}>
          {(c.citizenships ?? []).map((r) => (
            <Text key={r} style={styles.bigFlag}>{country(r).flag}</Text>
          ))}
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{(c.citizenships ?? []).map((r) => country(r).demonym).join(" · ")} citizen</Text>
            <Text style={styles.sub}>Passport strength {passportStrength(c)}/100</Text>
          </View>
        </View>
        {abroad && imm ? (
          <>
            <Text style={[ms.note, { marginTop: spacing.sm }]}>
              Living in {cityOf(c).name}, {label(c.originRegion!)} - {statusLabel(imm.status).toLowerCase()}
              {imm.expires !== undefined && imm.status !== "permanent" ? `, ${imm.status === "overstay" ? "you must leave by age" : "valid until age"} ${imm.expires}` : ""}. {imm.years} year{imm.years === 1 ? "" : "s"} in the country.
            </Text>
            <Text style={styles.meterLabel}>Feeling settled: {c.integration ?? 0}/100</Text>
            <Bar value={c.integration ?? 0} color={colors.teal} />
          </>
        ) : (
          <Text style={[ms.note, { marginTop: spacing.sm }]}>You live in your own country, {label(c.originRegion!)}.</Text>
        )}
        {app && (
          <View style={styles.pending}>
            <Ionicons name="hourglass" size={16} color={colors.gold} />
            <Text style={styles.pendingText}>
              {ROUTE_LABEL[app.route]} application{app.route === "residence" || app.route === "family" ? "" : ` for ${label(app.dest)}`} - decision at age {app.decides}
            </Text>
            <TouchableOpacity accessibilityRole="button" onPress={withdrawVisa}><Text style={styles.link}>Withdraw</Text></TouchableOpacity>
          </View>
        )}
      </Card>
      <MenuRow icon="airplane" color={colors.teal} title={abroad ? "Move to another country" : "Move abroad"} summary={c.age < 18 ? "Adults only - families sometimes emigrate" : `${ALL.length - 1} countries, six visa routes`} delay={0} onPress={() => push("abroadlist")} />
      <MenuRow icon="id-card" color={colors.gold} title="Passport & languages" summary={`${nLangs} language${nLangs === 1 ? "" : "s"} · ${(c.visited ?? []).length} stamp${(c.visited ?? []).length === 1 ? "" : "s"}`} delay={40} onPress={() => push("passport")} />
      <MenuRow icon="map" color={colors.love} title="Travel" summary="Trips abroad, with visas where needed" delay={80} onPress={() => push("travel")} />
      {abroad && (
        <MenuRow icon="ribbon" color={colors.primary} title="Citizenship" summary={nat?.ok ? "You're eligible to apply" : `Becoming ${country(c.originRegion).demonym}`} badge={nat?.ok ? "Ready" : undefined} delay={120} onPress={() => push("citizen")} />
      )}
      {abroad && home && (
        <MenuRow icon="home" color={colors.smarts} title={`Go back to ${label(home)}`} summary="Move home, leaving your life here" delay={160} onPress={() => push("gohome", { to: home })} />
      )}
    </MenuScreen>
  );
}

// ---------- pick a country ----------

export function AbroadListMenu() {
  const character = useGameStore((s) => s.character);
  const push = useNav((s) => s.push);
  if (!character) return null;
  const list = ALL.filter((r) => r !== character.originRegion).sort((a, b) => country(b).open - country(a).open);
  return (
    <MenuScreen title="Move abroad" icon="airplane" color={colors.teal}>
      <Text style={ms.note}>
        {character.age < 18 ? "You can't apply on your own yet." : "Pick a country to see the routes in, what they ask for and your odds. Moving means leaving your job, selling your home and starting over."}
      </Text>
      {list.map((r, i) => {
        const d = country(r);
        return (
          <MenuRow key={r} icon="flag" color={colors.teal} title={`${d.flag}  ${label(r)}`} summary={`${openWord(d.open)} · ${LANGUAGE_LABEL[d.language]}`} delay={i * 20} onPress={() => push("abroadcountry", { to: r })} />
        );
      })}
    </MenuScreen>
  );
}

export function CountryMenu({ dest }: { dest: RegionKey }) {
  const character = useGameStore((s) => s.character);
  const applyVisa = useGameStore((s) => s.applyVisa);
  const pop = useNav((s) => s.pop);
  const cities = citiesFor(dest);
  const [cityKey, setCityKey] = React.useState<string>(cities.find((c) => c.tier === "capital")?.key ?? cities[0]?.key ?? "");
  if (!character) return null;
  ensureAbroad(character);
  const d = country(dest);
  const routes = routesFor(character, dest);
  const lang = langLevel(character, d.language);
  return (
    <MenuScreen title={label(dest)} icon="flag" color={colors.teal}>
      <Card>
        <Text style={styles.title}>{d.flag}  {label(dest)}</Text>
        <Text style={styles.sub}>{openWord(d.open)} · {LANGUAGE_LABEL[d.language]} · citizenship after {d.naturalizeYears} years · {d.dual ? "dual citizenship allowed" : "no dual citizenship"}</Text>
        <Text style={[ms.note, { marginTop: spacing.sm }]}>{d.blurb}</Text>
        <Text style={styles.meterLabel}>Your {LANGUAGE_LABEL[d.language]}: {languageWord(lang).toLowerCase()} ({lang})</Text>
        <Bar value={lang} color={colors.smarts} />
        <Text style={[ms.subheading, { marginTop: spacing.md }]}>Where would you live?</Text>
        <View style={styles.chips}>
          {cities.map((c) => (
            <TouchableOpacity key={c.key} accessibilityRole="button" activeOpacity={0.75} style={[styles.chip, cityKey === c.key && styles.chipOn]} onPress={() => setCityKey(c.key)}>
              <Text style={[styles.chipText, cityKey === c.key && { color: colors.primary }]}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={ms.note}>{cityByKey(cityKey)?.blurb}</Text>
      </Card>
      {routes.map((r) => (
        <Card key={r.route}>
          <View style={styles.routeHead}>
            <Text style={styles.routeName}>{ROUTE_LABEL[r.route]}</Text>
            <Chip label={oddsWord(r.chance)} color={r.chance >= 0.6 ? colors.primary : r.chance >= 0.4 ? colors.gold : colors.danger} />
          </View>
          <Text style={ms.note}>{r.blurb}</Text>
          {r.reqs.map((q) => (
            <Text key={q.label} style={[styles.req, { color: q.met ? colors.primary : colors.danger }]}>
              {q.met ? "✓" : "✗"} {q.label}{!q.met && q.note ? ` - ${q.note}` : ""}
            </Text>
          ))}
          <Text style={[ms.note, { marginTop: spacing.xs }]}>Fee {money(r.fee)} · decision in {r.wait} year{r.wait === 1 ? "" : "s"}</Text>
          <Button label="Apply" icon="paper-plane" variant="primary" disabled={!r.ok} onPress={() => { applyVisa(dest, r.route as VisaRoute, cityKey); pop(); }} style={{ marginTop: spacing.sm }} />
        </Card>
      ))}
    </MenuScreen>
  );
}

// ---------- passport & languages ----------

export function PassportMenu() {
  const character = useGameStore((s) => s.character);
  const studyLanguage = useGameStore((s) => s.studyLanguage);
  if (!character) return null;
  ensureAbroad(character);
  const c = character;
  const langs = (Object.keys(LANGUAGE_LABEL) as LanguageKey[]).filter((k) => langLevel(c, k) > 0 || k === country(c.originRegion).language);
  const learnable = (Object.keys(LANGUAGE_LABEL) as LanguageKey[]);
  const cost = lessonCost(c);
  const doneThisYear = c.langStudyAge === c.age;
  return (
    <MenuScreen title="Passport & languages" icon="id-card" color={colors.gold}>
      <Card>
        <Text style={ms.subheading}>Passports</Text>
        {(c.citizenships ?? []).map((r) => (
          <View key={r} style={styles.line}>
            <Text style={styles.lineLabel}>{country(r).flag}  {country(r).demonym} passport</Text>
            <Text style={styles.lineValue}>{country(r).passport}/100</Text>
          </View>
        ))}
        <Text style={ms.note}>A stronger passport means fewer visas when you travel.</Text>
        <Text style={ms.subheading}>Stamps</Text>
        <Text style={ms.note}>{(c.visited ?? []).length ? (c.visited ?? []).map((r) => `${country(r).flag} ${label(r)}`).join("   ") : "No trips abroad yet."}</Text>
      </Card>
      <Card>
        <Text style={ms.subheading}>Languages</Text>
        {langs.map((k) => (
          <View key={k} style={{ marginBottom: spacing.sm }}>
            <View style={styles.line}>
              <Text style={styles.lineLabel}>{LANGUAGE_LABEL[k]}</Text>
              <Text style={styles.lineValue}>{languageWord(langLevel(c, k))}</Text>
            </View>
            <Bar value={langLevel(c, k)} color={colors.smarts} />
          </View>
        ))}
      </Card>
      <Card>
        <Text style={ms.subheading}>Take lessons ({money(cost)}, once a year)</Text>
        <View style={styles.chips}>
          {learnable.map((k) => (
            <TouchableOpacity key={k} accessibilityRole="button" activeOpacity={0.75} disabled={doneThisYear || c.money < cost || langLevel(c, k) >= 95 || c.age < 8} style={[styles.chip, (doneThisYear || c.money < cost || langLevel(c, k) >= 95) && { opacity: 0.4 }]} onPress={() => studyLanguage(k)}>
              <Text style={styles.chipText}>{LANGUAGE_LABEL[k]}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {doneThisYear ? <Text style={ms.note}>You've had your lessons this year.</Text> : c.age < 8 ? <Text style={ms.note}>Too young for formal lessons.</Text> : null}
      </Card>
    </MenuScreen>
  );
}

// ---------- travel ----------

export function TravelMenu() {
  const character = useGameStore((s) => s.character);
  const takeTrip = useGameStore((s) => s.takeTrip);
  if (!character) return null;
  ensureAbroad(character);
  const c = character;
  const list = ALL.filter((r) => r !== c.originRegion);
  return (
    <MenuScreen title="Travel" icon="map" color={colors.love}>
      <Text style={ms.note}>
        A trip costs flights plus a stay, scaled to where you're going. Passports with fewer doors need a tourist visa, and those can be refused. One trip a year.
        {c.age < 18 ? " Your family pays." : ""}
      </Text>
      {list.map((r, i) => {
        const chk = tripCheck(c, r);
        return (
          <MenuRow key={r} icon="airplane" color={colors.love} title={`${country(r).flag}  ${label(r)}`} summary={chk.ok ? `${chk.cost ? money(chk.cost + chk.visaFee) : "Free"} · ${chk.visaFree ? "no visa needed" : `visa ${money(chk.visaFee)}`}${(c.visited ?? []).includes(r) ? " · visited" : ""}` : chk.reason} disabled={!chk.ok} delay={i * 20} onPress={() => takeTrip(r)} />
        );
      })}
    </MenuScreen>
  );
}

// ---------- citizenship ----------

export function CitizenMenu() {
  const character = useGameStore((s) => s.character);
  const naturalise = useGameStore((s) => s.naturalise);
  const pop = useNav((s) => s.pop);
  if (!character) return null;
  ensureAbroad(character);
  const c = character;
  if (!isAbroad(c)) return <MenuScreen title="Citizenship" icon="ribbon"><Text style={ms.note}>You already live in your own country.</Text></MenuScreen>;
  const d = country(c.originRegion);
  const chk = naturalizeCheck(c);
  return (
    <MenuScreen title="Citizenship" icon="ribbon" color={colors.primary}>
      <Card>
        <Text style={styles.title}>{d.flag}  Becoming {d.demonym}</Text>
        <Text style={ms.note}>Pass the test and take the oath. {chk.keepsOld ? "You'd keep your other passport." : `${label(c.originRegion!)} doesn't allow dual citizenship (or one of your passports doesn't), so you'd give up your current one.`}</Text>
        {chk.reqs.map((q) => (
          <Text key={q.label} style={[styles.req, { color: q.met ? colors.primary : colors.danger }]}>{q.met ? "✓" : "✗"} {q.label}</Text>
        ))}
        <Text style={[ms.note, { marginTop: spacing.sm }]}>Chance of passing: {oddsWord(chk.chance).toLowerCase()}.</Text>
        <Button label="Take the citizenship test" icon="ribbon" variant="primary" disabled={!chk.ok} onPress={() => { naturalise(); pop(); }} style={{ marginTop: spacing.sm }} />
      </Card>
    </MenuScreen>
  );
}

// ---------- going home ----------

export function GoHomeMenu({ dest }: { dest: RegionKey }) {
  const character = useGameStore((s) => s.character);
  const returnHomeAbroad = useGameStore((s) => s.returnHomeAbroad);
  const pop = useNav((s) => s.pop);
  if (!character) return null;
  const d = country(dest);
  const cost = Math.round((900 + 1100) * livingIndex(dest));
  return (
    <MenuScreen title={`Back to ${label(dest)}`} icon="home" color={colors.smarts}>
      <Card>
        <Text style={styles.title}>{d.flag}  Going home</Text>
        <Text style={ms.note}>You'd leave your job and home here, say goodbye to friends, and start again in {label(dest)} with a studio flat. Moving costs about {money(cost)}. Your language skills and any passports stay with you.</Text>
        <Button label={`Move back to ${label(dest)}`} icon="airplane" variant="primary" disabled={!isCitizen(character, dest) || character.money < cost + 500} onPress={() => { returnHomeAbroad(dest); pop(); pop(); }} style={{ marginTop: spacing.sm }} />
      </Card>
    </MenuScreen>
  );
}

const styles = StyleSheet.create({
  flagRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  bigFlag: { fontSize: 34 },
  title: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fontSize.lg },
  sub: { color: colors.textMuted, fontFamily: fonts.semiBold, fontSize: fontSize.sm, marginTop: 2 },
  meterLabel: { color: colors.textSecondary, fontFamily: fonts.semiBold, fontSize: fontSize.sm, marginTop: spacing.sm, marginBottom: 4 },
  track: { height: 7, borderRadius: 4, backgroundColor: colors.surfaceRaised, overflow: "hidden" },
  fill: { height: 7, borderRadius: 4 },
  pending: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.md, backgroundColor: colors.surfaceRaised, padding: spacing.sm, borderRadius: radii.md },
  pendingText: { flex: 1, color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fontSize.sm },
  link: { color: colors.danger, fontFamily: fonts.semiBold, fontSize: fontSize.sm },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginVertical: spacing.sm },
  chip: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radii.pill, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: "transparent" },
  chipOn: { borderColor: colors.primary, backgroundColor: colors.primary + "18" },
  chipText: { color: colors.textSecondary, fontFamily: fonts.semiBold, fontSize: fontSize.md },
  routeHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  routeName: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fontSize.base },
  req: { fontFamily: fonts.regular, fontSize: fontSize.md, marginTop: 3, lineHeight: 18 },
  line: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  lineLabel: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fontSize.md },
  lineValue: { color: colors.textPrimary, fontFamily: fonts.semiBold, fontSize: fontSize.md },
});
