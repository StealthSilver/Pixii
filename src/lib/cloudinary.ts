import { v2 as cloudinary } from "cloudinary";

function ensureCloudinaryConfig(): void {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Missing Cloudinary configuration. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
    );
  }
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
}

function dataUriFromBuffer(buffer: Buffer, mime: string): string {
  const b64 = buffer.toString("base64");
  return `data:${mime};base64,${b64}`;
}

function sniffImageMime(buffer: Buffer): string {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }
  return "image/jpeg";
}

export async function uploadImageFromFile(
  fileBuffer: Buffer,
  folder: string,
): Promise<string> {
  ensureCloudinaryConfig();
  try {
    const mime = sniffImageMime(fileBuffer);
    const dataUri = dataUriFromBuffer(fileBuffer, mime);
    const result = await cloudinary.uploader.upload(dataUri, {
      folder,
      resource_type: "image",
    });
    if (!result?.secure_url) {
      throw new Error("Cloudinary returned no secure_url");
    }
    return result.secure_url as string;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Cloudinary upload failed: ${msg}`);
  }
}

export async function uploadImageFromUrl(
  imageUrl: string,
  folder: string,
  options?: { public_id?: string },
): Promise<string> {
  ensureCloudinaryConfig();
  try {
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder,
      resource_type: "image",
      ...(options?.public_id ? { public_id: options.public_id } : {}),
    });
    if (!result?.secure_url) {
      throw new Error("Cloudinary returned no secure_url");
    }
    return result.secure_url as string;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Cloudinary upload from URL failed: ${msg}`);
  }
}

