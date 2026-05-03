/** One-line notice for features still in beta (API stability). */
export function BetaFeatureNotice() {
  return (
    <p
      className="mb-6 rounded-lg border border-primary/20 bg-primary/[0.07] px-3.5 py-2.5 text-sm leading-relaxed text-foreground/90 dark:bg-primary/[0.12]"
      role="status"
    >
      <span className="font-semibold text-primary">Beta:</span> This area is in
      beta—the API might not work reliably yet.
    </p>
  );
}
