import { Platform } from "react-native";

// ---------- palettes ----------
// Every color in the app comes from `colors`, which is filled from one of
// these palettes when the module first loads. Styles are built once at
// startup (StyleSheet.create), so switching theme saves the choice and
// reloads - see applyTheme(). All values are 6-digit hex so components can
// append an alpha suffix (e.g. `${colors.primary}22`).

export type ThemeId = "midnight" | "ocean" | "sunset" | "forest" | "light";

export type Palette = {
  mode: "dark" | "light";
  background: string;
  surface: string;
  surfaceRaised: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryDark: string;
  primaryDeep: string;
  primaryText: string;
  danger: string;
  dangerDark: string;
  gold: string;
  health: string;
  happiness: string;
  smarts: string;
  looks: string;
  love: string;
  teal: string;
  bubbleMe: string;
  bubbleThem: string;
  // gradient starting colors (they fade to `surface`)
  gradHeader: string;
  gradLife: string;
  gradCareer: string;
  gradMoney: string;
  gradStart: string;
  // translucent helpers that must flip between dark and light themes
  shade: string;
  overlay: string;
};

export const THEMES: Record<ThemeId, { label: string; blurb: string; palette: Palette }> = {
  midnight: {
    label: "Midnight",
    blurb: "Deep indigo with mint accents",
    palette: {
      mode: "dark",
      background: "#0a0c16",
      surface: "#14172a",
      surfaceRaised: "#1d2138",
      border: "#2c3152",
      textPrimary: "#f4f6ff",
      textSecondary: "#a5abc9",
      textMuted: "#6e7597",
      primary: "#3ddc97",
      primaryDark: "#0f3d2d",
      primaryDeep: "#1fa86f",
      primaryText: "#04160e",
      danger: "#fb7185",
      dangerDark: "#3a1622",
      gold: "#fbbf24",
      health: "#fb7185",
      happiness: "#facc15",
      smarts: "#60a5fa",
      looks: "#c084fc",
      love: "#ff7eb6",
      teal: "#2dd4bf",
      bubbleMe: "#3ddc97",
      bubbleThem: "#252a4d",
      gradHeader: "#1f2552",
      gradLife: "#213566",
      gradCareer: "#1d4278",
      gradMoney: "#0f5a3f",
      gradStart: "#1b2050",
      shade: "rgba(0,0,0,0.24)",
      overlay: "rgba(3,4,10,0.72)",
    },
  },
  ocean: {
    label: "Ocean",
    blurb: "Deep teal with electric cyan",
    palette: {
      mode: "dark",
      background: "#05121a",
      surface: "#0b1f2a",
      surfaceRaised: "#112d3b",
      border: "#1c4557",
      textPrimary: "#ecfbff",
      textSecondary: "#9cc3d1",
      textMuted: "#64909f",
      primary: "#22d3ee",
      primaryDark: "#08394a",
      primaryDeep: "#0e9db8",
      primaryText: "#021a20",
      danger: "#ff7a8a",
      dangerDark: "#3a1a22",
      gold: "#fcd34d",
      health: "#ff7a8a",
      happiness: "#fde047",
      smarts: "#7dd3fc",
      looks: "#f0abfc",
      love: "#ff8fb8",
      teal: "#2dd4bf",
      bubbleMe: "#22d3ee",
      bubbleThem: "#163748",
      gradHeader: "#0f4257",
      gradLife: "#0f5470",
      gradCareer: "#135f86",
      gradMoney: "#0d6156",
      gradStart: "#0c3d52",
      shade: "rgba(0,0,0,0.26)",
      overlay: "rgba(2,10,15,0.74)",
    },
  },
  sunset: {
    label: "Sunset",
    blurb: "Warm plum with a coral glow",
    palette: {
      mode: "dark",
      background: "#150b14",
      surface: "#231421",
      surfaceRaised: "#31192d",
      border: "#4a2a41",
      textPrimary: "#fff4ee",
      textSecondary: "#d3abb7",
      textMuted: "#95707f",
      primary: "#ff8a4c",
      primaryDark: "#4b2611",
      primaryDeep: "#e0642a",
      primaryText: "#240d02",
      danger: "#ff5d73",
      dangerDark: "#3d1420",
      gold: "#ffc857",
      health: "#ff5d73",
      happiness: "#ffd166",
      smarts: "#7aa2ff",
      looks: "#d78bff",
      love: "#ff7eb6",
      teal: "#45d9c1",
      bubbleMe: "#ff8a4c",
      bubbleThem: "#3a2036",
      gradHeader: "#4d2044",
      gradLife: "#5e2748",
      gradCareer: "#3e2c6a",
      gradMoney: "#6b3b14",
      gradStart: "#4a1f45",
      shade: "rgba(0,0,0,0.26)",
      overlay: "rgba(12,4,10,0.74)",
    },
  },
  forest: {
    label: "Forest",
    blurb: "Mossy dark with lime pop",
    palette: {
      mode: "dark",
      background: "#07130d",
      surface: "#0f2018",
      surfaceRaised: "#163021",
      border: "#25493a",
      textPrimary: "#eefcf3",
      textSecondary: "#a6c9b3",
      textMuted: "#6f957f",
      primary: "#a3e635",
      primaryDark: "#2f420b",
      primaryDeep: "#7ab81f",
      primaryText: "#101c02",
      danger: "#fb7185",
      dangerDark: "#3a1a20",
      gold: "#fbbf24",
      health: "#fb7185",
      happiness: "#fde047",
      smarts: "#67e8f9",
      looks: "#f0abfc",
      love: "#ff8fb8",
      teal: "#34d399",
      bubbleMe: "#a3e635",
      bubbleThem: "#1c3a2a",
      gradHeader: "#144030",
      gradLife: "#1a5038",
      gradCareer: "#17495c",
      gradMoney: "#33601a",
      gradStart: "#134030",
      shade: "rgba(0,0,0,0.26)",
      overlay: "rgba(2,10,6,0.74)",
    },
  },
  light: {
    label: "Daylight",
    blurb: "Clean, bright and friendly",
    palette: {
      mode: "light",
      background: "#f2f5fb",
      surface: "#ffffff",
      surfaceRaised: "#edf1fa",
      border: "#dbe1f0",
      textPrimary: "#161a2e",
      textSecondary: "#4a5273",
      textMuted: "#7c86a6",
      primary: "#16a86b",
      primaryDark: "#d3f4e4",
      primaryDeep: "#0e8a56",
      primaryText: "#ffffff",
      danger: "#e5484d",
      dangerDark: "#fde6e7",
      gold: "#d18800",
      health: "#e5484d",
      happiness: "#d9a000",
      smarts: "#2f7de1",
      looks: "#9b51e0",
      love: "#e8508f",
      teal: "#0f9d8f",
      bubbleMe: "#16a86b",
      bubbleThem: "#e4e9f6",
      gradHeader: "#dbe4ff",
      gradLife: "#dfe8ff",
      gradCareer: "#d6e8ff",
      gradMoney: "#d3f2e3",
      gradStart: "#d8e2ff",
      shade: "rgba(20,30,70,0.07)",
      overlay: "rgba(20,26,50,0.45)",
    },
  },
};

