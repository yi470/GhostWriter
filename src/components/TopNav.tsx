import React from 'react';

interface TopNavProps {
  activeOverlay: 'scenarios' | 'drafts' | 'guide' | null;
  draftCount: number;
  onSelectWorkspace: () => void;
  onOpenScenarios: () => void;
  onOpenDrafts: () => void;
  onOpenGuide: () => void;
  onNewLetter: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeOverlay,
  draftCount,
  onSelectWorkspace,
  onOpenScenarios,
  onOpenDrafts,
  onOpenGuide,
  onNewLetter,
}) => {
  return (
    <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-[1380px] mx-auto flex items-center justify-between gap-8 px-6 lg:px-10 h-16">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#workspace"
          onClick={(e) => {
            e.preventDefault();
            onSelectWorkspace();
          }}
          className="font-letter-serif text-xl font-semibold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-900"
        >
          Correspondent
        </a>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav aria-label="Primary" className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          <a
            href="#workspace"
            onClick={(e) => {
              e.preventDefault();
              onSelectWorkspace();
            }}
            className={`transition-colors duration-150 hover:text-slate-900 hover:underline underline-offset-4 whitespace-nowrap shrink-0 ${
              activeOverlay === null ? 'text-slate-900 underline' : ''
            }`}
          >
            Workspace
          </a>
          <a
            href="#scenarios"
            onClick={(e) => {
              e.preventDefault();
              onOpenScenarios();
            }}
            className={`transition-colors duration-150 hover:text-slate-900 hover:underline underline-offset-4 whitespace-nowrap shrink-0 ${
              activeOverlay === 'scenarios' ? 'text-slate-900 underline' : ''
            }`}
          >
            Scenarios
          </a>
          <a
            href="#drafts"
            onClick={(e) => {
              e.preventDefault();
              onOpenDrafts();
            }}
            className={`transition-colors duration-150 hover:text-slate-900 hover:underline underline-offset-4 whitespace-nowrap shrink-0 tabular-nums ${
              activeOverlay === 'drafts' ? 'text-slate-900 underline' : ''
            }`}
          >
            {draftCount > 0 ? `Saved Drafts (${draftCount})` : 'Saved Drafts'}
          </a>
          <a
            href="#format-guide"
            onClick={(e) => {
              e.preventDefault();
              onOpenGuide();
            }}
            className={`transition-colors duration-150 hover:text-slate-900 hover:underline underline-offset-4 whitespace-nowrap shrink-0 ${
              activeOverlay === 'guide' ? 'text-slate-900 underline' : ''
            }`}
          >
            Format Guide
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onNewLetter}
            className="px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-900"
          >
            New Letter
          </button>
        </div>
      </div>
    </header>
  );
};
