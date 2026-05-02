const LS_BRAND = "pixii_aeo_brandName";
const LS_PRODUCT = "pixii_aeo_productName";

export function loadBrandFromStorage(): string {
  if (typeof window === "undefined") {
    return "";
  }
  return window.localStorage.getItem(LS_BRAND) ?? "";
}

export function loadProductFromStorage(): string {
  if (typeof window === "undefined") {
    return "";
  }
  return window.localStorage.getItem(LS_PRODUCT) ?? "";
}

export function persistBrandProduct(brandName: string, productName: string) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(LS_BRAND, brandName);
  window.localStorage.setItem(LS_PRODUCT, productName);
}
