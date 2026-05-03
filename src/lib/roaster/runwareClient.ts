const RUNWARE_API_URL = "https://api.runware.ai/v1";
const RUNWARE_FLUX_DEV = "runware:101@1";
const RUNWARE_KLING_AVATAR_DEFAULT = "klingai:avatar@2.0-pro";

function runwareApiKey(): string | null {
  const k = process.env.RUNWARE_API_KEY?.trim();
  return k || null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

type RunwareEnvelope = { data?: unknown[]; errors?: unknown[] };

/** HTTP + parsed body; does not throw on Runware billing or 4xx (callers treat as soft failure). */
async function runwareRequest(
  tasks: unknown[],
): Promise<RunwareEnvelope & { httpOk: boolean; httpStatus: number }> {
  const key = runwareApiKey();
  if (!key) {
    return { httpOk: false, httpStatus: 0, errors: [{ message: "RUNWARE_API_KEY is not set" }] };
  }
  let res: Response;
  try {
    res = await fetch(RUNWARE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(tasks),
    });
  } catch (e) {
    console.warn("[roaster/runware] fetch failed", e);
    return { httpOk: false, httpStatus: 0, errors: [{ message: String(e) }] };
  }
  let json: RunwareEnvelope = {};
  try {
    json = (await res.json()) as RunwareEnvelope;
  } catch {
    json = {};
  }
  if (!res.ok) {
    const snippet = JSON.stringify(json ?? {}).slice(0, 400);
    console.warn(`[roaster/runware] HTTP ${res.status}`, snippet);
  }
  return {
    httpOk: res.ok,
    httpStatus: res.status,
    data: json.data,
    errors: json.errors,
  };
}

function extractImageUrlFromRunwareResponse(json: {
  data?: unknown[];
  errors?: unknown[];
}): string | null {
  for (const row of json.data ?? []) {
    if (row && typeof row === "object" && "imageURL" in row) {
      const u = (row as { imageURL?: string }).imageURL;
      if (typeof u === "string" && u.startsWith("http")) {
        return u;
      }
    }
  }
  for (const err of json.errors ?? []) {
    if (err) {
      console.warn("[roaster/runware] image inference error", err);
    }
  }
  return null;
}

function extractVideoUrlFromRunwareResponse(json: {
  data?: unknown[];
  errors?: unknown[];
}): string | null {
  for (const row of json.data ?? []) {
    if (!row || typeof row !== "object") {
      continue;
    }
    const o = row as { videoURL?: string; status?: string };
    if (typeof o.videoURL === "string" && o.videoURL.startsWith("http")) {
      return o.videoURL;
    }
  }
  return null;
}

function runwareHasTerminalError(json: { data?: unknown[]; errors?: unknown[] }): boolean {
  for (const e of json.errors ?? []) {
    if (!e || typeof e !== "object") {
      continue;
    }
    const o = e as { status?: string; code?: string };
    if (o.status === "error" || o.code === "insufficientCredits") {
      return true;
    }
  }
  for (const row of json.data ?? []) {
    if (row && typeof row === "object" && (row as { status?: string }).status === "error") {
      return true;
    }
  }
  return false;
}

export async function runwareFluxImage(prompt: string): Promise<string | null> {
  if (!runwareApiKey()) {
    return null;
  }
  const sizes = [
    { width: 720, height: 1280 },
    { width: 768, height: 1024 },
  ];
  for (const { width, height } of sizes) {
    const taskUUID = crypto.randomUUID();
    const env = await runwareRequest([
      {
        taskType: "imageInference",
        taskUUID,
        model: RUNWARE_FLUX_DEV,
        positivePrompt: prompt,
        width,
        height,
        steps: 28,
        numberResults: 1,
      },
    ]);
    const payload = { data: env.data, errors: env.errors };
    const url = extractImageUrlFromRunwareResponse(payload);
    if (url) {
      return url;
    }
  }
  return null;
}

async function pollRunwareVideoUntilUrl(taskUUID: string): Promise<string | null> {
  let waitMs = 2000;
  for (let i = 0; i < 120; i++) {
    await sleep(waitMs);
    waitMs = Math.min(waitMs + 400, 10000);
    const env = await runwareRequest([{ taskType: "getResponse", taskUUID }]);
    const json = { data: env.data, errors: env.errors };
    if (!env.httpOk) {
      console.warn("[roaster/runware] getResponse HTTP", env.httpStatus, taskUUID);
      return null;
    }
    if (runwareHasTerminalError(json)) {
      console.warn("[roaster/runware] video task failed", taskUUID, json.errors ?? json.data);
      return null;
    }
    const url = extractVideoUrlFromRunwareResponse(json);
    if (url) {
      return url;
    }
  }
  console.warn("[roaster/runware] video poll timeout", taskUUID);
  return null;
}

export async function runwareKlingAvatarVideo(params: {
  imageUrl: string;
  audioUrl: string;
  positivePrompt: string;
}): Promise<string | null> {
  if (!runwareApiKey()) {
    return null;
  }
  const model =
    process.env.ROASTER_RUNWARE_AVATAR_MODEL?.trim() || RUNWARE_KLING_AVATAR_DEFAULT;
  const taskUUID = crypto.randomUUID();
  const prompt = params.positivePrompt.slice(0, 2500);
  const env = await runwareRequest([
    {
      taskType: "videoInference",
      taskUUID,
      deliveryMethod: "async",
      model,
      positivePrompt: prompt,
      inputs: {
        image: params.imageUrl,
        audio: params.audioUrl,
      },
    },
  ]);
  const json = { data: env.data, errors: env.errors };
  if (!env.httpOk) {
    console.warn("[roaster/runware] kling avatar HTTP", env.httpStatus, env.errors ?? env.data);
    return null;
  }
  if (runwareHasTerminalError(json)) {
    console.warn("[roaster/runware] kling avatar submit failed", json.errors ?? json.data);
    return null;
  }
  const immediate = extractVideoUrlFromRunwareResponse(json);
  if (immediate) {
    return immediate;
  }
  return pollRunwareVideoUntilUrl(taskUUID);
}
