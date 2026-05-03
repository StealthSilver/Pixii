export function ResultsSkeleton() {
 return (
 <div className="mt-8 space-y-6">
 <div className="animate-pulse rounded-xl border border-border bg-card p-6">
 <div className="mx-auto flex max-w-xl flex-col items-center gap-4 sm:flex-row sm:justify-center">
 <div className="size-36 rounded-full bg-border" />
 <div className="flex-1 space-y-2">
 <div className="h-5 w-40 rounded bg-border" />
 <div className="h-3 w-full max-w-md rounded bg-foreground/10" />
 <div className="flex gap-2 pt-2">
 <div className="h-7 w-20 rounded-full bg-foreground/10" />
 <div className="h-7 w-20 rounded-full bg-foreground/10" />
 <div className="h-7 w-24 rounded-full bg-foreground/10" />
 </div>
 </div>
 </div>
 </div>
 <div className="grid gap-4 md:grid-cols-3">
 {[0, 1, 2].map((i) => (
 <div
 key={i}
 className="animate-pulse rounded-xl border border-border bg-card p-4"
 >
 <div className="h-4 w-24 rounded bg-border" />
 <div className="mt-4 h-10 w-16 rounded bg-foreground/10" />
 <div className="mt-4 h-16 w-full rounded bg-foreground/10" />
 <div className="mt-3 h-9 w-full rounded-lg bg-foreground/10" />
 </div>
 ))}
 </div>
 <div className="animate-pulse rounded-xl border border-border bg-card p-5">
 <div className="h-4 w-48 rounded bg-border" />
 <div className="mt-4 space-y-2">
 <div className="h-3 w-full rounded bg-foreground/10" />
 <div className="h-3 w-5/6 rounded bg-foreground/10" />
 <div className="h-3 w-2/3 rounded bg-foreground/10" />
 </div>
 </div>
 <div className="grid gap-3 sm:grid-cols-2">
 {[0, 1, 2, 3].map((i) => (
 <div
 key={i}
 className="animate-pulse rounded-lg border border-border bg-card p-4"
 >
 <div className="h-4 w-full rounded bg-foreground/10" />
 <div className="mt-2 h-4 w-5/6 rounded bg-foreground/10" />
 </div>
 ))}
 </div>
 </div>
 );
}
