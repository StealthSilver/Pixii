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

 const linkedIn = `I asked an AI to roast my Amazon listing and... ouch Overall score: ${overallScore}/100
${top2}
Working on fixing these now 
#Amazon #ecommerce #productlisting`;

 return (
 <section className="rounded-xl border border-border/80 bg-card/95 p-5 shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.05]">
 <p className="text-sm font-semibold text-foreground">Share this roast</p>
 <div className="mt-3 flex flex-wrap gap-2">
 <button
 type="button"
 onClick={() => {
 void navigator.clipboard.writeText(shareableLink);
 onToast("Link copied.", "success");
 }}
 className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm ring-1 ring-black/10 hover:bg-primary/90 dark:ring-white/15"
 >
 Copy link
 </button>
 <button
 type="button"
 onClick={() => {
 void navigator.clipboard.writeText(linkedIn);
 onToast("LinkedIn text copied.", "success");
 }}
 className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm ring-1 ring-black/[0.04] hover:bg-muted dark:ring-white/[0.06]"
 >
 Copy for LinkedIn
 </button>
 </div>
 </section>
 );
}
