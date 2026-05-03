import crypto from "crypto";

export function verifyShopifyHmac(
  params: Record<string, string>,
  secret: string,
): boolean {
  const received = params.hmac;
  if (!received || !secret) {
    return false;
  }
  const { hmac, signature, ...rest } = params;
  void hmac;
  void signature;
  const message = Object.keys(rest)
    .sort()
    .map((k) => `${k}=${rest[k]}`)
    .join("&");
  const digest = crypto.createHmac("sha256", secret).update(message).digest("hex");
  return digest === received;
}
