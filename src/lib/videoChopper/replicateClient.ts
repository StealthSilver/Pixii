type PredictionBody = {
  version: string;
  input: Record<string, unknown>;
};

/** Poll Replicate predictions API (same pattern as photo-upgrader pipeline). */
export async function runReplicatePrediction(params: {
  version: string;
  input: Record<string, unknown>;
  pollIntervalMs?: number;
  maxWaitMs?: number;
}): Promise<unknown> {
  const token = process.env.REPLICATE_API_KEY?.trim();
  if (!token) {
    throw new Error("Missing REPLICATE_API_KEY");
  }

  const pollIntervalMs = params.pollIntervalMs ?? 1500;
  const maxWaitMs = params.maxWaitMs ?? 15 * 60 * 1000;
  const deadline = Date.now() + maxWaitMs;

  const createRes = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      version: params.version,
      input: params.input,
    } satisfies PredictionBody),
  });

  if (!createRes.ok) {
    const t = await createRes.text();
    throw new Error(`Replicate create failed: ${createRes.status} ${t}`);
  }

  const prediction = (await createRes.json()) as {
    id: string;
    urls?: { get?: string };
  };

  const pollUrl =
    prediction.urls?.get ?? `https://api.replicate.com/v1/predictions/${prediction.id}`;

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
      throw new Error(p.error || `Replicate prediction ${p.status}`);
    }
    await new Promise((r) => setTimeout(r, pollIntervalMs));
  }

  throw new Error(
    "Replicate did not report success before the poll deadline. Check REPLICATE_API_KEY, model version, and https://replicate.com/status — or increase maxWaitMs for this job.",
  );
}
