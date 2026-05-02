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
      className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm"
      aria-labelledby="aeo-input-heading"
    >
      <h2
        id="aeo-input-heading"
        className="font-heading text-lg font-semibold text-black"
      >
        Run diagnostic
      </h2>
      <p className="mt-1 text-sm text-neutral-600">
        Compare how GPT-4o, GPT-4o mini, and Gemini answer a shopper-style query
        and surface your brand versus competitors.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-neutral-700">
          Your brand name
          <input
            required
            value={brandName}
            onChange={(e) => onBrandChange(e.target.value)}
            placeholder="e.g. Garden of Life"
            className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-black shadow-sm placeholder:text-neutral-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35"
          />
        </label>
        <label className="block text-sm font-medium text-neutral-700">
          Product name{" "}
          <span className="font-normal text-neutral-500">(optional)</span>
          <input
            value={productName}
            onChange={(e) => onProductChange(e.target.value)}
            placeholder="e.g. Magnesium Glycinate 400mg"
            className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-black shadow-sm placeholder:text-neutral-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35"
          />
        </label>
      </div>

      <label className="mt-4 block text-sm font-medium text-neutral-700">
        Shopper query
        <textarea
          value={queryText}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder='e.g. "best magnesium supplement for seniors"'
          rows={3}
          className="mt-1.5 w-full resize-y rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-black shadow-sm placeholder:text-neutral-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35"
        />
      </label>

      <div className="mt-3 flex flex-wrap gap-2">
        {EXAMPLES.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onQueryChange(q)}
            className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 transition-colors hover:border-neutral-300 hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35"
          >
            {q}
          </button>
        ))}
      </div>

      <button
        type="button"
        disabled={disabled || !brandName.trim() || !queryText.trim()}
        onClick={onSubmit}
        className="mt-5 w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35"
      >
        Run AEO Diagnostic
      </button>
    </section>
  );
}
