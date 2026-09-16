"""Contract tests; semantic outcomes are checked by separate forward cases."""
import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import validate_behavior_cases
import validate_response


class ExpressionReviewTests(unittest.TestCase):
    def test_runtime_and_entrypoint_keep_non_action_messages(self):
        for path in (ROOT / "SKILL.md", ROOT / "references/runtime-prompt.md"):
            text = path.read_text(encoding="utf-8")
            for phrase in ("empty abstraction", "smallest fix", "no invented request"):
                self.assertIn(phrase, text)
            self.assertTrue("protected meaning" in text or "meaning to protect" in text)
        runtime = (ROOT / "references/runtime-prompt.md").read_text(encoding="utf-8")
        self.assertNotIn("For reminders, disagreement, and correction, use `verifiable fact", runtime)

    def test_corpus_is_valid_and_contains_fix_keep_and_fidelity_cases(self):
        path = ROOT / "evals/behavior-cases.json"
        self.assertEqual(validate_behavior_cases.validate(path), [])
        cases = {c["id"]: c for c in json.loads(path.read_text())["cases"]}
        self.assertNotIn("pass", cases["expression_repetition_local_fix"]["allowed_decisions"])
        for case_id in ("expression_formal_notice_keep", "expression_disagreement_no_action", "expression_product_name_not_blacklisted"):
            self.assertEqual(cases[case_id]["allowed_decisions"], ["pass"])

    def test_existing_response_contract_rejects_style_only_findings_on_pass(self):
        response = {"decision": "pass", "revised_text": "Already clear.",
                    "recommended_label": "Original", "alternatives": [],
                    "summary": "Clear to its reader.", "findings": [], "channel_advice": ""}
        self.assertEqual(validate_response.validate(response), [])
        response["findings"] = [{"dimension": "context", "issue": "Formal wording",
                                  "suggestion": "Add slang"}]
        self.assertTrue(validate_response.validate(response))


if __name__ == "__main__":
    unittest.main()
