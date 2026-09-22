#!/usr/bin/env python3
"""Validate the small machine contract used by the Hit Send desktop helper."""

from __future__ import annotations

import json
import argparse
import sys
from pathlib import Path
import reader_value


DECISIONS = {"pass", "polish", "rewrite", "switch_channel"}
REQUIRED_KEYS = {
    "decision",
    "revised_text",
    "recommended_label",
    "alternatives",
    "summary",
    "findings",
    "channel_advice",
}
ALTERNATIVE_KEYS = {"label", "text", "rationale"}
FINDING_KEYS = {"dimension", "issue", "suggestion"}
DIMENSIONS = {
    "intent",
    "conclusion",
    "context",
    "judgment",
    "action",
    "timing",
    "emotion",
    "reply_cost",
    "closure",
    "channel",
}


def _normalized_characters(text: str) -> list[str]:
    return [character for character in text.lower() if character.isalnum()]


def _edit_distance(left: list[str], right: list[str]) -> int:
    previous = list(range(len(right) + 1))
    for left_index, left_character in enumerate(left):
        current = [left_index + 1]
        for right_index, right_character in enumerate(right):
            current.append(
                min(
                    current[right_index] + 1,
                    previous[right_index + 1] + 1,
                    previous[right_index]
                    + (0 if left_character == right_character else 1),
                )
            )
        previous = current
    return previous[-1]


def _near_duplicate(left_text: str, right_text: str) -> bool:
    left = _normalized_characters(left_text)
    right = _normalized_characters(right_text)
    if not left or not right:
        return left == right
    threshold = max(2, int(max(len(left), len(right)) * 0.18))
    return _edit_distance(left, right) <= threshold


def validate(payload: object, source: str | None = None) -> list[str]:
    if not isinstance(payload, dict):
        return ["root must be an object"]

    errors: list[str] = []
    keys = set(payload)
    if keys != REQUIRED_KEYS:
        errors.append(
            f"keys must be exactly {sorted(REQUIRED_KEYS)}; got {sorted(keys)}"
        )
    if payload.get("decision") not in DECISIONS:
        errors.append(f"decision must be one of {sorted(DECISIONS)}")
    for key in ("revised_text", "recommended_label", "summary", "channel_advice"):
        if not isinstance(payload.get(key), str):
            errors.append(f"{key} must be a string")
    if isinstance(payload.get("revised_text"), str) and not payload["revised_text"].strip():
        errors.append("revised_text must be non-empty")
    if isinstance(payload.get("recommended_label"), str) and not payload[
        "recommended_label"
    ].strip():
        errors.append("recommended_label must be non-empty")
    alternatives = payload.get("alternatives")
    if not isinstance(alternatives, list):
        errors.append("alternatives must be an array")
    else:
        if len(alternatives) > 2:
            errors.append("alternatives must contain at most 2 items")
        seen_labels: set[str] = set()
        seen_texts = {payload["revised_text"]} if isinstance(payload.get("revised_text"), str) else set()
        for index, alternative in enumerate(alternatives):
            if not isinstance(alternative, dict):
                errors.append(f"alternatives[{index}] must be an object")
                continue
            if set(alternative) != ALTERNATIVE_KEYS:
                errors.append(
                    f"alternatives[{index}] keys must be exactly "
                    f"{sorted(ALTERNATIVE_KEYS)}"
                )
                continue
            for key in ALTERNATIVE_KEYS:
                if not isinstance(alternative.get(key), str) or not alternative[key].strip():
                    errors.append(f"alternatives[{index}].{key} must be a non-empty string")
            label = alternative.get("label")
            text = alternative.get("text")
            if isinstance(label, str):
                if label in seen_labels:
                    errors.append("alternative labels must be unique")
                seen_labels.add(label)
            if isinstance(text, str):
                if text in seen_texts:
                    errors.append("alternative texts must differ from the recommended text")
                # Similarity is a review signal: a short tone change can be useful.
                seen_texts.add(text)
    if payload.get("decision") == "pass" and alternatives:
        errors.append("pass results must not contain alternatives")
    findings = payload.get("findings")
    if not isinstance(findings, list):
        errors.append("findings must be an array")
    else:
        if len(findings) > 3:
            errors.append("findings must contain at most 3 items")
        seen_dimensions: set[str] = set()
        for index, finding in enumerate(findings):
            if not isinstance(finding, dict):
                errors.append(f"findings[{index}] must be an object")
                continue
            if set(finding) != FINDING_KEYS:
                errors.append(
                    f"findings[{index}] keys must be exactly {sorted(FINDING_KEYS)}"
                )
                continue
            dimension = finding.get("dimension")
            if dimension not in DIMENSIONS:
                errors.append(f"findings[{index}].dimension is invalid")
            elif dimension in seen_dimensions:
                errors.append("finding dimensions must be unique")
            else:
                seen_dimensions.add(dimension)
            for key in ("issue", "suggestion"):
                if not isinstance(finding.get(key), str) or not finding[key].strip():
                    errors.append(f"findings[{index}].{key} must be a non-empty string")
    if payload.get("decision") == "pass" and findings:
        errors.append("pass results must not contain findings")
    if source is not None and payload.get("decision") == "pass" and payload.get("revised_text") != source:
        errors.append("pass results must preserve the original text exactly")
    return errors


def validate_delivery(payload, source, review, binding):
    errors = validate(payload, source)
    if errors:
        return errors
    errors.extend(reader_value.validate(review, ("expression", "selection", "meaning"),
        binding, payload["revised_text"], source=source))
    variants = review.get("variants", []) if isinstance(review, dict) else []
    if not isinstance(variants, list) or len(variants) != len(payload["alternatives"]):
        errors.append("each alternative requires its own meaning and strategy check")
    else:
        for alternative, check in zip(payload["alternatives"], variants):
            errors.extend(reader_value.validate(check, ("expression", "meaning"), binding,
                alternative["text"], source=source))
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate response structure or source-bound send readiness.")
    parser.add_argument("response", type=Path)
    parser.add_argument("--source", type=Path)
    parser.add_argument("--review", type=Path)
    parser.add_argument("--schema-only", action="store_true")
    parser.add_argument("--prepare-review", type=Path)
    args = parser.parse_args()
    path = args.response
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not args.schema_only and not args.source:
        parser.error("final delivery requires --source and --review; use --schema-only for structure checks")
    source = args.source.read_text(encoding="utf-8") if args.source else None
    import hashlib
    binding = hashlib.sha256((reader_value.sha256(path) + ":" + (reader_value.sha256(args.source) if args.source else "")).encode()).hexdigest()
    if args.prepare_review:
        template = reader_value.template(("expression", "selection", "meaning"), binding)
        template["variants"] = [reader_value.template(("expression", "meaning"), binding) for _ in payload.get("alternatives", [])]
        args.prepare_review.write_text(json.dumps(template, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print("PENDING: complete the editorial review before delivery")
        return 0
    if args.schema_only:
        errors = validate(payload)
    elif not args.review:
        parser.error("final delivery requires --review")
    else:
        errors = validate_delivery(payload, source, json.loads(args.review.read_text(encoding="utf-8")), binding)
    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1
    print("PASS_SCHEMA_ONLY (not send-readiness verification)" if args.schema_only else "PASS_SOURCE_BOUND_REVIEW")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
