import React, { useEffect, useMemo, useState } from 'react';
import { Search, Trash2, X } from 'lucide-react';
import { FORMAL_LETTER_SECTIONS, SCENARIO_PRESETS } from '../data/presets';
import { LetterDraft, ScenarioPreset } from '../types/letter';

interface OverlayModalShellProps {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
}

const OverlayModalShell: React.FC<OverlayModalShellProps> = ({
  title,
  subtitle,
  onClose,
  children,
}) => {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px] p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[85vh] bg-white border border-slate-200 rounded-xl shadow-lg flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-slate-200">
          <div className="space-y-1">
            <h2 className="font-letter-serif text-xl font-semibold text-slate-900">{title}</h2>
            <p className="text-sm text-slate-600">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

interface ScenariosModalProps {
  onSelectPreset: (preset: ScenarioPreset) => void;
  onClose: () => void;
}

export const ScenariosModal: React.FC<ScenariosModalProps> = ({ onSelectPreset, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = useMemo(() => {
    const unique = Array.from(new Set(SCENARIO_PRESETS.map((p) => p.category)));
    return ['All', ...unique];
  }, []);

  const filtered = useMemo(() => {
    if (selectedCategory === 'All') return SCENARIO_PRESETS;
    return SCENARIO_PRESETS.filter((p) => p.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <OverlayModalShell
      title="Correspondence Scenarios"
      subtitle="Load a real-world dispute, claim, or business request into the composer to customize and generate."
      onClose={onClose}
    >
      <div className="space-y-5">
        {/* Interactive Category Filter */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="divide-y divide-slate-200 border-t border-b border-slate-200">
          {filtered.map((preset) => (
            <div key={preset.id} className="py-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>{preset.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{preset.tone} tone</span>
                  <span aria-hidden="true">·</span>
                  <span>To: {preset.recipientOrganization}</span>
                </div>
                <h3 className="text-base font-semibold text-slate-900">{preset.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{preset.problem}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onSelectPreset(preset);
                  onClose();
                }}
                className="self-start px-3.5 py-2 text-xs font-semibold text-white bg-[#1E3A8A] hover:bg-[#172E6E] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Use Scenario
              </button>
            </div>
          ))}
        </div>
      </div>
    </OverlayModalShell>
  );
};

interface DraftsModalProps {
  drafts: LetterDraft[];
  activeDraftId: string | null;
  onLoadDraft: (draft: LetterDraft) => void;
  onDeleteDraft: (id: string) => void;
  onNewLetter: () => void;
  onClose: () => void;
}

export const DraftsModal: React.FC<DraftsModalProps> = ({
  drafts,
  activeDraftId,
  onLoadDraft,
  onDeleteDraft,
  onNewLetter,
  onClose,
}) => {
  const [query, setQuery] = useState('');

  const filteredDrafts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return drafts;
    return drafts.filter(
      (d) =>
        d.subject.toLowerCase().includes(q) ||
        d.problem.toLowerCase().includes(q) ||
        d.letterBody.toLowerCase().includes(q)
    );
  }, [drafts, query]);

  return (
    <OverlayModalShell
      title="Saved Correspondence Drafts"
      subtitle="Generated and edited letters are stored locally in your browser so you can revisit or revise them."
      onClose={onClose}
    >
      {drafts.length === 0 ? (
        <div className="py-12 text-center space-y-4">
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            No saved drafts yet. Once you generate or edit a formal letter in the workspace, it will appear here automatically.
          </p>
          <button
            type="button"
            onClick={() => {
              onNewLetter();
              onClose();
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#1E3A8A] hover:bg-[#172E6E] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Compose First Letter
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search saved drafts by subject, recipient, or text..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:border-blue-900 focus:outline-none"
            />
          </div>

          {filteredDrafts.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No saved drafts match "{query}".
            </p>
          ) : (
            <div className="divide-y divide-slate-200 border-t border-b border-slate-200">
              {filteredDrafts.map((draft) => {
                const words = draft.letterBody.trim()
                  ? draft.letterBody.trim().split(/\s+/).length
                  : 0;
                const isCurrent = draft.id === activeDraftId;
                const formattedDate = new Date(draft.updatedAt).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={draft.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-mono tabular-nums">
                        <span>{draft.tone}</span>
                        <span aria-hidden="true">·</span>
                        <span>{words} words</span>
                        <span aria-hidden="true">·</span>
                        <span>Updated {formattedDate}</span>
                        {isCurrent && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-sans font-semibold text-blue-900">Active in editor</span>
                          </>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 truncate">
                        {draft.subject || 'Untitled Formal Letter'}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {draft.problem || draft.letterBody.slice(0, 140)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          onLoadDraft(draft);
                          onClose();
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Open Draft
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteDraft(draft.id)}
                        aria-label={`Delete draft ${draft.subject || 'Untitled'}`}
                        className="p-2 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </OverlayModalShell>
  );
};

interface FormatGuideModalProps {
  onClose: () => void;
}

export const FormatGuideModal: React.FC<FormatGuideModalProps> = ({ onClose }) => {
  return (
    <OverlayModalShell
      title="Full-Block Formal Letter Standards"
      subtitle="Reference structure used when transforming problem descriptions into formal correspondence."
      onClose={onClose}
    >
      <div className="space-y-6">
        <div className="divide-y divide-slate-200 border-t border-b border-slate-200">
          {FORMAL_LETTER_SECTIONS.map((item) => (
            <div key={item.step} className="py-4 space-y-1.5">
              <h3 className="text-sm font-semibold text-slate-900">{item.step}</h3>
              <p className="text-xs font-medium text-slate-700">{item.summary}</p>
              <p className="text-sm text-slate-600 leading-relaxed">{item.detail}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-4 pt-1">
          <p className="text-xs text-slate-500">
            Tip: Replace any bracketed placeholders (such as account numbers or mailing addresses) directly inside the Editable Letter Preview before printing.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#1E3A8A] hover:bg-[#172E6E] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Back to Workspace
          </button>
        </div>
      </div>
    </OverlayModalShell>
  );
};
