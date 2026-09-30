import React from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGameStore } from "../../state/gameStore";
import { useNav } from "../../nav/navStore";
import MenuScreen, { MenuRow, SectionLabel } from "../../nav/MenuScreen";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Chip from "../../components/Chip";
import Sparkline from "../../components/Sparkline";
import { ACTIONS, BRANDS, CADENCES, GEAR, NICHES, PLATFORMS, POST_TYPES, STYLES, brandDef, cadenceDef, fmt, gearDef, nicheDef, platformDef, styleDef } from "../../data/social";
import type { PlatformDef } from "../../data/social";
import {
  audienceMix, biggest, burnoutWord, carrying, channelOf, costScale, engagementOf, fameWord, hotMult, imageWord, isBanned, percentile, phaseOf, popOf, potential, privacyWord, qualityOf, qualityParts, qualityWord, roomWord, topWord,
  totalFollowers,
} from "../../engine/creatorCore";
import { ROLES, actionCheck, actionCost, actionsLeft, buyFollowers as _bf, canMembers, canMerch, commentsFor, crisisKind, expectedIncome, followerPrice, gearPrice, maxCadence, merchCost, openCheck, roleCheck } from "../../engine/creator";
import { colors, fonts, fontSize, radii, spacing } from "../../theme";
import { ms } from "./menuStyles";
import type { Channel, Character, InboxItem, Post } from "../../types";

const money = (n: number) => `${n < 0 ? "-" : ""}$${Math.abs(Math.round(n)).toLocaleString()}`;
const ICON = (n: string) => n as keyof typeof Ionicons.glyphMap;
void _bf;

// ---------------------------------------------------------------- shared pieces

function Bar({ value, color, height = 7 }: { value: number; color: string; height?: number }) {
  return (
    <View style={[styles.track, { height }]}>
      <View style={[styles.fill, { height, width: `${Math.max(3, Math.min(100, value))}%`, backgroundColor: color }]} />
    </View>
  );
}

function Opt({ icon, title, sub, on, disabled, onPress, right, color }: { icon: string; title: string; sub?: string; on?: boolean; disabled?: boolean; onPress: () => void; right?: string; color?: string }) {
  return (
    <TouchableOpacity accessibilityRole="button" activeOpacity={0.7} disabled={disabled} style={[styles.opt, on && styles.optOn, disabled && { opacity: 0.45 }]} onPress={onPress}>
      <Ionicons name={ICON(icon)} size={18} color={on ? colors.primary : color ?? colors.textSecondary} />
      <View style={{ flex: 1 }}>
        <Text style={styles.optTitle}>{title}</Text>
        {sub ? <Text style={styles.optSub}>{sub}</Text> : null}
      </View>
      {right ? <Text style={styles.optRight}>{right}</Text> : null}
      {on ? <Ionicons name="checkmark-circle" size={18} color={colors.primary} /> : null}
    </TouchableOpacity>
  );
}

function Line({ label, value, bold, color }: { label: string; value: string; bold?: boolean; color?: string }) {
  return (
    <View style={styles.line}>
      <Text style={[styles.lineLabel, bold && { color: colors.textPrimary, fontFamily: fonts.bold }]}>{label}</Text>
      <Text style={[styles.lineValue, color ? { color } : null, bold && { fontFamily: fonts.extraBold }]}>{value}</Text>
    </View>
  );
}

export function PlatformBadge({ p, size = 40 }: { p: PlatformDef; size?: number }) {
  return (
    <View style={[styles.badge, { width: size, height: size, borderRadius: size * 0.3, backgroundColor: p.color + "26", borderColor: p.color + "66" }]}>
      <Ionicons name={ICON(p.icon)} size={size * 0.52} color={p.color} />
    </View>
  );
}

const arrow = (n: number) => (n > 0 ? "▲" : n < 0 ? "▼" : "•");
const gainColor = (n: number) => (n > 0 ? colors.primary : n < 0 ? colors.danger : colors.textMuted);

function Trend({ history, color }: { history: number[]; color: string }) {
  const h = history.slice(-24);
  if (h.length < 2) return <Text style={ms.note}>Not enough history yet. Age up a couple of years.</Text>;
  const max = Math.max(1, ...h);
  return (
    <View>
      <Sparkline values={h.map((v) => (v / max) * 100)} color={color} height={90} />
      <View style={styles.rowBetween}>
        <Text style={styles.optSub}>{fmt(h[0])}</Text>
        <Text style={styles.optSub}>peak {fmt(max)}</Text>
      </View>
    </View>
  );
}

const TONE_COLOR: Record<string, string> = { love: colors.love, praise: colors.primary, neutral: colors.textSecondary, joke: colors.gold, question: colors.smarts, hate: colors.danger, troll: colors.danger };
const TONE_ICON: Record<string, string> = { love: "heart", praise: "thumbs-up", neutral: "chatbubble", joke: "happy", question: "help-circle", hate: "thumbs-down", troll: "skull" };

