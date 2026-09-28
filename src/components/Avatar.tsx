import React from "react";
import Svg, { Circle, Ellipse, Path, Rect } from "react-native-svg";
import { Character, Gender, RegionKey, RelationType } from "../types";
import { getRegion } from "../data/regions";

// A simple, original geometric portrait - circle head, neck, shoulders in a
// shirt color, a preset hair silhouette, brows, eyes and a small smile.
// Deliberately not attempting photorealism, so it's buildable without any
// external art assets. Skin tone is picked from the character's region's
// palette as flavor only (src/data/regions.ts), not a hard demographic
// assignment - every region spans a real range of tones. Driven entirely by
// `avatarSeed`, frozen at character creation, so the look is stable across
// reloads instead of re-randomizing on every render.

type HairKind = "bald" | "short" | "long";

const HAIR_KINDS: Record<Gender, HairKind[]> = {
  male: ["short", "bald", "long"],
  female: ["long", "short", "long"],
  nonbinary: ["short", "long"],
};

const HAIR_COLORS = ["#1a1210", "#3b2417", "#6b4226", "#a8681f", "#d9a441", "#2b2b2b"];
const SHIRT_COLORS = ["#4d9fef", "#2ecc71", "#f5b942", "#b370e0", "#ef5b5b", "#3fb8af", "#e67e22", "#7f8c8d"];

export default function Avatar({
  character,
  size = 64,
  ring,
}: {
  character: Pick<Character, "gender" | "originRegion" | "avatarSeed">;
  size?: number;
  ring?: string;
}) {
  const seed = character.avatarSeed ?? 0;
  const region = getRegion(character.originRegion);
  const skin = region.skinTonePalette[seed % region.skinTonePalette.length];
  const hairColor = HAIR_COLORS[Math.floor(seed / 7) % HAIR_COLORS.length];
  const shirt = SHIRT_COLORS[Math.floor(seed / 5) % SHIRT_COLORS.length];
  const kinds = HAIR_KINDS[character.gender];
  const hairKind = kinds[Math.floor(seed / 13) % kinds.length];

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {ring && <Circle cx={32} cy={32} r={31} fill="none" stroke={ring} strokeWidth={2} />}
      {/* back hair for long styles sits behind the shoulders */}
      {hairKind === "long" && <Rect x={15} y={14} width={34} height={34} rx={14} fill={hairColor} />}
      {/* shoulders / shirt */}
      <Rect x={10} y={46} width={44} height={22} rx={13} fill={shirt} />
      {/* neck */}
      <Rect x={27} y={38} width={10} height={11} rx={4} fill={skin} />
      {/* head */}
      <Circle cx={32} cy={26} r={14} fill={skin} />
      {/* hair cap */}
      {hairKind !== "bald" && <Ellipse cx={32} cy={16} rx={15} ry={hairKind === "short" ? 10 : 12} fill={hairColor} />}
      {/* brows, eyes, smile */}
      <Rect x={23.5} y={22} width={6} height={1.6} rx={0.8} fill="#241a14" opacity={0.7} />
      <Rect x={34.5} y={22} width={6} height={1.6} rx={0.8} fill="#241a14" opacity={0.7} />
      <Circle cx={27} cy={26.5} r={1.7} fill="#241a14" />
      <Circle cx={37} cy={26.5} r={1.7} fill="#241a14" />
      <Path d="M27.5 32 Q32 36 36.5 32" stroke="#241a14" strokeWidth={1.6} fill="none" strokeLinecap="round" opacity={0.75} />
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
  type,
  region,
  size = 40,
}: {
  name: string;
  type: RelationType;
  region?: RegionKey;
  size?: number;
}) {
  const h = hash(name);
  const gender: Gender =
    type === "mother" ? "female" : type === "father" ? "male" : (["female", "male", "nonbinary"] as Gender[])[h % 3];
  return <Avatar character={{ gender, originRegion: region, avatarSeed: h % 999983 }} size={size} />;
}
