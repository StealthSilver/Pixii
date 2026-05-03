import type { ReactNode } from "react";

type BetaFeatureNoticeProps = {
  /** Optional body after “Beta:”. Defaults to the generic API-stability message. */
  message?: ReactNode;
};

/** Compact Beta pill beside the page product title (right of the name). */
export function PageBetaBadge({ className }: { className?: string }) {
  return (
    <span
      className={
        "shrink-0 rounded-md border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-primary " +
        (className ?? "")
      }
    >
      Beta
    </span>
  );
}

/** One-line notice for features still in beta (API stability). */
export function BetaFeatureNotice({ message }: BetaFeatureNoticeProps) {
  return (
    <p
      className="mb-6 rounded-lg border border-primary/20 bg-primary/[0.07] px-3.5 py-2.5 text-sm leading-relaxed text-foreground/90 dark:bg-primary/[0.12]"
      role="status"
    >
      <span className="font-semibold text-primary">Beta:</span>{" "}
      {message ??
        "This area is in beta—the API might not work reliably yet."}
    </p>
  );
}
