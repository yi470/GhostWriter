import React from 'react';
import { AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { CaseSummary } from '../types/letter';

interface SummaryConfirmationPanelProps {
  summary: CaseSummary;
  isGenerating: boolean;
  onSummaryChange: (updated: CaseSummary) => void;
  onConfirmAndGenerate: () => void;
  onBackToDetails: () => void;
}

export const SummaryConfirmationPanel: React.FC<SummaryConfirmationPanelProps> = ({
  summary,
  isGenerating,
  onSummaryChange,
  onConfirmAndGenerate,
  onBackToDetails,
}) => {
  const canConfirm =
    summary.situation.trim().length > 0 &&
    summary.impact.trim().length > 0 &&
    summary.requestedResolution.trim().length > 0;

  return (
    <div
      role="region"
      aria-labelledby="summary-confirmation-heading"
      className="rounded-xl border border-amber-300/80 bg-amber-50/35 p-5 space-y-4"
    >
      {/* Unverified Header & Explicit Notice (clean unboxed metadata, zero static pills) */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-medium text-amber-800">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>Draft Summary</span>
          <span aria-hidden="true">·</span>
          <span>Pending Your Confirmation (Not Yet Verified)</span>
        </div>

        <div className="space-y-1">
          <h2
            id="summary-confirmation-heading"
            className="font-letter-serif text-lg font-semibold text-slate-900"
          >
            Review & Confirm Before Drafting
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Check the summarized situation, impact, and requested resolution below. Edit any box directly to correct facts or replace bracketed placeholders—this summary is not treated as verified until you confirm it.
          </p>
        </div>
      </div>

      {/* Editable Summary Fields */}
      <div className="space-y-3.5 pt-1">
        <div className="space-y-1">
          <div className="flex items-baseline justify-between gap-2">
            <label htmlFor="confirm-situation-input" className="text-xs font-semibold text-slate-800">
              1. Situation
            </label>
            <span className="text-xs text-slate-400">Editable</span>
          </div>
          <textarea
            id="confirm-situation-input"
            rows={3}
            value={summary.situation}
            onChange={(e) => onSummaryChange({ ...summary, situation: e.target.value })}
            placeholder="Summarize what happened and relevant dates or identifiers..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 leading-relaxed focus:border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-900/15 resize-y"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-baseline justify-between gap-2">
            <label htmlFor="confirm-impact-input" className="text-xs font-semibold text-slate-800">
              2. Impact
            </label>
            <span className="text-xs text-slate-400">Editable</span>
          </div>
          <textarea
            id="confirm-impact-input"
            rows={2}
            value={summary.impact}
            onChange={(e) => onSummaryChange({ ...summary, impact: e.target.value })}
            placeholder="Describe how this situation affects you..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 leading-relaxed focus:border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-900/15 resize-y"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-baseline justify-between gap-2">
            <label htmlFor="confirm-resolution-input" className="text-xs font-semibold text-slate-800">
              3. Requested Resolution
            </label>
            <span className="text-xs text-slate-400">Editable</span>
          </div>
          <textarea
            id="confirm-resolution-input"
            rows={2}
            value={summary.requestedResolution}
            onChange={(e) => onSummaryChange({ ...summary, requestedResolution: e.target.value })}
            placeholder="Specify the action, remedy, or adjustment you are requesting..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 leading-relaxed focus:border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-900/15 resize-y"
          />
        </div>

        {summary.keyFacts && summary.keyFacts.length > 0 && (
          <div className="pt-2 border-t border-amber-200/70 space-y-1">
            <span className="text-xs font-medium text-slate-600 block">
              Factual Details & Placeholders Noted in Draft:
            </span>
            <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside leading-relaxed">
              {summary.keyFacts.map((fact, idx) => (
                <li key={idx}>{fact}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Confirmation Actions */}
      <div className="pt-3 border-t border-amber-200/70 flex flex-wrap items-center justify-between gap-2.5">
        <button
          type="button"
          onClick={onBackToDetails}
          disabled={isGenerating}
          className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 disabled:opacity-50 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Back to Details
        </button>

        <button
          type="button"
          onClick={onConfirmAndGenerate}
          disabled={isGenerating || !canConfirm}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#1E3A8A] hover:bg-[#172E6E] disabled:opacity-55 disabled:cursor-not-allowed rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Drafting Formal Letter...</span>
            </>
          ) : (
            <>
              <span>Confirm Summary & Generate Letter</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
