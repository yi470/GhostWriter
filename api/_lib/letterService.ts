import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

dotenv.config();

export enum ApiErrorCode {
  MissingRoute = 'MISSING_ROUTE',
  MissingEnvVar = 'MISSING_ENV_VAR',
  UpstreamModelFailure = 'UPSTREAM_MODEL_FAILURE',
  InvalidResponse = 'INVALID_RESPONSE',
  ValidationError = 'VALIDATION_ERROR',
  MethodNotAllowed = 'METHOD_NOT_ALLOWED',
}

export class AppApiError extends Error {
  public readonly code: ApiErrorCode;
  public readonly status: number;
  public readonly details?: string;

  constructor(code: ApiErrorCode, status: number, message: string, details?: string) {
    super(message);
    this.name = 'AppApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function hasConfiguredApiKey(): boolean {
  const key = (process.env.GEMINI_API_KEY || process.env.API_KEY || '').trim();
  return Boolean(key && key !== 'MY_GEMINI_API_KEY');
}

function getValidatedApiKey(): string {
  const key = (process.env.GEMINI_API_KEY || process.env.API_KEY || '').trim();
  if (!key || key === 'MY_GEMINI_API_KEY') {
    throw new AppApiError(
      ApiErrorCode.MissingEnvVar,
      503,
      'Server configuration error: GEMINI_API_KEY is not set on the server. Configure GEMINI_API_KEY in your server or Vercel Project Environment Variables (server-side only; never prefix with VITE_).'
    );
  }
  return key;
}

function getGenAIClient(): GoogleGenAI {
  const apiKey = getValidatedApiKey();
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      timeout: 25000,
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

interface ModelTarget {
  name: string;
  supportsThinkingLevel: boolean;
}

const INTAKE_MODEL_CHAIN: ModelTarget[] = [
  { name: 'gemini-3.1-flash-lite', supportsThinkingLevel: false },
  { name: 'gemini-4-hydrogen', supportsThinkingLevel: true },
];

const DRAFTING_MODEL_CHAIN: ModelTarget[] = [
  { name: 'gemini-3.1-flash-lite', supportsThinkingLevel: false },
  { name: 'gemini-4-hydrogen', supportsThinkingLevel: true },
];

function classifyUpstreamError(err: unknown): AppApiError {
  if (err instanceof AppApiError) {
    return err;
  }

  const raw = err instanceof Error ? err.message : String(err);

  if (
    raw.includes('API_KEY_INVALID') ||
    raw.includes('403') ||
    raw.includes('PERMISSION_DENIED') ||
    raw.includes('UNAUTHENTICATED')
  ) {
    return new AppApiError(
      ApiErrorCode.UpstreamModelFailure,
      502,
      'Upstream model authentication failed: The configured GEMINI_API_KEY was rejected by the Gemini API. Verify your server-side GEMINI_API_KEY environment variable.',
      raw
    );
  }

  if (raw.includes('429') || raw.includes('RESOURCE_EXHAUSTED')) {
    return new AppApiError(
      ApiErrorCode.UpstreamModelFailure,
      429,
      'Upstream model rate limit or quota reached (429). Please wait a moment and try again, or check the quota on your GEMINI_API_KEY.',
      raw
    );
  }

  return new AppApiError(
    ApiErrorCode.UpstreamModelFailure,
    502,
    'Upstream model failure: The Gemini service could not complete the request right now. Please try again in a moment.',
    raw
  );
}

async function executeGenAIWithFallback<T>(
  chain: ModelTarget[],
  action: (target: ModelTarget) => Promise<T>
): Promise<T> {
  let lastError: unknown;

  for (const target of chain) {
    try {
      return await action(target);
    } catch (err: unknown) {
      if (err instanceof AppApiError && err.code === ApiErrorCode.MissingEnvVar) {
        throw err;
      }
      lastError = err;
      const raw = err instanceof Error ? err.message : String(err);
      console.warn(`[GenAI] Model ${target.name} failed: ${raw.slice(0, 180)}`);
      if (
        raw.includes('API_KEY_INVALID') ||
        raw.includes('403') ||
        raw.includes('PERMISSION_DENIED')
      ) {
        throw classifyUpstreamError(err);
      }
    }
  }

  throw classifyUpstreamError(lastError);
}

function parseModelJson<T>(rawText: string | undefined, contextName: string): T {
  const trimmed = (rawText ?? '').trim();
  if (!trimmed) {
    throw new AppApiError(
      ApiErrorCode.InvalidResponse,
      502,
      `Invalid model response: Empty output received during ${contextName}. Please try again.`
    );
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Parsed JSON is not an object');
    }
    return parsed as T;
  } catch (parseErr: unknown) {
    const rawDetail = parseErr instanceof Error ? parseErr.message : String(parseErr);
    throw new AppApiError(
      ApiErrorCode.InvalidResponse,
      502,
      `Invalid model response: Received malformed structured output during ${contextName}. Please try again.`,
      `${rawDetail} | Raw snippet: ${trimmed.slice(0, 200)}`
    );
  }
}

export interface IncomingClarificationQuestion {
  id: string;
  field: string;
  question: string;
  placeholderHint: string;
}

export function getApiHealthStatus() {
  return {
    ok: true,
    service: 'correspondent-api',
    hasGeminiApiKey: hasConfiguredApiKey(),
    routes: [
      'POST /api/letters/clarify',
      'POST /api/letters/summarize',
      'POST /api/letters/generate',
      'POST /api/letters/refine',
    ],
  };
}

export async function clarifyLetterInput(body: Record<string, unknown>) {
  const problem = typeof body.problem === 'string' ? body.problem : '';
  const senderName = typeof body.senderName === 'string' ? body.senderName : '';
  const senderDetails = typeof body.senderDetails === 'string' ? body.senderDetails : '';
  const recipientName = typeof body.recipientName === 'string' ? body.recipientName : '';
  const recipientOrganization =
    typeof body.recipientOrganization === 'string' ? body.recipientOrganization : '';
  const recipientDetails = typeof body.recipientDetails === 'string' ? body.recipientDetails : '';

  if (!problem.trim()) {
    throw new AppApiError(
      ApiErrorCode.ValidationError,
      400,
      'Please describe the problem or situation before analyzing.'
    );
  }

  const ai = getGenAIClient();

  const analysisPrompt = [
    `User Problem Description: ${problem.trim()}`,
    senderName.trim() ? `Sender Name: ${senderName.trim()}` : 'Sender Name: (Not provided)',
    senderDetails.trim()
      ? `Sender Details: ${senderDetails.trim()}`
      : 'Sender Details: (Not provided)',
    recipientName.trim()
      ? `Recipient Name: ${recipientName.trim()}`
      : 'Recipient Name: (Not provided)',
    recipientOrganization.trim()
      ? `Recipient Organization: ${recipientOrganization.trim()}`
      : 'Recipient Organization: (Not provided)',
    recipientDetails.trim()
      ? `Recipient Details: ${recipientDetails.trim()}`
      : 'Recipient Details: (Not provided)',
  ].join('\n');

  const systemInstruction = [
    'You are an intake analyst for formal correspondence and dispute letters.',
    'Analyze the user problem description to identify important factual information that is missing and needed to produce an accurate formal letter.',
    'Examples of important factual information depending on context:',
    '- Academic / school context: Specific course title/code, assignment dates or syllabus dates, recipient (e.g., instructor, department chair, dean), and specific requested resolution.',
    '- Consumer / housing / billing context: Account, lease, or order number, incident/statement dates, recipient/department, dollar amounts, and requested resolution/timeline.',
    'If the user problem already includes concrete facts for who, what, when, and the requested resolution, return hasMissingInformation: false and an empty questions array.',
    'Otherwise, return 2 to 4 concise clarification questions. Each question must have a short field label (under 5 words), a clear 1-sentence question, a clearly visible bracketed placeholderHint (e.g., "[COURSE TITLE / CODE]", "[ASSIGNMENT DATES]", "[RECIPIENT NAME / TITLE]", "[REQUESTED RESOLUTION]"), and a brief realistic example.',
  ].join(' ');

  const response = await executeGenAIWithFallback(INTAKE_MODEL_CHAIN, (target) =>
    ai.models.generateContent({
      model: target.name,
      contents: analysisPrompt,
      config: {
        systemInstruction,
        ...(target.supportsThinkingLevel
          ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
          : {}),
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hasMissingInformation: {
              type: Type.BOOLEAN,
              description:
                'True if key specific facts like course titles, dates, account numbers, recipient, or exact resolution are missing.',
            },
            summary: {
              type: Type.STRING,
              description: 'A 1-sentence note explaining what details were checked.',
            },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: {
                    type: Type.STRING,
                    description:
                      'Short camelCase identifier like courseTitle, assignmentDates, recipient, requestedResolution',
                  },
                  field: {
                    type: Type.STRING,
                    description:
                      'Short label like Course Title & Code, Assignment Dates, Recipient, Requested Resolution',
                  },
                  question: {
                    type: Type.STRING,
                    description: 'Concise 1-sentence clarification question',
                  },
                  placeholderHint: {
                    type: Type.STRING,
                    description:
                      'Clearly visible bracketed placeholder to insert if user skips, e.g. [COURSE TITLE / CODE]',
                  },
                  example: {
                    type: Type.STRING,
                    description: 'A short realistic example answer',
                  },
                },
                required: ['id', 'field', 'question', 'placeholderHint', 'example'],
              },
            },
          },
          required: ['hasMissingInformation', 'summary', 'questions'],
        },
      },
    })
  );

  const parsed = parseModelJson<{
    hasMissingInformation?: boolean;
    summary?: string;
    questions?: Array<{
      id: string;
      field: string;
      question: string;
      placeholderHint: string;
      example: string;
    }>;
  }>(response.text, 'missing-detail analysis');

  if (!Array.isArray(parsed.questions)) {
    throw new AppApiError(
      ApiErrorCode.InvalidResponse,
      502,
      'Invalid model response: Clarification questions field was missing or malformed.'
    );
  }

  return {
    hasMissingInformation: Boolean(parsed.hasMissingInformation && parsed.questions.length > 0),
    summary: parsed.summary || 'Identified optional factual details.',
    questions: parsed.questions,
  };
}

