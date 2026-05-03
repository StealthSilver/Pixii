"use client";

type ShareRowProps = {
  shareableLink: string;
  overallScore: number;
  weaknesses: string[];
  onToast: (message: string, variant: "success" | "error") => void;
};

export function ShareRow({
  shareableLink,
  overallScore,
  weaknesses,
  onToast,
}: ShareRowProps) {
  const top2 = weaknesses.slice(0, 2).join(" ");

  const linkedIn = `I asked an AI to roast my Amazon listing and... ouch 😬 Overall score: ${overallScore}/100
${top2}
Working on fixing these now 🔧
#Amazon #ecommerce #productlisting`;

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <p className="text-sm font-semibold text-foreground">Share this roast:</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(shareableLink);
            onToast("Link copied.", "success");
          }}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
        >
          Copy link
        </button>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(linkedIn);
            onToast("LinkedIn text copied.", "success");
          }}
          className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
        >
          Copy for LinkedIn
        </button>
      </div>
    </section>
  );
}
