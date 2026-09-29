import React from "react";
import { ScrollView } from "react-native";
import { useGameStore } from "../../state/gameStore";
import { useNav } from "../../nav/navStore";
import MenuScreen, { MenuRow } from "../../nav/MenuScreen";
import CareerTab from "../tabs/CareerTab";
import SchoolTab from "../tabs/SchoolTab";
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
  const job = character.inJail ? "Incarcerated" : character.job ? character.job.title : "Unemployed";
  const school = STAGE[character.educationStage] ?? character.educationStage;
  return (
    <ScrollView contentContainerStyle={tabStyles.scroll} showsVerticalScrollIndicator={false}>
      <MenuRow icon="briefcase" color={colors.smarts} title="Occupation & Jobs" summary={job} delay={0} onPress={() => push("occupation")} />
      <MenuRow
        icon="school" color={colors.looks} title="School & Education"
        summary={`${school}${character.gpa != null && character.age >= 5 ? ` · GPA ${character.gpa.toFixed(2)}` : ""}`}
        delay={40} onPress={() => push("school")}
      />
    </ScrollView>
  );
}

// The current career and school screens, wrapped as menus (both get rebuilt
// in the education and jobs releases).
export function OccupationMenu() {
  return (
    <MenuScreen title="Occupation & Jobs" icon="briefcase" color={colors.smarts} scroll={false}>
      <CareerTab />
    </MenuScreen>
  );
}

export function SchoolMenu() {
  return (
    <MenuScreen title="School & Education" icon="school" color={colors.looks} scroll={false}>
      <SchoolTab />
    </MenuScreen>
  );
}
