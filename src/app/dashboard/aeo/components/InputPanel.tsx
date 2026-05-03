type InputPanelProps = {
  brandName: string;
  productName: string;
  queryText: string;
  onBrandChange: (v: string) => void;
  onProductChange: (v: string) => void;
  onQueryChange: (v: string) => void;
  onSubmit: () => void;
  disabled: boolean;
};

const EXAMPLES = [
  "best magnesium supplement for seniors",
  "most effective sleep supplement 2024",
  "top rated protein powder for women",
  "best collagen supplement for joints",
] as const;

const inputClass =
  "mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground shadow-sm ring-1 ring-black/[0.04] placeholder:text-muted-foreground/75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35 dark:ring-white/[0.06]";

const examplePillClass =
  "rounded-full border border-border/80 bg-card/80 px-3 py-1.5 text-xs font-semibold text-muted-foreground backdrop-blur-[1px] transition-colors hover:border-muted-foreground/30 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35";

const primaryBtn =
  "mt-5 inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm ring-1 ring-black/10 transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/40 dark:ring-white/15";

export function InputPanel({
  brandName,
  productName,
  queryText,
  onBrandChange,
  onProductChange,
  onQueryChange,
  onSubmit,
  disabled,
}: InputPanelProps) {
  return (
    <section
      className="rounded-xl border border-border/80 bg-card/95 p-5 shadow-sm ring-1 ring-black/[0.03] backdrop-blur-[1px] dark:ring-white/[0.05]"
      aria-labelledby="aeo-input-heading"
    >
      <h2
        id="aeo-input-heading"
        className="font-heading text-lg font-semibold tracking-tight text-foreground"
      >
        Run diagnostic
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        Compare how GPT-4o, GPT-4o mini, and Gemini answer a shopper-style query
        and surface your brand versus competitors.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-foreground/90">
          Your brand name
          <input
            required
            value={brandName}
            onChange={(e) => onBrandChange(e.target.value)}
            placeholder="e.g. Garden of Life"
            className={inputClass}
          />
        </label>
        <label className="block text-sm font-medium text-foreground/90">
          Product name{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
          <input
            value={productName}
            onChange={(e) => onProductChange(e.target.value)}
            placeholder="e.g. Magnesium Glycinate 400mg"
            className={inputClass}
          />
        </label>
      </div>

      <label className="mt-4 block text-sm font-medium text-foreground/90">
        Shopper query
        <textarea
          value={queryText}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder='e.g. "best magnesium supplement for seniors"'
          rows={3}
          className={`${inputClass} resize-y`}
        />
      </label>

      <div className="mt-3 flex flex-wrap gap-2">
        {EXAMPLES.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onQueryChange(q)}
            className={examplePillClass}
          >
            {q}
          </button>
        ))}
      </div>

      <button
        type="button"
        disabled={disabled || !brandName.trim() || !queryText.trim()}
        onClick={onSubmit}
        className={primaryBtn}
      >
        Run AEO Diagnostic
      </button>
    </section>
  );
}
