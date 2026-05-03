"use client";

type SparklineProps = {
 values: number[];
 className?: string;
};

/** Fixed viewBox; parent controls display size via Tailwind. */
const VB_W = 120;
const VB_H = 40;
const PAD = { t: 6, r: 4, b: 8, l: 4 };

function chartPoints(
 values: number[],
 width: number,
 height: number,
 pad: typeof PAD,
): { x: number; y: number }[] {
 if (values.length === 0) {
 return [];
 }
 const min = Math.min(...values);
 const max = Math.max(...values);
 const span = max - min || 1;
 const innerW = width - pad.l - pad.r;
 const innerH = height - pad.t - pad.b;
 return values.map((v, i) => {
 const x =
 values.length === 1
 ? pad.l + innerW / 2
 : pad.l + (i / (values.length - 1)) * innerW;
 const y = pad.t + (1 - (v - min) / span) * innerH;
 return { x, y };
 });
}

function buildPolylinePath(points: { x: number; y: number }[]): string {
 if (points.length === 0) {
 return "";
 }
 if (points.length === 1) {
 return `M ${points[0].x} ${points[0].y}`;
 }
 let d = `M ${points[0].x} ${points[0].y}`;
 for (let i = 1; i < points.length; i++) {
 d += ` L ${points[i].x} ${points[i].y}`;
 }
 return d;
}

/**
 * Compact line chart for weekly trend (replaces area sparkline).
 * Styling aligns with HookCard: neutral grid, primary series, rounded caps.
 */
export function Sparkline({ values, className }: SparklineProps) {
 const pts = chartPoints(values, VB_W, VB_H, PAD);
 const pathD = buildPolylinePath(pts);
 const axisY = VB_H - PAD.b;
 const innerL = PAD.l;
 const innerR = VB_W - PAD.r;
 const gridYs = [PAD.t, PAD.t + (axisY - PAD.t) * 0.5, axisY];

 return (
 <svg
 viewBox={`0 0 ${VB_W} ${VB_H}`}
 className={"block max-h-full w-full " + (className ?? "")}
 preserveAspectRatio="none"
 aria-hidden
 >
 {gridYs.map((gy, i) => (
 <line
 key={i}
 x1={innerL}
 y1={gy}
 x2={innerR}
 y2={gy}
 className={
 gy === axisY
 ? "stroke-border"
 : "stroke-border/50 [stroke-dasharray:3_3]"
 }
 strokeWidth={gy === axisY ? 1 : 0.85}
 vectorEffect="non-scaling-stroke"
 />
 ))}

 {pathD && pts.length > 1 ? (
 <path
 d={pathD}
 fill="none"
 stroke="currentColor"
 strokeWidth={2}
 strokeLinecap="round"
 strokeLinejoin="round"
 className="text-primary"
 vectorEffect="non-scaling-stroke"
 />
 ) : null}

 {pts.length === 1 ? (
 <circle
 cx={pts[0].x}
 cy={pts[0].y}
 r={3}
 className="fill-primary stroke-white"
 strokeWidth={1.25}
 vectorEffect="non-scaling-stroke"
 />
 ) : (
 pts.map((p, i) => {
 const isLast = i === pts.length - 1;
 return (
 <circle
 key={i}
 cx={p.x}
 cy={p.y}
 r={isLast ? 3.25 : 2.25}
 className={
 isLast
 ? "fill-primary stroke-white"
 : "fill-white stroke-primary/55"
 }
 strokeWidth={isLast ? 1.35 : 1}
 vectorEffect="non-scaling-stroke"
 />
 );
 })
 )}
 </svg>
 );
}
