import React, { useState } from 'react';
import { Check, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import {
  CaseSummary,
  ClarificationQuestion,
  IntakeStage,
  LetterParties,
  LetterTone,
  ScenarioPreset,
} from '../types/letter';
import { SCENARIO_PRESETS } from '../data/presets';
import { ClarificationPanel } from './ClarificationPanel';
import { SummaryConfirmationPanel } from './SummaryConfirmationPanel';

interface ProblemComposerProps {
  problem: string;
  tone: LetterTone;
  parties: LetterParties;
  intakeStage: IntakeStage;
  isAnalyzing: boolean;
  isSummarizing: boolean;
  isGenerating: boolean;
  clarificationQuestions: ClarificationQuestion[] | null;
  clarificationAnswers: Record<string, string>;
  pendingSummary: CaseSummary | null;
  confirmedSummary: CaseSummary | null;
  error: string | null;
  onProblemChange: (value: string) => void;
  onToneChange: (tone: LetterTone) => void;
  onPartiesChange: (parties: LetterParties) => void;
  onApplyPreset: (preset: ScenarioPreset) => void;
  onAnswerClarification: (id: string, value: string) => void;
  onProceedWithClarifications: () => void;
  onProceedWithPlaceholders: () => void;
  onCancelClarifications: () => void;
  onPendingSummaryChange: (summary: CaseSummary) => void;
  onConfirmSummaryAndGenerate: () => void;
  onBackFromConfirmation: () => void;
  onReopenConfirmedSummary: () => void;
  onStartIntake: () => void;
}

const TONE_OPTIONS: { value: LetterTone; hint: string }[] = [
  { value: LetterTone.Diplomatic, hint: 'Measured, polite, collaborative' },
  { value: LetterTone.Firm, hint: 'Direct, assertive, deadline-oriented' },
  { value: LetterTone.Conciliatory, hint: 'Constructive, relationship-focused' },
  { value: LetterTone.Urgent, hint: 'Time-sensitive, high priority' },
];

export const ProblemComposer: React.FC<ProblemComposerProps> = ({
  problem,
  tone,
  parties,
  intakeStage,
  isAnalyzing,
  isSummarizing,
  isGenerating,
  clarificationQuestions,
  clarificationAnswers,
  pendingSummary,
  confirmedSummary,
  error,
  onProblemChange,
  onToneChange,
  onPartiesChange,
  onApplyPreset,
  onAnswerClarification,
  onProceedWithClarifications,
  onProceedWithPlaceholders,
  onCancelClarifications,
  onPendingSummaryChange,
  onConfirmSummaryAndGenerate,
  onBackFromConfirmation,
  onReopenConfirmedSummary,
  onStartIntake,
}) => {
  const [showParties, setShowParties] = useState(false);
  const [showConfirmedDetails, setShowConfirmedDetails] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (intakeStage === IntakeStage.ConfirmSummary && pendingSummary) {
      onConfirmSummaryAndGenerate();
    } else if (intakeStage === IntakeStage.Clarify) {
      onProceedWithClarifications();
    } else {
      onStartIntake();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (intakeStage === IntakeStage.Compose) {
        onStartIntake();
      }
    }
  };

  const activeToneHint = TONE_OPTIONS.find((t) => t.value === tone)?.hint ?? '';
  const isBusy = isAnalyzing || isSummarizing || isGenerating;

  return (
    <section
      aria-labelledby="composer-heading"
      className="no-print bg-white border border-slate-200/90 rounded-xl p-6 sm:p-7 flex flex-col justify-between"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step Progress Trail (clean unboxed text with typographic separators) */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span
            className={
              intakeStage === IntakeStage.Compose
                ? 'font-semibold text-slate-900'
                : 'text-slate-500'
            }
          >
            01. Describe Problem
          </span>
          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>
          <span
            className={
              intakeStage === IntakeStage.Clarify
                ? 'font-semibold text-blue-900'
                : 'text-slate-500'
            }
          >
            02. Clarify Details
          </span>
          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>
          <span
            className={
              intakeStage === IntakeStage.ConfirmSummary
                ? 'font-semibold text-amber-800'
                : 'text-slate-500'
            }
          >
            03. Confirm Summary
          </span>
        </div>

        {/* Header */}
        <div className="space-y-1.5">
          <h1
            id="composer-heading"
            className="font-letter-serif text-2xl font-semibold tracking-tight text-slate-900"
          >
            Describe the Problem
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Explain what happened, relevant dates or reference numbers, and the outcome you want. We will check for missing facts and let you confirm a case summary before drafting your letter.
          </p>
        </div>

        {/* Main Problem Input Area */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-4">
            <label htmlFor="problem-description" className="text-sm font-semibold text-slate-800">
              Situation & Desired Resolution
            </label>
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              {problem.trim().length > 0
                ? `${problem.trim().split(/\s+/).length} words`
                : 'Plain language'}
            </span>
          </div>

          <textarea
            id="problem-description"
            rows={intakeStage === IntakeStage.Compose ? 7 : 4}
            value={problem}
            onChange={(e) => onProblemChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Example: My landlord deducted $650 from my security deposit for hallway carpet wear, even though my signed move-in inspection checklist noted the wear two years ago. I would like the $650 refunded within 14 days."
            className="w-full rounded-lg border border-slate-300 bg-slate-50/50 px-4 py-3 text-[15px] leading-relaxed text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-900/15 transition-colors resize-y min-h-[112px]"
          />

          {/* Quick Scenario Examples */}
          {intakeStage === IntakeStage.Compose && (
            <div className="pt-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-slate-500">
                <span className="text-slate-400">Try an example:</span>
                {SCENARIO_PRESETS.slice(0, 3).map((preset, idx) => (
                  <React.Fragment key={preset.id}>
                    {idx > 0 && (
                      <span aria-hidden="true" className="text-slate-300">
                        ·
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => onApplyPreset(preset)}
                      className="text-slate-600 hover:text-blue-900 hover:underline underline-offset-2 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {preset.title
                        .replace(' Request', '')
                        .replace(' Appeal', '')
                        .replace(' Dispute', '')}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tone Selector */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-sm font-semibold text-slate-800">Correspondence Tone</span>
            <span className="text-xs text-slate-500">{activeToneHint}</span>
          </div>
          <div
            role="group"
            aria-label="Correspondence tone"
            className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 bg-slate-100 rounded-lg"
          >
            {TONE_OPTIONS.map((option) => {
              const isSelected = tone === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onToneChange(option.value)}
                  aria-pressed={isSelected}
                  className={`py-2 px-3 text-xs font-semibold rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {option.value}
                </button>
              );
            })}
          </div>
        </div>

        {/* Optional Sender & Recipient Details */}
        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowParties((prev) => !prev)}
            aria-expanded={showParties}
            className="w-full flex items-center justify-between py-1.5 text-left text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <span>Sender & Recipient Details (Optional)</span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>{showParties ? 'Hide fields' : 'Add names & addresses'}</span>
              {showParties ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </span>
          </button>

          {showParties && (
            <div className="mt-4 space-y-4 pt-3 border-t border-slate-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="sender-name"
                    className="block text-xs font-medium text-slate-600 mb-1"
                  >
                    Your Full Name
                  </label>
                  <input
                    id="sender-name"
                    type="text"
                    value={parties.senderName}
                    onChange={(e) =>
                      onPartiesChange({ ...parties, senderName: e.target.value })
                    }
                    placeholder="Jordan Vance"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="letter-date"
                    className="block text-xs font-medium text-slate-600 mb-1"
                  >
                    Letter Date
                  </label>
                  <input
                    id="letter-date"
                    type="text"
                    value={parties.letterDate}
                    onChange={(e) =>
                      onPartiesChange({ ...parties, letterDate: e.target.value })
                    }
                    placeholder="November 12, 2026"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="sender-details"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Your Address & Contact Line
                </label>
                <input
                  id="sender-details"
                  type="text"
                  value={parties.senderDetails}
                  onChange={(e) =>
                    onPartiesChange({ ...parties, senderDetails: e.target.value })
                  }
                  placeholder="742 Evergreen Terrace, Seattle, WA 98101 · jordan@example.com"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="recipient-name"
                    className="block text-xs font-medium text-slate-600 mb-1"
                  >
                    Recipient Name or Department
                  </label>
                  <input
                    id="recipient-name"
                    type="text"
                    value={parties.recipientName}
                    onChange={(e) =>
                      onPartiesChange({ ...parties, recipientName: e.target.value })
                    }
                    placeholder="Property Management Office"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="recipient-org"
                    className="block text-xs font-medium text-slate-600 mb-1"
                  >
                    Organization / Company
                  </label>
                  <input
                    id="recipient-org"
                    type="text"
                    value={parties.recipientOrganization}
                    onChange={(e) =>
                      onPartiesChange({
                        ...parties,
                        recipientOrganization: e.target.value,
                      })
                    }
                    placeholder="Oakridge Residential"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="recipient-address"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Recipient Mailing Address
                </label>
                <input
                  id="recipient-address"
                  type="text"
                  value={parties.recipientDetails}
                  onChange={(e) =>
                    onPartiesChange({ ...parties, recipientDetails: e.target.value })
                  }
                  placeholder="1200 Market Street, Suite 300, Seattle, WA 98101"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-900 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Stage 2: Clarification Panel for Missing Factual Details */}
        {intakeStage === IntakeStage.Clarify &&
          clarificationQuestions &&
          clarificationQuestions.length > 0 && (
            <ClarificationPanel
              questions={clarificationQuestions}
              answers={clarificationAnswers}
              isSummarizing={isSummarizing}
              onAnswerChange={onAnswerClarification}
              onProceedWithAnswers={onProceedWithClarifications}
              onProceedWithPlaceholders={onProceedWithPlaceholders}
              onCancel={onCancelClarifications}
            />
          )}

        {/* Stage 3: Unverified Summary Confirmation Step (before drafting) */}
        {intakeStage === IntakeStage.ConfirmSummary && pendingSummary && (
          <SummaryConfirmationPanel
            summary={pendingSummary}
            isGenerating={isGenerating}
            onSummaryChange={onPendingSummaryChange}
            onConfirmAndGenerate={onConfirmSummaryAndGenerate}
            onBackToDetails={onBackFromConfirmation}
          />
        )}

        {/* Post-Confirmation Summary Reference (only shown AFTER user explicitly confirmed) */}
        {intakeStage === IntakeStage.Compose && confirmedSummary && (
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 font-medium text-emerald-800">
                <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Summary Confirmed by You</span>
              </span>
              <div className="flex items-center gap-2 text-slate-500">
                <button
                  type="button"
                  onClick={() => setShowConfirmedDetails((prev) => !prev)}
                  className="hover:text-slate-900 hover:underline underline-offset-2 cursor-pointer whitespace-nowrap shrink-0"
                >
                  {showConfirmedDetails ? 'Hide summary' : 'View summary'}
                </button>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={onReopenConfirmedSummary}
                  className="text-blue-900 hover:underline underline-offset-2 font-medium cursor-pointer whitespace-nowrap shrink-0"
                >
                  Edit & Regenerate
                </button>
              </div>
            </div>

            {showConfirmedDetails && (
              <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-3.5 space-y-2 text-xs text-slate-700 leading-relaxed">
                <div>
                  <span className="font-semibold text-slate-900">Situation: </span>
                  <span>{confirmedSummary.situation}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-900">Impact: </span>
                  <span>{confirmedSummary.impact}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-900">Requested Resolution: </span>
                  <span>{confirmedSummary.requestedResolution}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Inline Validation / API Error Banner */}
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-800 leading-relaxed"
          >
            {error}
          </div>
        )}

        {/* Primary CTA in Compose Stage */}
        {intakeStage === IntakeStage.Compose && (
          <div className="pt-1 space-y-2.5">
            <button
              type="submit"
              disabled={isBusy}
              className="w-full flex items-center justify-center gap-2.5 py-3 px-5 rounded-lg bg-[#1E3A8A] hover:bg-[#172E6E] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-900"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Checking for Missing Details...</span>
                </>
              ) : isSummarizing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Preparing Summary for Confirmation...</span>
                </>
              ) : isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Drafting Formal Letter...</span>
                </>
              ) : (
                <span>Generate Letter</span>
              )}
            </button>
            <p className="text-center text-xs text-slate-400">
              Reviews missing facts and lets you confirm a summary before drafting
            </p>
          </div>
        )}
      </form>
    </section>
  );
};
