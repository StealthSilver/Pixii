"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type SharePayload = {
  finalVideoUrl?: string;
  avatarFrameUrls?: string[];
  voiceoverUrl?: string;
  fullScript?: string;
  listingTitle?: string;
  listingBrand?: string;
  overallScore?: number;
  letterGrade?: string;
  quickWins?: string[];
  conversionEstimate?: string;
  error?: string;
};

export default function ShareRoasterPage() {
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
        const res = await fetch(`/api/roaster/share/${jobId}`);
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
        <p className="text-sm text-neutral-600">{err}</p>
        <Link
          href="/dashboard/roaster"
          className="mt-4 inline-block text-sm font-semibold text-primary"
        >
          Go to Roaster
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[rgb(251_249_247)] px-4 py-16 text-center text-sm text-neutral-600">
        Loading…
      </div>
    );
  }

  const wins = (data.quickWins ?? []).slice(0, 3);

  return (
    <div className="min-h-screen bg-[rgb(251_249_247)] px-4 py-10">
      <div className="mx-auto max-w-lg">
        <p className="text-center font-heading text-xl font-bold text-black">
          Pixii Roaster
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

          {!data.finalVideoUrl && data.voiceoverUrl ? (
            <audio controls className="mx-auto w-full max-w-md">
              <source src={data.voiceoverUrl} />
            </audio>
          ) : null}

          <div className="text-center">
            <h1 className="font-heading text-lg font-semibold text-black">
              {data.listingTitle ?? "Amazon listing"}
            </h1>
            {data.listingBrand ? (
              <p className="mt-1 text-sm text-neutral-600">{data.listingBrand}</p>
            ) : null}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <span className="rounded-full bg-neutral-900 px-3 py-1 text-sm font-bold text-white">
                {data.letterGrade ?? "?"}
              </span>
              <span className="rounded-full bg-neutral-200 px-2.5 py-0.5 text-xs font-bold text-neutral-900">
                {data.overallScore ?? 0}/100
              </span>
              {data.conversionEstimate ? (
                <span className="text-xs text-neutral-600">
                  Est. conversion: {data.conversionEstimate}
                </span>
              ) : null}
            </div>
          </div>

          {wins.length > 0 ? (
            <div>
              <p className="text-sm font-semibold text-neutral-900">
                Top Issues Found:
              </p>
              <ul className="mx-auto mt-2 max-w-md list-disc space-y-2 pl-5 text-sm text-neutral-800">
                {wins.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex justify-center pt-4">
            <Link
              href="/dashboard/roaster"
              className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
            >
              Get Your Listing Roasted →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
