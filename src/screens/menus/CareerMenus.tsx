import React from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGameStore } from "../../state/gameStore";
import { useNav } from "../../nav/navStore";
import MenuScreen, { MenuRow } from "../../nav/MenuScreen";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { RUNG_NAMES } from "../../data/careers";
import { TAX, WELFARE } from "../../data/economy";
import { BUSINESSES, bizDef } from "../../data/businesses";
import { getRegion } from "../../data/regions";
import { canRetire, courseCost, ensureRole, networkCost, perfFactors, promoCheck, retireAge, pensionIncome, salaryNow, verdictFor, yearsInRole } from "../../engine/career";
import { canStart, capacity, expandCost, hireCost, marketingCost, outlook, startupCost, startupWarning, valueOf } from "../../engine/business";
import { bankruptcyCheck, debtTotal, rentalListings } from "../../engine/wealth";
import { marginalRate, taxBreakdown, taxCredit } from "../../engine/taxes";
import { cityWage } from "../../engine/where";
import { colors, fonts, fontSize, radii, spacing } from "../../theme";
import { ms } from "./menuStyles";

const money = (n: number) => `${n < 0 ? "-" : ""}$${Math.abs(Math.round(n)).toLocaleString()}`;
const pct = (n: number) => `${(n * 100).toFixed(n < 0.1 ? 1 : 0)}%`;

