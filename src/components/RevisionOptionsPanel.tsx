import React from 'react';
import { Check, GitBranch } from 'lucide-react';
import { PaperTypeface, PendingRevisionChoice, RevisionOption } from '../types/letter';

interface RevisionOptionsPanelProps {
  pendingRevision: PendingRevisionChoice;
  paperTypeface: PaperTypeface;
  onUpdateOptionBody: (index: 0 | 1, updatedBody: string) => void;
  onSelectOption: (option: RevisionOption) => void;
  onDismiss: () => void;
}

export const RevisionOptionsPanel: React.FC<RevisionOptionsPanelProps> = ({
  pendingRevision,
  paperTypeface,
  onUpdateOptionBody,
  onSelectOption,
  onDismiss,
}) => {
  const { instruction, ambiguityExplanation, options } = pendingRevision;

  return (
    <div
      role="region"
      aria-labelledby="revision-options-heading"
      className="no-print bg-white border border-blue-200/90 rounded-xl p-5 sm:p-6 space-y-5"
    >
      {/* Header explaining why we do not guess */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-blue-900">
          <GitBranch className="w-3.5 h-3.5 shrink-0" />
          <span>Revision Request Needs Your Choice</span>
          <span aria-hidden="true">·</span>
          <span>Two Approaches Prepared</span>
        </div>

        <div className="space-y-1">
          <h3
            id="revision-options-heading"
            className="font-letter-serif text-lg font-semibold text-slate-900"
          >
            Choose How to Apply “{instruction}”
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            {ambiguityExplanation}{' '}
            Rather than guessing, we prepared two distinct revisions below. Compare how their tone and emphasis differ, adjust any wording directly if needed, and choose the version you want—or keep your current draft.
          </p>
        </div>
      </div>

      {/* Side-by-Side Comparison of Option A and Option B */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 pt-1">
        {options.map((option, idx) => {
          const optionIndex = idx as 0 | 1;
          const optionTag = idx === 0 ? 'Option A' : 'Option B';
          const wordCount = option.letterBody.trim()
            ? option.letterBody.trim().split(/\s+/).length
            : 0;

          return (
            <div
              key={option.id || idx}
              className="flex flex-col justify-between rounded-lg border border-slate-200 bg-slate-50/50 p-4 space-y-3.5"
            >
              <div className="space-y-3">
                {/* Option Title & Unboxed Word Count */}
                <div className="flex items-baseline justify-between gap-3 border-b border-slate-200/80 pb-2.5">
                  <h4 className="text-sm font-semibold text-slate-900">
                    {optionTag} · {option.label}
                  </h4>
                  <span className="text-xs font-mono tabular-nums text-slate-400 shrink-0">
                    {wordCount} words
                  </span>
                </div>

                {/* Tone & Emphasis Difference Explanation */}
                <div className="space-y-1">
                  <span className="block text-xs font-semibold text-slate-700">
                    How Tone & Emphasis Differ
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {option.toneAndEmphasis}
                  </p>
                </div>

                {/* Editable Wording Preview */}
                <div className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <label
                      htmlFor={`revision-option-textarea-${idx}`}
                      className="text-xs font-medium text-slate-600"
                    >
                      Draft Wording (Editable)
                    </label>
                    <span className="text-xs text-slate-400 truncate max-w-[200px]">
                      Re: {option.subject}
                    </span>
                  </div>
                  <textarea
                    id={`revision-option-textarea-${idx}`}
                    rows={10}
                    value={option.letterBody}
                    onChange={(e) => onUpdateOptionBody(optionIndex, e.target.value)}
                    spellCheck={true}
                    className={`w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-[13.5px] leading-relaxed text-slate-900 focus:border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-900/15 resize-y ${
                      paperTypeface === PaperTypeface.Serif ? 'font-letter-serif' : 'font-sans'
                    }`}
                  />
                </div>
              </div>

              {/* Choose Option Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => onSelectOption(option)}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-white bg-[#1E3A8A] hover:bg-[#172E6E] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-900"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Use {optionTag} in Editor</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Control: Keep Original Draft */}
      <div className="pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-xs text-slate-500 leading-relaxed">
          Your current letter below has not been changed. After choosing an option, you still retain complete manual control over every word on the stationery sheet.
        </p>

        <button
          type="button"
          onClick={onDismiss}
          className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-auto"
        >
          Keep Current Draft
        </button>
      </div>
    </div>
  );
};