export async function summarizeLetterCase(body: Record<string, unknown>) {
  const problem = typeof body.problem === 'string' ? body.problem : '';
  const questions = Array.isArray(body.questions)
    ? (body.questions as IncomingClarificationQuestion[])
    : [];
  const clarifications =
    body.clarifications && typeof body.clarifications === 'object'
      ? (body.clarifications as Record<string, unknown>)
      : {};
  const senderName = typeof body.senderName === 'string' ? body.senderName : '';
  const recipientName = typeof body.recipientName === 'string' ? body.recipientName : '';
  const recipientOrganization =
    typeof body.recipientOrganization === 'string' ? body.recipientOrganization : '';

  if (!problem.trim()) {
    throw new AppApiError(
      ApiErrorCode.ValidationError,
      400,
      'Please describe the problem or situation before summarizing.'
    );
  }

  const ai = getGenAIClient();

  const answeredLines: string[] = [];
  const skippedPlaceholderLines: string[] = [];

  if (questions.length > 0) {
    for (const q of questions) {
      const val = clarifications[q.id];
      if (typeof val === 'string' && val.trim()) {
        answeredLines.push(`• ${q.field}: ${val.trim()}`);
      } else {
        skippedPlaceholderLines.push(
          `• ${q.field}: Not provided by user — MUST use visible placeholder ${q.placeholderHint}`
        );
      }
    }
  } else {
    for (const [k, v] of Object.entries(clarifications)) {
      if (typeof v === 'string' && v.trim()) {
        answeredLines.push(`• ${k}: ${v.trim()}`);
      }
    }
  }

  const summaryPrompt = [
    `User Problem Description: ${problem.trim()}`,
    answeredLines.length > 0
      ? `User-Provided Clarification Answers:\n${answeredLines.join('\n')}`
      : 'User-Provided Clarification Answers: (None provided)',
    skippedPlaceholderLines.length > 0
      ? `Unanswered / Skipped Fields (Use Placeholders, Never Invent):\n${skippedPlaceholderLines.join('\n')}`
      : '',
    senderName.trim() ? `Sender Name: ${senderName.trim()}` : '',
    recipientName.trim()
      ? `Recipient: ${recipientName.trim()}`
      : 'Recipient: (Not specified — use [RECIPIENT NAME / TITLE] if referenced)',
    recipientOrganization.trim() ? `Recipient Organization: ${recipientOrganization.trim()}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const systemInstruction = [
    'You prepare an unverified draft summary of a user’s correspondence request for the user to review, edit, and confirm before a formal letter is written.',
    'Summarize strictly what the user stated across three fields:',
    '1. situation: 1-2 factual sentences summarizing what happened, including any provided identifiers/dates and inserting clearly visible uppercase bracketed placeholders (such as [COURSE TITLE / CODE] or [ASSIGNMENT DATES]) where key facts were omitted.',
    '2. impact: 1-2 sentences describing the burden, unfairness, or impact expressed by the user.',
    '3. requestedResolution: 1-2 sentences stating the concrete outcome or remedy the user wants (using placeholders such as [SPECIFIC RESOLUTION / TIMELINE] only if the user left the remedy unspecified).',
    '4. keyFacts: 2-4 brief items noting the key facts captured and any bracketed placeholders that remain.',
    'CRITICAL: NEVER invent course names, dates, amounts, policies, or recipient names. Do not claim the summary is verified.',
  ].join(' ');

  const response = await executeGenAIWithFallback(INTAKE_MODEL_CHAIN, (target) =>
    ai.models.generateContent({
      model: target.name,
      contents: summaryPrompt,
      config: {
        systemInstruction,
        ...(target.supportsThinkingLevel
          ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
          : {}),
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            situation: {
              type: Type.STRING,
              description:
                '1-2 factual sentences summarizing the situation, using [PLACEHOLDERS] for missing specifics.',
            },
            impact: {
              type: Type.STRING,
              description: '1-2 sentences summarizing the impact or burden on the user.',
            },
            requestedResolution: {
              type: Type.STRING,
              description: '1-2 sentences summarizing the requested action or remedy.',
            },
            keyFacts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description:
                '2 to 4 concise bullet strings listing captured facts and active placeholders.',
            },
          },
          required: ['situation', 'impact', 'requestedResolution', 'keyFacts'],
        },
      },
    })
  );

  const parsed = parseModelJson<{
    situation?: string;
    impact?: string;
    requestedResolution?: string;
    keyFacts?: string[];
  }>(response.text, 'case summarization');

  if (!parsed.situation?.trim() || !parsed.impact?.trim() || !parsed.requestedResolution?.trim()) {
    throw new AppApiError(
      ApiErrorCode.InvalidResponse,
      502,
      'Invalid model response: Case summary fields were incomplete.'
    );
  }

  return {
    situation: parsed.situation.trim(),
    impact: parsed.impact.trim(),
    requestedResolution: parsed.requestedResolution.trim(),
    keyFacts: Array.isArray(parsed.keyFacts) ? parsed.keyFacts : [],
  };
}

export async function generateFormalLetter(body: Record<string, unknown>) {
  const problem = typeof body.problem === 'string' ? body.problem : '';
  const questions = Array.isArray(body.questions)
    ? (body.questions as IncomingClarificationQuestion[])
    : [];
  const clarifications =
    body.clarifications && typeof body.clarifications === 'object'
      ? (body.clarifications as Record<string, unknown>)
      : {};
  const confirmedSummary =
    body.confirmedSummary && typeof body.confirmedSummary === 'object'
      ? (body.confirmedSummary as {
          situation?: string;
          impact?: string;
          requestedResolution?: string;
        })
      : null;
  const tone = typeof body.tone === 'string' && body.tone.trim() ? body.tone.trim() : 'Diplomatic';
  const senderName = typeof body.senderName === 'string' ? body.senderName : '';
  const senderDetails = typeof body.senderDetails === 'string' ? body.senderDetails : '';
  const recipientName = typeof body.recipientName === 'string' ? body.recipientName : '';
  const recipientOrganization =
    typeof body.recipientOrganization === 'string' ? body.recipientOrganization : '';
  const recipientDetails = typeof body.recipientDetails === 'string' ? body.recipientDetails : '';
  const letterDate = typeof body.letterDate === 'string' ? body.letterDate : '';

  if (!problem.trim()) {
    throw new AppApiError(
      ApiErrorCode.ValidationError,
      400,
      'Please describe the problem or situation before generating a letter.'
    );
  }

  const ai = getGenAIClient();

  const resolvedDate = letterDate.trim()
    ? letterDate.trim()
    : new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

  const clarificationLines: string[] = [];
  const placeholderLines: string[] = [];

  if (questions.length > 0) {
    for (const q of questions) {
      const val = clarifications[q.id];
      if (typeof val === 'string' && val.trim()) {
        clarificationLines.push(`• ${q.field}: ${val.trim()}`);
      } else {
        placeholderLines.push(
          `• ${q.field}: Not provided — use visible placeholder ${q.placeholderHint}`
        );
      }
    }
  } else {
    for (const [k, v] of Object.entries(clarifications)) {
      if (typeof v === 'string' && v.trim()) {
        clarificationLines.push(`• ${k}: ${v.trim()}`);
      }
    }
  }

  const summaryLines =
    confirmedSummary &&
    confirmedSummary.situation &&
    confirmedSummary.impact &&
    confirmedSummary.requestedResolution
      ? [
          'User-Confirmed Case Summary (Authoritative Basis for Letter):',
          `• Confirmed Situation: ${confirmedSummary.situation}`,
          `• Confirmed Impact: ${confirmedSummary.impact}`,
          `• Confirmed Requested Resolution: ${confirmedSummary.requestedResolution}`,
        ].join('\n')
      : '';

  const contextLines = [
    `Original Problem Description: ${problem.trim()}`,
    summaryLines,
    clarificationLines.length > 0
      ? `User-Provided Clarifications:\n${clarificationLines.join('\n')}`
      : '',
    placeholderLines.length > 0
      ? `Missing Facts to Keep as Visible Placeholders (unless user filled them in Confirmed Summary above):\n${placeholderLines.join('\n')}`
      : '',
    `Desired Tone: ${tone}`,
    `Date to place on letter: ${resolvedDate}`,
    senderName.trim()
      ? `Sender Name: ${senderName.trim()}`
      : 'Sender Name: Use [YOUR NAME] placeholder',
    senderDetails.trim()
      ? `Sender Address / Contact: ${senderDetails.trim()}`
      : 'Sender Address / Contact: Use [YOUR ADDRESS] and [YOUR EMAIL / PHONE] placeholders',
    recipientName.trim()
      ? `Recipient Name / Title: ${recipientName.trim()}`
      : 'Recipient Name / Title: Use [RECIPIENT NAME / TITLE] unless explicitly named in Confirmed Summary',
    recipientOrganization.trim()
      ? `Recipient Organization: ${recipientOrganization.trim()}`
      : 'Recipient Organization: Use [ORGANIZATION / INSTITUTION NAME] unless explicitly named in Confirmed Summary',
    recipientDetails.trim()
      ? `Recipient Address: ${recipientDetails.trim()}`
      : 'Recipient Address: Use [RECIPIENT STREET ADDRESS] placeholder',
  ]
    .filter(Boolean)
    .join('\n\n');

  const systemInstruction = [
    'You are an expert formal correspondence writer.',
    'Compose a complete, publication-ready full-block formal letter grounded strictly in the User-Confirmed Case Summary and user-provided details.',
    'CRITICAL FACTUAL INTEGRITY & PLACEHOLDER RULES:',
    '1. Treat the User-Confirmed Case Summary (Situation, Impact, Requested Resolution) as the authoritative source of truth. Incorporate any edits or corrections the user made there.',
    '2. NEVER invent or hallucinate any missing facts (never invent course names/codes, professor names, assignment dates, account numbers, dollar figures, or street addresses).',
    '3. Whenever a specific detail was not provided, insert a clearly visible uppercase bracketed placeholder such as [COURSE TITLE / CODE], [ASSIGNMENT DATES], [RECIPIENT NAME / TITLE], [INSTITUTION NAME], or [YOUR NAME].',
    '4. Structure the letter in standard full-block format using double newlines (\\n\\n) between sections and paragraphs: sender block, date, recipient block, "Re: ..." subject line, formal salutation, body paragraphs covering the Situation, the Impact, and the Requested Resolution, complimentary close ("Sincerely,"), and sender signature line.',
    '5. Match the requested tone: Diplomatic (measured and constructive), Firm (direct and assertive), Conciliatory (cooperative and relationship-focused), or Urgent (time-sensitive and clear).',
    '6. Output clean plain text in letterBody with zero markdown formatting (no ** or #). Aim for 200 to 360 words.',
  ].join(' ');

  const response = await executeGenAIWithFallback(DRAFTING_MODEL_CHAIN, (target) =>
    ai.models.generateContent({
      model: target.name,
      contents: contextLines,
      config: {
        systemInstruction,
        ...(target.supportsThinkingLevel
          ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
          : {}),
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: {
              type: Type.STRING,
              description:
                'Concise formal subject line without "Re:", preserving [PLACEHOLDERS] if specific identifiers were omitted.',
            },
            letterBody: {
              type: Type.STRING,
              description:
                'Complete plain-text formal letter in full-block format with clearly visible [PLACEHOLDERS] for any unprovided facts.',
            },
            editorialNote: {
              type: Type.STRING,
              description:
                'One concise sentence reminding the user which bracketed placeholders (if any) to replace before sending.',
            },
          },
          required: ['subject', 'letterBody', 'editorialNote'],
        },
      },
    })
  );

  const parsed = parseModelJson<{
    subject?: string;
    letterBody?: string;
    editorialNote?: string;
  }>(response.text, 'letter generation');

  if (!parsed.letterBody || !parsed.letterBody.trim()) {
    throw new AppApiError(
      ApiErrorCode.InvalidResponse,
      502,
      'Invalid model response: Generated letter body was empty. Please try again.'
    );
  }

  return {
    subject: parsed.subject?.trim() || 'Formal Correspondence',
    letterBody: parsed.letterBody,
    editorialNote:
      parsed.editorialNote?.trim() ||
      'Replace any bracketed placeholders with your specific information before sending.',
  };
}

export async function refineFormalLetter(body: Record<string, unknown>) {
  const currentLetter = typeof body.currentLetter === 'string' ? body.currentLetter : '';
  const instruction = typeof body.instruction === 'string' ? body.instruction : '';
  const subject = typeof body.subject === 'string' ? body.subject : '';
  const isPresetAction = Boolean(body.isPresetAction);

  if (!currentLetter.trim()) {
    throw new AppApiError(
      ApiErrorCode.ValidationError,
      400,
      'There is no letter content to refine yet.'
    );
  }

  if (!instruction.trim()) {
    throw new AppApiError(ApiErrorCode.ValidationError, 400, 'Refinement instruction is required.');
  }

  const ai = getGenAIClient();

  if (isPresetAction) {
    const presetResponse = await executeGenAIWithFallback(DRAFTING_MODEL_CHAIN, (target) =>
      ai.models.generateContent({
        model: target.name,
        contents: `Current Subject: ${subject}\nRefinement Request: ${instruction.trim()}\n\nCurrent Letter Text:\n${currentLetter}`,
        config: {
          systemInstruction:
            'You are a meticulous formal correspondence editor. Revise the provided formal letter according to the user refinement request while preserving all factual details, names, dates, addresses, existing [BRACKETED PLACEHOLDERS] (never invent replacements for placeholders), and full-block formal letter layout with double newlines (\\n\\n) between paragraphs. Output clean plain text with zero markdown formatting (** or #).',
          ...(target.supportsThinkingLevel
            ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
            : {}),
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subject: {
                type: Type.STRING,
                description: 'Updated or preserved concise formal subject line without "Re:".',
              },
              letterBody: {
                type: Type.STRING,
                description: 'The revised complete plain-text formal letter.',
              },
              editorialNote: {
                type: Type.STRING,
                description: 'A brief 1-sentence summary of what was adjusted.',
              },
            },
            required: ['subject', 'letterBody', 'editorialNote'],
          },
        },
      })
    );

    const parsedPreset = parseModelJson<{
      subject?: string;
      letterBody?: string;
      editorialNote?: string;
    }>(presetResponse.text, 'preset letter refinement');

    if (!parsedPreset.letterBody || !parsedPreset.letterBody.trim()) {
      throw new AppApiError(
        ApiErrorCode.InvalidResponse,
        502,
        'Invalid model response: Refined letter body was empty.'
      );
    }

    return {
      isAmbiguous: false,
      subject: parsedPreset.subject?.trim() || subject,
      letterBody: parsedPreset.letterBody,
      editorialNote: parsedPreset.editorialNote?.trim() || 'Letter updated.',
    };
  }

  const customSystemInstruction = [
    'You are a meticulous formal correspondence editor assisting with post-draft revisions.',
    'Evaluate whether the user’s revision request is CLEAR (single unambiguous interpretation) or UNCLEAR (broad, subjective, underspecified, or open to multiple tonal/structural interpretations).',
    'CRITICAL RULES:',
    '1. DO NOT GUESS WHEN UNCLEAR: Set isAmbiguous to TRUE whenever the request uses subjective or open-ended language without specifying exact wording or direction—for example: "make it stronger", "make it better", "improve this", "change the tone", "more persuasive", "more professional", "fix the ending", "rewrite paragraph 2", "soften or adjust this", "make them take me seriously", "not quite right", or any request that could reasonably go in two different tonal or rhetorical directions.',
    '2. Set isAmbiguous to FALSE ONLY when the user provides a concrete, specific, single-interpretation edit—such as supplying an exact fact/placeholder replacement (e.g., "Replace [COURSE TITLE / CODE] with ECON 302", "Address it to Dean Holloway", "Change date to November 15") or an explicit mechanical instruction (e.g., "Fix spelling mistakes only", "Delete the third paragraph").',
    '3. When isAmbiguous is TRUE:',
    '   - Provide a concise ambiguityExplanation (1-2 sentences) explaining why the request could be interpreted in different ways without guessing.',
    '   - Provide EXACTLY TWO clearly different full-letter revision options in options (id "option_a" and "option_b"). The two options MUST differ meaningfully in tone or emphasis (for example, Option A using a constructive, relationship-preserving, impact-focused emphasis vs. Option B using a firmer, direct, expectations-and-accountability emphasis, or another genuine contrast tailored to the request).',
    '   - For each option, write a concise toneAndEmphasis (1-2 sentences) clearly explaining how its tone or emphasis differs from the other option.',
    '4. FACTUAL & PLACEHOLDER INTEGRITY: Across all revisions and options, preserve all factual details from the current letter and keep every unprovided [BRACKETED PLACEHOLDER] intact unless the user explicitly supplied its replacement. NEVER invent names, dates, course codes, numbers, or policies.',
    '5. Format every letterBody in full-block plain text separated by double newlines (\\n\\n) with zero markdown (** or #).',
  ].join(' ');

  const response = await executeGenAIWithFallback(DRAFTING_MODEL_CHAIN, (target) =>
    ai.models.generateContent({
      model: target.name,
      contents: `Current Subject: ${subject}\nUser Revision Request: ${instruction.trim()}\n\nCurrent Letter Text:\n${currentLetter}`,
      config: {
        systemInstruction: customSystemInstruction,
        ...(target.supportsThinkingLevel
          ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
          : {}),
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isAmbiguous: {
              type: Type.BOOLEAN,
              description:
                'True if the request is unclear, subjective, or open to multiple tonal/structural interpretations; false only if concrete and single-interpretation.',
            },
            ambiguityExplanation: {
              type: Type.STRING,
              description:
                '1-2 concise sentences explaining why the request can be interpreted in more than one way (empty string if isAmbiguous is false).',
            },
            directRevision: {
              type: Type.OBJECT,
              properties: {
                subject: { type: Type.STRING },
                letterBody: { type: Type.STRING },
                editorialNote: { type: Type.STRING },
              },
              required: ['subject', 'letterBody', 'editorialNote'],
              description:
                'Completed revised letter when isAmbiguous is false (empty strings allowed when isAmbiguous is true).',
            },
            options: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: {
                    type: Type.STRING,
                    description: 'option_a or option_b',
                  },
                  label: {
                    type: Type.STRING,
                    description:
                      'Short 2-5 word title capturing this option’s approach, e.g. "Constructive & Impact-Focused"',
                  },
                  toneAndEmphasis: {
                    type: Type.STRING,
                    description:
                      '1-2 concise sentences explaining how this option’s tone or emphasis differs from the alternative option.',
                  },
                  subject: {
                    type: Type.STRING,
                    description: 'Formal subject line without "Re:".',
                  },
                  letterBody: {
                    type: Type.STRING,
                    description:
                      'Complete revised plain-text formal letter with double newlines (\\n\\n) between paragraphs and preserved [PLACEHOLDERS].',
                  },
                  editorialNote: {
                    type: Type.STRING,
                    description: '1-sentence summary of this option’s revision.',
                  },
                },
                required: [
                  'id',
                  'label',
                  'toneAndEmphasis',
                  'subject',
                  'letterBody',
                  'editorialNote',
                ],
              },
              description:
                'Contains exactly 2 clearly distinct revision options when isAmbiguous is true; empty array when false.',
            },
          },
          required: ['isAmbiguous', 'ambiguityExplanation', 'directRevision', 'options'],
        },
      },
    })
  );

  const parsed = parseModelJson<{
    isAmbiguous?: boolean;
    ambiguityExplanation?: string;
    directRevision?: {
      subject?: string;
      letterBody?: string;
      editorialNote?: string;
    };
    options?: Array<{
      id: string;
      label: string;
      toneAndEmphasis: string;
      subject: string;
      letterBody: string;
      editorialNote: string;
    }>;
  }>(response.text, 'post-draft revision');

  if (parsed.isAmbiguous) {
    if (
      !Array.isArray(parsed.options) ||
      parsed.options.length < 2 ||
      !parsed.options[0]?.letterBody?.trim() ||
      !parsed.options[1]?.letterBody?.trim()
    ) {
      throw new AppApiError(
        ApiErrorCode.InvalidResponse,
        502,
        'Invalid model response: Expected two distinct revision options for an unclear request, but received an incomplete payload.'
      );
    }

    return {
      isAmbiguous: true,
      ambiguityExplanation:
        parsed.ambiguityExplanation?.trim() ||
        'Your request can be approached with different tones and emphases.',
      options: [parsed.options[0], parsed.options[1]],
    };
  }

  const singleBody =
    parsed.directRevision?.letterBody?.trim() || parsed.options?.[0]?.letterBody?.trim() || '';

  if (!singleBody) {
    throw new AppApiError(
      ApiErrorCode.InvalidResponse,
      502,
      'Invalid model response: Refined letter body was empty.'
    );
  }

  return {
    isAmbiguous: false,
    subject: parsed.directRevision?.subject?.trim() || subject,
    letterBody: singleBody,
    editorialNote: parsed.directRevision?.editorialNote?.trim() || 'Letter updated.',
  };
}