function PostCard({ c, post, open, onToggle }: { c: Character; post: Post; open: boolean; onToggle: () => void }) {
  const p = platformDef(post.platform);
  const comments = open ? commentsFor(c, post) : [];
  return (
    <TouchableOpacity accessibilityRole="button" activeOpacity={0.8} onPress={onToggle} style={styles.post}>
      <View style={styles.postHead}>
        <PlatformBadge p={p} size={30} />
        <View style={{ flex: 1 }}>
          <Text style={styles.optTitle} numberOfLines={open ? 3 : 1}>{post.title}</Text>
          <Text style={styles.optSub}>{p.label} · age {post.age}</Text>
        </View>
        {post.viral ? <Chip label="VIRAL" color={colors.gold} /> : post.flop ? <Chip label="FLOP" color={colors.textMuted} /> : <Chip label={post.kind} color={p.color} />}
      </View>
      <View style={styles.statRow}>
        <Text style={styles.stat}><Ionicons name="eye" size={13} color={colors.textMuted} /> {fmt(post.views)}</Text>
        <Text style={styles.stat}><Ionicons name="heart" size={13} color={colors.love} /> {fmt(post.likes)}</Text>
        <Text style={styles.stat}><Ionicons name="chatbubble" size={13} color={colors.textMuted} /> {fmt(post.comments)}</Text>
        <Text style={styles.stat}><Ionicons name="arrow-redo" size={13} color={colors.textMuted} /> {fmt(post.shares)}</Text>
      </View>
      {open &&
        comments.map((cm, i) => (
          <View key={i} style={styles.comment}>
            <Ionicons name={ICON(TONE_ICON[cm.tone])} size={14} color={TONE_COLOR[cm.tone]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.commentUser}>{cm.user}</Text>
              <Text style={styles.commentText}>{cm.text}</Text>
            </View>
          </View>
        ))}
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------- the hub

export function SocialHub() {
  const character = useGameStore((s) => s.character);
  const world = useGameStore((s) => s.worldState);
  const push = useNav((x) => x.push);
  if (!character) return null;
  const c = character;
  const s = c.social;
  const chans = s?.channels ?? [];
  const total = totalFollowers(c);
  const top = biggest(c);
  const inbox = s?.inbox.length ?? 0;
  const cr = crisisKind(c);
  const youngest = Math.min(...PLATFORMS.map((p) => p.minAge));

  if (chans.length === 0 && !s) {
    return (
      <MenuScreen title="Social media" icon="phone-portrait" color={colors.looks}>
        <Card>
          <Text style={styles.big}>Be somebody online</Text>
          <Text style={ms.note}>Post, stream, record or write. Some people blow up overnight, some build a small devoted crowd over decades, and most fall somewhere in between. What you make and where you make it decides which.</Text>
          <Text style={ms.note}>Your niche sets how big you can get, your quality and consistency set how fast, and luck decides the rest.</Text>
        </Card>
        {c.age < youngest ? (
          <Text style={[ms.note, { color: colors.gold }]}>You're too young for any platform yet. You need to be {youngest}.</Text>
        ) : (
          <Button label="Start a channel" icon="add-circle" variant="primary" onPress={() => push("newchannel")} />
        )}
      </MenuScreen>
    );
  }

  return (
    <MenuScreen title="Social media" icon="phone-portrait" color={colors.looks}>
      <Card>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={styles.handle}>{top ? `@${top.handle}` : `${c.firstName} ${c.lastName}`}</Text>
            <Text style={styles.optSub}>{fameWord(s?.fame ?? 0)}</Text>
          </View>
          <Chip label={imageWord(s?.image ?? 0)} color={(s?.image ?? 0) >= 8 ? colors.primary : (s?.image ?? 0) > -10 ? colors.gold : colors.danger} />
        </View>
        <Text style={styles.big}>{fmt(total)}</Text>
        <Text style={styles.optSub}>followers across {chans.length} platform{chans.length === 1 ? "" : "s"}</Text>
        <View style={styles.meters}>
          <View style={{ flex: 1 }}>
            <Text style={styles.meterLabel}>Fame {s?.fame ?? 0}</Text>
            <Bar value={s?.fame ?? 0} color={colors.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.meterLabel}>Image</Text>
            <Bar value={((s?.image ?? 0) + 100) / 2} color={(s?.image ?? 0) >= 8 ? colors.primary : (s?.image ?? 0) > -10 ? colors.gold : colors.danger} />
          </View>
        </View>
        <View style={styles.meters}>
          <View style={{ flex: 1 }}>
            <Text style={styles.meterLabel}>Privacy · {privacyWord(s?.privacy ?? 100)}</Text>
            <Bar value={s?.privacy ?? 100} color={colors.smarts} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.meterLabel}>Energy · {burnoutWord(s?.burnout ?? 0)}</Text>
            <Bar value={100 - (s?.burnout ?? 0)} color={(s?.burnout ?? 0) >= 60 ? colors.danger : colors.teal} />
          </View>
        </View>
        {expectedIncome(c) > 0 || (s?.lastEarned ?? 0) > 0 ? (
          <Text style={[ms.note, { marginTop: spacing.sm }]}>Last year you made {money(s?.lastEarned ?? 0)} from content · about {money(expectedIncome(c))} a year at your current size.</Text>
        ) : null}
      </Card>

      {cr ? (
        <Card style={{ borderColor: colors.danger }}>
          <Text style={[styles.optTitle, { color: colors.danger }]}>A controversy is brewing</Text>
          <Text style={ms.note}>People are talking about something you posted. You'll get the chance to respond soon.</Text>
        </Card>
      ) : null}

      <SectionLabel>Your channels</SectionLabel>
      {chans.map((ch, i) => {
        const p = platformDef(ch.platform);
        const banned = isBanned(c, ch);
        return (
          <TouchableOpacity key={ch.platform} accessibilityRole="button" activeOpacity={0.75} style={styles.channel} onPress={() => push("channel", { platform: ch.platform })}>
            <PlatformBadge p={p} />
            <View style={{ flex: 1 }}>
              <Text style={styles.optTitle}>
                {p.label}
                {ch.verified ? "  ✔" : ""}
              </Text>
              <Text style={styles.optSub} numberOfLines={1}>@{ch.handle} · {nicheDef(ch.niche).label}</Text>
              <Text style={[styles.optSub, { color: banned ? colors.danger : colors.textMuted }]}>{phaseOf(c, ch)} · {cadenceDef(ch.cadence).label}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.count}>{fmt(ch.followers)}</Text>
              <Text style={[styles.optSub, { color: gainColor(ch.gain) }]}>{arrow(ch.gain)} {fmt(Math.abs(ch.gain))}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        );
      })}
      {chans.length < PLATFORMS.length ? (
        <Button label="Add another platform" icon="add-circle" variant="secondary" onPress={() => push("newchannel")} style={{ marginBottom: spacing.md }} />
      ) : null}

      <SectionLabel>Your world</SectionLabel>
      <MenuRow icon="mail" color={colors.gold} title="Inbox" summary={inbox > 0 ? `${inbox} message${inbox === 1 ? "" : "s"} waiting` : "Nothing new"} badge={inbox > 0 ? String(inbox) : undefined} delay={0} onPress={() => push("inbox")} />
      <MenuRow icon="images" color={colors.looks} title="Your feed" summary={(s?.feed.length ?? 0) > 0 ? `${s?.feed.length} posts and what people said` : "Nothing posted yet"} delay={20} onPress={() => push("socialfeed")} />
      <MenuRow icon="document-text" color={colors.teal} title="Brand deals" summary={(s?.deals.length ?? 0) > 0 ? `${s?.deals.length} active` : "None yet"} delay={40} onPress={() => push("deals")} />
      <MenuRow icon="stats-chart" color={colors.smarts} title="Analytics" summary="Growth, income and where you stand" delay={60} onPress={() => push("analytics")} />
      <MenuRow icon="trending-up" color={colors.love} title="What's trending" summary={world.social?.mood ?? "The state of the internet"} delay={80} onPress={() => push("trending")} />
      <MenuRow icon="people" color={colors.primary} title="Your team" summary={[s?.team.editor ? "editor" : "", s?.team.assistant ? "community" : "", s?.team.manager ? "manager" : ""].filter(Boolean).join(", ") || "Just you"} delay={100} onPress={() => push("team")} />
    </MenuScreen>
  );
}

