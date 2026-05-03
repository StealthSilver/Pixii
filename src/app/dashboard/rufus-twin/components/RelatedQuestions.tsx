"use client";

import { FaArrowRight } from "react-icons/fa";

type RelatedQuestionsProps = {
  questions: string[];
  disabled?: boolean;
  onSelect: (q: string) => void;
};

export function RelatedQuestions({
  questions,
  disabled,
  onSelect,
}: RelatedQuestionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {questions.map((q) => (
        <button
          key={q}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(q)}
          className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/90 px-3 py-1.5 text-left text-xs font-medium text-foreground shadow-sm ring-1 ring-black/[0.04] transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 dark:ring-white/[0.06]"
        >
          <span className="max-w-[220px] truncate sm:max-w-xs">{q}</span>
          <FaArrowRight
            className="size-3 shrink-0 text-muted-foreground/75"
            aria-hidden
          />
        </button>
      ))}
    </div>
  );
}
