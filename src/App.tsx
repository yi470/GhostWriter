import React, { useCallback, useEffect, useState } from 'react';
import { TopNav } from './components/TopNav';
import { ProblemComposer } from './components/ProblemComposer';
import { LetterStationery } from './components/LetterStationery';
import { DraftsModal, FormatGuideModal, ScenariosModal } from './components/OverlayPanels';
import {
  CaseSummary,
  ClarificationQuestion,
  IntakeStage,
  LetterDraft,
  LetterParties,
  LetterTone,
  PaperTypeface,
  PendingRevisionChoice,
  RevisionOption,
  ScenarioPreset,
} from './types/letter';

const STORAGE_KEY = 'correspondent_saved_drafts_v1';

function getTodayFormatted(): string {
  return new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function createEmptyParties(): LetterParties {
  return {
    senderName: '',
    senderDetails: '',
    recipientName: '',
    recipientOrganization: '',
    recipientDetails: '',
    letterDate: getTodayFormatted(),
  };
}

function loadStoredDrafts(): LetterDraft[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function App() {
  const [drafts, setDrafts] = useState<LetterDraft[]>(() => loadStoredDrafts());
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);

  const [problem, setProblem] = useState<string>('');
  const [tone, setTone] = useState<LetterTone>(LetterTone.Diplomatic);
  const [parties, setParties] = useState<LetterParties>(() => createEmptyParties());

  const [intakeStage, setIntakeStage] = useState<IntakeStage>(IntakeStage.Compose);
  const [clarificationQuestions, setClarificationQuestions] = useState<ClarificationQuestion[] | null>(null);
  const [clarificationAnswers, setClarificationAnswers] = useState<Record<string, string>>({});
  const [effectiveClarifications, setEffectiveClarifications] = useState<Record<string, string>>({});

  // Unverified summary awaiting user confirmation vs. explicitly confirmed summary
  const [pendingSummary, setPendingSummary] = useState<CaseSummary | null>(null);
  const [confirmedSummary, setConfirmedSummary] = useState<CaseSummary | null>(null);

  const [subject, setSubject] = useState<string>('');
  const [letterBody, setLetterBody] = useState<string>('');
  const [editorialNote, setEditorialNote] = useState<string>('');
  const [previousRevisions, setPreviousRevisions] = useState<string[]>([]);
  const [pendingRevision, setPendingRevision] = useState<PendingRevisionChoice | null>(null);

  const [paperTypeface, setPaperTypeface] = useState<PaperTypeface>(PaperTypeface.Serif);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [revisionError, setRevisionError] = useState<string | null>(null);
  const [lastSavedLabel, setLastSavedLabel] = useState<string>('');

  const [activeOverlay, setActiveOverlay] = useState<'scenarios' | 'drafts' | 'guide' | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
    } catch {
      // Ignore storage quota errors gracefully
    }
  }, [drafts]);

  const upsertDraft = useCallback(
    (
      nextSubject: string,
      nextBody: string,
      nextNote: string,
      nextProblem: string,
      nextTone: LetterTone,
      nextParties: LetterParties,
      nextConfirmedSummary: CaseSummary | null,
      existingId?: string | null
    ) => {
      if (!nextBody.trim()) return;
      const nowIso = new Date().toISOString();
      const targetId = existingId || `draft_${Date.now()}`;

      setActiveDraftId(targetId);
      setLastSavedLabel('Saved');

      setDrafts((prev) => {
        const updatedDraft: LetterDraft = {
          id: targetId,
          subject: nextSubject || 'Formal Correspondence',
          problem: nextProblem,
          letterBody: nextBody,
          editorialNote: nextNote,
          tone: nextTone,
          parties: nextParties,
          confirmedSummary: nextConfirmedSummary,
          updatedAt: nowIso,
        };
        const exists = prev.some((d) => d.id === targetId);
        if (exists) {
          return prev.map((d) => (d.id === targetId ? updatedDraft : d));
        }
        return [updatedDraft, ...prev].slice(0, 30);
      });
    },
    []
  );

  const handleLetterBodyEdit = (nextBody: string) => {
    setLetterBody(nextBody);
    if (nextBody.trim()) {
      upsertDraft(
        subject,
        nextBody,
        editorialNote,
        problem,
        tone,
        parties,
        confirmedSummary,
        activeDraftId
      );
    }
  };

  const handleSubjectEdit = (nextSubject: string) => {
    setSubject(nextSubject);
    if (letterBody.trim()) {
      upsertDraft(
        nextSubject,
        letterBody,
        editorialNote,
        problem,
        tone,
        parties,
        confirmedSummary,
        activeDraftId
      );
    }
  };

  const parseApiResponse = async (
    response: Response,
    endpoint: string
  ): Promise<{ ok: boolean; data: any; errorMessage: string }> => {
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      try {
        const json = await response.json();
        if (!json || typeof json !== 'object') {
          console.error(`[API Invalid JSON Root on ${endpoint}]`, json);
          return {
            ok: false,
            data: null,
            errorMessage: `Invalid response from ${endpoint}: Expected a JSON object payload.`,
          };
        }

        if (!response.ok) {
          if (json.details) {
            console.error(`[API Error Details on ${endpoint}]`, json.details);
          }

          if (response.status === 404 || json.code === 'MISSING_ROUTE') {
            return {
              ok: false,
              data: json,
              errorMessage:
                json.error ||
                `Missing API route (404): ${endpoint} was not found on the server. Ensure the /api/letters/* serverless functions are deployed.`,
            };
          }

          if (json.code === 'MISSING_ENV_VAR') {
            return {
              ok: false,
              data: json,
              errorMessage:
                json.error ||
                'Missing server environment variable: GEMINI_API_KEY is not configured on the server.',
            };
          }

          if (json.code === 'INVALID_RESPONSE') {
            return {
              ok: false,
              data: json,
              errorMessage:
                json.error ||
                `Invalid model response on ${endpoint}: The upstream model returned malformed or incomplete data.`,
            };
          }

          if (json.code === 'UPSTREAM_MODEL_FAILURE') {
            return {
              ok: false,
              data: json,
              errorMessage:
                json.error ||
                `Upstream model failure on ${endpoint}: The Gemini service could not complete the request right now.`,
            };
          }

          const errMsg =
            json.error || `Request to ${endpoint} failed with status ${response.status}.`;
          return { ok: false, data: json, errorMessage: errMsg };
        }

        return { ok: true, data: json, errorMessage: '' };
      } catch (jsonErr) {
        console.error(`[API JSON Parse Error on ${endpoint}]`, jsonErr);
        return {
          ok: false,
          data: null,
          errorMessage: `Invalid response from ${endpoint}: Server returned malformed JSON.`,
        };
      }
    } else {
      const rawText = await response.text();
      console.error(
        `[API Non-JSON Response ${response.status} on ${endpoint}]`,
        rawText.slice(0, 300)
      );

      if (response.status === 404) {
        return {
          ok: false,
          data: null,
          errorMessage: `Missing API route (404): ${endpoint} was not found on the server. Ensure the serverless API routes (/api/letters/*) are deployed.`,
        };
      }

      if (response.ok) {
        return {
          ok: false,
          data: null,
          errorMessage: `Invalid response from ${endpoint}: Expected application/json, but received ${contentType || 'non-JSON content'}.`,
        };
      }

      return {
        ok: false,
        data: null,
        errorMessage:
          response.status >= 500
            ? `Upstream or server failure (${response.status}) on ${endpoint}. Check server logs and verify GEMINI_API_KEY is configured.`
            : `Request error (${response.status}) on ${endpoint}. Please try again.`,
      };
    }
  };

  // Prepares an unverified draft summary for user confirmation
  const requestDraftSummary = async (
    questionsAsked: ClarificationQuestion[] | null,
    submittedAnswers: Record<string, string>
  ) => {
    setError(null);
    setRevisionError(null);
    setIsSummarizing(true);
    setEffectiveClarifications(submittedAnswers);

    try {
      const endpoint = '/api/letters/summarize';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem,
          questions: questionsAsked || [],
          clarifications: submittedAnswers,
          senderName: parties.senderName,
          recipientName: parties.recipientName,
          recipientOrganization: parties.recipientOrganization,
        }),
      });

      const result = await parseApiResponse(response, endpoint);
      if (!result.ok) {
        throw new Error(result.errorMessage);
      }

      const data = result.data;
      if (
        typeof data.situation !== 'string' ||
        typeof data.impact !== 'string' ||
        typeof data.requestedResolution !== 'string'
      ) {
        throw new Error(
          'Invalid response from /api/letters/summarize: Summary fields were missing.'
        );
      }

      const draftSummary: CaseSummary = {
        situation: data.situation || problem.trim(),
        impact: data.impact,
        requestedResolution: data.requestedResolution,
        keyFacts: Array.isArray(data.keyFacts) ? data.keyFacts : [],
      };

      // Present as unverified draft summary until user explicitly confirms
      setConfirmedSummary(null);
      setPendingSummary(draftSummary);
      setIntakeStage(IntakeStage.ConfirmSummary);
    } catch (err: unknown) {
      console.error('[requestDraftSummary error]', err);
      const msg = err instanceof Error ? err.message : 'Could not prepare the case summary right now.';
      setError(msg);
    } finally {
      setIsSummarizing(false);
    }
  };

  // Step 1: Check for missing factual details; then proceed either to Clarify or to ConfirmSummary
  const handleStartIntake = async () => {
    if (!problem.trim()) {
      setError('Please describe the problem or situation in the input area before generating a letter.');
      return;
    }

    setError(null);
    setRevisionError(null);
    setConfirmedSummary(null);
    setIsAnalyzing(true);

    try {
      const endpoint = '/api/letters/clarify';
      const clarifyRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem,
          senderName: parties.senderName,
          senderDetails: parties.senderDetails,
          recipientName: parties.recipientName,
          recipientOrganization: parties.recipientOrganization,
          recipientDetails: parties.recipientDetails,
        }),
      });

      const clarifyResult = await parseApiResponse(clarifyRes, endpoint);

      if (!clarifyResult.ok) {
        throw new Error(clarifyResult.errorMessage);
      }

      if (!clarifyResult.data || !Array.isArray(clarifyResult.data.questions)) {
        throw new Error(
          'Invalid response from /api/letters/clarify: Expected clarification questions array.'
        );
      }

      if (
        clarifyResult.data &&
        clarifyResult.data.hasMissingInformation &&
        Array.isArray(clarifyResult.data.questions) &&
        clarifyResult.data.questions.length > 0
      ) {
        setClarificationQuestions(clarifyResult.data.questions);
        setClarificationAnswers({});
        setIntakeStage(IntakeStage.Clarify);
        setIsAnalyzing(false);
        return;
      }

      // All core facts present -> build unverified summary for user confirmation
      setClarificationQuestions(null);
      setClarificationAnswers({});
      setIsAnalyzing(false);
      await requestDraftSummary(null, {});
    } catch (err: unknown) {
      console.error('[handleStartIntake error]', err);
      setIsAnalyzing(false);
      const msg = err instanceof Error ? err.message : 'Unable to analyze details right now.';
      setError(msg);
    }
  };

  const handleAnswerClarification = (id: string, value: string) => {
    setClarificationAnswers((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleProceedWithClarifications = () => {
    requestDraftSummary(clarificationQuestions, clarificationAnswers);
  };

  const handleProceedWithPlaceholders = () => {
    requestDraftSummary(clarificationQuestions, {});
  };

  const handleCancelClarifications = () => {
    setIntakeStage(IntakeStage.Compose);
    setClarificationQuestions(null);
    setClarificationAnswers({});
  };

  const handleBackFromConfirmation = () => {
    if (clarificationQuestions && clarificationQuestions.length > 0) {
      setIntakeStage(IntakeStage.Clarify);
    } else {
      setIntakeStage(IntakeStage.Compose);
    }
  };

  const handleReopenConfirmedSummary = () => {
    if (!confirmedSummary) return;
    // Move back into unverified edit/confirm mode so user can modify and re-confirm
    setPendingSummary({ ...confirmedSummary });
    setConfirmedSummary(null);
    setIntakeStage(IntakeStage.ConfirmSummary);
  };

  // Step 3 -> Final: User explicitly confirms the summary, triggering formal letter generation
  const handleConfirmSummaryAndGenerate = async () => {
    if (!pendingSummary) return;

    const userVerifiedSummary: CaseSummary = {
      situation: pendingSummary.situation.trim(),
      impact: pendingSummary.impact.trim(),
      requestedResolution: pendingSummary.requestedResolution.trim(),
      keyFacts: pendingSummary.keyFacts,
    };

    setError(null);
    setRevisionError(null);
    setIsGenerating(true);

    try {
      const endpoint = '/api/letters/generate';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem,
          questions: clarificationQuestions || [],
          clarifications: effectiveClarifications,
          confirmedSummary: userVerifiedSummary,
          tone,
          senderName: parties.senderName,
          senderDetails: parties.senderDetails,
          recipientName: parties.recipientName,
          recipientOrganization: parties.recipientOrganization,
          recipientDetails: parties.recipientDetails,
          letterDate: parties.letterDate,
        }),
      });

      const result = await parseApiResponse(response, endpoint);

      if (!result.ok) {
        throw new Error(result.errorMessage);
      }

      const data = result.data;
      if (typeof data.letterBody !== 'string' || !data.letterBody.trim()) {
        throw new Error(
          'Invalid response from /api/letters/generate: Generated letter text was empty.'
        );
      }

      if (letterBody.trim()) {
        setPreviousRevisions((prev) => [...prev.slice(-9), letterBody]);
      }

      const generatedSubject = data.subject || 'Formal Correspondence';
      const generatedBody = data.letterBody;
      const generatedNote = data.editorialNote || '';

      setConfirmedSummary(userVerifiedSummary);
      setPendingSummary(null);
      setPendingRevision(null);
      setIntakeStage(IntakeStage.Compose);

      setSubject(generatedSubject);
      setLetterBody(generatedBody);
      setEditorialNote(generatedNote);

      const targetId = activeDraftId || `draft_${Date.now()}`;
      upsertDraft(
        generatedSubject,
        generatedBody,
        generatedNote,
        problem,
        tone,
        parties,
        userVerifiedSummary,
        targetId
      );
    } catch (err: unknown) {
      console.error('[handleConfirmSummaryAndGenerate error]', err);
      const msg = err instanceof Error ? err.message : 'Unable to generate letter right now.';
      setError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefine = async (
    instruction: string,
    isPresetAction = false
  ): Promise<boolean> => {
    if (!letterBody.trim()) return false;

    setError(null);
    setRevisionError(null);
    setIsRefining(true);

    try {
      const endpoint = '/api/letters/refine';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentLetter: letterBody,
          instruction,
          subject,
          isPresetAction,
        }),
      });

      const result = await parseApiResponse(response, endpoint);

      if (!result.ok) {
        throw new Error(result.errorMessage);
      }

      const data = result.data;

      // Unclear / multi-interpretable request: do NOT guess or overwrite the current draft
      if (data.isAmbiguous) {
        if (
          !Array.isArray(data.options) ||
          data.options.length < 2 ||
          !data.options[0]?.letterBody ||
          !data.options[1]?.letterBody
        ) {
          throw new Error(
            'Invalid response from /api/letters/refine: Expected two revision options for an unclear request.'
          );
        }

        setPendingRevision({
          instruction,
          ambiguityExplanation:
            data.ambiguityExplanation ||
            'This revision request could be interpreted with different tones or emphases.',
          options: [data.options[0], data.options[1]],
        });
        return true;
      }

      if (typeof data.letterBody !== 'string' || !data.letterBody.trim()) {
        throw new Error(
          'Invalid response from /api/letters/refine: Revised letter text was empty.'
        );
      }

      // Clear / concrete request: apply directly while preserving Undo history
      setPendingRevision(null);
      setPreviousRevisions((prev) => [...prev.slice(-9), letterBody]);

      const nextSubject = data.subject || subject;
      const nextBody = data.letterBody;
      const nextNote = data.editorialNote || editorialNote;

      setSubject(nextSubject);
      setLetterBody(nextBody);
      setEditorialNote(nextNote);

      upsertDraft(
        nextSubject,
        nextBody,
        nextNote,
        problem,
        tone,
        parties,
        confirmedSummary,
        activeDraftId
      );
      return true;
    } catch (err: unknown) {
      console.error('[handleRefine error]', err);
      const msg = err instanceof Error ? err.message : 'Could not refine the letter right now.';
      setRevisionError(msg);
      return false;
    } finally {
      setIsRefining(false);
    }
  };

  const handleUpdateRevisionOptionBody = (index: 0 | 1, updatedBody: string) => {
    setPendingRevision((prev) => {
      if (!prev) return null;
      const nextOptions: [RevisionOption, RevisionOption] = [
        { ...prev.options[0] },
        { ...prev.options[1] },
      ];
      nextOptions[index] = {
        ...nextOptions[index],
        letterBody: updatedBody,
      };
      return {
        ...prev,
        options: nextOptions,
      };
    });
  };

  const handleSelectRevisionOption = (option: RevisionOption) => {
    if (letterBody.trim()) {
      setPreviousRevisions((prev) => [...prev.slice(-9), letterBody]);
    }

    const nextSubject = option.subject || subject;
    const nextBody = option.letterBody || letterBody;
    const nextNote =
      option.editorialNote ||
      'Selected revision applied. You can continue editing any word directly above.';

    setPendingRevision(null);
    setSubject(nextSubject);
    setLetterBody(nextBody);
    setEditorialNote(nextNote);

    upsertDraft(
      nextSubject,
      nextBody,
      nextNote,
      problem,
      tone,
      parties,
      confirmedSummary,
      activeDraftId
    );
  };

  const handleDismissRevisionOptions = () => {
    setPendingRevision(null);
  };

  const handleUndoRevision = () => {
    if (previousRevisions.length === 0) return;
    const previous = previousRevisions[previousRevisions.length - 1];
    setPreviousRevisions((prev) => prev.slice(0, -1));
    setPendingRevision(null);
    setLetterBody(previous);
    upsertDraft(
      subject,
      previous,
      editorialNote,
      problem,
      tone,
      parties,
      confirmedSummary,
      activeDraftId
    );
  };

  const resetIntakeFlow = () => {
    setIntakeStage(IntakeStage.Compose);
    setClarificationQuestions(null);
    setClarificationAnswers({});
    setEffectiveClarifications({});
    setPendingSummary(null);
    setConfirmedSummary(null);
  };

  const handleApplyPreset = (preset: ScenarioPreset) => {
    setError(null);
    resetIntakeFlow();
    setProblem(preset.problem);
    setTone(preset.tone);
    setParties((prev) => ({
      ...prev,
      recipientName: preset.recipientName,
      recipientOrganization: preset.recipientOrganization,
    }));
  };

  const handleLoadDraft = (draft: LetterDraft) => {
    setError(null);
    setActiveDraftId(draft.id);
    setProblem(draft.problem);
    setTone(draft.tone);
    setParties(draft.parties || createEmptyParties());
    setSubject(draft.subject);
    setLetterBody(draft.letterBody);
    setEditorialNote(draft.editorialNote || '');
    setIntakeStage(IntakeStage.Compose);
    setClarificationQuestions(null);
    setClarificationAnswers({});
    setEffectiveClarifications({});
    setPendingSummary(null);
    setPendingRevision(null);
    setConfirmedSummary(draft.confirmedSummary ?? null);
    setPreviousRevisions([]);
    setLastSavedLabel('Saved');
  };

  const handleDeleteDraft = (id: string) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
    if (activeDraftId === id) {
      setActiveDraftId(null);
      setLastSavedLabel('');
    }
  };

  const handleNewLetter = () => {
    setError(null);
    setRevisionError(null);
    setActiveDraftId(null);
    setProblem('');
    setTone(LetterTone.Diplomatic);
    setParties(createEmptyParties());
    resetIntakeFlow();
    setSubject('');
    setLetterBody('');
    setEditorialNote('');
    setPreviousRevisions([]);
    setPendingRevision(null);
    setLastSavedLabel('');
    setActiveOverlay(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f7f9] text-slate-900">
      <TopNav
        activeOverlay={activeOverlay}
        draftCount={drafts.length}
        onSelectWorkspace={() => setActiveOverlay(null)}
        onOpenScenarios={() => setActiveOverlay('scenarios')}
        onOpenDrafts={() => setActiveOverlay('drafts')}
        onOpenGuide={() => setActiveOverlay('guide')}
        onNewLetter={handleNewLetter}
      />

      {/* Main 1440px Two-Column Correspondence Workspace */}
      <main id="workspace" className="flex-1 w-full max-w-[1380px] mx-auto px-6 lg:px-10 py-8 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Problem Input, Clarification & Confirmation Controls */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <ProblemComposer
              problem={problem}
              tone={tone}
              parties={parties}
              intakeStage={intakeStage}
              isAnalyzing={isAnalyzing}
              isSummarizing={isSummarizing}
              isGenerating={isGenerating}
              clarificationQuestions={clarificationQuestions}
              clarificationAnswers={clarificationAnswers}
              pendingSummary={pendingSummary}
              confirmedSummary={confirmedSummary}
              error={error}
              onProblemChange={(val) => {
                setProblem(val);
                if (error) setError(null);
                if (intakeStage !== IntakeStage.Compose || confirmedSummary) {
                  resetIntakeFlow();
                }
              }}
              onToneChange={setTone}
              onPartiesChange={setParties}
              onApplyPreset={handleApplyPreset}
              onAnswerClarification={handleAnswerClarification}
              onProceedWithClarifications={handleProceedWithClarifications}
              onProceedWithPlaceholders={handleProceedWithPlaceholders}
              onCancelClarifications={handleCancelClarifications}
              onPendingSummaryChange={setPendingSummary}
              onConfirmSummaryAndGenerate={handleConfirmSummaryAndGenerate}
              onBackFromConfirmation={handleBackFromConfirmation}
              onReopenConfirmedSummary={handleReopenConfirmedSummary}
              onStartIntake={handleStartIntake}
            />
          </div>

          {/* Right Column: Editable Formal Letter Sheet */}
          <div className="lg:col-span-7">
            <LetterStationery
              subject={subject}
              letterBody={letterBody}
              editorialNote={editorialNote}
              paperTypeface={paperTypeface}
              isGenerating={isGenerating}
              isRefining={isRefining}
              canUndoRevision={previousRevisions.length > 0}
              lastSavedLabel={lastSavedLabel}
              pendingRevision={pendingRevision}
              revisionError={revisionError}
              onSubjectChange={handleSubjectEdit}
              onLetterBodyChange={handleLetterBodyEdit}
              onTypefaceChange={setPaperTypeface}
              onRefine={handleRefine}
              onUpdateRevisionOptionBody={handleUpdateRevisionOptionBody}
              onSelectRevisionOption={handleSelectRevisionOption}
              onDismissRevisionOptions={handleDismissRevisionOptions}
              onUndoRevision={handleUndoRevision}
            />
          </div>
        </div>
      </main>

      {/* Quiet Editorial Footer */}
      <footer className="no-print border-t border-slate-200/80 bg-white/60 mt-auto">
        <div className="max-w-[1380px] mx-auto px-6 lg:px-10 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>Correspondent · Formal Correspondence & Letter-Writing Assistant</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveOverlay('scenarios')}
              className="hover:text-slate-900 hover:underline underline-offset-2 cursor-pointer"
            >
              Browse Scenarios
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setActiveOverlay('guide')}
              className="hover:text-slate-900 hover:underline underline-offset-2 cursor-pointer"
            >
              Block-Letter Format Guide
            </button>
          </div>
        </div>
      </footer>

      {/* Interactive Modals */}
      {activeOverlay === 'scenarios' && (
        <ScenariosModal
          onSelectPreset={handleApplyPreset}
          onClose={() => setActiveOverlay(null)}
        />
      )}

      {activeOverlay === 'drafts' && (
        <DraftsModal
          drafts={drafts}
          activeDraftId={activeDraftId}
          onLoadDraft={handleLoadDraft}
          onDeleteDraft={handleDeleteDraft}
          onNewLetter={handleNewLetter}
          onClose={() => setActiveOverlay(null)}
        />
      )}

      {activeOverlay === 'guide' && (
        <FormatGuideModal onClose={() => setActiveOverlay(null)} />
      )}
    </div>
  );
}

export default App;
