import React from "react";
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGameStore } from "../../state/gameStore";
import MenuScreen, { SectionLabel } from "../../nav/MenuScreen";
import Card from "../../components/Card";
import Button from "../../components/Button";
import ThemePicker from "../../components/ThemePicker";
import WhatsNewModal from "../../components/WhatsNewModal";
import { setSetting, useSettings } from "../../settings";
import { THEMES, colors, currentThemeId, fonts, fontSize, radii, spacing } from "../../theme";
import { APP_VERSION } from "../../version";
import { ms } from "./menuStyles";

function Toggle({ icon, title, sub, on, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; sub: string; on: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity accessibilityRole="switch" accessibilityState={{ checked: on }} activeOpacity={0.75} style={styles.row} onPress={onPress}>
      <View style={[styles.icon, { backgroundColor: (on ? colors.primary : colors.textMuted) + "22" }]}>
        <Ionicons name={icon} size={18} color={on ? colors.primary : colors.textMuted} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSub}>{sub}</Text>
      </View>
      <View style={[styles.switchTrack, on && { backgroundColor: colors.primary }]}>
        <View style={[styles.switchKnob, on && { alignSelf: "flex-end" }]} />
      </View>
    </TouchableOpacity>
  );
}

const SIZES: { label: string; value: number }[] = [
  { label: "Small", value: 0.9 },
  { label: "Normal", value: 1 },
  { label: "Large", value: 1.15 },
];

