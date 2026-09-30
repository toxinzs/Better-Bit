import React from "react";
import { creatorLabel } from "../../engine/creatorCore";
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
    : [character.job?.title, character.partTime ? `${character.partTime.title} (part-time)` : undefined].filter(Boolean).join(" + ") || creatorLabel(character) || "Unemployed";
  const school = stageLabel(character.originRegion, character.educationStage);
  return (
    <ScrollView contentContainerStyle={tabStyles.scroll} showsVerticalScrollIndicator={false}>
      <MenuRow icon="briefcase" color={colors.smarts} title="Occupation" summary={job} delay={0} onPress={() => push("occupation")} />
      <MenuRow
        icon="trending-up" color={colors.primary} title="Career & Promotion"
        summary={character.retired ? "Retired" : character.job?.kind === "fulltime" ? `${Math.round(character.job.perf ?? 55)} performance · ${character.job.title}` : character.unemp ? "Between jobs" : "Ladder, reviews, networking"}
        delay={15} onPress={() => push("career")}
      />
      <MenuRow
        icon="storefront" color={colors.gold} title="Business"
        summary={character.business ? `${character.business.name} · ${character.business.lastProfit >= 0 ? "+" : "-"}$${Math.abs(character.business.lastProfit).toLocaleString()} last year` : "Start your own"}
        delay={22} onPress={() => push("business")}
      />
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
