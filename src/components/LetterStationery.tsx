import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Copy, Download, Loader2, Printer, RotateCcw } from 'lucide-react';
import { PaperTypeface, PendingRevisionChoice, RevisionOption } from '../types/letter';
import { RevisionOptionsPanel } from './RevisionOptionsPanel';

interface LetterStationeryProps {
  subject: string;
  letterBody: string;
  editorialNote: string;
  paperTypeface: PaperTypeface;
  isGenerating: boolean;
  isRefining: boolean;
  canUndoRevision: boolean;
  lastSavedLabel: string;
  pendingRevision: PendingRevisionChoice | null;
  revisionError?: string | null;
  onSubjectChange: (value: string) => void;
  onLetterBodyChange: (value: string) => void;
  onTypefaceChange: (typeface: PaperTypeface) => void;
  onRefine: (instruction: string, isPresetAction?: boolean) => Promise<boolean>;
  onUpdateRevisionOptionBody: (index: 0 | 1, updatedBody: string) => void;
  onSelectRevisionOption: (option: RevisionOption) => void;
  onDismissRevisionOptions: () => void;
  onUndoRevision: () => void;
}

const REFINEMENT_ACTIONS = [
  { label: 'More Concise', instruction: 'Make the letter ~25% more concise while keeping all facts, dates, and the requested resolution.' },
  { label: 'Softer Tone', instruction: 'Make the tone warmer, more diplomatic, and relationship-preserving without weakening the core request.' },
  { label: 'Firmer Stance', instruction: 'Make the tone firmer, more direct, and unambiguous regarding expectations and timeline.' },
  { label: 'Polish Grammar', instruction: 'Tighten phrasing, improve formal transitions, and ensure impeccable grammar and punctuation.' },
];

const PLACEHOLDER_LETTER = `[Your Name]
[Your Street Address]
[City, State ZIP Code]
[Email Address · Phone Number]

November 10, 2026

[Recipient Name or Department]
[Organization Name]
[Street Address]
[City, State ZIP Code]

Re: [Subject or Account Reference]

Dear [Recipient Name or Hiring / Resolution Team],

Describe your problem on the left and click "Generate Letter" to compose a complete, structured formal letter here—or click anywhere on this page to begin typing and editing directly.

Every generated letter is fully editable right on this stationery sheet before you copy, download, or print it.

Sincerely,

[Your Name]`;

