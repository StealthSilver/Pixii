"use client";

type ToastProps = {
  message: string;
  variant: "success" | "error" | "info";
  onDismiss: () => void;
};

export function Toast({ message, variant, onDismiss }: ToastProps) {
  const variantClass =
    variant === "success"
      ? "border-emerald-200/90 bg-card text-emerald-950 shadow-lg ring-1 ring-black/[0.04] dark:border-emerald-500/35 dark:bg-card dark:text-emerald-100 dark:ring-white/[0.06]"
      : variant === "info"
        ? "border-sky-200/90 bg-card text-sky-950 shadow-lg ring-1 ring-black/[0.04] dark:border-sky-500/35 dark:bg-card dark:text-sky-100 dark:ring-white/[0.06]"
        : "border-red-200/90 bg-card text-red-950 shadow-lg ring-1 ring-black/[0.04] dark:border-red-500/35 dark:bg-card dark:text-red-100 dark:ring-white/[0.06]";
  return (
    <div
      role="status"
      className={
        "fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 " +
        variantClass
      }
    >
      <p className="flex-1 text-sm font-medium leading-snug">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-foreground/8 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
