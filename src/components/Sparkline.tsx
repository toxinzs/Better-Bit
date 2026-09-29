import React from "react";
import Svg, { Circle, Line, Polyline } from "react-native-svg";
import { colors } from "../theme";

// A small trend line for a 0-100 series (the stat detail screens).
export default function Sparkline({
  values,
  color = colors.primary,
  width = 300,
  height = 90,
}: {
  values: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  const pad = 6;
  if (values.length < 2) return <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} />;
  const step = (width - pad * 2) / (values.length - 1);
  const y = (v: number) => pad + (1 - Math.max(0, Math.min(100, v)) / 100) * (height - pad * 2);
  const points = values.map((v, i) => `${pad + i * step},${y(v)}`).join(" ");
  const last = values[values.length - 1];
  return (
    <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      {[25, 50, 75].map((g) => (
        <Line key={g} x1={pad} x2={width - pad} y1={y(g)} y2={y(g)} stroke={colors.border} strokeWidth={1} strokeDasharray="3 4" />
      ))}
      <Polyline points={points} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      <Circle cx={pad + (values.length - 1) * step} cy={y(last)} r={4.5} fill={color} />
    </Svg>
  );
}
