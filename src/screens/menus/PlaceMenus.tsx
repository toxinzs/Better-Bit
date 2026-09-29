import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGameStore } from "../../state/gameStore";
import { useNav } from "../../nav/navStore";
import MenuScreen, { MenuRow } from "../../nav/MenuScreen";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Chip from "../../components/Chip";
import { TIER_LABEL, cityByKey, citiesFor } from "../../data/cities";
import { LIFESTYLES, RENT_OPTIONS, lifestyleDef, rentOption } from "../../data/housing";
import { getRegion } from "../../data/regions";
import { cityOf } from "../../engine/where";
import { canMoveHome, canRent, depositFor, ensureLocation, livingCost, livingShare, previewMove, rentFor } from "../../engine/location";
import { totalNetWorth } from "../../engine/lifeEngine";
import { colors, fonts, fontSize, radii, spacing } from "../../theme";
import { ms } from "./menuStyles";
import type { Character } from "../../types";

const money = (n: number) => `${n < 0 ? "-" : ""}$${Math.abs(Math.round(n)).toLocaleString()}`;

const HOUSING_WORD: Record<string, string> = { family: "Living with family", rent: "Renting", own: "Homeowner", homeless: "No fixed home" };

const housingSummary = (c: Character) => {
  const res = c.residence;
  if (!res) return "";
  if (res.housing === "rent") return `Renting · ${money(res.rent ?? 0)}/yr`;
  if (res.housing === "own") return c.home ? `${c.home.name} · ${money(c.home.value)}` : "Homeowner";
  return HOUSING_WORD[res.housing];
};

