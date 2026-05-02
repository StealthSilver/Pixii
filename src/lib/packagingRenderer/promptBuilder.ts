type Dimensions = { width: number; height: number; depth: number };

const SHAPE_TEXT: Record<string, string> = {
  box_square: "a square cardboard box product package",
  box_rectangle: "a rectangular cardboard box product package",
  bottle_round: "a cylindrical round plastic bottle",
  bottle_square: "a square cross-section plastic bottle",
  tube: "a squeeze tube product container",
  pouch: "a flexible stand-up mylar pouch",
  can: "a metal tin can",
  jar: "a wide-mouth glass or plastic jar",
};

const STYLE_TEXT: Record<string, string> = {
  studio_white:
    "on a pure white seamless studio background, professional product photography, soft box lighting from top-left, subtle shadow beneath",
  studio_dark:
    "on a deep black seamless background, dramatic studio lighting, rim light effect, luxury product photography",
  lifestyle_kitchen:
    "on a clean marble kitchen countertop, natural window light, lifestyle product photography, shallow depth of field",
  lifestyle_gym:
    "on a gym floor next to workout equipment, sports nutrition photography, dynamic lighting",
  lifestyle_bathroom:
    "on a clean white bathroom shelf, soft natural light, wellness and beauty product photography",
  shelf_display:
    "on a retail store shelf with other products visible but blurred, retail merchandising photography",
};

const ANGLE_TEXT: Record<string, string> = {
  front: "straight-on front view, perfectly centered",
  three_quarter:
    "three-quarter angle view showing front and right side",
  top_down: "top-down flat lay view",
  hero: "dramatic low-angle hero shot, slightly below eye level",
};

export function buildRenderPrompt(
  packageShape: string,
  renderStyle: string,
  renderAngle: string,
  dimensions: Dimensions,
): { prompt: string; negativePrompt: string } {
  const shape =
    SHAPE_TEXT[packageShape] ?? SHAPE_TEXT.box_rectangle;
  const style =
    STYLE_TEXT[renderStyle] ?? STYLE_TEXT.studio_white;
  const angle =
    ANGLE_TEXT[renderAngle] ?? ANGLE_TEXT.three_quarter;

  const dimNote = `Approximate real-world size about ${dimensions.width}×${dimensions.height}×${dimensions.depth} cm.`;

  const prompt =
    `Product packaging 3D render: ${shape}. The packaging artwork from the reference image is accurately wrapped around the ${shape} surface. ${dimNote} ${style} ${angle}. Photorealistic, 8K resolution, commercial product photography, sharp focus on the packaging, the label and artwork from the reference image is clearly visible and legible on the package surface. Professional CGI render quality. No text overlays. No watermarks.`;

  const negativePrompt =
    "flat, 2D, cartoon, illustration, blurry, low quality, watermark, text overlay, floating, unrealistic proportions, distorted artwork, warped text";

  return { prompt, negativePrompt };
}
