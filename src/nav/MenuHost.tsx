import React from "react";
import { Route } from "./navStore";
import { CrimeMenu, DatingMenu, EndRoadMenu, FertilityMenu, HealthMenu, LessonsMenu, VacationsMenu, VenuesMenu } from "../screens/menus/ActivityMenus";
import { CarMenu, HomeMenu, InvestMenu, LoansMenu, RetireMenu } from "../screens/menus/AssetMenus";
import { SchoolMenu } from "../screens/menus/WorkHub";
import { FindWorkMenu, OccupationMenu } from "../screens/menus/JobMenus";
import { ProfileMenu, StatDetailMenu } from "../screens/menus/ProfileMenus";
import PeopleTab from "../screens/tabs/PeopleTab";
import { StatKey } from "../types";

// Maps a route id on the nav stack to the menu screen it opens.
export default function MenuHost({ route }: { route: Route }) {
  switch (route.id) {
    case "venues": return <VenuesMenu />;
    case "lessons": return <LessonsMenu />;
    case "health": return <HealthMenu />;
    case "dating": return <DatingMenu />;
    case "fertility": return <FertilityMenu />;
    case "vacations": return <VacationsMenu />;
    case "endroad": return <EndRoadMenu />;
    case "crime": return <CrimeMenu />;
    case "car": return <CarMenu />;
    case "home": return <HomeMenu />;
    case "loans": return <LoansMenu />;
    case "invest": return <InvestMenu />;
    case "retire": return <RetireMenu />;
    case "occupation": return <OccupationMenu />;
    case "findwork": return <FindWorkMenu />;
    case "school": return <SchoolMenu />;
    case "peopleGroup": return <PeopleTab group={String(route.params?.group ?? "family")} />;
    case "profile": return <ProfileMenu />;
    case "statDetail": return <StatDetailMenu stat={(route.params?.stat as StatKey) ?? "health"} />;
    default: return null;
  }
}
