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
 className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-left text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-foreground/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
 >
 <span className="max-w-[220px] truncate sm:max-w-xs">{q}</span>
 <FaArrowRight className="size-3 shrink-0 text-muted-foreground/75" aria-hidden />
 </button>
 ))}
 </div>
 );
}
