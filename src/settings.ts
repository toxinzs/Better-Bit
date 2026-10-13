import { useSyncExternalStore } from "react";
import { Platform } from "react-native";

// Per-device preferences (not part of a life's save): sound, motion, text size.
// Web reads them synchronously at load so every StyleSheet picks up the text
// size on first paint, exactly like the theme choice does.

export type Settings = { sound: boolean; reduceMotion: boolean; textScale: number; shortcuts: boolean };

const KEY = "@better-bit/settings";
const DEFAULTS: Settings = { sound: true, reduceMotion: false, textScale: 1, shortcuts: true };

function read(): Settings {
  try {
    if (Platform.OS === "web" && typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const p = JSON.parse(raw) as Partial<Settings>;
        return {
          sound: p.sound ?? DEFAULTS.sound,
          reduceMotion: p.reduceMotion ?? DEFAULTS.reduceMotion,
          textScale: [0.9, 1, 1.15].includes(p.textScale as number) ? (p.textScale as number) : 1,
          shortcuts: p.shortcuts ?? DEFAULTS.shortcuts,
        };
      }
    }
  } catch {
    // storage blocked: defaults
  }
  return { ...DEFAULTS };
}

export let settings: Settings = read();
const listeners = new Set<() => void>();

function write(): void {
  try {
    if (Platform.OS === "web" && typeof localStorage !== "undefined") localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
  settings = { ...settings, [key]: value };
  write();
  listeners.forEach((l) => l());
  // text size is baked into the styles at load, so it needs a reload (the game saves on every action)
  if (key === "textScale" && Platform.OS === "web" && typeof window !== "undefined") window.location.reload();
}

export function useSettings(): Settings {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => settings,
    () => settings,
  );
}
