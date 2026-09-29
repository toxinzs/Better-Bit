import React from "react";
import { ScrollView } from "react-native";
import { useGameStore } from "../../state/gameStore";
import { useNav } from "../../nav/navStore";
import { MenuRow } from "../../nav/MenuScreen";
import { getRegion } from "../../data/regions";
import { stageLabel } from "../../data/education";
import { colors } from "../../theme";
import { tabStyles } from "../tabs/sharedStyles";

export function WorkHub() {
  const character = useGameStore((s) => s.character);
  const push = useNav((s) => s.push);
  if (!character) return null;
  const job = character.inJail
    ? "Incarcerated"
    : [character.job?.title, character.partTime ? `${character.partTime.title} (part-time)` : undefined].filter(Boolean).join(" + ") || "Unemployed";
  const school = stageLabel(character.originRegion, character.educationStage);
  return (
    <ScrollView contentContainerStyle={tabStyles.scroll} showsVerticalScrollIndicator={false}>
      <MenuRow icon="briefcase" color={colors.smarts} title="Occupation" summary={job} delay={0} onPress={() => push("occupation")} />
      <MenuRow
        icon="search" color={colors.happiness} title="Find Work"
        summary={`${character.age < getRegion(character.originRegion).workAge.parttime ? "Odd jobs" : "Part-time, full-time & gigs"}`}
        delay={30} onPress={() => push("findwork")}
      />
      <MenuRow
        icon="school" color={colors.looks} title="School & Education"
        summary={`${school}${character.gpa != null && character.age >= 5 ? ` · GPA ${character.gpa.toFixed(2)}` : ""}`}
        delay={40} onPress={() => push("school")}
      />
    </ScrollView>
  );
}
