import { fromBuffer } from "pdf2pic";

function cloudinaryPdfToPngUrl(pdfSecureUrl: string): string {
  if (!pdfSecureUrl.includes("res.cloudinary.com")) {
    return pdfSecureUrl.replace(/\.pdf(\?.*)?$/i, ".png$1") + "?page=1&density=300";
  }
  return pdfSecureUrl
    .replace("/raw/upload/", "/image/upload/pg_1,dn_300/")
    .replace(/\.pdf(\?.*)?$/i, ".png$1");
}

async function tryPdf2pic(pdfBuffer: Buffer): Promise<Buffer> {
  const converter = fromBuffer(pdfBuffer, {
    density: 300,
    saveFilename: "texture",
    savePath: "/tmp",
    format: "png",
    width: 3000,
    height: 3000,
  });
  const result = await converter(1, { responseType: "buffer" });
  const buf = (result as { buffer?: Buffer }).buffer;
  if (!buf || buf.length === 0) {
    throw new Error("pdf2pic returned empty buffer");
  }
  return buf;
}

async function resolveReplicateModelVersion(
  modelOwner: string,
  modelName: string,
): Promise<string> {
  const token = process.env.REPLICATE_API_KEY?.trim();
  if (!token) {
    throw new Error("Missing REPLICATE_API_KEY");
  }
  const res = await fetch(
    `https://api.replicate.com/v1/models/${modelOwner}/${modelName}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Replicate model lookup failed: ${res.status} ${t}`);
  }
  const data = (await res.json()) as { latest_version?: { id?: string } };
  const id = data.latest_version?.id;
  if (!id || typeof id !== "string") {
    throw new Error("Replicate model has no latest_version.id");
  }
  return id;
}

async function pollReplicatePrediction(pollUrl: string, token: string, deadline: number): Promise<unknown> {
  while (Date.now() < deadline) {
    const pollRes = await fetch(pollUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!pollRes.ok) {
      const t = await pollRes.text();
      throw new Error(`Replicate poll failed: ${pollRes.status} ${t}`);
    }
    const p = (await pollRes.json()) as {
      status: string;
      output?: unknown;
      error?: string;
    };
    if (p.status === "succeeded") {
      return p.output;
    }
    if (p.status === "failed" || p.status === "canceled") {
      throw new Error(p.error ?? `Replicate prediction ${p.status}`);
    }
    await new Promise((r) => setTimeout(r, 1200));
  }
  throw new Error("Replicate prediction timed out");
}

async function tryReplicatePdfToImage(pdfBuffer: Buffer): Promise<Buffer> {
  const token = process.env.REPLICATE_API_KEY?.trim();
  if (!token) {
    throw new Error("Missing REPLICATE_API_KEY");
  }

  const version = await resolveReplicateModelVersion("adirik", "pdf-to-image");

  const createRes = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      version,
      input: {
        pdf: `data:application/pdf;base64,${pdfBuffer.toString("base64")}`,
      },
    }),
  });

  if (!createRes.ok) {
    const t = await createRes.text();
    throw new Error(`Replicate pdf-to-image create failed: ${createRes.status} ${t}`);
  }

  const prediction = (await createRes.json()) as {
    id: string;
    urls?: { get?: string };
  };

  const pollUrl =
    prediction.urls?.get ??
    `https://api.replicate.com/v1/predictions/${prediction.id}`;

  const deadline = Date.now() + 120_000;
  const output = await pollReplicatePrediction(pollUrl, token, deadline);

  const url =
    typeof output === "string"
      ? output
      : Array.isArray(output) && typeof output[0] === "string"
        ? output[0]
        : null;

  if (!url?.startsWith("http")) {
    throw new Error("Replicate pdf-to-image returned no image URL");
  }

  const imgRes = await fetch(url);
  if (!imgRes.ok) {
    throw new Error(`Fetch replicate output failed: ${imgRes.status}`);
  }
  return Buffer.from(await imgRes.arrayBuffer());
}

async function tryCloudinaryPdfUrl(pdfSecureUrl: string): Promise<Buffer> {
  const imageUrl = cloudinaryPdfToPngUrl(pdfSecureUrl);
  const res = await fetch(imageUrl);
  if (!res.ok) {
    throw new Error(`Cloudinary PDF→PNG fetch failed: ${res.status}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

/**
 * Converts the first page of a PDF to a PNG buffer.
 * Tries pdf2pic, then Replicate `adirik/pdf-to-image`, then Cloudinary URL transforms (pass `cloudinaryPdfUrl` when available).
 */
export async function extractTextureFromPdf(
  pdfBuffer: Buffer,
  cloudinaryPdfUrl?: string,
): Promise<Buffer> {
  const errors: string[] = [];

  try {
    return await tryPdf2pic(pdfBuffer);
  } catch (e) {
    errors.push(`pdf2pic: ${e instanceof Error ? e.message : String(e)}`);
  }

  try {
    return await tryReplicatePdfToImage(pdfBuffer);
  } catch (e) {
    errors.push(`replicate: ${e instanceof Error ? e.message : String(e)}`);
  }

  if (cloudinaryPdfUrl?.startsWith("http")) {
    try {
      return await tryCloudinaryPdfUrl(cloudinaryPdfUrl);
    } catch (e) {
      errors.push(`cloudinary: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  throw new Error(
    `extractTextureFromPdf failed:\n${errors.join("\n")}`,
  );
}
