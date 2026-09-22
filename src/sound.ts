import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from "expo-audio";

const SOUND_SOURCES = {
  ageUp: require("../assets/sounds/age-up.wav"),
  choice: require("../assets/sounds/choice.wav"),
  sent: require("../assets/sounds/sent.wav"),
  gameOver: require("../assets/sounds/game-over.wav"),
} as const;

export type SoundKey = keyof typeof SOUND_SOURCES;

setAudioModeAsync({ playsInSilentMode: true }).catch(() => {
  // best-effort; sound is non-essential
});

let players: Partial<Record<SoundKey, AudioPlayer>> = {};

function getPlayer(key: SoundKey): AudioPlayer | null {
  if (!players[key]) {
    try {
      players[key] = createAudioPlayer(SOUND_SOURCES[key]);
    } catch {
      return null;
    }
  }
  return players[key] ?? null;
}

export function playSound(key: SoundKey) {
  const player = getPlayer(key);
  if (!player) return;
  player
    .seekTo(0)
    .catch(() => {})
    .finally(() => {
      try {
        player.play();
      } catch {
        // best-effort; never let sound failures affect gameplay
      }
    });
}
