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
): Promise<string> {
  ensureCloudinaryConfig();
  try {
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder,
      resource_type: "image",
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

/** Upload a PDF buffer as a raw asset (e.g. dieline PDF). Resolves when the upload stream finishes. */
export async function uploadRawPdfBuffer(
  buffer: Buffer,
  folder: string,
): Promise<string> {
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
        if (!result?.secure_url) {
          reject(new Error("Cloudinary returned no secure_url"));
          return;
        }
        resolve(result.secure_url as string);
      },
    );
    stream.end(buffer);
  });
}
