import React from "react";
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from "react-native-svg";
import { Character, Gender, RegionKey, RelationType } from "../types";
import { EYE_COLORS, appearanceFromSeed } from "../data/appearance";

// A simple, original geometric portrait - circle head, neck, shoulders in a
// shirt color, a preset hair silhouette, brows, eyes and a small smile.
// Deliberately not attempting photorealism, so it's buildable without any
// external art assets. Skin tone is picked from the character's region's
// palette as flavor only (src/data/regions.ts), not a hard demographic
// assignment - every region spans a real range of tones. Driven entirely by
// `avatarSeed`, frozen at character creation, so the look is stable across
// reloads instead of re-randomizing on every render.

// The face reacts to how the character is doing.
export type Mood = "happy" | "neutral" | "sad";
export function moodFor(happiness: number): Mood {
  return happiness >= 60 ? "happy" : happiness >= 32 ? "neutral" : "sad";
}

const MOUTH: Record<Mood, string> = {
  happy: "M27.5 32 Q32 36.5 36.5 32",
  neutral: "M28.5 33.5 L35.5 33.5",
  sad: "M27.5 35.5 Q32 31.5 36.5 35.5",
};

const BROWS: Record<Mood, { left: string; right: string }> = {
  happy: { left: "M23.5 22.3 L29.5 22.3", right: "M34.5 22.3 L40.5 22.3" },
  neutral: { left: "M23.5 22.5 L29.5 22.5", right: "M34.5 22.5 L40.5 22.5" },
  sad: { left: "M23.5 23.6 L29.5 21", right: "M34.5 21 L40.5 23.6" },
};

const SHIRT_COLORS = ["#4d9fef", "#2ecc71", "#f5b942", "#b370e0", "#ef5b5b", "#3fb8af", "#e67e22", "#7f8c8d"];

type AvatarChar = Pick<Character, "gender" | "originRegion" | "avatarSeed"> &
  Partial<Pick<Character, "appearance" | "age" | "stats" | "job" | "inJail" | "educationStage" | "inCollege" | "higher" | "retired" | "social">>;

// What you're wearing says what you're doing: scrubs, a hi-vis vest, a suit, a school bag,
// headphones if you make things online, an orange jumpsuit if you're locked up.
type Outfit = { kind: string; shirt: string };

function outfitFor(c: AvatarChar, base: string): Outfit {
  const age = c.age ?? 25;
  if (c.inJail) return { kind: "jumpsuit", shirt: "#f0861a" };
  if (age <= 2) return { kind: "onesie", shirt: ["#ffd6e0", "#cfe8ff", "#e4f5d0", "#fff1c1"][Math.abs(base.charCodeAt(1)) % 4] };
  const field = c.job?.field;
  if (c.job && age >= 16) {
    switch (field) {
      case "Healthcare": return { kind: "scrubs", shirt: "#2fb8ac" };
      case "Food & Hospitality": return { kind: "apron", shirt: base };
      case "Outdoors & Trades":
      case "Logistics": return { kind: "hivis", shirt: "#556270" };
      case "Public Service": return { kind: "uniform", shirt: "#2c3e75" };
      case "Tech": return { kind: "lanyard", shirt: "#6b7a99" };
      case "Creative & Media": return { kind: "headphones", shirt: base };
      case "Education & Care": return { kind: "cardigan", shirt: "#b98a5e" };
      case "Retail & Service": return { kind: "nametag", shirt: "#3d7fd1" };
      default: return { kind: "suit", shirt: "#2f3a4d" };
    }
  }
  if (age >= 5 && age <= 17 && ["elementary", "middle", "high"].includes(c.educationStage ?? "")) return { kind: "school", shirt: base };
  if (c.inCollege || c.higher) return { kind: "hoodie", shirt: "#7a6bb0" };
  if (age >= 16 && (c.social?.fame ?? 0) >= 20) return { kind: "headphones", shirt: base };
  if (age >= 65) return { kind: "cardigan", shirt: "#a8896a" };
  return { kind: "plain", shirt: base };
}