function Meter({ label, value, color, note }: { label: string; value: number; color: string; note?: string }) {
  return (
    <View style={styles.meterRow}>
      <Text style={styles.meterLabel}>{label}</Text>
      <View style={styles.meterTrack}>
        <View style={[styles.meterFill, { width: `${Math.max(4, Math.min(100, value))}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.meterNote}>{note}</Text>
    </View>
  );
}

const costWord = (x: number) => (x >= 1.3 ? "Very high" : x >= 1.08 ? "High" : x >= 0.9 ? "Average" : x >= 0.75 ? "Low" : "Very low");
const wageWord = (x: number) => (x >= 1.2 ? "Very high" : x >= 1.05 ? "High" : x >= 0.92 ? "Average" : x >= 0.8 ? "Low" : "Very low");
const safetyWord = (x: number) => (x >= 85 ? "Very safe" : x >= 70 ? "Safe" : x >= 55 ? "Mixed" : x >= 45 ? "Rough" : "Dangerous");

function CityCard({ city, region }: { city: ReturnType<typeof cityByKey>; region: string }) {
  if (!city) return null;
  return (
    <>
      <Text style={styles.cityName}>{city.name}</Text>
      <Text style={styles.cityMeta}>
        {TIER_LABEL[city.tier]} · {region}
      </Text>
      <Text style={ms.note}>{city.blurb}</Text>
      <Meter label="Cost of living" value={(city.cost / 1.6) * 100} color={colors.danger} note={costWord(city.cost)} />
      <Meter label="Wages" value={(city.wage / 1.4) * 100} color={colors.primary} note={wageWord(city.wage)} />
      <Meter label="Safety" value={city.safety} color={colors.teal} note={safetyWord(city.safety)} />
      <Meter label="Schools" value={city.schools} color={colors.smarts} note={`${city.schools}/100`} />
      <View style={styles.chips}>
        {city.strengths.map((s) => (
          <Chip key={s} label={s} color={colors.gold} />
        ))}
      </View>
    </>
  );
}

// ---------- the hub ----------

export function PlaceHub() {
  const character = useGameStore((s) => s.character);
  const push = useNav((s) => s.push);
  if (!character) return null;
  ensureLocation(character);
  const city = cityOf(character);
  const region = getRegion(character.originRegion);
  const b = character.budget;
  return (
    <MenuScreen title="Home & Moving" icon="home" color={colors.gold}>
      <Card>
        <CityCard city={city} region={region.label} />
        <Text style={[ms.note, { marginTop: spacing.sm }]}>{housingSummary(character)}</Text>
      </Card>
      <MenuRow icon="swap-horizontal" color={colors.teal} title="Move to another city" summary={character.age < 18 ? "Your family decides for now" : `${citiesFor(character.originRegion).length - 1} other cities in ${region.label}`} delay={0} onPress={() => push("move")} />
      <MenuRow icon="key" color={colors.love} title="Rent a place" summary={character.residence?.housing === "rent" ? `${rentOption(character.residence.rentKey)?.label} · ${money(character.residence.rent ?? 0)}/yr` : character.age < 18 ? "Adults only" : "Find somewhere of your own"} delay={40} onPress={() => push("rent")} />
      <MenuRow icon="home" color={colors.gold} title="Buy or sell a home" summary={character.home ? `${character.home.name} · ${money(character.home.value)}` : "Prices here scale with the city"} delay={80} onPress={() => push("home")} />
      <MenuRow icon="wallet" color={colors.primary} title="Budget & lifestyle" summary={b ? `Last year: ${money(b.income - b.tax - b.rent - b.living - b.upkeep)} left over` : `Living costs ~${money(livingCost(character) * livingShare(character))}/yr`} delay={120} onPress={() => push("budget")} />
    </MenuScreen>
  );
}

// ---------- moving ----------

export function MoveMenu() {
  const character = useGameStore((s) => s.character);
  const push = useNav((s) => s.push);
  if (!character) return null;
  ensureLocation(character);
  const here = cityOf(character);
  const region = getRegion(character.originRegion);
  const list = citiesFor(character.originRegion).slice().sort((a, b) => b.cost - a.cost);
  return (
    <MenuScreen title="Move" icon="swap-horizontal" color={colors.teal}>
      <Text style={ms.note}>
        {character.age < 18
          ? "You're too young to move on your own - but families do move, and when yours does you'll find out."
          : `You live in ${here.name}. Pick a city in ${region.label} to see what a move would change - your job, your friends, your rent.`}
      </Text>
      {list.map((c, i) => {
        const here2 = c.key === here.key;
        return (
          <MenuRow
            key={c.key}
            icon={c.tier === "capital" ? "flag" : c.tier === "big" ? "business" : c.tier === "mid" ? "storefront" : "leaf"}
            color={here2 ? colors.gold : colors.teal}
            title={c.name}
            summary={`${TIER_LABEL[c.tier]} · cost ${costWord(c.cost).toLowerCase()} · ${safetyWord(c.safety).toLowerCase()}`}
            badge={here2 ? "You" : undefined}
            delay={i * 25}
            onPress={() => push("movecity", { city: c.key })}
          />
        );
      })}
    </MenuScreen>
  );
}

export function MoveCityMenu({ cityKey }: { cityKey: string }) {
  const character = useGameStore((s) => s.character);
  const moveToCity = useGameStore((s) => s.moveToCity);
  const pop = useNav((s) => s.pop);
  const [rentKey, setRentKey] = React.useState<(typeof RENT_OPTIONS)[number]["key"]>("studio");
  const dest = cityByKey(cityKey);
  if (!character || !dest) return null;
  ensureLocation(character);
  const pre = previewMove(character, dest);
  const region = getRegion(dest.region);
  const rent = rentFor(character, dest, rentKey);
  const total = pre.cost + depositFor(rent);
  const canAfford = character.money >= total;
  const owns = !!character.home;
  const go = () => {
    moveToCity(dest.key, rentKey);
    pop();
    pop();
  };
  const jobLine = (label: string, fate: "none" | "keep" | "lose", job: Character["job"]) =>
    fate === "none" ? null : (
      <Text key={label} style={[styles.effect, { color: fate === "keep" ? colors.primary : colors.danger }]}>
        {fate === "keep" ? "✓" : "✗"} Your {label} ({job?.title}) {fate === "keep" ? "transfers with you" : "won't come with you"}
      </Text>
    );
  return (
    <MenuScreen title={dest.name} icon="swap-horizontal" color={colors.teal}>
      <Card>
        <CityCard city={dest} region={region.label} />
      </Card>
      <Card>
        <Text style={ms.subheading}>If you move</Text>
        <Text style={styles.effect}>
          Pay here would change by {pre.wageDelta >= 0 ? "+" : ""}
          {pre.wageDelta}%; rent by {pre.rentDelta >= 0 ? "+" : ""}
          {pre.rentDelta}%.
        </Text>
        {jobLine("job", pre.job, character.job)}
        {jobLine("part-time job", pre.partTime, character.partTime ?? null)}
        {owns && <Text style={[styles.effect, { color: colors.danger }]}>✗ You'd have to sell your home first.</Text>}
        <Text style={styles.effect}>• Friends and classmates will drift apart, and you'll feel homesick for a while.</Text>
        <Text style={styles.effect}>• You'll meet new neighbours, and start a new life at school or work.</Text>
        <Text style={ms.subheading}>Where will you live?</Text>
        {RENT_OPTIONS.filter((o) => character.age >= o.minAge).map((o) => (
          <TouchableOpacity key={o.key} accessibilityRole="button" activeOpacity={0.7} style={[styles.opt, rentKey === o.key && styles.optOn]} onPress={() => setRentKey(o.key)}>
            <Ionicons name={o.icon as keyof typeof Ionicons.glyphMap} size={18} color={rentKey === o.key ? colors.primary : colors.textSecondary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.optTitle}>{o.label}</Text>
              <Text style={styles.optSub}>{money(rentFor(character, dest, o.key))}/yr</Text>
            </View>
            {rentKey === o.key && <Ionicons name="checkmark-circle" size={18} color={colors.primary} />}
          </TouchableOpacity>
        ))}
        <Text style={[ms.note, { marginTop: spacing.sm }]}>
          Moving costs {money(pre.cost)} plus a {money(depositFor(rent))} deposit: {money(total)} in all. You have {money(character.money)}.
        </Text>
        {pre.blocked ? <Text style={[styles.effect, { color: colors.danger }]}>{pre.blocked}</Text> : null}
        <Button label={`Move to ${dest.name}`} icon="airplane" variant="primary" disabled={!!pre.blocked || !canAfford} onPress={go} style={{ marginTop: spacing.sm }} />
      </Card>
    </MenuScreen>
  );
}

// ---------- renting ----------

export function RentMenu() {
  const character = useGameStore((s) => s.character);
  const rentPlace = useGameStore((s) => s.rentPlace);
  const moveBackHome = useGameStore((s) => s.moveBackHome);
  const pop = useNav((s) => s.pop);
  if (!character) return null;
  ensureLocation(character);
  const city = cityOf(character);
  const res = character.residence!;
  const home = canMoveHome(character);
  return (
    <MenuScreen title="Rent a place" icon="key" color={colors.love}>
      <Card>
        <Text style={styles.cityName}>{housingSummary(character)}</Text>
        <Text style={ms.note}>
          {character.age < 18
            ? "You live with your family until you're old enough to rent."
            : res.housing === "own"
              ? "You own your home. Sell it to go back to renting."
              : `Rents in ${city.name} run ${costWord(city.cost).toLowerCase()} compared with the rest of the country.`}
        </Text>
      </Card>
      {character.age >= 18 && res.housing !== "own" && (
        <Card>
          <Text style={ms.subheading}>Available in {city.name}</Text>
          {RENT_OPTIONS.map((o) => {
            const chk = canRent(character, o.key);
            const current = res.housing === "rent" && res.rentKey === o.key;
            return (
              <TouchableOpacity key={o.key} accessibilityRole="button" activeOpacity={0.7} disabled={!chk.ok || current} style={[styles.opt, (!chk.ok || current) && { opacity: 0.5 }]} onPress={() => { rentPlace(o.key); pop(); }}>
                <Ionicons name={o.icon as keyof typeof Ionicons.glyphMap} size={20} color={colors.love} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.optTitle}>{o.label}{current ? " (current)" : ""}</Text>
                  <Text style={styles.optSub}>{o.blurb}</Text>
                  <Text style={styles.optSub}>{money(rentFor(character, city, o.key))}/yr · deposit and moving {money(chk.cost ?? 0)}</Text>
                  {!chk.ok && chk.reason ? <Text style={[styles.optSub, { color: colors.danger }]}>{chk.reason}</Text> : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </Card>
      )}
      {home.ok && (
        <Card>
          <Text style={ms.subheading}>Or go home</Text>
          <Text style={ms.note}>Moving back in with your family costs nothing, though your independence takes a knock.</Text>
          <Button label="Move back in with family" icon="people" onPress={() => { moveBackHome(); pop(); }} style={{ marginTop: spacing.sm }} />
        </Card>
      )}
    </MenuScreen>
  );
}

// ---------- budget ----------

export function BudgetMenu() {
  const character = useGameStore((s) => s.character);
  const world = useGameStore((s) => s.worldState);
  const setLifestyle = useGameStore((s) => s.setLifestyle);
  if (!character) return null;
  ensureLocation(character);
  const b = character.budget;
  const res = character.residence!;
  const rentNow = res.housing === "rent" ? res.rent ?? 0 : 0;
  const livingNow = Math.round(livingCost(character) * livingShare(character));
  const net = b ? b.income - b.rent - b.living - b.upkeep : 0;
  return (
    <MenuScreen title="Budget & lifestyle" icon="wallet" color={colors.primary}>
      <Card>
        <Text style={ms.subheading}>Last year</Text>
        {b ? (
          <>
            <Line label="Take-home pay" value={money(b.income)} good />
            {b.tax > 0 && <Line label={`(already after ${money(b.tax)} tax)`} value="" muted />}
            {b.rent > 0 && <Line label="Rent" value={`-${money(b.rent)}`} />}
            <Line label="Food, bills & getting around" value={`-${money(b.living)}`} />
            {b.upkeep > 0 && <Line label="Property tax & upkeep" value={`-${money(b.upkeep)}`} />}
            <Line label="Left over" value={money(net)} good={net >= 0} bad={net < 0} bold />
          </>
        ) : (
          <Text style={ms.note}>Nothing recorded yet - the first full year will show here.</Text>
        )}
      </Card>
      <Card>
        <Text style={ms.subheading}>This year, at today's prices</Text>
        <Line label={housingSummary(character)} value={rentNow > 0 ? `-${money(rentNow)}` : res.housing === "own" ? "mortgage" : "-"} />
        <Line label={`Living costs (${lifestyleDef(character.lifestyle).label.toLowerCase()})`} value={`-${money(livingNow)}`} />
        <Text style={[ms.note, { marginTop: spacing.xs }]}>
          {res.housing === "family" ? "You chip in towards the household." : character.age < 18 ? "Your family pays for everything." : ""}
        </Text>
        <Text style={[ms.note, { marginTop: spacing.xs }]}>Your net worth: {money(totalNetWorth(character, world))}</Text>
      </Card>
      <Card>
        <Text style={ms.subheading}>How do you live?</Text>
        {LIFESTYLES.map((l) => {
          const on = (character.lifestyle ?? "normal") === l.key;
          return (
            <TouchableOpacity key={l.key} accessibilityRole="button" activeOpacity={0.7} style={[styles.opt, on && styles.optOn]} onPress={() => setLifestyle(l.key)}>
              <Ionicons name={l.icon as keyof typeof Ionicons.glyphMap} size={20} color={on ? colors.primary : colors.textSecondary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.optTitle}>{l.label}</Text>
                <Text style={styles.optSub}>{l.blurb}</Text>
                <Text style={styles.optSub}>{money(Math.round(livingCost({ ...character, lifestyle: l.key })))}/yr</Text>
              </View>
              {on && <Ionicons name="checkmark-circle" size={18} color={colors.primary} />}
            </TouchableOpacity>
          );
        })}
      </Card>
    </MenuScreen>
  );
}

function Line({ label, value, good, bad, muted, bold }: { label: string; value: string; good?: boolean; bad?: boolean; muted?: boolean; bold?: boolean }) {
  return (
    <View style={styles.line}>
      <Text style={[styles.lineLabel, muted && { color: colors.textMuted }, bold && { fontFamily: fonts.bold }]}>{label}</Text>
      <Text style={[styles.lineValue, good && { color: colors.primary }, bad && { color: colors.danger }, bold && { fontFamily: fonts.bold }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cityName: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fontSize.lg },
  cityMeta: { color: colors.textMuted, fontFamily: fonts.semiBold, fontSize: fontSize.sm, marginBottom: 4 },
  meterRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: 6 },
  meterLabel: { width: 96, color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fontSize.sm },
  meterTrack: { flex: 1, height: 7, borderRadius: 4, backgroundColor: colors.surfaceRaised, overflow: "hidden" },
  meterFill: { height: 7, borderRadius: 4 },
  meterNote: { width: 66, textAlign: "right", color: colors.textMuted, fontFamily: fonts.semiBold, fontSize: fontSize.xs },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.sm },
  effect: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fontSize.md, lineHeight: 19, marginTop: 4 },
  opt: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.surfaceRaised, marginTop: spacing.sm, borderWidth: 1, borderColor: "transparent" },
  optOn: { borderColor: colors.primary },
  optTitle: { color: colors.textPrimary, fontFamily: fonts.semiBold, fontSize: fontSize.base },
  optSub: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: fontSize.sm, marginTop: 1 },
  line: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  lineLabel: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fontSize.md, flex: 1 },
  lineValue: { color: colors.textPrimary, fontFamily: fonts.semiBold, fontSize: fontSize.md },
});
