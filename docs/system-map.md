# GhostWriter Detailed System Map

## Legend

- **D — Deterministic:** interface, validation, state, routing, storage, and user-selected actions.
- **P — Probabilistic:** Gemini interpretation, question generation, summarization, drafting, and revision alternatives.
- **H — Human judgment:** factual answers, confirmation, tone choice, option selection, direct editing, and final use.

## High-level logic

```mermaid
flowchart LR
    A[01 Problem description] --> B[02 Missing-fact review]
    B --> C[03 Unverified case summary]
    C --> D[04 Human confirmation]
    D --> E[05 Formal letter draft]
    E --> F[06 Revision and comparison]
    F --> G[07 User-controlled final letter]
```

## Detailed behavior, routing, and decisions

```mermaid
flowchart TD
    Start([START]) --> H1[H: Describe the problem]
    H1 --> D1[D: Validate required input]
    D1 -->|Empty| Err1[D: Show readable validation error]
    Err1 --> H1
    D1 -->|Valid| P1[P: Identify important missing facts]

    P1 --> D2{D: Missing information?}
    D2 -->|Yes| H2[H: Answer clarification questions]
    H2 --> D3{D: Answer or skip?}
    D3 -->|Answer| D4[D: Store user-provided fact]
    D3 -->|Skip| D5[D: Insert visible uppercase placeholder]
    D4 --> P2[P: Produce unverified summary]
    D5 --> P2
    D2 -->|No| P2

    P2 --> H3[H: Review and edit Situation, Impact, Resolution]
    H3 --> D6{H: Confirm summary?}
    D6 -->|No| H3
    D6 -->|Yes| D7[D: Mark confirmed summary as factual authority]
    D7 --> P3[P: Generate block-format formal letter]
    P3 --> D8[D: Place result in editable preview]

    D8 --> H4{H: Keep, edit, or revise?}
    H4 -->|Direct edit| D9[D: Update local draft state]
    H4 -->|Preset revision| P4[P: Apply bounded tone or length change]
    H4 -->|Free-text revision| D10{D/P: Is request ambiguous?}
    D10 -->|No| P5[P: Produce bounded revision]
    D10 -->|Yes| P6[P: Produce two distinct options and explanations]
    P6 --> H5[H: Edit/select Option A, Option B, or Keep Current Draft]
    H5 --> D9
    P4 --> D9
    P5 --> D9
    D9 --> H6[H: Final manual wording control]
    H6 --> D11[D: Copy, download, print, or save draft]

    P1 -. Model/route failure .-> Err2[D: Preserve input and show retry message]
    P2 -. Invalid structured output .-> Err2
    P3 -. Model/route failure .-> Err2
    P4 -. Model/route failure .-> Err2
    P5 -. Model/route failure .-> Err2
    P6 -. Model/route failure .-> Err2
    Err2 --> H1
```

## Information boundaries

### Sent to Gemini when required

- current problem description;
- current optional sender and recipient fields;
- answers supplied for the current clarification step;
- the current unverified or confirmed summary, depending on the route;
- the current letter and the current revision request during refinement;
- the selected tone.

### Not sent automatically

- unrelated saved drafts;
- unrelated scenarios or prior sessions;
- local browser history;
- the user's Gemini API key (the key stays server-side and is used only to authenticate the API call);
- facts that the user skipped—these remain visible placeholders rather than hidden guesses.

## Human-control boundary

The model may propose questions, summaries, letters, and revision alternatives. The user decides which facts are true, whether the summary is confirmed, which revision option is applied, and what final wording leaves the system. A generated draft is not treated as verified evidence merely because the model or build panel says it completed successfully.

