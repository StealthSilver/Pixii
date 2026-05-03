"use client";

type FixListProps = {
 weaknesses: string[];
};

export function FixList({ weaknesses }: FixListProps) {
 function suggestion(w: string): string {
 const x = w.toLowerCase();
 if (x.includes("title")) {
 return "Add primary keyword in first 5 words.";
 }
 if (x.includes("bullet")) {
 return "Lead with benefit, not feature.";
 }
 if (x.includes("image")) {
 return "Add lifestyle shot as image 2–3.";
 }
 if (x.includes("keyword")) {
 return "Add to title and first bullet.";
 }
 if (x.includes("description")) {
 return "Add HTML formatting and A+ content.";
 }
 return "Review and update based on competitor analysis.";
 }

 return (
 <div>
 <h3 className="font-heading text-lg font-semibold text-foreground">
 Your listing fix list
 </h3>
 <p className="mt-1 text-sm text-muted-foreground">
 In order of impact — fix these first
 </p>
 <ol className="mt-4 space-y-3">
 {weaknesses.map((w, i) => (
 <li
 key={i}
 className="flex gap-3 rounded-xl border border-border bg-card p-4 shadow-sm"
 >
 <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-heading text-sm font-bold text-primary">
 {i + 1}
 </span>
 <div>
 <p className="text-sm text-foreground">{w}</p>
 <p className="mt-1 text-xs font-medium text-primary">
 → Fix: {suggestion(w)}
 </p>
 </div>
 </li>
 ))}
 </ol>
 </div>
 );
}
