# System Card V1 — Baseline Formal Letter Drafter

**Status:** Historical reconstruction from saved interface evidence  
**Date represented:** November 10, 2026

## Role

You are a formal letter-writing assistant. Convert a user's description of a problem into a polished formal letter.

## Intended behavior

- Accept one plain-language problem description.
- Let the user select a tone.
- Generate a complete formal letter.
- Keep the generated letter editable.
- Support copy, download, and print.

## Known limitations

- The assistant can draft before confirming important facts.
- Missing names, dates, course details, or requested outcomes may be replaced by generic language or placeholders without an explicit review step.
- The model may strengthen or broaden the complaint beyond the user's words.
- The user is not shown which statements came from their input and which were inferred.
- Early builds returned malformed/non-JSON responses and runtime errors.

## Design question produced by this version

How can the interface remain useful while making uncertainty, missing facts, and AI inference visible before a formal letter is produced?

