#!/usr/bin/env python3
"""Validate Hit Send's anonymized behavior-evaluation corpus."""

from __future__ import annotations

import json
import sys
from pathlib import Path


DECISIONS = {"pass", "polish", "rewrite", "switch_channel"}
MODES = {"original", "direct", "softer", "concise"}
REQUIRED = {
    "id",
    "message",
    "mode",
    "allowed_decisions",
    "must_preserve",
    "must_not_add",
    "max_alternatives",
}


def validate(path: Path) -> list[str]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    errors: list[str] = []
    if not isinstance(payload, dict) or not isinstance(payload.get("cases"), list):
        return ["root.cases must be an array"]

    seen: set[str] = set()
    for index, case in enumerate(payload["cases"]):
        prefix = f"cases[{index}]"
        if not isinstance(case, dict) or set(case) != REQUIRED:
            errors.append(f"{prefix} must contain exactly {sorted(REQUIRED)}")
            continue
        case_id = case["id"]
        if not isinstance(case_id, str) or not case_id:
            errors.append(f"{prefix}.id must be non-empty")
        elif case_id in seen:
            errors.append(f"duplicate case id: {case_id}")
        else:
            seen.add(case_id)
        if not isinstance(case["message"], str) or not case["message"].strip():
            errors.append(f"{prefix}.message must be non-empty")
        if case["mode"] not in MODES:
            errors.append(f"{prefix}.mode is invalid")
        decisions = case["allowed_decisions"]
        if not isinstance(decisions, list) or not decisions or not set(decisions) <= DECISIONS:
            errors.append(f"{prefix}.allowed_decisions is invalid")
        for key in ("must_preserve", "must_not_add"):
            if not isinstance(case[key], list) or not all(
                isinstance(value, str) for value in case[key]
            ):
                errors.append(f"{prefix}.{key} must be a string array")
        if case["max_alternatives"] not in (0, 1, 2):
            errors.append(f"{prefix}.max_alternatives must be 0, 1, or 2")
    return errors


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: validate_behavior_cases.py CASES.json", file=sys.stderr)
        return 2
    errors = validate(Path(sys.argv[1]))
    if errors:
        print("\n".join(f"ERROR: {error}" for error in errors), file=sys.stderr)
        return 1
    print("PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
