import React from 'react';
import { HelpCircle, Loader2, ArrowRight } from 'lucide-react';
import { ClarificationQuestion } from '../types/letter';

interface ClarificationPanelProps {
  questions: ClarificationQuestion[];
  answers: Record<string, string>;
  isSummarizing: boolean;
  onAnswerChange: (id: string, value: string) => void;
  onProceedWithAnswers: () => void;
  onProceedWithPlaceholders: () => void;
  onCancel: () => void;
}

export const ClarificationPanel: React.FC<ClarificationPanelProps> = ({
  questions,
  answers,
  isSummarizing,
  onAnswerChange,
  onProceedWithAnswers,
  onProceedWithPlaceholders,
  onCancel,
}) => {
  const answeredCount = Object.values(answers).filter((v) => v && v.trim()).length;

  return (
    <div
      role="region"
      aria-labelledby="clarification-heading"
      className="rounded-xl border border-blue-200/90 bg-blue-50/40 p-5 space-y-4 transition-opacity"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-blue-900 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 id="clarification-heading" className="text-sm font-semibold text-slate-900">
              Clarify Missing Factual Details
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Providing these specifics helps build an accurate case summary. Any field left blank will use a clearly visible placeholder—details are never invented.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3.5 pt-1">
        {questions.map((q) => (
          <div key={q.id} className="space-y-1">
            <div className="flex items-baseline justify-between gap-2">
              <label htmlFor={`clarify-${q.id}`} className="text-xs font-semibold text-slate-800">
                {q.field}
              </label>
              <span className="text-xs text-slate-400 font-mono">
                If skipped: {q.placeholderHint}
              </span>
            </div>
            <p className="text-xs text-slate-600">{q.question}</p>
            <input
              id={`clarify-${q.id}`}
              type="text"
              value={answers[q.id] || ''}
              onChange={(e) => onAnswerChange(q.id, e.target.value)}
              placeholder={`Example: ${q.example}`}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-900/15"
            />
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-blue-200/60 flex flex-wrap items-center justify-between gap-2.5">
        <button
          type="button"
          onClick={onProceedWithPlaceholders}
          disabled={isSummarizing}
          className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 disabled:opacity-50 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Skip & Use Placeholders
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSummarizing}
            className="px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Back
          </button>

          <button
            type="button"
            onClick={onProceedWithAnswers}
            disabled={isSummarizing}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1E3A8A] hover:bg-[#172E6E] disabled:opacity-55 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isSummarizing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Preparing Summary...</span>
              </>
            ) : (
              <>
                <span>
                  {answeredCount > 0
                    ? `Continue to Summary (${answeredCount} added)`
                    : 'Continue to Summary'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
