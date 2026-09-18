import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useGameStore } from "./src/state/gameStore";
import StartScreen from "./src/screens/StartScreen";
import HomeScreen from "./src/screens/HomeScreen";
import GameOverScreen from "./src/screens/GameOverScreen";

export default function App() {
  const screen = useGameStore((s) => s.screen);
  const hydrated = useGameStore((s) => s.hydrated);
  const hydrate = useGameStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!hydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#2ecc71" size="large" />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {screen === "start" && <StartScreen />}
      {screen === "home" && <HomeScreen />}
      {screen === "gameover" && <GameOverScreen />}
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#12121c",
  },
  loading: {
    flex: 1,
    backgroundColor: "#12121c",
    alignItems: "center",
    justifyContent: "center",
  },
});