// worn over the shirt, behind the neck
function outfitUnder(kind: string, w: number): React.ReactNode {
  const x0 = 32 - w / 2;
  switch (kind) {
    case "suit": return (
      <>
        <Rect x={x0} y={46} width={w} height={22} rx={13} fill="#2f3a4d" />
        <Path d="M26.5 46.5 L32 57 L37.5 46.5 Z" fill="#f4f4f4" />
        <Path d="M31 50 L33 50 L34 59 L32 61 L30 59 Z" fill="#c0392b" opacity={0.9} />
        <Path d="M26.5 46.5 L30 60 L22 56 Z M37.5 46.5 L34 60 L42 56 Z" fill="#232c3b" opacity={0.7} />
      </>
    );
    case "scrubs": return <Path d="M27.5 46.2 L32 54.5 L36.5 46.2 Z" fill="#1c8a80" />;
    case "apron": return (
      <>
        <Path d="M26.5 52 L37.5 52 L40 68 L24 68 Z" fill="#f7f7f2" />
        <Path d="M27.5 46.8 L26.5 52 M36.5 46.8 L37.5 52" stroke="#f7f7f2" strokeWidth={1.4} />
        <Rect x={29} y={57} width={6} height={4} rx={1} fill="#e5e5dc" />
      </>
    );
    case "hivis": return (
      <>
        <Rect x={x0 + 3} y={47} width={w - 6} height={21} rx={8} fill="#d4e600" />
        <Rect x={x0 + 3} y={54} width={w - 6} height={2} fill="#eceff1" />
        <Rect x={x0 + 3} y={60} width={w - 6} height={2} fill="#eceff1" />
        <Path d="M29 46.6 L32 52 L35 46.6" fill="#556270" />
      </>
    );
    case "uniform": return (
      <>
        <Path d="M25.5 46.5 L31 53 L28 47.6 Z M38.5 46.5 L33 53 L36 47.6 Z" fill="#f4f4f4" />
        <Circle cx={38.2} cy={55.5} r={2.3} fill="#e8b923" />
        <Rect x={x0 + 1.5} y={50.5} width={5} height={3} rx={1} fill="#e8b923" opacity={0.85} />
      </>
    );
    case "cardigan": return (
      <>
        <Rect x={x0} y={46} width={w} height={22} rx={13} fill="#8a6a4a" opacity={0.55} />
        <Line x1={32} y1={50} x2={32} y2={68} stroke="#5a4330" strokeWidth={1} opacity={0.6} />
        <Circle cx={32} cy={55} r={1} fill="#3d2d20" />
        <Circle cx={32} cy={61} r={1} fill="#3d2d20" />
      </>
    );
    case "nametag": return (
      <>
        <Path d="M27 46.6 L32 51 L37 46.6" stroke="#f4f4f4" strokeWidth={1.4} fill="none" />
        <Rect x={35.2} y={52} width={5.2} height={2.8} rx={0.6} fill="#ffffff" />
      </>
    );
    case "hoodie": return (
      <>
        <Path d="M23.5 47.5 Q32 58 40.5 47.5" stroke="#5a4c8c" strokeWidth={3} fill="none" strokeLinecap="round" />
        <Line x1={29.5} y1={53} x2={29} y2={61} stroke="#e8e8f2" strokeWidth={0.9} />
        <Line x1={34.5} y1={53} x2={35} y2={61} stroke="#e8e8f2" strokeWidth={0.9} />
      </>
    );
    case "school": return (
      <>
        <Path d="M26.5 47 L25 67 M37.5 47 L39 67" stroke="#2d3340" strokeWidth={2.6} strokeLinecap="round" />
      </>
    );
    case "onesie": return (
      <>
        <Circle cx={32} cy={53} r={0.9} fill="#ffffff" opacity={0.85} />
        <Circle cx={32} cy={57} r={0.9} fill="#ffffff" opacity={0.85} />
        <Circle cx={32} cy={61} r={0.9} fill="#ffffff" opacity={0.85} />
      </>
    );
    case "jumpsuit": return (
      <>
        <Path d="M27 46.4 L32 55 L37 46.4 Z" fill="#c76a10" />
        <Rect x={36} y={55} width={6} height={4} rx={0.8} fill="#ffffff" opacity={0.9} />
        <Line x1={x0 + 2} y1={64} x2={x0 + w - 2} y2={64} stroke="#c76a10" strokeWidth={1.2} />
      </>
    );
    default: return null;
  }
}

