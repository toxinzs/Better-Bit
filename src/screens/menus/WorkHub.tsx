import React from "react";
import { ScrollView } from "react-native";
import { useGameStore } from "../../state/gameStore";
import { useNav } from "../../nav/navStore";
import MenuScreen, { MenuRow } from "../../nav/MenuScreen";
import SchoolTab from "../tabs/SchoolTab";
import { getRegion } from "../../data/regions";
import { colors } from "../../theme";
import { tabStyles } from "../tabs/sharedStyles";

const STAGE: Record<string, string> = {
  none: "Not in school yet",
  elementary: "Elementary school",
  middle: "Middle school",
  high: "High school",
  college: "College",
  graduated: "Not enrolled",
};

export function WorkHub() {
  const character = useGameStore((s) => s.character);
  const push = useNav((s) => s.push);
  if (!character) return null;
  const job = character.inJail
    ? "Incarcerated"
    : [character.job?.title, character.partTime ? `${character.partTime.title} (part-time)` : undefined].filter(Boolean).join(" + ") || "Unemployed";
  const school = STAGE[character.educationStage] ?? character.educationStage;
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

// School is still the older screen, wrapped as a menu (rebuilt in v2.1b).
export function SchoolMenu() {
  return (
    <MenuScreen title="School & Education" icon="school" color={colors.looks} scroll={false}>
      <SchoolTab />
    </MenuScreen>
  );
}
