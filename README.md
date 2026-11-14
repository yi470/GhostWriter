# GhostWriter / Correspondent

GhostWriter is a formal complaint-letter assistant developed in Google AI Studio. The final prototype is called **Correspondent**. It turns a plain-language problem description into an editable formal letter, while asking for missing facts, preserving visible placeholders, and requiring the user to confirm a summary before drafting.

## Project links

- **Repository:** https://github.com/yi470/GhostWriter
- **Deployed prototype:** https://ghostwriter-wheat.vercel.app/
- **Google AI Studio project:** https://ai.studio/apps/1c2e08ac-00d5-4350-bde1-aa7a9918171e
- **Process journal:** https://github.com/dengyixin2026-lang/Agent-Studio-1/blob/main/week-04.md

## Submission files

| Requirement | Location |
| --- | --- |
| System card versions | [`system-cards/`](system-cards/) |
| Evaluation set | [`evaluation/evaluation-set.md`](evaluation/evaluation-set.md) |
| Evaluation results | [`evaluation/results.md`](evaluation/results.md) |
| Saved iteration evidence | [`evaluation/evidence/`](evaluation/evidence/) |
| System map | [`docs/system-map.md`](docs/system-map.md) |
| Application source | [`src/`](src/) and [`api/`](api/) |

## Design intent

The assistant should help a user turn an everyday complaint into a formal letter without inventing details or taking control away from the user. Its main safeguards are:

1. identify important missing facts;
2. let the user answer or deliberately keep visible placeholders;
3. present an editable, unverified case summary;
4. generate only after the user confirms that summary;
5. preserve the current draft when a revision request is ambiguous;
6. offer two interpretable alternatives instead of silently guessing.

## Evidence boundary

The repository includes screenshots from the actual November 10–13, 2026 development sessions. They demonstrate the baseline interface, API failures, successful generation, clarification flow, summary confirmation, and ambiguous-revision options. The screenshots are evidence of those specific observed sessions, not proof that every evaluation case was rerun against the latest deployment.

A peer test found that the three-step flow was understandable, but the generated letter broadened the complaint with claims that the user had not confirmed. That failure is preserved in the evaluation results rather than hidden. Factual containment therefore remains the most important follow-up test.

## Local setup

```bash
npm install
cp .env.example .env
# Add a server-side GEMINI_API_KEY to .env
npm run dev
```

The Gemini key must remain server-side. Do not expose it through a `VITE_` environment variable.

