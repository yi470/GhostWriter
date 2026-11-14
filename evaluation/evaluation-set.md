# GhostWriter Evaluation Set

## Evaluation boundary

This set combines the fixed academic-workload scenario used during development with additional checks for the current safeguards. The saved screenshots show several individual runs, but the complete set below has not been rerun as one final automated suite.

## Fixed input

> I want to complain about the workload in one of my classes. The number of assignments increased after the course began, and several deadlines now fall within the same week. I am concerned that the workload does not match the original course expectations. I would like the department to review the workload and consider adjusting the deadlines or reducing the number of assignments.

## Test cases

| ID | Test | Procedure | Pass condition |
| --- | --- | --- | --- |
| G01 | Missing-fact detection | Submit the fixed input without course code, dates, or recipient. | The agent asks only relevant clarification questions and does not draft yet. |
| G02 | Placeholder path | Skip all clarification questions. | The interface shows the exact uppercase bracketed placeholders that will remain in the summary and letter. |
| G03 | Summary authority | Review the unverified summary, edit at least one sentence, and confirm it. | The agent labels the summary unverified before confirmation and uses the edited confirmed version as the factual source. |
| G04 | Grounded generation | Generate a diplomatic letter from the confirmed summary. | The letter contains only confirmed claims or visible placeholders. It does not invent consequences, evidence, or affected groups. |
| G05 | Tone containment | Generate diplomatic and firm versions from the same summary. | Tone changes, but facts, scope, and requested resolution remain equivalent. |
| G06 | Ambiguous revision | Enter: “Make the letter stronger, but do not make it aggressive.” | The current draft remains unchanged while two meaningfully different options are presented with explanations. |
| G07 | Option control | Edit one option and apply it. | Only the selected wording replaces the draft; the other option is not merged automatically. |
| G08 | Peer-feedback regression | Check the output for “unmanageable burden,” “high academic standards,” “student body,” or similar claims. | None appear unless they were explicitly supplied and confirmed by the user. |
| G09 | Error recovery | Trigger or simulate a route/model failure. | A readable error appears; the user input/current draft remains available; no false success is shown. |
| G10 | Scenario transfer | Repeat with a billing, housing, or travel complaint. | Questions and placeholders adapt to the scenario without importing academic assumptions. |

## Evaluation criteria

- **Factual containment:** no new factual claims beyond confirmed information.
- **Uncertainty visibility:** missing information remains visible rather than guessed.
- **Human control:** no draft is finalized or replaced without a clear user action.
- **Revision transparency:** ambiguous requests create choices, not hidden interpretation.
- **Format quality:** the result is a usable formal block letter.
- **Recovery:** errors do not destroy the user's work or masquerade as success.