// worn on top of the neck
function outfitOver(kind: string): React.ReactNode {
  switch (kind) {
    case "scrubs": return (
      <>
        <Path d="M27.5 48 Q26 58.5 32 59.5 Q38 58.5 36.5 48" stroke="#2b2f36" strokeWidth={1.3} fill="none" />
        <Circle cx={32} cy={60.4} r={1.7} fill="#c9d1d9" stroke="#2b2f36" strokeWidth={0.6} />
      </>
    );
    case "lanyard": return (
      <>
        <Path d="M28.4 46.8 L31.3 58 M35.6 46.8 L32.7 58" stroke="#e74c3c" strokeWidth={1.2} />
        <Rect x={30.4} y={58} width={3.2} height={4.4} rx={0.6} fill="#ffffff" />
      </>
    );
    case "headphones": return (
      <>
        <Path d="M23.6 44 Q32 58 40.4 44" stroke="#22262e" strokeWidth={2.2} fill="none" strokeLinecap="round" />
        <Ellipse cx={23.4} cy={44.4} rx={2.8} ry={3.6} fill="#2e333d" />
        <Ellipse cx={40.6} cy={44.4} rx={2.8} ry={3.6} fill="#2e333d" />
      </>
    );
    default: return null;
  }
}

function mix(a: string, b: string, t: number): string {
  const p = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  const k = Math.max(0, Math.min(1, t));
  const ch = (i: number) => Math.round(p(a, i) + (p(b, i) - p(a, i)) * k).toString(16).padStart(2, "0");
  return `#${ch(0)}${ch(1)}${ch(2)}`;
}

// how much smaller the figure is at each age (kids are shorter and rounder-headed)
function scaleFor(age: number): number {
  if (age <= 2) return 0.62;
  if (age <= 5) return 0.72;
  if (age <= 8) return 0.8;
  if (age <= 12) return 0.88;
  if (age <= 16) return 0.95;
  return 1;
}

const CAP = "M17.5 25 Q16 10 32 10.5 Q48 10 46.5 25 Q43 17.5 32 17.5 Q21 17.5 17.5 25 Z";

// Hair is drawn in two layers: `back` sits behind the head and shoulders,
// `front` on top of the head.
function hairBack(style: string, color: string): React.ReactNode {
  switch (style) {
    case "long": return <Rect x={15} y={14} width={34} height={36} rx={14} fill={color} />;
    case "bob": return <Rect x={16} y={13} width={32} height={27} rx={11} fill={color} />;
    case "afro": return <Circle cx={32} cy={21} r={19.5} fill={color} />;
    case "ponytail": return <Ellipse cx={49.5} cy={31} rx={4} ry={9} fill={color} />;
    default: return null;
  }
}

