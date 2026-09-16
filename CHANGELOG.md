# Changelog

All notable changes to Hit Send are documented here.

## 0.1.3 - 2026-09-16

- Add contextual expression review to the existing send check, without an AI score, new response fields, or an extra review loop.
- Locate the wording, explain its recipient impact, and make the smallest edit while preserving facts, conditions, responsibility, timing, emotion, and intent.
- Preserve already-clear messages, formal notices, precise terminology, and product names rather than applying a blacklist.
- Align the machine runtime policy with the skill: observations and disagreements do not need invented actions, reply deadlines, impacts, or commitments.
- Add synthetic behavior cases and contract tests; run the new tests in CI. The optional H5 application code is unchanged.

## 0.1.2 - 2026-09-07

- Clarify the core fact or relationship with minimal edits, retaining the sender's voice and material conditions.
- Clarify requests and timing only when the original message calls for action; do not invent asks, deadlines, or commitments.
- Preserve already-clear messages and use parallel phrasing only for real comparisons, not decorative slogans.
- Add five behavior cases for repetition, tradeoffs, causal uncertainty, unchanged clear facts, and material conditions.
- The optional H5 application is unchanged; this release updates the skill only.

## 0.1.1 - 2026-08-27

- Replace H5 screenshots in the top-level documentation with scenario-based message examples.
- Use natural English workplace examples in the English README and natural Chinese workplace examples in the Chinese README.
- Keep the optional H5 interface documented as an implementation path rather than a product example.

## 0.1.0 - 2026-08-27

- Publish the installable Hit Send Agent Skill.
- Add the optional browser and Feishu/Lark H5 interface.
- Add deterministic checks for meaning preservation, unsafe send-readiness decisions, and decorative alternatives.
- Add public CI, bilingual documentation, privacy boundaries, and installation instructions.
