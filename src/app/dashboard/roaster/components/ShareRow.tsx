"use client";

import { useState } from "react";
import type { RoasterJobView } from "./types";

type ShareRowProps = {
 job: RoasterJobView;
};

export function ShareRow({ job }: ShareRowProps) {
 const [copyLink, setCopyLink] = useState(false);
 const [copyLi, setCopyLi] = useState(false);
 const ls = job.listingScore;
 const qw = ls.quickWins;
 const q0 = qw[0] ?? "";
 const q1 = qw[1] ?? "";
 const q2 = qw[2] ?? "";

 const linkedInText = `Got my Amazon listing roasted by AI 

Overall score: ${ls.overallScore}/100 (${ls.letterGrade})
Estimated conversion: ${ls.conversionEstimate || "—"}

Top issues:
• ${q0}
• ${q1}
• ${q2}

Working on the fixes now 
#Amazon #ecommerce #productlisting #FBA`;

 const copy = async (kind: "link" | "li") => {
 if (kind === "link") {
 await navigator.clipboard.writeText(job.shareableLink);
 setCopyLink(true);
 window.setTimeout(() => setCopyLink(false), 2000);
 } else {
 await navigator.clipboard.writeText(linkedInText);
 setCopyLi(true);
 window.setTimeout(() => setCopyLi(false), 2000);
 }
 };

 return (
 <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
 <p className="text-sm font-semibold text-foreground">Share this critique:</p>
 <div className="mt-3 flex flex-wrap gap-2">
 <button
 type="button"
 onClick={() => void copy("link")}
 className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
 >
 {copyLink ? "Copied!" : "Copy Link"}
 </button>
 <button
 type="button"
 onClick={() => void copy("li")}
 className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
 >
 {copyLi ? "Copied!" : "Copy for LinkedIn"}
 </button>
 </div>
 </section>
 );
}
