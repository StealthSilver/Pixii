import crypto from "crypto";

const STATE_TTL_MS = 5 * 60 * 1000;
const stateExpiry = new Map<string, number>();

function randomState(): string {
  return crypto.randomBytes(8).toString("hex");
}

export function buildAuthorizationUrl(shopDomain: string): string {
  const clientId = process.env.SHOPIFY_CLIENT_ID?.trim();
  const scopes = process.env.SHOPIFY_SCOPES?.trim();
  const baseUrl = process.env.NEXTAUTH_URL?.trim()?.replace(/\/$/, "");
  if (!clientId || !scopes || !baseUrl) {
    throw new Error("Missing SHOPIFY_CLIENT_ID, SHOPIFY_SCOPES, or NEXTAUTH_URL.");
  }
  const state = randomState();
  stateExpiry.set(state, Date.now() + STATE_TTL_MS);

  const redirectUri = `${baseUrl}/api/shopify/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    scope: scopes,
    redirect_uri: redirectUri,
    state,
  });
  return `https://${shopDomain}/admin/oauth/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(
  shopDomain: string,
  code: string,
): Promise<string> {
  const clientId = process.env.SHOPIFY_CLIENT_ID?.trim();
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error("Missing SHOPIFY_CLIENT_ID or SHOPIFY_CLIENT_SECRET.");
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(`https://${shopDomain}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
      signal: controller.signal,
    });
    const raw = await res.text();
    if (!res.ok) {
      throw new Error(`Token exchange failed (${res.status}): ${raw.slice(0, 200)}`);
    }
    const data = JSON.parse(raw) as { access_token?: string };
    const token = data.access_token;
    if (!token || typeof token !== "string") {
      throw new Error("Token exchange returned no access_token.");
    }
    return token;
  } finally {
    clearTimeout(timer);
  }
}

export function verifyState(state: string): boolean {
  const exp = stateExpiry.get(state);
  stateExpiry.delete(state);
  if (exp == null) {
    return false;
  }
  if (Date.now() > exp) {
    return false;
  }
  return true;
}
