# Contributing

Contributions that make Hit Send more accurate, natural, portable, or easier to verify are welcome.

## Before opening a change

- Use synthetic or anonymized workplace messages. Never submit private chats, internal links, credentials, personal data, or confidential business details.
- Preserve the product boundary: Hit Send previews and copies text; it does not send messages or read conversation history by default.
- Treat a writing recommendation and a deterministic product rule differently. Add a hard rule only when the incorrect behavior would materially change meaning, ownership, commitment, timing, or user control.
- Keep changes scoped. The installable Skill lives in `skills/hit-send`; the optional H5 surface lives in `apps/feishu-h5`.

## Validate locally

```bash
python3 scripts/validate_repo.py
npm test --prefix apps/feishu-h5
python3 skills/hit-send/scripts/validate_response.py skills/hit-send/evals/valid-response.json
python3 skills/hit-send/scripts/validate_behavior_cases.py skills/hit-send/evals/behavior-cases.json
```

For UI changes, verify the actual H5 page at desktop and mobile widths, keyboard access, copy behavior, empty input, long input, mixed Chinese and English, and error states. A passing contract test alone is not enough.

## Pull requests

Explain the recipient-facing problem, the behavior changed, and how it was verified. Add or update an anonymized behavior case when fixing a demonstrated failure.
