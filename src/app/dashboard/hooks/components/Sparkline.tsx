"use client";

import { useId } from "react";

function normalizePoints(values: number[], width: number, height: number) {
  if (values.length === 0) {
    return [];
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = 4;
  const span = max - min || 1;
  return values.map((v, i) => {
    const x =
      values.length === 1
        ? width / 2
        : pad + (i / (values.length - 1)) * (width - pad * 2);
    const ny = pad + (1 - (v - min) / span) * (height - pad * 2);
    return { x, y: ny };
  });
}

function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) {
    return "";
  }
  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function buildAreaPath(
  points: { x: number; y: number }[],
  baselineY: number,
): string {
  if (points.length === 0) {
    return "";
  }
  const top = buildSmoothPath(points);
  if (points.length === 1) {
    const p = points[0];
    return `${top} L ${p.x + 0.5} ${baselineY} L ${p.x - 0.5} ${baselineY} Z`;
  }
  const first = points[0];
  const last = points[points.length - 1];
  return `${top} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;
}

type SparklineProps = {
  values: number[];
  className?: string;
};

export function Sparkline({ values, className }: SparklineProps) {
  const gradId = useId().replace(/:/g, "");
  const w = 120;
  const h = 36;
  const pad = 4;
  const baselineY = h - pad;
  const pts = normalizePoints(values, w, h);
  const linePath = buildSmoothPath(pts);
  const areaPath = buildAreaPath(pts, baselineY);
  const last = pts[pts.length - 1];

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={"block max-h-full w-full " + (className ?? "")}
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity={0.22} />
          <stop offset="100%" stopColor="currentColor" stopOpacity={0.02} />
        </linearGradient>
      </defs>

      {pts.length > 1
        ? pts.map((p, i) => (
            <line
              key={i}
              x1={p.x}
              y1={baselineY}
              x2={p.x}
              y2={baselineY - 3}
              className="stroke-neutral-200"
              strokeWidth={0.9}
              vectorEffect="non-scaling-stroke"
            />
          ))
        : null}

      {areaPath ? (
        <path
          d={areaPath}
          fill={`url(#${gradId})`}
          className="text-primary"
          stroke="none"
        />
      ) : null}

      {linePath ? (
        <path
          d={linePath}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-primary"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}

      {pts.length > 1
        ? pts.map((p, i) => (
            <circle
              key={`d-${i}`}
              cx={p.x}
              cy={p.y}
              r={1.6}
              className="fill-white stroke-primary/50"
              strokeWidth={0.85}
              vectorEffect="non-scaling-stroke"
            />
          ))
        : null}

      {last ? (
        <circle
          cx={last.x}
          cy={last.y}
          r={2.75}
          className="fill-primary stroke-white"
          strokeWidth={1.25}
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
    </svg>
  );
}
