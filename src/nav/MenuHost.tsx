import React from "react";
import { Route } from "./navStore";
import { CrimeMenu, DatingMenu, EndRoadMenu, FertilityMenu, HealthMenu, LessonsMenu, VacationsMenu, VenuesMenu } from "../screens/menus/ActivityMenus";
import { CarMenu, HomeMenu, InvestMenu, LoansMenu, RetireMenu } from "../screens/menus/AssetMenus";
import { CampusMenu, CollegeHub, CollegeMoneyMenu, DegreeMenu, ApplyMenu, ExamMenu, GradMenu, TradesMenu, TranscriptMenu } from "../screens/menus/CollegeMenus";
import { ClubsMenu, MySchoolMenu, ReportCardMenu, SchoolMenu, SchoolSocialMenu, StudyMenu, TeachersMenu } from "../screens/menus/SchoolMenus";
import { FindWorkMenu, OccupationMenu } from "../screens/menus/JobMenus";
import { ProfileMenu, StatDetailMenu } from "../screens/menus/ProfileMenus";
import { BudgetMenu, MoveCityMenu, MoveMenu, PlaceHub, RentMenu } from "../screens/menus/PlaceMenus";
import { AbroadHub, AbroadListMenu, CitizenMenu, CountryMenu, GoHomeMenu, PassportMenu, TravelMenu } from "../screens/menus/AbroadMenus";
import PeopleTab from "../screens/tabs/PeopleTab";
import { RegionKey, StatKey } from "../types";

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
    case "reportcard": return <ReportCardMenu />;
    case "study": return <StudyMenu />;
    case "myschool": return <MySchoolMenu />;
    case "schoolsocial": return <SchoolSocialMenu />;
    case "clubs": return <ClubsMenu />;
    case "teachers": return <TeachersMenu />;
    case "college": return <CollegeHub />;
    case "exam": return <ExamMenu />;
    case "apply": return <ApplyMenu />;
    case "trades": return <TradesMenu />;
    case "grad": return <GradMenu />;
    case "campus": return <CampusMenu />;
    case "collegemoney": return <CollegeMoneyMenu />;
    case "degree": return <DegreeMenu />;
    case "transcript": return <TranscriptMenu />;
    case "abroad": return <AbroadHub />;
    case "abroadlist": return <AbroadListMenu />;
    case "abroadcountry": return <CountryMenu dest={route.params?.to as RegionKey} />;
    case "passport": return <PassportMenu />;
    case "travel": return <TravelMenu />;
    case "citizen": return <CitizenMenu />;
    case "gohome": return <GoHomeMenu dest={route.params?.to as RegionKey} />;
    case "place": return <PlaceHub />;
    case "move": return <MoveMenu />;
    case "movecity": return <MoveCityMenu cityKey={String(route.params?.city ?? "")} />;
    case "rent": return <RentMenu />;
    case "budget": return <BudgetMenu />;
    case "peopleGroup": return <PeopleTab group={String(route.params?.group ?? "family")} />;
    case "profile": return <ProfileMenu />;
    case "statDetail": return <StatDetailMenu stat={(route.params?.stat as StatKey) ?? "health"} />;
    default: return null;
  }
}
