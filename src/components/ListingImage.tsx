"use client";

import { useEffect, useState } from "react";
import { normalizeAmazonImageUrl } from "@/lib/amazon/normalizeAmazonImageUrl";

type ListingImageMode = "square" | "banner";

type Props = {
  src: string | undefined | null;
  alt?: string;
  mode?: ListingImageMode;
  /** Pixel edge length when `mode` is `"square"` (default 44). */
  squareSize?: number;
  className?: string;
};

export function ListingImage({
  src,
  alt = "",
  mode = "square",
  squareSize = 44,
  className = "",
}: Props) {
  const [failed, setFailed] = useState(false);
  const normalized = normalizeAmazonImageUrl(src);
  const ready = Boolean(normalized) && !failed;

  useEffect(() => {
    setFailed(false);
  }, [normalized]);

  const placeholder = (
    <span
      aria-hidden
      className="flex h-full w-full items-center justify-center bg-muted text-[11px] font-semibold text-muted-foreground"
    >
      —
    </span>
  );

  if (mode === "banner") {
    return (
      <div
        className={`relative h-14 w-full overflow-hidden rounded-lg border border-border/55 bg-muted ${className}`}
      >
        {ready ? (
          <img
            src={normalized}
            alt={alt}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="absolute inset-0 h-full w-full object-cover object-center"
            onError={() => setFailed(true)}
          />
        ) : (
          placeholder
        )}
      </div>
    );
  }

  const s = squareSize;
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-lg border border-border/55 bg-muted ${className}`}
      style={{ width: s, height: s, minWidth: s, minHeight: s }}
    >
      {ready ? (
        <img
          src={normalized}
          alt={alt}
          width={s}
          height={s}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        placeholder
      )}
    </div>
  );
}