function hairFront(style: string, color: string, dark: string): React.ReactNode {
  switch (style) {
    case "bald": return null;
    case "balding":
      return (
        <>
          <Ellipse cx={20.5} cy={24} rx={3.4} ry={6.5} fill={color} />
          <Ellipse cx={43.5} cy={24} rx={3.4} ry={6.5} fill={color} />
        </>
      );
    case "buzz": return <Path d="M18.5 23 Q18 12 32 11.5 Q46 12 45.5 23 Q42 17 32 17 Q22 17 18.5 23Z" fill={color} opacity={0.75} />;
    case "sidepart": return <Path d="M17.5 25 Q16 10 32 10.5 Q48 10 46.5 25 Q45 19 37 16.5 Q27 20.5 17.5 25 Z" fill={color} />;
    case "curly":
      return (
        <>
          {[[22, 17.5, 6.2], [28.5, 13, 6.4], [36, 13, 6.4], [42, 17.5, 6.2], [19.5, 24, 5], [44.5, 24, 5], [32, 15, 6]].map(([x, y, r], i) => (
            <Circle key={i} cx={x} cy={y} r={r} fill={color} />
          ))}
        </>
      );
    case "afro": return <Path d="M18.5 24 Q19 16.5 32 16.5 Q45 16.5 45.5 24 Q41 19.5 32 19.5 Q23 19.5 18.5 24Z" fill={color} />;
    case "bob": return <Path d="M17 26 Q16 10 32 10.5 Q48 10 47 26 Q44 20.5 32 19.5 Q20 20.5 17 26Z" fill={color} />;
    case "bun":
      return (
        <>
          <Path d={CAP} fill={color} />
          <Circle cx={32} cy={8.5} r={5.4} fill={color} />
        </>
      );
    case "braids":
      return (
        <>
          <Path d={CAP} fill={color} />
          <Line x1={19.4} y1={26} x2={19} y2={48} stroke={color} strokeWidth={3.6} strokeDasharray="3.2 1.4" strokeLinecap="round" />
          <Line x1={44.6} y1={26} x2={45} y2={48} stroke={color} strokeWidth={3.6} strokeDasharray="3.2 1.4" strokeLinecap="round" />
        </>
      );
    case "mohawk":
      return (
        <>
          <Path d="M18.5 23 Q18 14 32 13.5 Q46 14 45.5 23 Q42 18 32 18 Q22 18 18.5 23Z" fill={dark} opacity={0.5} />
          <Path d="M27.8 17 Q27 3.5 32 3 Q37 3.5 36.2 17 Z" fill={color} />
        </>
      );
    default: return <Path d={CAP} fill={color} />;
  }
}