export const THEME_IDS = Object.keys(THEMES) as ThemeId[];
const THEME_KEY = "@better-bit/theme";

// Web can read the saved choice synchronously, which is what lets every
// StyleSheet pick up the right colors at first paint. (Native would need an
// async read before the first render - not wired up yet.)
function readSavedTheme(): ThemeId {
  try {
    if (Platform.OS === "web" && typeof localStorage !== "undefined") {
      const saved = localStorage.getItem(THEME_KEY) as ThemeId | null;
      if (saved && saved in THEMES) return saved;
    }
  } catch {
    // storage blocked (private window, sandboxed frame) - fall back to default
  }
  return "midnight";
}

export const currentThemeId: ThemeId = readSavedTheme();

export const colors: Palette = { ...THEMES[currentThemeId].palette };

// Save the new theme and reload so every style is rebuilt with it. Game
// progress is saved on every action, so nothing is lost by the reload.
export function applyTheme(id: ThemeId): void {
  try {
    if (Platform.OS === "web" && typeof localStorage !== "undefined") {
      localStorage.setItem(THEME_KEY, id);
    }
  } catch {
    // ignore - the reload below just keeps the current theme
  }
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.location.reload();
  }
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
};

export const fonts = {
  regular: "Nunito_400Regular",
  semiBold: "Nunito_600SemiBold",
  bold: "Nunito_700Bold",
  extraBold: "Nunito_800ExtraBold",
};

export const fontSize = {
  xs: 11,
  sm: 12,
  md: 13,
  base: 14,
  lg: 16,
  xl: 20,
  xxl: 26,
  display: 32,
};

export const shadow = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: colors.mode === "light" ? 0.1 : 0.25,
  shadowRadius: 10,
  elevation: 4,
};
