# Changelog

All notable changes to Hit Send are documented here.

## 0.2.0 - 2026-09-22

- Require source-bound checks for the recommended message and every alternative, covering concrete wording, necessary content, preserved intent, and useful differences between versions.
- Keep clear originals unchanged and retain legitimate urgency, refusal, useful contrasts, and uncertainty. An expedite request must not silently become a progress question.
- Reject missing reviews, stale source or response files, unresolved findings, and alternatives without their own review. The response JSON schema is unchanged.
- CLI upgrade: checked delivery requires `--source` and `--review`; `--prepare-review` creates pending records. `--schema-only` is explicitly limited to structural checks and cannot authorize delivery.
- Run delivery and negative regression tests in CI. Review material stays local and ephemeral during ordinary use.
- This updates the Skill only. The optional H5 application and native applications are not newly integrated with the checked-delivery path.

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
