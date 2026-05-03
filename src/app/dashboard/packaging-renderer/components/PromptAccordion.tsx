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
 <details className="rounded-xl border border-border bg-card shadow-sm">
 <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-foreground">
 View AI prompt used
 </summary>
 <div className="border-t border-border/55 px-4 py-3">
 <p className="text-xs font-medium text-muted-foreground">
 Engine: {renderEngine ?? "—"}
 </p>
 <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-3 text-xs text-foreground">
 {promptUsed ?? "—"}
 </pre>
 <button
 type="button"
 onClick={() => {
 if (promptUsed) {
 void navigator.clipboard.writeText(promptUsed);
 }
 }}
 className="mt-3 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm hover:bg-muted"
 >
 Copy prompt
 </button>
 </div>
 </details>
 );
}