function Bar({ value, color }: { value: number; color: string }) {
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${Math.max(3, Math.min(100, value))}%`, backgroundColor: color }]} />
    </View>
  );
}

function Line({ label, value, good, bad, bold }: { label: string; value: string; good?: boolean; bad?: boolean; bold?: boolean }) {
  return (
    <View style={styles.line}>
      <Text style={[styles.lineLabel, bold && { fontFamily: fonts.bold }]}>{label}</Text>
      <Text style={[styles.lineValue, good && { color: colors.primary }, bad && { color: colors.danger }, bold && { fontFamily: fonts.bold }]}>{value}</Text>
    </View>
  );
}

const perfColor = (p: number) => (p >= 70 ? colors.primary : p >= 45 ? colors.gold : colors.danger);

// ---------- career ----------

export function CareerMenu() {
  const character = useGameStore((s) => s.character);
  const world = useGameStore((s) => s.worldState);
  const setWorkMode = useGameStore((x) => x.setWorkMode);
  const askRaise = useGameStore((x) => x.askRaise);
  const askPromotion = useGameStore((x) => x.askPromotion);
  const doNetwork = useGameStore((x) => x.doNetwork);
  const takeCourse = useGameStore((x) => x.takeCourse);
  const toggleUnion = useGameStore((x) => x.toggleUnion);
  const retireNow = useGameStore((x) => x.retireNow);
  const push = useNav((x) => x.push);
  const [showWhy, setShowWhy] = React.useState(false);
  if (!character) return null;
  const c = character;
  const job = ensureRole(c);
  const W = WELFARE[c.originRegion ?? "us"];
  const full = job && job.kind === "fulltime";
  const gross = job ? salaryNow(c, world, job) : 0;
  const promo = full ? promoCheck(c, world) : null;
  const factors = full ? perfFactors(c) : [];
  const netCost = networkCost(c);
  const crsCost = courseCost(c);
  const rung = job?.rung ?? 0;
  return (
    <MenuScreen title="Career" icon="trending-up" color={colors.primary}>
      {c.retired ? (
        <Card>
          <Text style={styles.title}>Retired</Text>
          <Text style={ms.note}>
            {c.age >= retireAge(c)
              ? `Your ${W.pensionName} pays ${money(pensionIncome(c, world))} a year.`
              : `You retired early. Your ${W.pensionName} starts at ${retireAge(c)}, so until then you live off your savings.`}
          </Text>
        </Card>
      ) : null}

      {full ? (
        <>
          <Card>
            <Text style={styles.title}>{job!.title}</Text>
            <Text style={styles.sub}>{job!.company?.name ?? "Your employer"} · {money(gross)} a year · {yearsInRole(c)} yr in role</Text>
            <View style={styles.ladder}>
              {RUNG_NAMES.map((n, i) => (
                <View key={n} style={styles.rungCol}>
                  <View style={[styles.dot, i <= rung && { backgroundColor: colors.primary }, i === rung && { borderWidth: 2, borderColor: colors.gold }]} />
                  <Text style={[styles.rungLabel, i === rung && { color: colors.textPrimary }]}>{n}</Text>
                </View>
              ))}
            </View>
            {promo?.canRise ? <Text style={ms.note}>Next: {promo.next} (about {money(promo.nextSalary ?? 0)} a year)</Text> : <Text style={ms.note}>{promo?.reqs[0]?.label}</Text>}
          </Card>

          <Card>
            <Text style={ms.subheading}>How you're doing</Text>
            <View style={styles.rowBetween}>
              <Text style={styles.lineLabel}>Performance</Text>
              <Text style={[styles.lineValue, { color: perfColor(job!.perf ?? 55) }]}>{Math.round(job!.perf ?? 55)} · {verdictFor(job!.perf ?? 55)}</Text>
            </View>
            <Bar value={job!.perf ?? 55} color={perfColor(job!.perf ?? 55)} />
            <View style={[styles.rowBetween, { marginTop: spacing.sm }]}>
              <Text style={styles.lineLabel}>Boss & team</Text>
              <Text style={styles.lineValue}>{Math.round(job!.rapport ?? 50)}</Text>
            </View>
            <Bar value={job!.rapport ?? 50} color={colors.love} />
            {job!.pip && <Text style={[ms.note, { color: colors.danger, marginTop: spacing.sm }]}>You're on a performance plan. Improve this year or you'll be dismissed.</Text>}
            {job!.review && <Text style={[ms.note, { marginTop: spacing.sm }]}>Last review (age {job!.review.age}): {job!.review.verdict.toLowerCase()}{job!.review.note ? ` - ${job!.review.note}` : ""}.</Text>}
            <TouchableOpacity accessibilityRole="button" onPress={() => setShowWhy(!showWhy)}>
              <Text style={styles.link}>{showWhy ? "Hide what's affecting it" : "What's affecting it?"}</Text>
            </TouchableOpacity>
            {showWhy && factors.map((f) => (
              <View key={f.label} style={styles.line}>
                <Text style={styles.lineLabel}>{f.label}</Text>
                <Text style={[styles.lineValue, { color: f.delta > 0 ? colors.primary : colors.danger }]}>{f.delta > 0 ? "+" : ""}{f.delta}</Text>
              </View>
            ))}
          </Card>

          <Card>
            <Text style={ms.subheading}>How hard do you work?</Text>
            {([["coast", "Coast", "Do what's asked and go home. Less stress, lower performance.", "cafe"], ["steady", "Steady", "A solid, sustainable effort.", "walk"], ["grind", "Grind", "Long hours. Better reviews, worse health and mood.", "flame"]] as const).map(([k, label, blurb, icon]) => {
              const on = (c.workMode ?? "steady") === k;
              return (
                <TouchableOpacity key={k} accessibilityRole="button" activeOpacity={0.7} style={[styles.opt, on && styles.optOn]} onPress={() => setWorkMode(k)}>
                  <Ionicons name={icon} size={18} color={on ? colors.primary : colors.textSecondary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.optTitle}>{label}</Text>
                    <Text style={styles.optSub}>{blurb}</Text>
                  </View>
                  {on && <Ionicons name="checkmark-circle" size={18} color={colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </Card>

          <Card>
            <Text style={ms.subheading}>Moving up</Text>
            {promo?.reqs.map((r) => (
              <Text key={r.label} style={[styles.req, { color: r.met ? colors.primary : colors.danger }]}>{r.met ? "✓" : "✗"} {r.label}{r.note && !r.met ? ` - ${r.note}` : ""}</Text>
            ))}
            <View style={ms.btnRow}>
              <Button label="Ask for a raise" icon="cash" size="sm" disabled={c.raiseAsked === c.age} onPress={askRaise} />
              <Button label="Ask for promotion" icon="trending-up" size="sm" disabled={c.promoAsked === c.age || !promo?.canRise} onPress={askPromotion} />
            </View>
            <Text style={[ms.note, { marginTop: spacing.xs }]}>You can ask once a year. A refusal cools things with your boss.</Text>
          </Card>
        </>
      ) : job ? (
        <Card>
          <Text style={styles.title}>{job.title}</Text>
          <Text style={ms.note}>A part-time job has no ladder. For promotions and reviews, get a full-time career.</Text>
        </Card>
      ) : !c.retired ? (
        <Card>
          <Text style={styles.title}>{c.unemp ? "Between jobs" : "No full-time job"}</Text>
          {c.unemp && c.unemp.yearsLeft > 0 && <Text style={ms.note}>Unemployment benefit pays about {pct(W.unemployRate)} of your last salary, for {c.unemp.yearsLeft} more year{c.unemp.yearsLeft === 1 ? "" : "s"}.</Text>}
          {c.unemp && c.unemp.yearsLeft <= 0 && <Text style={ms.note}>{c.unemp.cause === "fired" ? "You were dismissed, so there's no benefit." : W.unemployRate === 0 ? `${getRegion(c.originRegion).label} has no unemployment benefit.` : "Your benefit has run out."}</Text>}
          <Button label="Find work" icon="search" variant="primary" onPress={() => push("findwork")} style={{ marginTop: spacing.sm }} />
        </Card>
      ) : null}

      {c.age >= 18 && (
        <Card>
          <Text style={ms.subheading}>Build your career</Text>
          <View style={styles.rowBetween}>
            <Text style={styles.lineLabel}>Professional network</Text>
            <Text style={styles.lineValue}>{Math.round(c.network ?? 0)}</Text>
          </View>
          <Bar value={c.network ?? 0} color={colors.smarts} />
          <Text style={[ms.note, { marginTop: spacing.xs }]}>Contacts help you get interviews and promotions, and fade if you neglect them.</Text>
          <View style={ms.btnRow}>
            <Button label={`Networking event (${money(netCost)})`} icon="people" size="sm" disabled={c.netAge === c.age || c.money < netCost} onPress={doNetwork} />
            <Button label={`Training course (${money(crsCost)})`} icon="school" size="sm" disabled={c.courseAge === c.age || c.money < crsCost} onPress={takeCourse} />
          </View>
          {full && (
            <View style={ms.btnRow}>
              <Button label={c.inUnion ? "Leave the union" : "Join the union"} icon="shield-checkmark" size="sm" variant="ghost" onPress={toggleUnion} />
            </View>
          )}
          {full && c.inUnion && <Text style={ms.note}>Union: dues of 1% of pay, but far fewer layoffs and a floor on your raises.</Text>}
        </Card>
      )}

      {canRetire(c) && (
        <Card>
          <Text style={ms.subheading}>Retirement</Text>
          <Text style={ms.note}>
            The {getRegion(c.originRegion).label} state pension starts at {retireAge(c)} and pays about {pct(W.pension)} of your best salary after a full career. Retiring early means living off savings until then.
          </Text>
          <Button label="Retire" icon="sunny" variant="danger" onPress={retireNow} style={{ marginTop: spacing.sm }} />
        </Card>
      )}
    </MenuScreen>
  );
}

// ---------- business ----------

export function BusinessMenu() {
  const character = useGameStore((s) => s.character);
  const world = useGameStore((s) => s.worldState);
  const push = useNav((s) => s.push);
  const hireStaff = useGameStore((x) => x.hireStaff);
  const fireStaff = useGameStore((x) => x.fireStaff);
  const bizMarketing = useGameStore((x) => x.bizMarketing);
  const expandBiz = useGameStore((x) => x.expandBiz);
  const sellBiz = useGameStore((x) => x.sellBiz);
  const closeBiz = useGameStore((x) => x.closeBiz);
  if (!character) return null;
  const c = character;
  const b = c.business;
  if (!b) {
    return (
      <MenuScreen title="Business" icon="storefront" color={colors.gold}>
        <Text style={ms.note}>Be your own boss. Start something small alongside a job, or go all in. Startup costs and revenue scale with where you live.</Text>
        {BUSINESSES.map((d, i) => {
          const chk = canStart(c, d);
          return (
            <MenuRow key={d.key} icon={d.icon as keyof typeof Ionicons.glyphMap} color={colors.gold} title={d.label} summary={chk.ok ? `${money(chk.cost)} to open · ${d.blurb}` : chk.reason} disabled={c.age < d.minAge} delay={i * 20} onPress={() => push("bizstart", { key: d.key })} />
          );
        })}
      </MenuScreen>
    );
  }
  const def = bizDef(b.type)!;
  const o = outlook(c, world);
  const cap = capacity(b);
  const mk = marketingCost(c, world);
  return (
    <MenuScreen title={b.name} icon="storefront" color={colors.gold}>
      <Card>
        <Text style={styles.title}>{b.name}</Text>
        <Text style={styles.sub}>{def.label} · level {b.level}/5 · {b.employees}/{cap} staff · open since {b.since}</Text>
        {b.sideline && <Text style={ms.note}>You run it alongside your job, so it earns less and costs you energy.</Text>}
        <View style={[styles.rowBetween, { marginTop: spacing.sm }]}>
          <Text style={styles.lineLabel}>Reputation</Text>
          <Text style={styles.lineValue}>{Math.round(b.rep)}</Text>
        </View>
        <Bar value={b.rep} color={colors.love} />
      </Card>
      <Card>
        <Text style={ms.subheading}>Last year</Text>
        <Line label="Revenue" value={money(b.lastRevenue)} />
        <Line label="Profit" value={money(b.lastProfit)} good={b.lastProfit >= 0} bad={b.lastProfit < 0} bold />
        <Line label="Lifetime profit" value={money(b.totalProfit)} />
        <Line label="Cash in the business" value={money(b.reserve)} />
        <Text style={ms.subheading}>This year, on average</Text>
        <Line label="Expected revenue" value={money(o.revenue)} />
        <Line label="Wages" value={`-${money(o.wages)}`} />
        <Line label="Expected profit" value={money(o.profit)} good={o.profit >= 0} bad={o.profit < 0} bold />
        {b.badYears >= 1 && <Text style={[ms.note, { color: colors.danger, marginTop: spacing.xs }]}>{b.badYears} losing year{b.badYears === 1 ? "" : "s"} in a row. Three and it may go under.</Text>}
      </Card>
      <Card>
        <Text style={ms.subheading}>Run it</Text>
        <View style={ms.btnRow}>
          <Button label={`Hire (${money(hireCost(c))})`} icon="person-add" size="sm" disabled={b.employees >= cap || c.money < hireCost(c)} onPress={hireStaff} />
          <Button label="Let someone go" icon="person-remove" size="sm" variant="ghost" disabled={b.employees <= 0} onPress={fireStaff} />
        </View>
        <View style={ms.btnRow}>
          <Button label={`Marketing (${money(mk)})`} icon="megaphone" size="sm" disabled={b.marketAge === c.age || c.money < mk} onPress={bizMarketing} />
          <Button label={b.level >= 5 ? "Fully expanded" : `Expand (${money(expandCost(c))})`} icon="resize" size="sm" disabled={b.level >= 5 || c.money < expandCost(c)} onPress={expandBiz} />
        </View>
      </Card>
      <Card>
        <Text style={ms.subheading}>Exit</Text>
        <Text style={ms.note}>A buyer would pay about {money(valueOf(c))}.</Text>
        <View style={ms.btnRow}>
          <Button label="Sell the business" icon="cash" size="sm" variant="secondary" onPress={sellBiz} />
          <Button label="Close it down" icon="close-circle" size="sm" variant="danger" onPress={closeBiz} />
        </View>
      </Card>
    </MenuScreen>
  );
}

export function StartBusinessMenu({ bizKey }: { bizKey: string }) {
  const character = useGameStore((s) => s.character);
  const startBusiness = useGameStore((x) => x.startBusiness);
  const pop = useNav((x) => x.pop);
  const def = bizDef(bizKey);
  const [name, setName] = React.useState("");
  if (!character || !def) return null;
  const c = character;
  const chk = canStart(c, def);
  const warn = startupWarning(c, def);
  return (
    <MenuScreen title={def.label} icon={def.icon as keyof typeof Ionicons.glyphMap} color={colors.gold}>
      <Card>
        <Text style={styles.title}>{def.label}</Text>
        <Text style={ms.note}>{def.blurb}</Text>
        <Line label="Cost to open" value={money(startupCost(c, def))} />
        <Line label="Revenue potential (year 1)" value={money(def.revenue * getRegion(c.originRegion).jobMultiplier * cityWage(c))} />
        <Line label="Risk" value={def.risk >= 0.5 ? "Very high" : def.risk >= 0.3 ? "High" : def.risk >= 0.2 ? "Medium" : "Low"} />
        <Line label="Suits people good at" value={def.talent} />
        {def.moonshot ? <Text style={ms.note}>Small chance each year of an enormous breakout.</Text> : null}
        {warn ? <Text style={[ms.note, { color: colors.gold }]}>{warn}</Text> : null}
        <Text style={ms.subheading}>Name it</Text>
        <TextInput value={name} onChangeText={setName} placeholder={`${c.lastName} ${def.label}`} placeholderTextColor={colors.textMuted} style={styles.input} maxLength={30} />
        {!chk.ok && <Text style={[ms.note, { color: colors.danger }]}>{chk.reason}</Text>}
        <Button label={`Open for ${money(chk.cost)}`} icon="storefront" variant="primary" disabled={!chk.ok} onPress={() => { startBusiness(def.key, name); pop(); }} style={{ marginTop: spacing.sm }} />
      </Card>
    </MenuScreen>
  );
}

// ---------- taxes ----------

export function TaxMenu() {
  const character = useGameStore((s) => s.character);
  const world = useGameStore((s) => s.worldState);
  const push = useNav((x) => x.push);
  if (!character) return null;
  const c = character;
  const region = c.originRegion;
  const model = TAX[region ?? "us"];
  const W = WELFARE[region ?? "us"];
  const job = c.job ? salaryNow(c, world) : 0;
  const part = c.partTime ? salaryNow(c, world, c.partTime) : 0;
  const biz = Math.max(0, c.business?.lastProfit ?? 0);
  const gross = job + part + biz;
  const credit = taxCredit(c);
  const t = taxBreakdown(gross, region, credit);
  const eff = gross > 0 ? t.total / gross : 0;
  return (
    <MenuScreen title="Taxes" icon="receipt" color={colors.danger}>
      <Card>
        <Text style={styles.title}>{getRegion(region).label}</Text>
        <Text style={ms.note}>{model.note}</Text>
      </Card>
      <Card>
        <Text style={ms.subheading}>At your current income</Text>
        {gross === 0 ? (
          <Text style={ms.note}>You're not earning right now, so there's nothing to tax.</Text>
        ) : (
          <>
            <Line label="Gross income" value={money(gross)} bold />
            <Line label="Income tax" value={`-${money(t.income)}`} />
            <Line label="Social contributions" value={`-${money(t.social)}`} />
            {t.local > 0 && <Line label="Local tax" value={`-${money(t.local)}`} />}
            {t.credit > 0 && <Line label={`Child credit (already taken off)`} value={money(t.credit)} good />}
            <Line label="Take-home" value={money(gross - t.total)} good bold />
            <Line label="Average rate" value={pct(eff)} />
            <Line label="On your next dollar" value={pct(marginalRate(gross, region))} />
          </>
        )}
      </Card>
      <Card>
        <Text style={ms.subheading}>What you get back</Text>
        <Line label="Unemployment benefit" value={W.unemployRate > 0 ? `${pct(W.unemployRate)} for ${W.unemployYears} yr` : "None"} />
        <Line label="Severance" value={`${W.severanceWeeks} wk per year worked`} />
        <Line label="State pension" value={`${pct(W.pension)} from age ${W.retireAge}`} />
        <Text style={[ms.note, { marginTop: spacing.xs }]}>{W.pensionName}</Text>
      </Card>
      <MenuRow icon="umbrella" color={colors.looks} title="Retirement savings" summary="Pre-tax contributions lower your tax" onPress={() => push("retire")} />
    </MenuScreen>
  );
}

// ---------- rental property ----------

export function RentalsMenu() {
  const character = useGameStore((s) => s.character);
  const buyRental = useGameStore((x) => x.buyRental);
  const sellRental = useGameStore((x) => x.sellRental);
  if (!character) return null;
  const c = character;
  const list = rentalListings(c);
  const owned = c.rentals ?? [];
  return (
    <MenuScreen title="Property investments" icon="business" color={colors.gold}>
      <Text style={ms.note}>Buy property to let. It earns rent (minus upkeep and the odd empty year) and rises or falls with the market. Priced for your city.</Text>
      {owned.length > 0 && (
        <Card>
          <Text style={ms.subheading}>You own</Text>
          {owned.map((r, i) => (
            <View key={i} style={ms.rowBlock}>
              <Text style={ms.ownedName}>{r.name}</Text>
              <Text style={ms.listingSub}>Worth {money(r.value)} · rents for about {money(r.rent)}/yr{r.vacantYears ? " · empty" : ""}</Text>
              <Button label="Sell (3% costs)" icon="cash" size="sm" variant="ghost" onPress={() => sellRental(i)} style={{ marginTop: spacing.xs, alignSelf: "flex-start" }} />
            </View>
          ))}
        </Card>
      )}
      <Card>
        <Text style={ms.subheading}>For sale</Text>
        {c.age < 21 && <Text style={ms.note}>You need to be 21.</Text>}
        {list.map((l) => (
          <TouchableOpacity key={l.key} accessibilityRole="button" activeOpacity={0.7} disabled={c.age < 21 || c.money < l.price} style={[styles.opt, (c.age < 21 || c.money < l.price) && { opacity: 0.45 }]} onPress={() => buyRental(l)}>
            <Ionicons name="business" size={18} color={colors.gold} />
            <View style={{ flex: 1 }}>
              <Text style={styles.optTitle}>{l.name}</Text>
              <Text style={styles.optSub}>{l.blurb} About {pct(l.yield)} a year in rent.</Text>
            </View>
            <Text style={styles.optTitle}>{money(l.price)}</Text>
          </TouchableOpacity>
        ))}
      </Card>
    </MenuScreen>
  );
}

// ---------- bankruptcy ----------

export function BankruptMenu() {
  const character = useGameStore((s) => s.character);
  const declare = useGameStore((x) => x.declareBankruptcy);
  const pop = useNav((x) => x.pop);
  if (!character) return null;
  const c = character;
  const chk = bankruptcyCheck(c);
  return (
    <MenuScreen title="Bankruptcy" icon="warning" color={colors.danger}>
      <Card>
        <Text style={styles.title}>A last resort</Text>
        <Text style={ms.note}>Bankruptcy wipes out your loans and credit-card debt (not student loans). It costs you your car, investments and rental properties, ruins your credit for seven years and takes a heavy toll on your mood.</Text>
        <Line label="Debts (excluding student loans)" value={money((c.loans ?? []).filter((l) => l.kind !== "student").reduce((s, l) => s + l.balance, 0))} />
        <Line label="Total debt" value={money(debtTotal(c))} />
        <Line label="Cash" value={money(c.money)} bad={c.money < 0} />
        {!chk.ok && <Text style={[ms.note, { color: colors.gold }]}>{chk.reason}</Text>}
        <Button label="Declare bankruptcy" icon="warning" variant="danger" disabled={!chk.ok} onPress={() => { declare(); pop(); }} style={{ marginTop: spacing.sm }} />
      </Card>
    </MenuScreen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fontSize.lg },
  sub: { color: colors.textMuted, fontFamily: fonts.semiBold, fontSize: fontSize.sm, marginTop: 2 },
  link: { color: colors.primary, fontFamily: fonts.semiBold, fontSize: fontSize.sm, marginTop: spacing.sm },
  track: { height: 7, borderRadius: 4, backgroundColor: colors.surfaceRaised, overflow: "hidden", marginTop: 4 },
  fill: { height: 7, borderRadius: 4 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between" },
  ladder: { flexDirection: "row", justifyContent: "space-between", marginVertical: spacing.md },
  rungCol: { alignItems: "center", flex: 1, gap: 4 },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.surfaceRaised },
  rungLabel: { color: colors.textMuted, fontFamily: fonts.semiBold, fontSize: 10 },
  req: { fontFamily: fonts.regular, fontSize: fontSize.md, marginTop: 3, lineHeight: 18 },
  line: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  lineLabel: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fontSize.md, flex: 1 },
  lineValue: { color: colors.textPrimary, fontFamily: fonts.semiBold, fontSize: fontSize.md },
  opt: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.surfaceRaised, marginTop: spacing.sm, borderWidth: 1, borderColor: "transparent" },
  optOn: { borderColor: colors.primary },
  optTitle: { color: colors.textPrimary, fontFamily: fonts.semiBold, fontSize: fontSize.base },
  optSub: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: fontSize.sm, marginTop: 1 },
  input: { backgroundColor: colors.surfaceRaised, color: colors.textPrimary, borderRadius: radii.md, padding: spacing.md, fontFamily: fonts.regular, fontSize: fontSize.base, marginTop: spacing.xs },
});