// ---------------------------------------------------------------- starting a channel

const fitWord = (f: number) => (f >= 1.2 ? "Great fit" : f >= 0.8 ? "Good fit" : f >= 0.45 ? "Awkward fit" : "Poor fit");
const crowdWord = (ceiling: number) => (ceiling >= 30_000_000 ? "huge crowd" : ceiling >= 5_000_000 ? "big crowd" : ceiling >= 800_000 ? "modest crowd" : "small, devoted crowd");

export function NewChannelMenu({ platform: initial }: { platform?: string }) {
  const character = useGameStore((s) => s.character);
  const openChannel = useGameStore((x) => x.openChannel);
  const pop = useNav((x) => x.pop);
  const [platform, setPlatform] = React.useState<string>(initial ?? "");
  const [niche, setNiche] = React.useState<string>("");
  const [handle, setHandle] = React.useState("");
  if (!character) return null;
  const c = character;
  const p = PLATFORMS.find((x) => x.key === platform);
  const chk = p && niche ? openCheck(c, p.key, niche) : { ok: false, reason: p ? "Pick what you'll make." : "Pick a platform." };
  const cats = ["Entertainment", "Look & lifestyle", "Knowledge", "Craft & hobby"] as const;
  const talentWordOf = (v: number) => (v >= 70 ? "a real strength" : v >= 45 ? "average" : "not your strong suit");
  return (
    <MenuScreen title="New channel" icon="add-circle" color={colors.looks}>
      <Text style={ms.subheading}>1. Where</Text>
      <Card>
        {PLATFORMS.map((pl) => {
          const has = !!channelOf(c, pl.key);
          const tooYoung = c.age < pl.minAge;
          return (
            <TouchableOpacity key={pl.key} accessibilityRole="button" activeOpacity={0.75} disabled={has || tooYoung} style={[styles.opt, platform === pl.key && styles.optOn, (has || tooYoung) && { opacity: 0.4 }]} onPress={() => setPlatform(pl.key)}>
              <PlatformBadge p={pl} size={36} />
              <View style={{ flex: 1 }}>
                <Text style={styles.optTitle}>{pl.label}</Text>
                <Text style={styles.optSub}>{has ? "You're already here." : tooYoung ? `You need to be ${pl.minAge}.` : pl.bestFor}</Text>
              </View>
              {platform === pl.key ? <Ionicons name="checkmark-circle" size={18} color={colors.primary} /> : null}
            </TouchableOpacity>
          );
        })}
      </Card>
      {p ? (
        <>
          <Text style={ms.subheading}>2. What you'll make</Text>
          {cats.map((cat) => (
            <Card key={cat}>
              <Text style={ms.subheading}>{cat}</Text>
              {NICHES.filter((n) => n.cat === cat).map((n) => {
                const f = n.fit[p.key] ?? 0.5;
                const young = c.age < n.minAge;
                const know = Math.max(0, ...n.hobbies.map((h) => c.hobbies?.[h]?.level ?? 0)) >= 20;
                const bits = [fitWord(f), crowdWord(n.ceiling * p.scale * f), know ? "you know this" : undefined].filter(Boolean).join(" · ");
                return <Opt key={n.key} icon={n.icon} title={n.label} sub={young ? `You need to be ${n.minAge}.` : `${n.blurb} ${bits}.`} on={niche === n.key} disabled={young} onPress={() => setNiche(n.key)} color={f >= 1 ? colors.primary : colors.textSecondary} />;
              })}
            </Card>
          ))}
        </>
      ) : null}
      {p && niche ? (
        <>
          <Text style={ms.subheading}>3. Your handle</Text>
          <Card>
            <TextInput value={handle} onChangeText={setHandle} placeholder={`${c.firstName.toLowerCase()}${c.lastName.toLowerCase()}`} placeholderTextColor={colors.textMuted} style={styles.input} maxLength={20} autoCapitalize="none" />
            <Text style={ms.note}>
              {nicheDef(niche).label} leans on {nicheDef(niche).talent} ability, and yours is {talentWordOf(c.talents?.[nicheDef(niche).talent] ?? 50)}.{" "}
              {nicheDef(niche).ceiling * p.scale * (nicheDef(niche).fit[p.key] ?? 0.5) < 800_000 ? "It's a small world, so don't expect to be huge. Do expect people who really care." : nicheDef(niche).ceiling >= 30_000_000 ? "There's room to become enormous, and everyone else has noticed too." : "There's real room to grow here."}
            </Text>
            {!chk.ok && <Text style={[ms.note, { color: colors.danger }]}>{chk.reason}</Text>}
            <Button label={`Start on ${p.label}`} icon="rocket" variant="primary" disabled={!chk.ok} onPress={() => { openChannel(p.key, niche, handle); pop(); }} />
          </Card>
        </>
      ) : null}
    </MenuScreen>
  );
}

