"use client";

type ConnectionBarProps = {
 shopName: string;
 shopDomain: string;
 onDisconnect: () => void;
};

export function ConnectionBar({ shopName, shopDomain, onDisconnect }: ConnectionBarProps) {
 return (
 <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200/90 bg-emerald-50/70 px-4 py-2.5 text-sm ring-1 ring-black/[0.03] dark:border-emerald-500/30 dark:bg-emerald-950/35 dark:ring-emerald-500/15">
 <div className="flex min-w-0 items-center gap-2">
 <span className="size-2 shrink-0 rounded-full bg-emerald-500" aria-hidden />
 <span className="font-medium text-foreground">
 Connected to <span className="text-emerald-900 dark:text-emerald-100">{shopName}</span>
 </span>
 <span className="hidden text-muted-foreground sm:inline">·</span>
 <span className="truncate text-xs text-muted-foreground">{shopDomain}</span>
 </div>
 <button
 type="button"
 onClick={() => void onDisconnect()}
 className="shrink-0 text-xs font-semibold text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
 >
 Disconnect
 </button>
 </div>
 );
}
