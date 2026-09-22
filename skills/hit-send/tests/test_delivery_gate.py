"""Test the final delivery CLI, not just response JSON shape."""
import copy
import hashlib
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import validate_response
from editorial_fixture import structural_review


class DeliveryGateTests(unittest.TestCase):
    def setUp(self):
        self.text = "Please finish the known task; it is needed tomorrow."
        self.response = {"decision": "pass", "revised_text": self.text,
                         "recommended_label": "Original", "alternatives": [],
                         "summary": "The request and timing are clear.", "findings": [], "channel_advice": ""}
        self.review = structural_review(("expression", "selection", "meaning"), "binding", self.text, self.text)

    def test_original_pass_is_byte_exact(self):
        self.assertEqual(validate_response.validate_delivery(self.response, self.text, self.review, "binding"), [])
        self.response["revised_text"] += " Please report progress."
        self.assertTrue(validate_response.validate(self.response, self.text))

    def test_missing_review_and_changed_source_binding_block(self):
        self.assertTrue(validate_response.validate_delivery(self.response, self.text, None, "binding"))
        self.assertTrue(validate_response.validate_delivery(self.response, self.text, self.review, "changed"))

    def test_reviewer_detected_request_loss_cannot_pass(self):
        self.response.update(decision="rewrite", revised_text="What is the current progress?")
        self.review = structural_review(("expression", "selection", "meaning"), "binding", self.response["revised_text"], self.text)
        self.review["checks"]["meaning"].update(status="fail", action="revise", reader_effect="The original request to finish has been replaced by a status question.")
        self.assertTrue(validate_response.validate_delivery(self.response, self.text, self.review, "binding"))

    def test_every_alternative_requires_meaning_and_strategy_review(self):
        self.response["decision"] = "polish"
        self.response["alternatives"] = [{"label": "Softer", "text": "Could you finish the known task? It is needed tomorrow.", "rationale": "Less direct request, same timing."}]
        self.assertTrue(validate_response.validate_delivery(self.response, self.text, self.review, "binding"))
        self.review["variants"] = [structural_review(("expression", "meaning"), "binding", self.response["alternatives"][0]["text"], self.text)]
        self.assertEqual(validate_response.validate_delivery(self.response, self.text, self.review, "binding"), [])

    def test_cli_requires_review_and_schema_only_is_explicit(self):
        with tempfile.TemporaryDirectory() as directory:
            base = Path(directory)
            response = base / "response.json"
            source = base / "source.txt"
            review = base / "review.json"
            response.write_text(json.dumps(self.response), encoding="utf-8")
            source.write_text(self.text, encoding="utf-8")
            cmd = [sys.executable, str(ROOT / "scripts/validate_response.py"), str(response)]
            result = subprocess.run(cmd, capture_output=True, text=True)
            self.assertEqual(result.returncode, 2)
            result = subprocess.run(cmd + ["--schema-only"], capture_output=True, text=True)
            self.assertIn("not send-readiness", result.stdout)
            subprocess.run(cmd + ["--source", str(source), "--prepare-review", str(review)], check=True, capture_output=True)
            result = subprocess.run(cmd + ["--source", str(source), "--review", str(review)], capture_output=True, text=True)
            self.assertEqual(result.returncode, 1)
            pending = json.loads(review.read_text())
            review.write_text(json.dumps(structural_review(("expression", "selection", "meaning"), pending["artifact_binding"], self.text, self.text)))
            result = subprocess.run(cmd + ["--source", str(source), "--review", str(review)], capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            source.write_text(self.text + " A changed scope.")
            result = subprocess.run(cmd + ["--source", str(source), "--review", str(review)], capture_output=True, text=True)
            self.assertEqual(result.returncode, 1)


if __name__ == "__main__":
    unittest.main()
