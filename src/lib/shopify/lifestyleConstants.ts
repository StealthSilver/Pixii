export const SHOPIFY_PHOTO_LIFESTYLES = [
  "kitchen",
  "bathroom",
  "gym",
  "office",
  "bedroom",
  "outdoor",
  "studio_white",
  "studio_dark",
  "minimal_flat",
] as const;

export type ShopifyPhotoLifestyle = (typeof SHOPIFY_PHOTO_LIFESTYLES)[number];
