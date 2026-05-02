/** Shared enums for packaging renderer (safe for client + server; no mongoose). */

export const PACKAGE_SHAPES = [
  "box_square",
  "box_rectangle",
  "bottle_round",
  "bottle_square",
  "tube",
  "pouch",
  "can",
  "jar",
] as const;

export type PackageShape = (typeof PACKAGE_SHAPES)[number];

export const RENDER_STYLES = [
  "studio_white",
  "studio_dark",
  "lifestyle_kitchen",
  "lifestyle_gym",
  "lifestyle_bathroom",
  "shelf_display",
] as const;

export type RenderStyle = (typeof RENDER_STYLES)[number];

export const RENDER_ANGLES = ["front", "three_quarter", "top_down", "hero"] as const;

export type RenderAngle = (typeof RENDER_ANGLES)[number];

export const PACKAGING_JOB_STATUSES = [
  "queued",
  "extracting",
  "rendering",
  "complete",
  "failed",
] as const;

export type PackagingJobStatus = (typeof PACKAGING_JOB_STATUSES)[number];
