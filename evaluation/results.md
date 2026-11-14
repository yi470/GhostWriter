# Evaluation Results and Evidence Log

## Result labels

- **Observed:** directly visible in a saved screenshot or supplied peer-test record.
- **Implemented, not fully rerun:** behavior is present in the current source, but the complete final evaluation set was not executed again as one controlled suite.
- **Open issue:** observed failure or remaining validation need.

## Chronological observations

| Date | Evidence | Result |
| --- | --- | --- |
| Nov. 10 | [`01-baseline-interface.png`](evidence/01-baseline-interface.png) | **Observed:** A simple letter-writing interface accepted a problem, tone, and optional sender/recipient details. It did not yet expose a confirmation boundary. |
| Nov. 10 | [`02-non-json-build-failure.png`](evidence/02-non-json-build-failure.png) | **Observed failure:** The app surfaced an unexpected HTML/non-JSON response and a build failure. |
| Nov. 10 | [`03-generation-error-state.png`](evidence/03-generation-error-state.png) | **Observed failure:** The interface reported that the letter could not be generated, even while the assistant panel claimed the development preview was ready. This is why build text is not treated as functional proof. |
| Nov. 10 | [`04-runtime-diagnosis.png`](evidence/04-runtime-diagnosis.png) | **Observed process evidence:** The AI Studio session documented API availability, environment-key handling, and non-JSON parsing guards. The screenshot records the diagnosis; it does not independently verify every claim in the generated explanation. |
| Nov. 12 | [`05-first-successful-letter.png`](evidence/05-first-successful-letter.png) | **Observed:** A course-workload complaint produced a complete editable letter in the preview. |
| Nov. 12 | [`06-v2-missing-facts.png`](evidence/06-v2-missing-facts.png) | **Observed:** V2 identified missing course, assignment, recipient, and requested-resolution facts and showed visible placeholders when skipped. |
| Nov. 12 | [`07-v3-confirmation-flow.png`](evidence/07-v3-confirmation-flow.png) | **Observed:** V3 added a three-step flow: Describe Problem, Clarify Details, and Confirm Summary. |
| Nov. 12 | [`08-summary-confirmation.png`](evidence/08-summary-confirmation.png) | **Observed:** The summary was labeled pending confirmation and separated situation, impact, and requested resolution into editable fields. |
| Nov. 12 | [`09-generated-letter.png`](evidence/09-generated-letter.png) | **Observed:** The confirmed flow generated a firm, editable letter while preserving visible recipient placeholders. |
| Nov. 12 | [`10-scenarios.png`](evidence/10-scenarios.png) | **Observed interface evidence:** The app included non-academic scenarios for flight reimbursement, municipal maintenance, and contract-timeline adjustment. These examples were visible, but a full final generation run for each scenario was not saved. |
| Nov. 13 | [`11-ambiguous-revision-request.png`](evidence/11-ambiguous-revision-request.png) | **Observed:** The user entered “Make the letter stronger, but do not make it aggressive.” |
| Nov. 13 | [`12-option-a.png`](evidence/12-option-a.png) and [`13-option-b.png`](evidence/13-option-b.png) | **Observed:** The interface returned a constructive/collaborative option and a firm/evidence-based option, explained their differences, and kept a “Keep Current Draft” choice. |
| Nov. 13 | [`14-deployed-success.png`](evidence/14-deployed-success.png) | **Observed:** The deployed interface generated a formal complaint and kept the three-step summary state visible. |

## Peer evaluation

The peer tester reported:

> The three-step flow was easy to understand, and the clarification questions and visible placeholders made missing information clear. However, the generated letter expanded the original complaint with stronger claims about an “unmanageable burden,” “high academic standards,” and effects on “the student body.” The agent should avoid broadening the user’s experience beyond confirmed information.

### Interpretation

- **Passed:** the interaction sequence, clarification questions, and placeholder visibility were understandable.
- **Failed:** factual containment. The draft broadened the user's experience beyond confirmed information.
- **Design response:** V3's documented contract now explicitly prohibits generalizing an individual experience to other students or adding unconfirmed consequences. The current source also instructs the model to use only the confirmed summary.
- **Still required:** rerun G04, G05, and G08 against the latest deployment and preserve the new output before claiming the peer-identified failure is resolved.

## Current status by test

| Test | Status | Evidence / note |
| --- | --- | --- |
| G01 Missing-fact detection | Observed pass | Screenshot 06 |
| G02 Placeholder path | Observed pass | Screenshots 06, 09 |
| G03 Summary authority | Observed interface pass | Screenshots 07–08; exact output fidelity should be rerun |
| G04 Grounded generation | Open issue | Peer output added unconfirmed claims |
| G05 Tone containment | Not fully rerun | Multiple tone controls exist; factual equivalence not systematically compared |
| G06 Ambiguous revision | Observed pass | Screenshots 11–13 |
| G07 Option control | Implemented, not fully rerun | Selection controls are present; no saved final before/after comparison |
| G08 Peer-feedback regression | Not rerun after revision | Required before claiming the issue is fixed |
| G09 Error recovery | Partial observed pass | Errors were visible; preservation across every failure path was not systematically tested |
| G10 Scenario transfer | Interface observed, generation not fully rerun | Screenshot 10 |

## Honest completion statement

The evidence demonstrates meaningful iteration from a one-step drafter to a user-confirmed, three-step correspondence workflow with non-guessing revision choices. It does **not** yet demonstrate that every current safeguard passes on every scenario. The peer-identified factual-broadening problem is retained as an open regression test.