// ---------------------------------------------------------------- one channel

export function ChannelMenu({ platform }: { platform: string }) {
  const character = useGameStore((s) => s.character);
  const world = useGameStore((s) => s.worldState);
  const setPlan = useGameStore((x) => x.setChannelPlan);
  const act = useGameStore((x) => x.creatorAction);
  const closeChannel = useGameStore((x) => x.closeChannel);
  const buy = useGameStore((x) => x.buyFollowers);
  const launchMembers = useGameStore((x) => x.launchMembers);
  const launchMerch = useGameStore((x) => x.launchMerch);
  const pop = useNav((x) => x.pop);
  const push = useNav((x) => x.push);
  const [pickNiche, setPickNiche] = React.useState(false);
  const [target, setTarget] = React.useState<string | null>(null);
  const [showQ, setShowQ] = React.useState(false);
  const [confirmDel, setConfirmDel] = React.useState(false);
  const [openPost, setOpenPost] = React.useState<string | null>(null);
  if (!character) return null;
  const c = character;
  const ch = channelOf(c, platform as never);
  if (!ch) return null;
  const p = platformDef(ch.platform);
  const n = nicheDef(ch.niche);
  const q = qualityOf(c, ch);
  const eng = engagementOf(c, ch);
  const banned = isBanned(c, ch);
  const share = percentile(c, world, ch);
  const posts = (c.social?.feed ?? []).filter((x) => x.platform === ch.platform).slice(0, 4);
  const mem = canMembers(ch);
  const mer = canMerch(c, ch);
  const maxC = maxCadence(c);
  const cadOrder = CADENCES.map((x) => x.key);
  return (
    <MenuScreen title={p.label} icon={ICON(p.icon)} color={p.color}>
      <Card>
        <View style={styles.rowBetween}>
          <PlatformBadge p={p} size={46} />
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={styles.handle}>@{ch.handle}{ch.verified ? "  ✔" : ""}</Text>
            <Text style={styles.optSub}>{n.label} · since age {ch.since}</Text>
          </View>
          <Chip label={phaseOf(c, ch)} color={banned ? colors.danger : ch.momentum >= 1.5 ? colors.gold : colors.primary} />
        </View>
        <Text style={styles.big}>{fmt(ch.followers)}</Text>
        <Text style={styles.optSub}>{p.people} · <Text style={{ color: gainColor(ch.gain) }}>{arrow(ch.gain)} {fmt(Math.abs(ch.gain))} last year</Text>{ch.peak > ch.followers * 1.2 ? ` · peak ${fmt(ch.peak)}` : ""}</Text>
        <View style={{ marginTop: spacing.sm }}>
          <Trend history={ch.history} color={p.color} />
        </View>
        <Line label="Views last year" value={fmt(ch.views)} />
        <Line label="Engagement" value={`${(eng * 100).toFixed(1)}%`} />
        <Line label="Where you stand in this niche" value={topWord(share)} />
        <Line label="Earned last year" value={ch.monetised ? money(ch.revenue) : "Not monetised yet"} />
        <Text style={[ms.note, { marginTop: spacing.sm }]}>{roomWord(c, world, ch)}{ch.fake > 10 ? ` About ${Math.round(ch.fake)}% of your audience isn't real.` : ""}</Text>
        {!ch.monetised ? <Text style={ms.note}>You'll be able to earn from {p.monetiseName} at {fmt(p.monetise)} {p.people}.</Text> : null}
        {banned ? <Text style={[ms.note, { color: colors.danger }]}>This account is suspended until age {ch.bannedUntil}.</Text> : null}
        {ch.strikes > 0 ? <Text style={[ms.note, { color: colors.gold }]}>{ch.strikes} strike{ch.strikes === 1 ? "" : "s"}. Three gets you suspended.</Text> : null}
      </Card>

      <Card>
        <TouchableOpacity accessibilityRole="button" activeOpacity={0.75} onPress={() => setShowQ((v) => !v)} style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={ms.subheading}>Content quality</Text>
            <Text style={styles.optTitle}>{qualityWord(q)} · {q}/100</Text>
          </View>
          <Ionicons name={showQ ? "chevron-up" : "chevron-down"} size={18} color={colors.textMuted} />
        </TouchableOpacity>
        <Bar value={q} color={q >= 70 ? colors.primary : q >= 45 ? colors.gold : colors.danger} />
        {showQ &&
          qualityParts(c, ch)
            .filter((x) => Math.abs(x.value) >= 0.5)
            .map((x) => <Line key={x.label} label={x.label} value={`${x.value > 0 ? "+" : ""}${Math.round(x.value)}`} color={x.value < 0 ? colors.danger : undefined} />)}
      </Card>

      <Text style={ms.subheading}>Your plan for the year</Text>
      <Card>
        <Text style={ms.subheading}>How often</Text>
        {CADENCES.map((cd) => (
          <Opt key={cd.key} icon="calendar" title={cd.label} sub={cd.blurb} on={ch.cadence === cd.key} disabled={cadOrder.indexOf(cd.key) > cadOrder.indexOf(maxC)} onPress={() => setPlan(ch.platform, { cadence: cd.key })} right={cd.posts > 0 ? `${cd.posts}/yr` : undefined} />
        ))}
      </Card>
      <Card>
        <Text style={ms.subheading}>Kit and production</Text>
        {GEAR.map((g) => (
          <Opt key={g.key} icon="videocam" title={g.label} sub={g.blurb} on={ch.gear === g.key} disabled={c.age < 18 && g.key !== "phone" && g.key !== "home"} onPress={() => setPlan(ch.platform, { gear: g.key })} right={c.age >= 18 && g.cost > 0 ? `${money(gearPrice(c, g.key))}/yr` : undefined} />
        ))}
        {c.age < 18 ? <Text style={ms.note}>Your parents cover the basics until you're 18.</Text> : null}
      </Card>
      <Card>
        <Text style={ms.subheading}>Tone</Text>
        {STYLES.map((st) => (
          <Opt key={st.key} icon={st.key === "bait" ? "flame" : st.key === "edgy" ? "flash" : st.key === "wholesome" ? "heart" : "remove"} title={st.label} sub={st.blurb} on={ch.style === st.key} onPress={() => setPlan(ch.platform, { style: st.key })} />
        ))}
      </Card>
      <Card>
        <TouchableOpacity accessibilityRole="button" activeOpacity={0.75} onPress={() => setPickNiche((v) => !v)} style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={ms.subheading}>Niche</Text>
            <Text style={styles.optTitle}>{n.label}</Text>
          </View>
          <Text style={styles.optRight}>{pickNiche ? "Close" : "Change"}</Text>
        </TouchableOpacity>
        {pickNiche ? (
          <>
            <Text style={ms.note}>Switching to something new costs you about a third of your audience, and you'll spend a year finding your feet.</Text>
            {NICHES.filter((x) => x.key !== ch.niche).map((x) => (
              <Opt key={x.key} icon={x.icon} title={x.label} sub={c.age < x.minAge ? `You need to be ${x.minAge}.` : `${fitWord(x.fit[ch.platform] ?? 0.5)} · ${crowdWord(x.ceiling * p.scale * (x.fit[ch.platform] ?? 0.5))}`} on={target === x.key} disabled={c.age < x.minAge} onPress={() => setTarget(x.key)} />
            ))}
            {target ? <Button label={`Switch to ${nicheDef(target).label}`} icon="swap-horizontal" variant="danger" onPress={() => { setPlan(ch.platform, { niche: target }); setTarget(null); setPickNiche(false); }} style={{ marginTop: spacing.sm }} /> : null}
          </>
        ) : null}
      </Card>

      <Text style={ms.subheading}>Do something now</Text>
      <Card>
        {ACTIONS.map((a) => {
          const chk = actionCheck(c, ch, a);
          const cost = actionCost(c, ch, a.key);
          return <Opt key={a.key} icon={a.icon} title={a.key === "post" ? "Create a post" : a.label} sub={chk.ok ? a.blurb : chk.reason} disabled={!chk.ok} onPress={() => (a.key === "post" ? push("createpost", { platform: ch.platform }) : act(ch.platform, a.key))} right={chk.ok ? `${cost > 0 ? money(cost) + " · " : ""}${actionsLeft(c, a)} left` : undefined} />;
        })}
      </Card>

      <Text style={ms.subheading}>Money</Text>
      <Card>
        <Opt icon="ribbon" title={ch.members ? (ch.platform === "twitch" ? "Subscriptions are on" : "Memberships are on") : ch.platform === "twitch" ? "Turn on subscriptions" : "Launch paid memberships"} sub={ch.members ? "Your most loyal fans pay to support you every month." : mem.ok ? "Let your most loyal fans pay to support you." : mem.reason} disabled={!mem.ok} on={ch.members} onPress={() => launchMembers(ch.platform)} />
        <Opt icon="shirt" title={ch.merch ? "Merch is selling" : "Launch a merch line"} sub={ch.merch ? "T-shirts, mugs and stickers with your face on." : mer.ok ? "Loyal niches buy the most." : mer.reason} disabled={!mer.ok} on={ch.merch} onPress={() => launchMerch(ch.platform)} right={!ch.merch ? money(merchCost(c)) : undefined} />
        {c.age >= 16 ? (
          <>
            <Opt icon="cart" title="Buy 1,000 followers" sub="They're fake. The number goes up, engagement falls, and getting caught is costly." onPress={() => buy(ch.platform, 1)} disabled={c.money < followerPrice(c)} right={money(followerPrice(c))} color={colors.danger} />
            <Opt icon="cart" title="Buy 10,000 followers" sub="A bigger number, a bigger risk." onPress={() => buy(ch.platform, 10)} disabled={c.money < followerPrice(c) * 10} right={money(followerPrice(c) * 10)} color={colors.danger} />
          </>
        ) : null}
      </Card>

      {posts.length > 0 ? (
        <>
          <Text style={ms.subheading}>Recent posts</Text>
          {posts.map((post) => (
            <PostCard key={post.id} c={c} post={post} open={openPost === post.id} onToggle={() => setOpenPost(openPost === post.id ? null : post.id)} />
          ))}
        </>
      ) : null}

      <Card>
        {confirmDel ? (
          <>
            <Text style={ms.note}>Delete this channel and everything on it? Deals tied to it end too.</Text>
            <Button label="Yes, delete it" icon="trash" variant="danger" onPress={() => { closeChannel(ch.platform); pop(); }} />
          </>
        ) : (
          <Button label="Delete this channel" icon="trash" variant="ghost" onPress={() => setConfirmDel(true)} />
        )}
      </Card>
    </MenuScreen>
  );
}

// ---------------------------------------------------------------- create a post

export function CreatePostMenu({ platform }: { platform: string }) {
  const character = useGameStore((s) => s.character);
  const act = useGameStore((x) => x.creatorAction);
  if (!character) return null;
  const c = character;
  const ch = channelOf(c, platform as never);
  if (!ch) return null;
  const p = platformDef(ch.platform);
  const n = nicheDef(ch.niche);
  const def = ACTIONS.find((a) => a.key === "post")!;
  const chk = actionCheck(c, ch, def);
  const left = actionsLeft(c, def);
  return (
    <MenuScreen title="Create a post" icon="add-circle" color={p.color}>
      <Card>
        <View style={styles.postHead}>
          <PlatformBadge p={p} size={34} />
          <View style={{ flex: 1 }}>
            <Text style={styles.optTitle}>@{ch.handle}</Text>
            <Text style={styles.optSub}>{n.label} on {p.label} · {left} left this year</Text>
          </View>
        </View>
        <Text style={ms.note}>What you make matters. Some formats suit your niche much better than others, and some are riskier than they look.</Text>
        {!chk.ok ? <Text style={[ms.note, { color: colors.danger }]}>{chk.reason}</Text> : null}
      </Card>
      {POST_TYPES.map((t) => {
        const fit = t.fit[n.cat];
        const short = t.minFollowers && ch.followers < t.minFollowers;
        const cost = c.age >= 18 && t.cost > 0 ? Math.round(t.cost * costScale(c)) : 0;
        return (
          <Opt
            key={t.key}
            icon={t.icon}
            title={t.label}
            sub={short ? `Needs ${fmt(t.minFollowers!)} ${p.people}.` : `${t.blurb} ${fit >= 1.2 ? "Great fit for your niche." : fit >= 0.95 ? "Works well." : fit >= 0.75 ? "Not a natural fit." : "A poor fit for your niche."}${t.risk >= 0.06 ? " Risky." : ""}`}
            disabled={!chk.ok || !!short}
            onPress={() => act(ch.platform, "post", t.key)}
            right={cost > 0 ? `from ${money(cost)}` : undefined}
            color={fit >= 1.2 ? colors.primary : fit < 0.8 ? colors.textMuted : colors.textSecondary}
          />
        );
      })}
    </MenuScreen>
  );
}

// ---------------------------------------------------------------- feed

export function FeedMenu() {
  const character = useGameStore((s) => s.character);
  const [open, setOpen] = React.useState<string | null>(null);
  if (!character) return null;
  const c = character;
  const feed = c.social?.feed ?? [];
  return (
    <MenuScreen title="Your feed" icon="images" color={colors.looks}>
      {feed.length === 0 ? <Text style={ms.note}>Nothing yet. Post something from one of your channels.</Text> : <Text style={ms.note}>Tap a post to read what people said. Your tone and reputation shape the comment section.</Text>}
      {feed.map((post) => (
        <PostCard key={post.id} c={c} post={post} open={open === post.id} onToggle={() => setOpen(open === post.id ? null : post.id)} />
      ))}
    </MenuScreen>
  );
}

// ---------------------------------------------------------------- inbox

const KIND_ICON: Record<string, string> = { brand: "pricetag", collab: "people", fan: "heart", hate: "skull", platform: "shield-checkmark", press: "newspaper", agency: "briefcase", scam: "warning", friend: "person", family: "home" };
const KIND_COLOR: Record<string, string> = { brand: colors.gold, collab: colors.smarts, fan: colors.love, hate: colors.danger, platform: colors.primary, press: colors.looks, agency: colors.teal, scam: colors.danger, friend: colors.happiness, family: colors.textSecondary };

function InboxCard({ item, onAnswer }: { item: InboxItem; onAnswer: (key: string) => void }) {
  const color = KIND_COLOR[item.kind] ?? colors.primary;
  const d = item.deal;
  return (
    <Card>
      <View style={styles.postHead}>
        <View style={[styles.badge, { width: 36, height: 36, borderRadius: 11, backgroundColor: color + "26", borderColor: color + "66" }]}>
          <Ionicons name={ICON(KIND_ICON[item.kind] ?? "mail")} size={18} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.optTitle}>{item.subject}</Text>
          <Text style={styles.optSub}>{item.from}{item.platform ? ` · ${platformDef(item.platform).label}` : ""}</Text>
        </View>
      </View>
      <Text style={[ms.note, { marginTop: spacing.sm }]}>{item.body}</Text>
      {d ? <Text style={[ms.note, { color: colors.gold }]}>{money(d.pay)}{d.kind === "ambassador" ? ` a year for ${d.yearsLeft} years` : d.kind === "series" ? " over the year" : " for one post"}</Text> : null}
      <View style={ms.btnRow}>
        {item.options.map((o, i) => (
          <Button key={o.key} label={o.label} size="sm" variant={i === 0 ? "primary" : "secondary"} onPress={() => onAnswer(o.key)} />
        ))}
      </View>
    </Card>
  );
}

export function InboxMenu() {
  const character = useGameStore((s) => s.character);
  const answer = useGameStore((x) => x.answerInbox);
  if (!character) return null;
  const inbox = character.social?.inbox ?? [];
  return (
    <MenuScreen title="Inbox" icon="mail" color={colors.gold}>
      {inbox.length === 0 ? <Text style={ms.note}>Nothing waiting. The bigger you get, the more people want something from you: brands, other creators, fans, journalists, and people who just want to make you miserable.</Text> : <Text style={ms.note}>Offers go cold if you leave them a year or two.</Text>}
      {inbox.map((it) => (
        <InboxCard key={it.id} item={it} onAnswer={(k) => answer(it.id, k)} />
      ))}
    </MenuScreen>
  );
}

// ---------------------------------------------------------------- deals

export function DealsMenu() {
  const character = useGameStore((s) => s.character);
  if (!character) return null;
  const deals = character.social?.deals ?? [];
  return (
    <MenuScreen title="Brand deals" icon="document-text" color={colors.teal}>
      <Text style={ms.note}>Brands pay for your audience. Bigger, more engaged and better-liked audiences get better offers, and brands notice fake followers. Deals show up in your inbox, and a long deal means keeping up your end: stay active on that platform.</Text>
      {deals.length === 0 ? (
        <Card>
          <Text style={styles.optTitle}>No active deals</Text>
          <Text style={ms.note}>Once you're monetised and have a few thousand followers, brands will start writing.</Text>
        </Card>
      ) : (
        deals.map((d) => {
          const b = brandDef(d.brand);
          return (
            <Card key={d.id}>
              <View style={styles.rowBetween}>
                <Text style={styles.optTitle}>{b?.name ?? d.brand}</Text>
                <Chip label={d.kind === "ambassador" ? "Ambassador" : d.kind === "series" ? "Series" : "Post"} color={d.sketchy ? colors.danger : colors.teal} />
              </View>
              <Text style={styles.optSub}>{b?.blurb} · {platformDef(d.platform).label}</Text>
              <Line label="Pays" value={`${money(d.pay)} a year`} />
              <Line label="Time left" value={`${d.yearsLeft} year${d.yearsLeft === 1 ? "" : "s"}`} />
              {d.clause ? <Text style={ms.note}>{d.clause}</Text> : null}
              {d.sketchy ? <Text style={[ms.note, { color: colors.danger }]}>You've had doubts about this one.</Text> : null}
            </Card>
          );
        })
      )}
      <Card>
        <Text style={ms.subheading}>Who's out there</Text>
        <Text style={ms.note}>{BRANDS.length} brands are looking for creators. Some sell things they shouldn't. They pay the most, and they're the ones who end up in the news.</Text>
      </Card>
    </MenuScreen>
  );
}

// ---------------------------------------------------------------- analytics

export function AnalyticsMenu() {
  const character = useGameStore((s) => s.character);
  const world = useGameStore((s) => s.worldState);
  if (!character) return null;
  const c = character;
  const s = c.social;
  const chans = s?.channels ?? [];
  const sponsor = (s?.deals ?? []).reduce((t, d) => t + d.pay, 0);
  const rev = chans.reduce((t, ch) => t + ch.revenue, 0);
  return (
    <MenuScreen title="Analytics" icon="stats-chart" color={colors.smarts}>
      <Card>
        <Text style={ms.subheading}>All time</Text>
        <Line label="Followers now" value={fmt(totalFollowers(c))} bold />
        <Line label="Biggest you've been" value={fmt(s?.topFollowers ?? 0)} />
        <Line label="Viral hits" value={String(chans.reduce((t, ch) => t + ch.hits, 0))} />
        <Line label="Earned from content" value={money(s?.earned ?? 0)} />
        <Line label="Best year" value={money(s?.bestYear ?? 0)} />
      </Card>
      <Card>
        <Text style={ms.subheading}>Last year</Text>
        <Line label="From your platforms" value={money(rev)} />
        <Line label="From sponsors (running)" value={money(sponsor)} />
        <Line label="Tax paid" value={money(s?.lastTax ?? 0)} />
        <Line label="Kept" value={money(s?.lastEarned ?? 0)} bold />
      </Card>
      {chans.map((ch) => {
        const p = platformDef(ch.platform);
        return (
          <Card key={ch.platform}>
            <View style={styles.postHead}>
              <PlatformBadge p={p} size={30} />
              <View style={{ flex: 1 }}>
                <Text style={styles.optTitle}>{p.label} · {fmt(ch.followers)}</Text>
                <Text style={styles.optSub}>{nicheDef(ch.niche).label} · {topWord(percentile(c, world, ch))}</Text>
              </View>
            </View>
            <Trend history={ch.history} color={p.color} />
            <Line label="Quality" value={`${qualityWord(qualityOf(c, ch))} (${qualityOf(c, ch)})`} />
            <Line label="Engagement" value={`${(engagementOf(c, ch) * 100).toFixed(1)}%`} />
            <Line label="Room to grow" value={fmt(Math.max(0, Math.round(carrying(c, world, ch) - ch.followers)))} />
            <Line label="Earned last year" value={ch.monetised ? money(ch.revenue) : "not monetised"} />
            <Text style={[ms.subheading, { marginTop: spacing.md }]}>Who's watching</Text>
            {audienceMix(ch).map((a) => (
              <View key={a.label} style={{ marginBottom: 4 }}>
                <View style={styles.rowBetween}>
                  <Text style={styles.optSub}>{a.label}</Text>
                  <Text style={styles.optSub}>{a.pct}%</Text>
                </View>
                <Bar value={a.pct * 2.2} color={p.color} height={5} />
              </View>
            ))}
          </Card>
        );
      })}
    </MenuScreen>
  );
}

// ---------------------------------------------------------------- trending

const popWord = (v: number) => (v >= 1.25 ? "Booming" : v >= 1.05 ? "Strong" : v >= 0.85 ? "Steady" : v >= 0.6 ? "Fading" : "Collapsing");

export function TrendingMenu() {
  const character = useGameStore((s) => s.character);
  const world = useGameStore((s) => s.worldState);
  if (!character) return null;
  const c = character;
  const w = world.social;
  const stars = [...(w?.stars ?? [])].sort((a, b) => b.followers - a.followers).slice(0, 12);
  return (
    <MenuScreen title="What's trending" icon="trending-up" color={colors.love}>
      <Card>
        <Text style={ms.subheading}>The mood this year</Text>
        <Text style={styles.optTitle}>{w?.mood ?? "The internet is quiet."}</Text>
      </Card>
      <Card>
        <Text style={ms.subheading}>Platforms</Text>
        {PLATFORMS.map((p) => {
          const v = popOf(world, p.key);
          return (
            <View key={p.key} style={{ marginBottom: spacing.sm }}>
              <View style={styles.rowBetween}>
                <Text style={styles.optTitle}>{p.label}</Text>
                <Text style={[styles.optSub, { color: v >= 1 ? colors.primary : v >= 0.85 ? colors.textMuted : colors.danger }]}>{popWord(v)}</Text>
              </View>
              <Bar value={(v / 1.5) * 100} color={p.color} height={6} />
            </View>
          );
        })}
        <Text style={ms.note}>When a platform booms, everyone on it grows faster. When it fades, its audience leaves.</Text>
      </Card>
      <Card>
        <Text style={ms.subheading}>Niches on the move</Text>
        {(w?.hot ?? []).length === 0 ? <Text style={ms.note}>Nothing in particular is having a moment.</Text> : null}
        {(w?.hot ?? []).map((h) => (
          <View key={h.niche} style={styles.rowBetween}>
            <Text style={styles.optTitle}>{nicheDef(h.niche).label}</Text>
            <Text style={[styles.optSub, { color: h.mult >= 1 ? colors.primary : colors.danger }]}>{h.mult >= 1 ? "Hot" : "Cooling"} · {h.years}y</Text>
          </View>
        ))}
        {(c.social?.channels ?? []).some((ch) => hotMult(world, ch.niche) > 1) ? <Text style={[ms.note, { color: colors.primary }]}>One of your niches is hot right now. Now's the time to post.</Text> : null}
      </Card>
      <Card>
        <Text style={ms.subheading}>Biggest names right now</Text>
        {(c.social?.channels ?? []).filter((ch) => ch.followers >= (stars[stars.length - 1]?.followers ?? 1e12)).map((ch) => (
          <View key={ch.platform} style={styles.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.optTitle, { color: colors.primary }]}>You (@{ch.handle})</Text>
              <Text style={styles.optSub}>{platformDef(ch.platform).label} · {nicheDef(ch.niche).label}</Text>
            </View>
            <Text style={[styles.count, { color: colors.primary }]}>{fmt(ch.followers)}</Text>
          </View>
        ))}
        {stars.map((st, i) => (
          <View key={i} style={styles.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text style={styles.optTitle}>{st.name}</Text>
              <Text style={styles.optSub}>{platformDef(st.platform).label} · {nicheDef(st.niche).label}</Text>
            </View>
            <Text style={styles.count}>{fmt(st.followers)}</Text>
          </View>
        ))}
      </Card>
    </MenuScreen>
  );
}

// ---------------------------------------------------------------- team

export function TeamMenu() {
  const character = useGameStore((s) => s.character);
  const hire = useGameStore((x) => x.hireTeam);
  const fire = useGameStore((x) => x.fireTeam);
  if (!character) return null;
  const c = character;
  const s = c.social;
  return (
    <MenuScreen title="Your team" icon="people" color={colors.primary}>
      <Text style={ms.note}>Help costs money and takes a cut, but it's how one person becomes a business. You need to be an adult to hire, and your channels have to be big enough to keep them busy.</Text>
      {ROLES.map((r) => {
        const has = !!s?.team[r.key];
        const chk = roleCheck(c, r.key);
        return (
          <Card key={r.key}>
            <View style={styles.postHead}>
              <View style={[styles.badge, { width: 36, height: 36, borderRadius: 11, backgroundColor: colors.primary + "26", borderColor: colors.primary + "66" }]}>
                <Ionicons name={ICON(r.icon)} size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.optTitle}>{r.label}</Text>
                <Text style={styles.optSub}>{has ? "On the team" : `Needs a channel with ${fmt(r.need)} followers`}</Text>
              </View>
            </View>
            <Text style={ms.note}>{r.blurb}</Text>
            {has ? <Button label={`Let them go`} variant="secondary" size="sm" onPress={() => fire(r.key)} /> : <Button label={chk.ok ? `Hire a ${r.label.toLowerCase()}` : chk.reason ?? "Not yet"} variant="primary" size="sm" disabled={!chk.ok} onPress={() => hire(r.key)} />}
          </Card>
        );
      })}
    </MenuScreen>
  );
}

// ---------------------------------------------------------------- styles

const styles = StyleSheet.create({
  track: { borderRadius: 4, backgroundColor: colors.surfaceRaised, overflow: "hidden", marginTop: 4 },
  fill: { borderRadius: 4 },
  badge: { alignItems: "center", justifyContent: "center", borderWidth: 1 },
  opt: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.surfaceRaised, marginTop: spacing.sm, borderWidth: 1, borderColor: "transparent" },
  optOn: { borderColor: colors.primary },
  optTitle: { color: colors.textPrimary, fontFamily: fonts.semiBold, fontSize: fontSize.base },
  optSub: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: fontSize.sm, marginTop: 1 },
  optRight: { color: colors.textSecondary, fontFamily: fonts.semiBold, fontSize: fontSize.sm },
  line: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, gap: spacing.md },
  lineLabel: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fontSize.md, flexShrink: 1 },
  lineValue: { color: colors.textPrimary, fontFamily: fonts.semiBold, fontSize: fontSize.md },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
  big: { color: colors.textPrimary, fontFamily: fonts.extraBold, fontSize: 34, marginTop: spacing.sm },
  handle: { color: colors.textPrimary, fontFamily: fonts.extraBold, fontSize: fontSize.lg },
  count: { color: colors.textPrimary, fontFamily: fonts.extraBold, fontSize: fontSize.lg },
  meters: { flexDirection: "row", gap: spacing.md, marginTop: spacing.md },
  meterLabel: { color: colors.textSecondary, fontFamily: fonts.semiBold, fontSize: fontSize.xs },
  channel: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  post: { backgroundColor: colors.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  postHead: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  statRow: { flexDirection: "row", gap: spacing.lg, marginTop: spacing.sm },
  stat: { color: colors.textSecondary, fontFamily: fonts.semiBold, fontSize: fontSize.sm },
  comment: { flexDirection: "row", gap: spacing.sm, paddingTop: spacing.sm, marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  commentUser: { color: colors.textMuted, fontFamily: fonts.bold, fontSize: fontSize.xs },
  commentText: { color: colors.textPrimary, fontFamily: fonts.regular, fontSize: fontSize.md },
  input: { backgroundColor: colors.surfaceRaised, color: colors.textPrimary, borderRadius: radii.md, padding: spacing.md, fontFamily: fonts.regular, fontSize: fontSize.base, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
});

export { gearDef, styleDef };