export default function Avatar({
  character,
  size = 64,
  ring,
  mood = "happy",
}: {
  character: AvatarChar;
  size?: number;
  ring?: string;
  mood?: Mood;
}) {
  const seed = character.avatarSeed ?? 0;
  const ap = character.appearance ?? appearanceFromSeed(seed, character.gender, character.originRegion);
  const age = character.age ?? 25;
  const child = age < 13;
  const k = scaleFor(age);
  const skin = ap.skin;
  const dark = "#241a14";
  const eye = EYE_COLORS[ap.eyes]?.hex ?? "#5a3a22";
  const baseShirt = SHIRT_COLORS[Math.floor(seed / 5) % SHIRT_COLORS.length];
  const outfit = outfitFor(character, baseShirt);
  const shirt = outfit.shirt;
  const shoulderW = { slim: 40, average: 44, stocky: 50, athletic: 48 }[ap.build] ?? 44;
  // greys with age
  const hairColor = mix(ap.hairColor, "#c8c8c8", (age - 42) / 32);
  const style = ap.balding > 0 && age >= ap.balding ? "balding" : ap.hairStyle;
  const headR = child ? 15 : 14;
  const eyeY = child ? 27.5 : 26.5;
  const eyeR = child ? 2.3 : 1.8;
  const health = character.stats?.health ?? 80;
  const wrinkle = Math.max(0, Math.min(0.55, (age - 48) / 45));
  const fame = character.social?.fame ?? 0;
  const showFace = age >= 16 ? ap.facialHair : "none";
  const stubbleColor = age > 50 ? mix(ap.hairColor, "#c8c8c8", (age - 42) / 32) : ap.hairColor;

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {ring && <Circle cx={32} cy={32} r={31} fill="none" stroke={ring} strokeWidth={2} />}
      <G transform={`translate(${32 - 32 * k} ${64 - 64 * k}) scale(${k})`}>
        {/* back hair sits behind the shoulders */}
        {hairBack(style, hairColor)}
        {/* shoulders / shirt */}
        <Rect x={32 - shoulderW / 2} y={46} width={shoulderW} height={22} rx={13} fill={shirt} />
        {outfitUnder(outfit.kind, shoulderW)}
        {/* neck */}
        <Rect x={27} y={38} width={10} height={11} rx={4} fill={skin} />
        {outfitOver(outfit.kind)}
        {/* ears */}
        <Circle cx={18.2} cy={27} r={2.6} fill={skin} />
        <Circle cx={45.8} cy={27} r={2.6} fill={skin} />
        {/* head */}
        <Circle cx={32} cy={26} r={headR} fill={skin} />
        {/* nose */}
        <Path d="M32 28.5 Q30.8 31 32.4 31.2" stroke={dark} strokeWidth={0.9} fill="none" opacity={0.28} strokeLinecap="round" />
        {ap.freckles && [[26, 30], [28.6, 31.2], [24.6, 31.4], [37.4, 30], [35.4, 31.2], [39.4, 31.4]].map(([x, y], i) => (
          <Circle key={i} cx={x} cy={y} r={0.6} fill="#a86432" opacity={0.6} />
        ))}
        {/* health tint */}
        {health < 35 && <Circle cx={32} cy={26} r={headR} fill="#8fa89c" opacity={(35 - health) / 110} />}
        {/* hair */}
        {hairFront(style, hairColor, dark)}
        {/* facial hair */}
        {showFace === "stubble" && <Path d="M21 29 Q22 40.5 32 40.5 Q42 40.5 43 29 Q40 35 32 35 Q24 35 21 29Z" fill={stubbleColor} opacity={0.32} />}
        {showFace === "mustache" && <Path d="M26.5 32.4 Q32 30 37.5 32.4 Q32 34 26.5 32.4Z" fill={stubbleColor} />}
        {showFace === "goatee" && (
          <>
            <Path d="M26.5 32.4 Q32 30 37.5 32.4 Q32 34 26.5 32.4Z" fill={stubbleColor} />
            <Ellipse cx={32} cy={38.2} rx={3.2} ry={2.8} fill={stubbleColor} />
          </>
        )}
        {showFace === "beard" && <Path d="M19.3 29 Q19.5 42.5 32 42.8 Q44.5 42.5 44.7 29 Q41.5 36.8 32 36.4 Q22.5 36.8 19.3 29Z" fill={stubbleColor} />}
        {/* brows, eyes, mouth */}
        <Path d={BROWS[mood].left} stroke={dark} strokeWidth={1.6} strokeLinecap="round" opacity={0.7} />
        <Path d={BROWS[mood].right} stroke={dark} strokeWidth={1.6} strokeLinecap="round" opacity={0.7} />
        <Ellipse cx={27} cy={eyeY} rx={eyeR + 0.8} ry={eyeR + 0.5} fill="#ffffff" opacity={0.95} />
        <Ellipse cx={37} cy={eyeY} rx={eyeR + 0.8} ry={eyeR + 0.5} fill="#ffffff" opacity={0.95} />
        <Circle cx={27} cy={eyeY} r={eyeR} fill={eye} />
        <Circle cx={37} cy={eyeY} r={eyeR} fill={eye} />
        <Circle cx={27} cy={eyeY} r={eyeR * 0.5} fill={dark} />
        <Circle cx={37} cy={eyeY} r={eyeR * 0.5} fill={dark} />
        <Circle cx={27.7} cy={eyeY - 0.7} r={0.5} fill="#ffffff" />
        <Circle cx={37.7} cy={eyeY - 0.7} r={0.5} fill="#ffffff" />
        {health < 40 && (
          <>
            <Path d="M24.5 29.6 Q27 31.2 29.5 29.6" stroke="#6b5a8a" strokeWidth={1} fill="none" opacity={0.35} />
            <Path d="M34.5 29.6 Q37 31.2 39.5 29.6" stroke="#6b5a8a" strokeWidth={1} fill="none" opacity={0.35} />
          </>
        )}
        <Path d={MOUTH[mood]} stroke={dark} strokeWidth={1.6} fill="none" strokeLinecap="round" opacity={0.75} />
        {/* sunglasses pushed up on the head once you're properly famous */}
        {fame >= 50 && age >= 16 && (
          <>
            <Rect x={23.5} y={13.2} width={7} height={3.4} rx={1.5} fill="#15171c" />
            <Rect x={33.5} y={13.2} width={7} height={3.4} rx={1.5} fill="#15171c" />
            <Line x1={30.5} y1={14.6} x2={33.5} y2={14.6} stroke="#15171c" strokeWidth={1} />
          </>
        )}
        {/* a gold star pin for the very famous */}
        {fame >= 75 && age >= 16 && <Path d="M44 50 l1.1 2.7 2.9.2 -2.2 1.8 .7 2.8 -2.5 -1.5 -2.5 1.5 .7 -2.8 -2.2 -1.8 2.9 -.2z" fill="#f5c542" />}
        {/* glasses */}
        {ap.glasses && (
          <>
            <Circle cx={27} cy={eyeY} r={4.7} stroke="#2a2a2a" strokeWidth={1.2} fill="#9ec5e8" fillOpacity={0.15} />
            <Circle cx={37} cy={eyeY} r={4.7} stroke="#2a2a2a" strokeWidth={1.2} fill="#9ec5e8" fillOpacity={0.15} />
            <Line x1={31.7} y1={eyeY - 0.4} x2={32.3} y2={eyeY - 0.4} stroke="#2a2a2a" strokeWidth={1.2} />
            <Line x1={22.3} y1={eyeY - 0.5} x2={18.6} y2={eyeY - 1} stroke="#2a2a2a" strokeWidth={1} />
            <Line x1={41.7} y1={eyeY - 0.5} x2={45.4} y2={eyeY - 1} stroke="#2a2a2a" strokeWidth={1} />
          </>
        )}
        {/* the years show */}
        {wrinkle > 0 && (
          <>
            <Path d="M24 19.5 Q32 18 40 19.5" stroke={dark} strokeWidth={0.8} fill="none" opacity={wrinkle} />
            <Path d="M25.5 21.3 Q32 20 38.5 21.3" stroke={dark} strokeWidth={0.7} fill="none" opacity={wrinkle * 0.8} />
            <Path d="M22.6 27.4 L20.6 28.6 M22.6 29 L20.8 30.6 M41.4 27.4 L43.4 28.6 M41.2 29 L43.2 30.6" stroke={dark} strokeWidth={0.7} opacity={wrinkle} />
            <Path d="M28 35 Q27 37 28.6 38.4 M36 35 Q37 37 35.4 38.4" stroke={dark} strokeWidth={0.7} fill="none" opacity={wrinkle * 0.7} />
          </>
        )}
      </G>
    </Svg>
  );
}

function hash(str: string): number {
  let h = 7;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

// Avatars for everyone who isn't the player - derived from their name and
// role so the same person always looks the same, with no extra saved data.
export function PersonAvatar({
  name,
  id,
  type,
  gender: knownGender,
  region,
  age,
  size = 40,
}: {
  name: string;
  id?: string;
  type: RelationType;
  gender?: Gender;
  region?: RegionKey;
  age?: number;
  size?: number;
}) {
  // seeded by id when we have it, so renaming (a newborn getting a real
  // name) never changes someone's face
  const h = hash(id ?? name);
  const gender: Gender =
    knownGender ??
    (type === "mother" ? "female" : type === "father" ? "male" : (["female", "male", "nonbinary"] as Gender[])[h % 3]);
  return <Avatar character={{ gender, originRegion: region, avatarSeed: h % 999983, age }} size={size} />;
}
