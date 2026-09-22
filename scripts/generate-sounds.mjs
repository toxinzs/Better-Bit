// Generates the game's UI sound effects as plain synthesized WAV tones.
// No external audio assets or network fetches - self-generated, so there's
// zero licensing/reachability risk. Re-run with `node scripts/generate-sounds.mjs`
// after editing NOTES below to regenerate assets/sounds/*.wav.
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "assets", "sounds");
const SAMPLE_RATE = 44100;

// A single tone: sine wave with a linear attack/release envelope (click-free),
// layered into the mix at [startTime, startTime + duration].
function note({ freq, startTime, duration, amplitude = 0.5, attack = 0.015, release = 0.08, sweepTo = null }) {
  return { freq, startTime, duration, amplitude, attack, release, sweepTo };
}

function render(notes, totalDuration) {
  const totalSamples = Math.ceil(totalDuration * SAMPLE_RATE);
  const buffer = new Float32Array(totalSamples);

  for (const n of notes) {
    const startSample = Math.floor(n.startTime * SAMPLE_RATE);
    const noteSamples = Math.floor(n.duration * SAMPLE_RATE);
    const attackSamples = Math.floor(n.attack * SAMPLE_RATE);
    const releaseSamples = Math.floor(n.release * SAMPLE_RATE);

    for (let i = 0; i < noteSamples; i++) {
      const sampleIndex = startSample + i;
      if (sampleIndex >= totalSamples) break;

      // envelope: linear ramp up, sustain, linear ramp down
      let env = 1;
      if (i < attackSamples) env = i / attackSamples;
      else if (i > noteSamples - releaseSamples) env = Math.max(0, (noteSamples - i) / releaseSamples);

      // optional frequency sweep (for "whoosh"/chirp sounds)
      const progress = i / noteSamples;
      const freq = n.sweepTo != null ? n.freq + (n.sweepTo - n.freq) * progress : n.freq;

      const t = i / SAMPLE_RATE;
      const sample = Math.sin(2 * Math.PI * freq * t) * env * n.amplitude;
      buffer[sampleIndex] += sample;
    }
  }

  // soft clip to avoid harsh distortion if notes overlap
  for (let i = 0; i < buffer.length; i++) {
    buffer[i] = Math.max(-1, Math.min(1, buffer[i]));
  }
  return buffer;
}

function writeWav(filename, floatBuffer) {
  const numSamples = floatBuffer.length;
  const blockAlign = 2; // 16-bit mono
  const byteRate = SAMPLE_RATE * blockAlign;
  const dataSize = numSamples * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); // fmt chunk size
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // bits per sample
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const clamped = Math.max(-1, Math.min(1, floatBuffer[i]));
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  }

  writeFileSync(join(OUT_DIR, filename), buffer);
  console.log(`wrote ${filename} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

// --- Sound definitions ---

// Age Up: gentle ascending two-note "page turn" chime
writeWav(
  "age-up.wav",
  render(
    [
      note({ freq: 523.25, startTime: 0, duration: 0.14, amplitude: 0.35 }), // C5
      note({ freq: 659.25, startTime: 0.09, duration: 0.18, amplitude: 0.4 }), // E5
    ],
    0.3,
  ),
);

// Event choice selected: short, soft confirm tap
writeWav(
  "choice.wav",
  render([note({ freq: 740, startTime: 0, duration: 0.09, amplitude: 0.3, attack: 0.005, release: 0.05 })], 0.12),
);

// Message/action sent (text, call, gift, booty call): quick upward whoosh
writeWav(
  "sent.wav",
  render(
    [note({ freq: 420, sweepTo: 880, startTime: 0, duration: 0.16, amplitude: 0.3, attack: 0.01, release: 0.06 })],
    0.18,
  ),
);

// Game over: slow, somber two-note descending phrase
writeWav(
  "game-over.wav",
  render(
    [
      note({ freq: 440, startTime: 0, duration: 0.5, amplitude: 0.3, attack: 0.04, release: 0.25 }), // A4
      note({ freq: 349.23, startTime: 0.35, duration: 0.65, amplitude: 0.3, attack: 0.04, release: 0.4 }), // F4
    ],
    1.0,
  ),
);

console.log("done");
