"use client";

type PromptAccordionProps = {
  promptUsed: string | null;
  renderEngine: string | null;
};

export function PromptAccordion({
  promptUsed,
  renderEngine,
}: PromptAccordionProps) {
  return (
    <details className="rounded-xl border border-neutral-200 bg-white shadow-sm">
      <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-black">
        View AI prompt used
      </summary>
      <div className="border-t border-neutral-100 px-4 py-3">
        <p className="text-xs font-medium text-neutral-500">
          Engine: {renderEngine ?? "—"}
        </p>
        <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-neutral-50 p-3 text-xs text-neutral-800">
          {promptUsed ?? "—"}
        </pre>
        <button
          type="button"
          onClick={() => {
            if (promptUsed) {
              void navigator.clipboard.writeText(promptUsed);
            }
          }}
          className="mt-3 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-800 shadow-sm hover:bg-neutral-50"
        >
          Copy prompt
        </button>
      </div>
    </details>
  );
}
