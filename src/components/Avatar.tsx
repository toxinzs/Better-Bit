import React from "react";
import Svg, { Circle, Ellipse, Rect } from "react-native-svg";
import { Character, Gender } from "../types";
import { getRegion } from "../data/regions";

// A simple, original geometric portrait - circle head, rounded-rect
// shoulders, a preset hair silhouette, dot eyes. Deliberately not
// attempting photorealism, so it's buildable without any external art
// assets. Skin tone is picked from the character's region's palette as
// flavor only (src/data/regions.ts), not a hard demographic assignment -
// every region spans a real range of tones. Driven entirely by
// `avatarSeed`, frozen at character creation, so the look is stable
// across reloads instead of re-randomizing on every render.

type HairKind = "bald" | "short" | "long";

const HAIR_KINDS: Record<Gender, HairKind[]> = {
  male: ["short", "bald", "long"],
  female: ["long", "short", "long"],
  nonbinary: ["short", "long"],
};

const HAIR_COLORS = ["#1a1210", "#3b2417", "#6b4226", "#a8681f", "#d9a441", "#2b2b2b"];

export default function Avatar({
  character,
  size = 64,
}: {
  character: Pick<Character, "gender" | "originRegion" | "avatarSeed">;
  size?: number;
}) {
  const seed = character.avatarSeed ?? 0;
  const region = getRegion(character.originRegion);
  const skin = region.skinTonePalette[seed % region.skinTonePalette.length];
  const hairColor = HAIR_COLORS[Math.floor(seed / 7) % HAIR_COLORS.length];
  const kinds = HAIR_KINDS[character.gender];
  const hairKind = kinds[Math.floor(seed / 13) % kinds.length];

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {/* shoulders */}
      <Rect x={12} y={44} width={40} height={20} rx={12} fill={skin} />
      {/* head */}
      <Circle cx={32} cy={26} r={14} fill={skin} />
      {/* hair */}
      {hairKind !== "bald" && <Ellipse cx={32} cy={16} rx={15} ry={12} fill={hairColor} />}
      {hairKind === "long" && (
        <>
          <Rect x={15} y={16} width={6} height={24} rx={3} fill={hairColor} />
          <Rect x={43} y={16} width={6} height={24} rx={3} fill={hairColor} />
        </>
      )}
      {/* eyes */}
      <Circle cx={27} cy={26} r={1.5} fill="#241a14" />
      <Circle cx={37} cy={26} r={1.5} fill="#241a14" />
    </Svg>
  );
}
