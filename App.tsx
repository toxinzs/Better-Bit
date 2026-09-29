import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import {
  useFonts,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from "@expo-google-fonts/nunito";
import { useGameStore } from "./src/state/gameStore";
import StartScreen from "./src/screens/StartScreen";
import HomeScreen from "./src/screens/HomeScreen";
import GameOverScreen from "./src/screens/GameOverScreen";
import { colors } from "./src/theme";
import { actionsFor, romanceCandidates, runPersonAction } from "./src/engine/lifeEngine";
import { killRelative } from "./src/engine/relatives";
import { nextDecisionEvent } from "./src/engine/decisionQueue";
import { tickExes, craziness } from "./src/engine/exes";
import { listingsFor, requirements, preparedness } from "./src/engine/jobs";
import { QUESTIONS } from "./src/data/interviews";
import { INSTITUTIONS } from "./src/data/institutions";
import { MAJORS } from "./src/data/majors";
import * as LOCATION from "./src/engine/location";
import { CITIES } from "./src/data/cities";
import { cityOf } from "./src/engine/where";
import { useNav } from "./src/nav/navStore";

if (typeof window !== "undefined") {
  (window as any).__store = useGameStore;
  (window as any).__nav = useNav;
  (window as any).__engine = { actionsFor, romanceCandidates, runPersonAction, killRelative, nextDecisionEvent, tickExes, craziness, listingsFor, requirements, preparedness, QUESTIONS, institutions: (r: string) => INSTITUTIONS.filter((i) => i.region === r), majors: MAJORS, location: LOCATION, cities: CITIES, cityOf };
}

export default function App() {
  const screen = useGameStore((s) => s.screen);
  const hydrated = useGameStore((s) => s.hydrated);
  const hydrate = useGameStore((s) => s.hydrate);
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!hydrated || !fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
        <StatusBar style={colors.mode === "light" ? "dark" : "light"} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {screen === "start" && <StartScreen />}
      {screen === "home" && <HomeScreen />}
      {screen === "gameover" && <GameOverScreen />}
      <StatusBar style={colors.mode === "light" ? "dark" : "light"} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
});
