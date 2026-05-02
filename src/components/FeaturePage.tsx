import type { ReactNode } from "react";

type FeaturePageProps = {
  title: string;
  children?: ReactNode;
};

export function FeaturePage({ title, children }: FeaturePageProps) {
  return (
    <main className="min-h-full bg-background px-4 py-6 md:px-6">
      <h1 className="font-heading text-2xl font-semibold tracking-tight text-black">
        {title}
      </h1>
      {children}
    </main>
  );
}
