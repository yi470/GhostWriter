export enum LetterTone {
  Diplomatic = 'Diplomatic',
  Firm = 'Firm',
  Conciliatory = 'Conciliatory',
  Urgent = 'Urgent',
}

export enum PaperTypeface {
  Serif = 'Serif',
  Sans = 'Sans',
}

export interface LetterParties {
  senderName: string;
  senderDetails: string;
  recipientName: string;
  recipientOrganization: string;
  recipientDetails: string;
  letterDate: string;
}

export enum IntakeStage {
  Compose = 'compose',
  Clarify = 'clarify',
  ConfirmSummary = 'confirm',
}

export interface LetterDraft {
  id: string;
  subject: string;
  problem: string;
  letterBody: string;
  editorialNote: string;
  tone: LetterTone;
  parties: LetterParties;
  confirmedSummary?: CaseSummary | null;
  updatedAt: string;
}

export interface ClarificationQuestion {
  id: string;
  field: string;
  question: string;
  placeholderHint: string;
  example: string;
  userValue?: string;
}

export interface CaseSummary {
  situation: string;
  impact: string;
  requestedResolution: string;
  keyFacts: string[];
}

export interface RevisionOption {
  id: string;
  label: string;
  toneAndEmphasis: string;
  subject: string;
  letterBody: string;
  editorialNote: string;
}

export interface PendingRevisionChoice {
  instruction: string;
  ambiguityExplanation: string;
  options: [RevisionOption, RevisionOption];
}

export interface ScenarioPreset {
  id: string;
  title: string;
  category: string;
  tone: LetterTone;
  problem: string;
  recipientName: string;
  recipientOrganization: string;
}
