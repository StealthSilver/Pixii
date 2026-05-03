"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PERSONAS } from "@/lib/aiCreator/personas";
import type { InfluencerPersonaId } from "@/lib/aiCreator/personas";

type SharePayload = {
  finalVideoUrl?: string;
  avatarFrameUrls?: string[];
  fullScript?: string;
  listingTitle?: string;
  overallScore?: number;
  influencerPersona?: InfluencerPersonaId;
  weaknesses?: string[];
  error?: string;
};

export default function ShareCreatorRoastPage() {
  const params = useParams();
  const jobId = typeof params.jobId === "string" ? params.jobId : "";
  const [data, setData] = useState<SharePayload | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) {
      return;
    }
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/ai-creator/share/${jobId}`);
        const body = (await res.json()) as SharePayload;
        if (!res.ok) {
          throw new Error(body.error ?? "Failed to load");
        }
        if (!cancelled) {
          setData(body);
        }
      } catch (e) {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : "Error");
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  if (err) {
    return (
      <div className="min-h-screen bg-[rgb(251_249_247)] px-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">{err}</p>
        <Link
          href="/dashboard/ai-creator"
          className="mt-4 inline-block text-sm font-semibold text-primary"
        >
          Go to AI Creator
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[rgb(251_249_247)] px-4 py-16 text-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  const persona =
    data.influencerPersona && data.influencerPersona in PERSONAS
      ? PERSONAS[data.influencerPersona]
      : null;
  const topWeak = (data.weaknesses ?? []).slice(0, 3);

  return (
    <div className="min-h-screen bg-[rgb(251_249_247)] px-4 py-10">
      <div className="mx-auto max-w-lg">
        <p className="text-center font-heading text-xl font-bold text-foreground">
          Pixii AI Creator
        </p>

        <div className="mt-8 space-y-4">
          {data.finalVideoUrl ? (
            <video
              controls
              width="100%"
              className="mx-auto rounded-xl shadow-md"
              style={{ maxWidth: 360 }}
            >
              <source src={data.finalVideoUrl} type="video/mp4" />
            </video>
          ) : data.avatarFrameUrls?.[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.avatarFrameUrls[0]}
              alt=""
              className="mx-auto max-h-[420px] w-full max-w-[300px] rounded-xl object-cover shadow-md"
            />
          ) : null}

          <div className="flex flex-wrap items-center justify-center gap-2">
            <h1 className="text-center font-heading text-lg font-semibold text-foreground">
              {data.listingTitle ?? "Amazon listing"}
            </h1>
            <span className="rounded-full bg-border px-2.5 py-0.5 text-xs font-bold text-foreground">
              {data.overallScore ?? 0}/100
            </span>
          </div>

          {persona ? (
            <p className="text-center text-sm text-muted-foreground">
              {persona.name}{" "}
              <span className="text-muted-foreground/75">{persona.handle}</span>
            </p>
          ) : null}

          {topWeak.length > 0 ? (
            <ul className="mx-auto max-w-md list-disc space-y-2 pl-5 text-sm text-foreground">
              {topWeak.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          ) : null}

          <div className="flex justify-center pt-4">
            <Link
              href="/dashboard/ai-creator"
              className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
            >
              Get your listing roasted
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
