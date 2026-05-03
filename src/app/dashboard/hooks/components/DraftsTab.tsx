"use client";

import { useCallback, useEffect, useState } from "react";
import { FaInbox } from "react-icons/fa";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import type { DraftJson } from "../types";

function platformPillClass(platform: string): string {
 switch (platform) {
 case "Twitter":
 return "border-blue-200 bg-blue-50 text-blue-700";
 case "TikTok":
 return "border-pink-200 bg-pink-50 text-pink-700";
 case "Instagram":
 return "border-rose-200 bg-rose-50 text-rose-800";
 case "LinkedIn":
 return "border-indigo-200 bg-indigo-50 text-indigo-800";
 default:
 return "border-border bg-muted text-foreground/90";
 }
}

type DraftsTabProps = {
 drafts: DraftJson[] | undefined;
 loading: boolean;
 error: Error | undefined;
 onRefresh: () => void;
 onToast: (message: string, variant: "success" | "error") => void;
};

export function DraftsTab({
 drafts,
 loading,
 error,
 onRefresh,
 onToast,
}: DraftsTabProps) {
 const [expanded, setExpanded] = useState<Record<string, boolean>>({});
 const [confirmId, setConfirmId] = useState<string | null>(null);
 const [copiedId, setCopiedId] = useState<string | null>(null);

 useEffect(() => {
 if (copiedId === null) {
 return;
 }
 const t = window.setTimeout(() => setCopiedId(null), 2000);
 return () => window.clearTimeout(t);
 }, [copiedId]);

 const toggleExpand = useCallback((id: string) => {
 setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
 }, []);

 const handleDelete = async (id: string) => {
 try {
 const res = await fetch(`/api/hooks/drafts/${id}`, { method: "DELETE" });
 const data = (await res.json()) as { error?: string };
 if (!res.ok) {
 throw new Error(data.error ?? "Delete failed");
 }
 onToast("Draft deleted", "success");
 setConfirmId(null);
 onRefresh();
 } catch (e) {
 const msg = e instanceof Error ? e.message : "Delete failed";
 onToast(msg, "error");
 }
 };

 const copyContent = async (draftId: string, text: string) => {
 try {
 await navigator.clipboard.writeText(text);
 setCopiedId(draftId);
 } catch {
 onToast("Could not copy — try again.", "error");
 }
 };

 if (loading && !drafts) {
 return (
 <div className="space-y-3">
 {[0, 1, 2].map((i) => (
 <div
 key={i}
 className="animate-pulse rounded-xl border border-border/80 bg-card p-4"
 >
 <div className="h-4 w-1/3 rounded bg-border" />
 <div className="mt-3 h-3 w-full rounded bg-foreground/10" />
 <div className="mt-2 h-3 w-[92%] rounded bg-foreground/10" />
 </div>
 ))}
 </div>
 );
 }

 if (error) {
 return (
 <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
 {error.message}
 </p>
 );
 }

 if (!drafts?.length) {
 return (
 <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/60 px-6 py-10 text-center">
 <FaInbox className="size-12 text-muted-foreground/55" aria-hidden />
 <p className="font-heading text-base font-semibold text-foreground">
 No saved drafts yet
 </p>
 <p className="max-w-md text-sm text-muted-foreground">
 Generate posts and save them here.
 </p>
 </div>
 );
 }

 return (
 <ul className="space-y-4">
 {drafts.map((d) => {
 const isOpen = expanded[d._id];
 const lines = d.content.split("\n");
 const preview = isOpen ? d.content : lines.slice(0, 3).join("\n");
 const truncated = !isOpen && lines.length > 3;

 return (
 <li
 key={d._id}
 className="rounded-xl border border-border/80 bg-card p-4 shadow-sm"
 >
 <div className="flex flex-wrap items-center gap-2">
 <span
 className={
 "rounded-full border px-2 py-0.5 text-[11px] font-semibold " +
 platformPillClass(d.platform)
 }
 >
 {d.platform}
 </span>
 <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-semibold text-foreground/90">
 {d.tone}
 </span>
 <span className="text-xs text-muted-foreground">
 {formatRelativeTime(d.createdAt)}
 </span>
 </div>
 <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
 {preview}
 {truncated ? "…" : ""}
 </p>
 {lines.length > 3 ? (
 <button
 type="button"
 onClick={() => toggleExpand(d._id)}
 className="mt-2 text-xs font-semibold text-primary hover:underline"
 >
 {isOpen ? "Show less" : "Show more"}
 </button>
 ) : null}
 <p className="mt-2 text-xs text-muted-foreground">
 Pattern: {d.patternName}
 </p>
 <div className="mt-4 flex flex-wrap items-center gap-2">
 <button
 type="button"
 onClick={() => void copyContent(d._id, d.content)}
 className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-foreground/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35"
 >
 {copiedId === d._id ? "Copied" : "Copy"}
 </button>
 {confirmId === d._id ? (
 <span className="inline-flex flex-wrap items-center gap-2 text-xs">
 <span className="font-medium text-foreground/90">
 Are you sure?
 </span>
 <button
 type="button"
 onClick={() => void handleDelete(d._id)}
 className="rounded-lg bg-red-600 px-3 py-1.5 font-semibold text-white hover:bg-red-700"
 >
 Confirm
 </button>
 <button
 type="button"
 onClick={() => setConfirmId(null)}
 className="rounded-lg border border-border px-3 py-1.5 font-semibold text-foreground hover:bg-foreground/[0.06]"
 >
 Cancel
 </button>
 </span>
 ) : (
 <button
 type="button"
 onClick={() => setConfirmId(d._id)}
 className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800 transition-colors hover:bg-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300"
 >
 Delete
 </button>
 )}
 </div>
 </li>
 );
 })}
 </ul>
 );
}
