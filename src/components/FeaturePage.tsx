import type { ReactNode } from "react";

type FeaturePageProps = {
  title: ReactNode;
  /** Short tagline shown under the title in secondary/muted style. */
  description?: string;
  children?: ReactNode;
};

export function FeaturePage({ title, description, children }: FeaturePageProps) {
  return (
    <main className="min-h-full bg-background px-4 py-6 md:px-6">
      <header className="max-w-2xl">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-black">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            {description}
          </p>
        ) : null}
      </header>
      {children}
    </main>
  );
}