export const LetterStationery: React.FC<LetterStationeryProps> = ({
  subject,
  letterBody,
  editorialNote,
  paperTypeface,
  isGenerating,
  isRefining,
  canUndoRevision,
  lastSavedLabel,
  pendingRevision,
  revisionError,
  onSubjectChange,
  onLetterBodyChange,
  onTypefaceChange,
  onRefine,
  onUpdateRevisionOptionBody,
  onSelectRevisionOption,
  onDismissRevisionOptions,
  onUndoRevision,
}) => {
  const [copied, setCopied] = useState(false);
  const [customInstruction, setCustomInstruction] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(520, el.scrollHeight)}px`;
  }, [letterBody, paperTypeface]);

  const hasContent = letterBody.trim().length > 0;
  const wordCount = hasContent ? letterBody.trim().split(/\s+/).length : 0;
  const charCount = letterBody.length;
  const readMinutes = wordCount > 0 ? Math.max(1, Math.round(wordCount / 200)) : 0;

  const handleCopy = async () => {
    if (!hasContent) return;
    try {
      await navigator.clipboard.writeText(letterBody);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.select();
        document.execCommand('copy');
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const handleDownloadTxt = () => {
    if (!hasContent) return;
    const slug = (subject || 'formal-letter')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48);
    const blob = new Blob([letterBody], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${slug || 'formal-letter'}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    if (!hasContent) return;
    window.print();
  };

  const handleCustomRevisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customInstruction.trim();
    if (!trimmed || !hasContent || isRefining || isGenerating) return;
    const ok = await onRefine(trimmed, false);
    if (ok) {
      setCustomInstruction('');
    }
  };

  return (
    <section aria-labelledby="preview-heading" className="flex flex-col space-y-3">
      {/* Toolbar above stationery sheet */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="preview-heading" className="text-sm font-semibold text-slate-800 mr-1">
            Editable Letter Preview
          </h2>

          {/* Paper Typeface Switch */}
          <div
            role="group"
            aria-label="Letter typeface"
            className="inline-flex items-center p-0.5 bg-slate-200/70 rounded-lg"
          >
            <button
              type="button"
              onClick={() => onTypefaceChange(PaperTypeface.Serif)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                paperTypeface === PaperTypeface.Serif
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Serif
            </button>
            <button
              type="button"
              onClick={() => onTypefaceChange(PaperTypeface.Sans)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                paperTypeface === PaperTypeface.Sans
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sans
            </button>
          </div>
        </div>

        {/* Export / Copy Actions */}
        <div className="flex items-center gap-2">
          {canUndoRevision && (
            <button
              type="button"
              onClick={onUndoRevision}
              title="Restore previous version"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Undo</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            disabled={!hasContent}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-45 disabled:cursor-not-allowed border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-700" />
                <span className="text-emerald-800">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownloadTxt}
            disabled={!hasContent}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-45 disabled:cursor-not-allowed border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .txt</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            disabled={!hasContent}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-45 disabled:cursor-not-allowed border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Post-Draft Revision Bar when letter content exists */}
      {hasContent && (
        <div className="no-print bg-white border border-slate-200/90 rounded-xl p-4 space-y-3">
          <form onSubmit={handleCustomRevisionSubmit} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <label
                htmlFor="custom-revision-input"
                className="text-xs font-semibold text-slate-800"
              >
                Revise Draft
              </label>
              <span className="text-xs text-slate-400">
                Unclear requests present 2 options rather than guessing
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                id="custom-revision-input"
                type="text"
                value={customInstruction}
                onChange={(e) => setCustomInstruction(e.target.value)}
                disabled={isRefining || isGenerating}
                placeholder="Describe a change (e.g., 'Make it stronger', 'Adjust the tone', or 'Replace [COURSE] with ECON 302')..."
                className="flex-1 min-w-0 rounded-lg border border-slate-300 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-900/15 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={isRefining || isGenerating || !customInstruction.trim()}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1E3A8A] hover:bg-[#172E6E] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {isRefining ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Preparing Revision...</span>
                  </>
                ) : (
                  <>
                    <span>Request Revision</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-slate-500 mr-1">Quick adjustments:</span>
              {REFINEMENT_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  disabled={isRefining || isGenerating}
                  onClick={() => {
                    void onRefine(action.instruction, true);
                  }}
                  className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-blue-900 hover:bg-slate-100 disabled:opacity-50 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {action.label}
                </button>
              ))}
            </div>
            {isRefining && (
              <span className="inline-flex items-center gap-1.5 text-xs text-blue-900 font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Analyzing & revising...</span>
              </span>
            )}
          </div>

          {revisionError && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50/80 px-3.5 py-2.5 text-xs text-red-800 leading-relaxed"
            >
              {revisionError}
            </div>
          )}
        </div>
      )}

      {/* Two-Option Revision Comparison when request is unclear / open to interpretation */}
      {hasContent && pendingRevision && (
        <RevisionOptionsPanel
          pendingRevision={pendingRevision}
          paperTypeface={paperTypeface}
          onUpdateOptionBody={onUpdateRevisionOptionBody}
          onSelectOption={onSelectRevisionOption}
          onDismiss={onDismissRevisionOptions}
        />
      )}

      {/* Archival Stationery Sheet */}
      <div className="print-only-sheet bg-white border border-slate-200/90 shadow-xs rounded-xl px-7 py-8 sm:px-12 sm:py-11 transition-opacity duration-150">
        {isGenerating && !hasContent ? (
          /* Skeleton Loader matching formal full-block letter geometry */
          <div aria-live="polite" aria-busy="true" className="space-y-7 py-2 animate-pulse max-w-[68ch]">
            <div className="space-y-2">
              <div className="h-3.5 w-36 bg-slate-200 rounded" />
              <div className="h-3 w-52 bg-slate-100 rounded" />
              <div className="h-3 w-44 bg-slate-100 rounded" />
            </div>
            <div className="h-3.5 w-32 bg-slate-200 rounded" />
            <div className="space-y-2">
              <div className="h-3.5 w-48 bg-slate-200 rounded" />
              <div className="h-3 w-56 bg-slate-100 rounded" />
            </div>
            <div className="h-4 w-3/4 bg-slate-200 rounded" />
            <div className="space-y-2.5 pt-2">
              <div className="h-3.5 w-full bg-slate-100 rounded" />
              <div className="h-3.5 w-11/12 bg-slate-100 rounded" />
              <div className="h-3.5 w-full bg-slate-100 rounded" />
              <div className="h-3.5 w-4/5 bg-slate-100 rounded" />
            </div>
            <div className="space-y-2.5">
              <div className="h-3.5 w-full bg-slate-100 rounded" />
              <div className="h-3.5 w-10/12 bg-slate-100 rounded" />
              <div className="h-3.5 w-3/4 bg-slate-100 rounded" />
            </div>
            <div className="space-y-3 pt-4">
              <div className="h-3.5 w-24 bg-slate-200 rounded" />
              <div className="h-3.5 w-36 bg-slate-200 rounded mt-6" />
            </div>
          </div>
        ) : (
          <div className="max-w-[68ch] mx-auto">
            {/* Editable Document Subject Header (non-printed helper strip) */}
            <div className="no-print mb-6 pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <label htmlFor="letter-subject-input" className="sr-only">
                  Document Title / Subject
                </label>
                <input
                  id="letter-subject-input"
                  type="text"
                  value={subject}
                  onChange={(e) => onSubjectChange(e.target.value)}
                  placeholder="Untitled Formal Letter — Click anywhere below to edit text"
                  className="w-full text-xs font-medium text-slate-600 placeholder:text-slate-400 bg-transparent focus:text-slate-900 focus:outline-none truncate"
                />
              </div>
              <span className="text-xs text-slate-400 shrink-0">
                Final wording control · Click letter text to edit directly
              </span>
            </div>

            {/* Directly Editable Letter Manuscript */}
            <label htmlFor="editable-letter-preview" className="sr-only">
              Editable formal letter content
            </label>
            <textarea
              ref={textareaRef}
              id="editable-letter-preview"
              value={letterBody}
              onChange={(e) => onLetterBodyChange(e.target.value)}
              spellCheck={true}
              placeholder={PLACEHOLDER_LETTER}
              className={`w-full bg-transparent border-0 p-0 text-[15.5px] leading-[1.78] text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-0 resize-none overflow-hidden ${
                paperTypeface === PaperTypeface.Serif ? 'font-letter-serif' : 'font-sans'
              }`}
            />
          </div>
        )}
      </div>

      {/* Unboxed Metadata & Editorial Note Footer */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 text-xs text-slate-500">
        <div className="leading-relaxed">
          {editorialNote ? (
            <span>Note: {editorialNote}</span>
          ) : (
            <span>Full-block correspondence layout · Ready for personal signature or PDF print</span>
          )}
        </div>

        <div className="flex items-center gap-2 font-mono tabular-nums text-slate-400 shrink-0">
          {hasContent ? (
            <>
              <span>{wordCount} words</span>
              <span aria-hidden="true">·</span>
              <span>{charCount.toLocaleString()} chars</span>
              <span aria-hidden="true">·</span>
              <span>~{readMinutes} min read</span>
              {lastSavedLabel && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{lastSavedLabel}</span>
                </>
              )}
            </>
          ) : (
            <span>0 words · Awaiting draft</span>
          )}
        </div>
      </div>
    </section>
  );
};