/** Upload a buffer using an explicit MIME type (e.g. PNG from Remove.bg). */
export async function uploadImageBufferWithMime(
  buffer: Buffer,
  mime: string,
  folder: string,
): Promise<string> {
  ensureCloudinaryConfig();
  try {
    const dataUri = dataUriFromBuffer(buffer, mime);
    const result = await cloudinary.uploader.upload(dataUri, {
      folder,
      resource_type: "image",
    });
    if (!result?.secure_url) {
      throw new Error("Cloudinary returned no secure_url");
    }
    return result.secure_url as string;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Cloudinary upload failed: ${msg}`);
  }
}

function parseRawPublicIdFromDeliveryUrl(secureUrl: string): string | null {
  try {
    const path = new URL(secureUrl).pathname;
    const m = path.match(/\/raw\/upload\/(?:v\d+\/)?(.+)\.pdf$/i);
    return m?.[1] ? decodeURIComponent(m[1]) : null;
  } catch {
    return null;
  }
}

/** Version segment after /raw/upload/ or /image/upload/ (unsigned delivery URLs). */
export function parseDeliveryAssetVersionFromUrl(secureUrl: string): number | undefined {
  try {
    const pathname = new URL(secureUrl).pathname;
    const m = pathname.match(
      /\/(?:raw|image|video)\/upload\/(?:s--[^/]+--\/)?(v\d+)\//i,
    );
    if (!m?.[1]) return undefined;
    const n = parseInt(m[1].slice(1), 10);
    return Number.isFinite(n) ? n : undefined;
  } catch {
    return undefined;
  }
}

export type SignedCloudinaryDeliveryOptions = {
  /** From the asset's `secure_url` so we never use the SDK's default `v1` for foldered IDs. */
  version?: number;
  /** Some product environments expect SHA-256 / 32-char URL signatures. */
  longUrlSignature?: boolean;
};

/**
 * Signed HTTPS URL for raw delivery. Required when the Cloudinary account uses
 * authenticated/restricted raw delivery (unsigned URLs return 401).
 * Raw PDFs uploaded with `format: "pdf"` must pass `format: "pdf"` here or
 * Cloudinary builds the wrong path and returns 404.
 */
export function signedRawDeliveryUrl(
  publicId: string,
  opts?: SignedCloudinaryDeliveryOptions,
): string {
  ensureCloudinaryConfig();
  const id = publicId.replace(/\.pdf$/i, "").trim();
  return cloudinary.url(id, {
    resource_type: "raw",
    secure: true,
    sign_url: true,
    format: "pdf",
    urlAnalytics: false,
    ...(opts?.longUrlSignature ? { long_url_signature: true } : {}),
    ...(opts?.version != null
      ? { version: opts.version }
      : { force_version: false }),
  }) as string;
}

/** First page of a stored PDF as PNG (signed). Used when raw PDF URLs require auth. */
export function signedCloudinaryPdfFirstPagePngUrl(
  publicId: string,
  opts?: SignedCloudinaryDeliveryOptions,
): string {
  ensureCloudinaryConfig();
  const base = publicId.replace(/\.pdf$/i, "").trim();
  return cloudinary.url(`${base}.pdf`, {
    resource_type: "image",
    secure: true,
    sign_url: true,
    transformation: [{ page: 1 }, { density: 300 }],
    format: "png",
    urlAnalytics: false,
    ...(opts?.longUrlSignature ? { long_url_signature: true } : {}),
    ...(opts?.version != null
      ? { version: opts.version }
      : { force_version: false }),
  }) as string;
}

function signedRawUrlCandidates(publicId: string, version?: number): string[] {
  const urls: string[] = [];
  if (version != null) {
    urls.push(signedRawDeliveryUrl(publicId, { version }));
    urls.push(signedRawDeliveryUrl(publicId, { version, longUrlSignature: true }));
  } else {
    urls.push(signedRawDeliveryUrl(publicId, {}));
    urls.push(signedRawDeliveryUrl(publicId, { longUrlSignature: true }));
  }
  return urls;
}

/** Download raw PDF bytes from Cloudinary (handles signed delivery when needed). */
export async function downloadRawPdfAsset(options: {
  secureUrl: string;
  publicId?: string | null;
}): Promise<Buffer> {
  ensureCloudinaryConfig();
  const { secureUrl, publicId } = options;
  const version = parseDeliveryAssetVersionFromUrl(secureUrl);

  const tryFetch = async (url: string) =>
    fetch(url, {
      headers: { "User-Agent": "PixiiPackagingRenderer/1.0" },
    });

  const pid = publicId?.trim();
  const normalizedPid = pid?.replace(/\.pdf$/i, "").trim();

  /** Prefer direct secure_url first — works for public raw delivery. */
  const candidates: string[] = [secureUrl];
  if (pid) {
    candidates.push(...signedRawUrlCandidates(pid, version));
  }

  let lastStatus = 0;
  for (const url of candidates) {
    const res = await tryFetch(url);
    if (res.ok) {
      return Buffer.from(await res.arrayBuffer());
    }
    lastStatus = res.status;
  }

  const parsed = parseRawPublicIdFromDeliveryUrl(secureUrl);
  if (parsed && parsed !== normalizedPid) {
    for (const url of signedRawUrlCandidates(parsed, version)) {
      const res = await tryFetch(url);
      if (res.ok) {
        return Buffer.from(await res.arrayBuffer());
      }
      lastStatus = res.status;
    }
  }

  const apiPid = normalizedPid ?? parsed ?? null;
  if (apiPid) {
    const apiUrl = cloudinary.utils.private_download_url(
      apiPid.replace(/\.pdf$/i, "").trim(),
      "pdf",
      { resource_type: "raw", type: "upload" },
    );
    const res = await tryFetch(apiUrl);
    if (res.ok) {
      return Buffer.from(await res.arrayBuffer());
    }
    lastStatus = res.status;
  }

  throw new Error(`Failed to download PDF (${lastStatus})`);
}

/** Upload a PDF buffer as a raw asset (e.g. dieline PDF). Resolves when the upload stream finishes. */
export async function uploadRawPdfBuffer(
  buffer: Buffer,
  folder: string,
): Promise<{ secureUrl: string; publicId: string }> {
  ensureCloudinaryConfig();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "raw",
        format: "pdf",
      },
      (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        if (!result?.secure_url || !result.public_id) {
          reject(new Error("Cloudinary returned no secure_url or public_id"));
          return;
        }
        resolve({
          secureUrl: result.secure_url as string,
          publicId: result.public_id as string,
        });
      },
    );
    stream.end(buffer);
  });
}

/** Upload raw bytes (e.g. MP3, JSON package) via data URI. */
export async function uploadRawFromBuffer(
  buffer: Buffer,
  mime: string,
  folder: string,
  options?: { public_id?: string },
): Promise<string> {
  ensureCloudinaryConfig();
  const dataUri = dataUriFromBuffer(buffer, mime);
  try {
    const result = await cloudinary.uploader.upload(dataUri, {
      folder,
      resource_type: "raw",
      public_id: options?.public_id,
    });
    if (!result?.secure_url) {
      throw new Error("Cloudinary returned no secure_url");
    }
    return result.secure_url as string;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Cloudinary raw upload failed: ${msg}`);
  }
}

/** Upload a remote video URL into Cloudinary (e.g. Replicate output). */
export async function uploadVideoFromUrl(
  videoUrl: string,
  folder: string,
): Promise<string> {
  ensureCloudinaryConfig();
  try {
    const result = await cloudinary.uploader.upload(videoUrl, {
      folder,
      resource_type: "video",
    });
    if (!result?.secure_url) {
      throw new Error("Cloudinary returned no secure_url");
    }
    return result.secure_url as string;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Cloudinary video upload failed: ${msg}`);
  }
}
