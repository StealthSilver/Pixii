export function formatSeconds(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  if (s < 3600) {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${r.toString().padStart(2, "0")}`;
  }
  const h = Math.floor(s / 3600);
  const rem = s % 3600;
  const m = Math.floor(rem / 60);
  const r = rem % 60;
  return `${h}:${m.toString().padStart(2, "0")}:${r.toString().padStart(2, "0")}`;
}

/** Always mm:ss for clip timestamps (e.g. 01:15). */
export function secondsToTimestamp(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m.toString().padStart(2, "0")}:${r.toString().padStart(2, "0")}`;
}