export function SettingsMenu() {
  const s = useSettings();
  const character = useGameStore((x) => x.character);
  const exportSave = useGameStore((x) => x.exportSave);
  const importSave = useGameStore((x) => x.importSave);
  const restart = useGameStore((x) => x.restart);
  const [themes, setThemes] = React.useState(false);
  const [news, setNews] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [paste, setPaste] = React.useState("");
  const [msg, setMsg] = React.useState<{ text: string; ok: boolean } | null>(null);
  const [confirmLoad, setConfirmLoad] = React.useState(false);
  const [confirmNew, setConfirmNew] = React.useState(false);

  const copy = async () => {
    const text = exportSave();
    setCode(text);
    try {
      await navigator.clipboard.writeText(text);
      setMsg({ ok: true, text: "Copied. Paste it somewhere safe, like a note or a message to yourself." });
    } catch {
      setMsg({ ok: true, text: "Your browser wouldn't copy it automatically. Select the text below and copy it yourself." });
    }
  };

  const load = () => {
    const r = importSave(paste);
    if (r.ok) {
      setMsg({ ok: true, text: "Loaded. You're back in that life." });
      setPaste("");
      setConfirmLoad(false);
    } else {
      setMsg({ ok: false, text: r.error ?? "Couldn't load that." });
      setConfirmLoad(false);
    }
  };

  return (
    <MenuScreen title="Settings" icon="settings" color={colors.textSecondary}>
      <SectionLabel>Look and feel</SectionLabel>
      <Card>
        <TouchableOpacity accessibilityRole="button" activeOpacity={0.75} style={styles.row} onPress={() => setThemes(true)}>
          <View style={[styles.icon, { backgroundColor: colors.looks + "22" }]}>
            <Ionicons name="color-palette" size={18} color={colors.looks} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Colour theme</Text>
            <Text style={styles.rowSub}>{THEMES[currentThemeId].label}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>
        <Text style={ms.subheading}>Text size</Text>
        <View style={styles.sizes}>
          {SIZES.map((z) => (
            <TouchableOpacity key={z.value} accessibilityRole="button" activeOpacity={0.75} style={[styles.size, s.textScale === z.value && styles.sizeOn]} onPress={() => s.textScale !== z.value && setSetting("textScale", z.value)}>
              <Text style={[styles.sizeText, { fontSize: fontSize.base * z.value }, s.textScale === z.value && { color: colors.primary }]}>Aa</Text>
              <Text style={styles.sizeLabel}>{z.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={ms.note}>Changing the text size restarts the screen. Your life is saved.</Text>
        <Toggle icon="film" title="Reduce motion" sub="Turns off confetti, pops and slide-ins" on={s.reduceMotion} onPress={() => setSetting("reduceMotion", !s.reduceMotion)} />
        <Toggle icon="volume-high" title="Sound" sub="Age up, choices and game over" on={s.sound} onPress={() => setSetting("sound", !s.sound)} />
      </Card>

      {Platform.OS === "web" ? (
        <>
          <SectionLabel>Keyboard</SectionLabel>
          <Card>
            <Toggle icon="keypad" title="Keyboard shortcuts" sub="Space ages up, 1 to 9 pick a choice, Esc goes back, Q W E R T switch tabs" on={s.shortcuts} onPress={() => setSetting("shortcuts", !s.shortcuts)} />
          </Card>
        </>
      ) : null}

      {character ? (
        <>
          <SectionLabel>Back up and move your life</SectionLabel>
          <Card>
            <Text style={ms.note}>A save is just text. Copy it, and you can load the same life in another browser, on another device, or the downloaded copy of the game. Saves live in the browser you play in, so clearing site data erases them.</Text>
            <Button label="Copy my save" icon="copy" variant="secondary" onPress={copy} />
            {code ? <TextInput style={[styles.input, { height: 90 }]} value={code} multiline editable={false} selectTextOnFocus /> : null}
            <Text style={ms.subheading}>Load a save</Text>
            <TextInput style={[styles.input, { height: 90 }]} value={paste} onChangeText={(t) => { setPaste(t); setConfirmLoad(false); }} placeholder="Paste a save here" placeholderTextColor={colors.textMuted} multiline autoCapitalize="none" autoCorrect={false} />
            {confirmLoad ? (
              <View style={ms.btnRow}>
                <Button label="Yes, replace my current life" icon="warning" variant="danger" onPress={load} />
                <Button label="Cancel" variant="ghost" onPress={() => setConfirmLoad(false)} />
              </View>
            ) : (
              <Button label="Load it" icon="download" variant="secondary" disabled={!paste.trim()} onPress={() => setConfirmLoad(true)} />
            )}
            {msg ? <Text style={[ms.note, { color: msg.ok ? colors.primary : colors.danger, marginTop: spacing.sm }]}>{msg.text}</Text> : null}
          </Card>
        </>
      ) : null}

      <SectionLabel>This life</SectionLabel>
      <Card>
        {confirmNew ? (
          <>
            <Text style={ms.note}>This ends {character ? `${character.firstName}'s` : "this"} life without a game over screen and takes you back to the start. Copy a save first if you might want it back.</Text>
            <View style={ms.btnRow}>
              <Button label="Yes, start over" icon="trash" variant="danger" onPress={() => restart()} />
              <Button label="Cancel" variant="ghost" onPress={() => setConfirmNew(false)} />
            </View>
          </>
        ) : (
          <Button label="Abandon this life and start over" icon="refresh" variant="ghost" onPress={() => setConfirmNew(true)} />
        )}
      </Card>

      <SectionLabel>About</SectionLabel>
      <Card>
        <TouchableOpacity accessibilityRole="button" activeOpacity={0.75} style={styles.row} onPress={() => setNews(true)}>
          <View style={[styles.icon, { backgroundColor: colors.gold + "22" }]}>
            <Ionicons name="sparkles" size={18} color={colors.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>What's new</Text>
            <Text style={styles.rowSub}>Better Bit v{APP_VERSION}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </Card>

      {themes && <ThemePicker onClose={() => setThemes(false)} />}
      {news && <WhatsNewModal onClose={() => setNews(false)} />}
    </MenuScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm },
  icon: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  rowTitle: { color: colors.textPrimary, fontFamily: fonts.bold, fontSize: fontSize.base },
  rowSub: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: fontSize.sm, marginTop: 1 },
  switchTrack: { width: 42, height: 24, borderRadius: 12, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border, padding: 2, justifyContent: "center" },
  switchKnob: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.textPrimary, alignSelf: "flex-start" },
  sizes: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm },
  size: { flex: 1, alignItems: "center", paddingVertical: spacing.md, borderRadius: radii.md, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: "transparent" },
  sizeOn: { borderColor: colors.primary },
  sizeText: { color: colors.textPrimary, fontFamily: fonts.extraBold },
  sizeLabel: { color: colors.textMuted, fontFamily: fonts.semiBold, fontSize: fontSize.xs, marginTop: 2 },
  input: { backgroundColor: colors.surfaceRaised, color: colors.textPrimary, borderRadius: radii.md, padding: spacing.md, fontFamily: fonts.regular, fontSize: fontSize.sm, marginVertical: spacing.sm, borderWidth: 1, borderColor: colors.border, textAlignVertical: "top" },
});
