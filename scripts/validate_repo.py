#!/usr/bin/env python3
"""Validate the public Hit Send repository without third-party dependencies."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SKILL = ROOT / "skills" / "hit-send"


def markdown_links(path: Path) -> list[str]:
    text = path.read_text(encoding="utf-8")
    return re.findall(r"\]\(([^)]+)\)", text)


def main() -> int:
    errors: list[str] = []
    required = [
        ROOT / "README.md",
        ROOT / "README.zh-CN.md",
        ROOT / "LICENSE",
        ROOT / ".github" / "workflows" / "validate.yml",
        SKILL / "SKILL.md",
        SKILL / "agents" / "openai.yaml",
        SKILL / "references" / "method.md",
        SKILL / "references" / "runtime-prompt.md",
        SKILL / "scripts" / "response.schema.json",
        ROOT / "apps" / "feishu-h5" / "package.json",
        ROOT / "apps" / "feishu-h5" / "public" / "index.html",
    ]
    for path in required:
        if not path.exists():
            errors.append(f"missing required file: {path.relative_to(ROOT)}")

    skill_path = SKILL / "SKILL.md"
    if skill_path.exists():
        text = skill_path.read_text(encoding="utf-8")
        frontmatter = re.match(r"^---\n(.*?)\n---\n", text, re.DOTALL)
        if not frontmatter:
            errors.append("SKILL.md has invalid frontmatter boundaries")
        else:
            header = frontmatter.group(1)
            if not re.search(r"^name:\s*hit-send\s*$", header, re.MULTILINE):
                errors.append("SKILL.md name must be hit-send")
            if not re.search(r"^description:\s*\S", header, re.MULTILINE):
                errors.append("SKILL.md needs a non-empty description")

    for path in ROOT.rglob("*.json"):
        try:
            json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            errors.append(f"invalid JSON in {path.relative_to(ROOT)}: {exc}")

    for path in ROOT.rglob("*.md"):
        for link in markdown_links(path):
            if (
                "://" in link
                or link.startswith("#")
                or link.startswith("mailto:")
            ):
                continue
            target_text = link.split("#", 1)[0]
            if not target_text:
                continue
            target = (path.parent / target_text).resolve()
            if not target.exists():
                errors.append(
                    f"broken local link in {path.relative_to(ROOT)}: {link}"
                )

    forbidden = {
        "bytedance" + ".sg.larkoffice.com": "private document URL",
        "/" + "Users" + "/": "local absolute path",
        "example" + ".internal": "internal-only example domain",
    }
    text_suffixes = {".md", ".json", ".mjs", ".js", ".html", ".css", ".yml", ".yaml"}
    for path in ROOT.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in text_suffixes:
            continue
        if path.resolve() == Path(__file__).resolve():
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        for needle, label in forbidden.items():
            if needle in text:
                errors.append(
                    f"{path.relative_to(ROOT)} contains a {label}: {needle}"
                )

    forbidden_paths = [ROOT / "Sources", ROOT / "Resources", ROOT / "Package.swift"]
    for path in forbidden_paths:
        if path.exists():
            errors.append(f"native macOS application file is out of scope: {path.name}")

    env_files = [path for path in ROOT.rglob(".env") if path.is_file()]
    if env_files:
        errors.extend(
            f"environment file must not be published: {path.relative_to(ROOT)}"
            for path in env_files
        )

    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1
    print("PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
