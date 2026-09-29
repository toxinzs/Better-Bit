import React from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGameStore } from "../../state/gameStore";
import { useNav } from "../../nav/navStore";
import { MenuRow } from "../../nav/MenuScreen";
import Card from "../../components/Card";
import { GROUPS } from "../tabs/PeopleTab";
import { colors, fonts, fontSize, spacing } from "../../theme";
import { tabStyles } from "../tabs/sharedStyles";

const summarize = (names: string[]) => {
  const first = names.slice(0, 3).map((n) => n.split(" ")[0]);
  return first.join(", ") + (names.length > 3 ? ` +${names.length - 3}` : "");
};

export default function PeopleHub() {
  const character = useGameStore((s) => s.character);
  const push = useNav((s) => s.push);
  if (!character) return null;
  const alive = character.relationships.filter((r) => r.alive && r.type !== "teacher" && !r.hidden);
  const memorial = character.relationships.filter((r) => !r.alive && r.diedAge !== undefined && r.type !== "classmate" && r.type !== "teacher");
  const teenDatingOpen = character.age >= 13 && character.age < 18 && !alive.some((r) => r.type === "partner");

  return (
    <ScrollView contentContainerStyle={tabStyles.scroll} showsVerticalScrollIndicator={false}>
      {character.pregnancy && (
        <Card style={styles.hint}>
          <Ionicons name="egg" size={20} color={colors.love} />
          <Text style={styles.hintText}>
            {character.pregnancy.carrier === "player"
              ? "You're expecting. The baby arrives next year."
              : character.pregnancy.carrier === "surrogate"
                ? "Your surrogate is expecting. The baby arrives next year."
                : `${character.relationships.find((x) => x.id === character.pregnancy!.carrierId)?.name.split(" ")[0] ?? "Your partner"} is expecting. The baby arrives next year.`}
            {character.pregnancy.plan === "adopt" ? " You've planned an adoption." : ""}
          </Text>
        </Card>
      )}
      {teenDatingOpen && (
        <Card style={styles.hint}>
          <Ionicons name="heart-circle" size={20} color={colors.love} />
          <Text style={styles.hintText}>Dating is open. Tap a classmate or friend your age and choose Ask Out - or wait, someone might ask you.</Text>
        </Card>
      )}
      {GROUPS.map((g, i) => {
        const members = alive.filter((r) => g.types.includes(r.type)).sort((a, b) => b.level - a.level);
        if (members.length === 0 && g.key !== "family") return null;
        return (
          <MenuRow
            key={g.key}
            icon={g.icon}
            color={g.color}
            title={g.title}
            summary={members.length > 0 ? summarize(members.map((m) => m.name)) : "No one yet"}
            badge={String(members.length)}
            delay={i * 40}
            onPress={() => push("peopleGroup", { group: g.key })}
          />
        );
      })}
      {memorial.length > 0 && (
        <MenuRow icon="rose" color={colors.textSecondary} title="In memory" summary={summarize(memorial.map((m) => m.name))} badge={String(memorial.length)} delay={300} onPress={() => push("peopleGroup", { group: "memory" })} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hint: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  hintText: { flex: 1, color: colors.textSecondary, fontFamily: fonts.semiBold, fontSize: fontSize.md, lineHeight: 19 },
});
