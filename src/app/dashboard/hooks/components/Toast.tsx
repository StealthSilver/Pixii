"use client";

type ToastProps = {
 message: string;
 variant: "success" | "error" | "info";
 onDismiss: () => void;
};

export function Toast({ message, variant, onDismiss }: ToastProps) {
 const variantClass =
 variant === "success"
 ? "border-emerald-200 bg-card text-emerald-900"
 : variant === "info"
 ? "border-sky-200 bg-card text-sky-950"
 : "border-red-200 bg-card text-red-900";
 return (
 <div
 role="status"
 className={
 "fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-lg " +
 variantClass
 }
 >
 <p className="flex-1 text-sm font-medium leading-snug">{message}</p>
 <button
 type="button"
 onClick={onDismiss}
 className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35"
 aria-label="Dismiss"
 >
 ×
 </button>
 </div>
 );
}
