"""Exercise the real CLI with synthetic review fixtures, never message history."""
import base64
import hashlib
import json
import subprocess
import sys
import tempfile
import unittest
from unittest import mock
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import reader_value
import deliver
import checked_delivery
from editorial_fixture import structural_review


class CheckedDeliveryCLITests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.base = Path(self.tmp.name)
        self.source = self.base / "source.txt"
        self.source.write_text("Only yesterday was checked; today is still unknown.")
        self.response = self.base / "response.json"
        self.response.write_text(json.dumps({"decision": "pass", "revised_text": self.source.read_text(),
            "recommended_label": "Original", "alternatives": [], "summary": "The scope is clear.",
            "findings": [], "channel_advice": ""}))
        self.review = self.base / "review.json"
        binding = hashlib.sha256((reader_value.sha256(self.response) + ":" + reader_value.sha256(self.source)).encode()).hexdigest()
        self.record = structural_review(("expression", "selection", "meaning"), binding,
                                         self.source.read_text(), self.source.read_text())
        self.review.write_text(json.dumps(self.record))
        self.cmd = [sys.executable, "-B", str(ROOT / "scripts/deliver.py"), str(self.response),
                    "--source", str(self.source), "--review", str(self.review)]

    def tearDown(self):
        self.tmp.cleanup()

    def run_delivery(self, *extra):
        return subprocess.run([*self.cmd, *extra], capture_output=True, text=True)

    def test_checked_response_is_exact_and_leaves_no_new_message_files(self):
        before = set(self.base.iterdir())
        result = self.run_delivery()
        self.assertEqual(result.returncode, 0, result.stderr)
        envelope = json.loads(result.stdout)
        self.assertEqual(envelope["delivery_state"], "checked")
        self.assertEqual(envelope["review_method"], "self-check")
        self.assertEqual(base64.b64decode(envelope["payload"]), self.response.read_bytes())
        self.assertEqual(set(self.base.iterdir()), before)

    def test_missing_review_blocks_without_payload_or_message_leak(self):
        self.review.unlink()
        result = self.run_delivery()
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(result.stdout, "")
        self.assertNotIn(self.source.read_text(), result.stderr)

    def test_preparation_exit_zero_cannot_release_pending_review(self):
        result = subprocess.run([sys.executable, str(ROOT / "scripts/validate_response.py"),
            str(self.response), "--source", str(self.source), "--prepare-review", str(self.review)], capture_output=True)
        self.assertEqual(result.returncode, 0)
        self.assertNotEqual(self.run_delivery().returncode, 0)

    def test_old_review_after_candidate_or_source_change_blocks(self):
        self.source.write_text(self.source.read_text() + " Newly added scope.")
        self.assertNotEqual(self.run_delivery().returncode, 0)

    def test_reviewer_detected_lost_qualifier_blocks(self):
        self.record["checks"]["meaning"].update(status="fail", action="revise")
        self.review.write_text(json.dumps(self.record))
        self.assertNotEqual(self.run_delivery().returncode, 0)

    def test_schema_only_option_is_not_a_delivery_path(self):
        result = self.run_delivery("--schema-only")
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(result.stdout, "")

    def test_cannot_overwrite_source_as_envelope(self):
        before = self.source.read_bytes()
        self.assertNotEqual(self.run_delivery("--output", str(self.source)).returncode, 0)
        self.assertEqual(before, self.source.read_bytes())

    def test_aba_candidate_change_cannot_pass_with_post_validation_hash(self):
        accepted = self.response.read_bytes()
        wrong = json.loads(accepted)
        wrong.update(decision="rewrite", revised_text="All periods are confirmed safe.")
        unreviewed = json.dumps(wrong).encode()
        self.response.write_bytes(unreviewed)
        real_pack, real_validate = checked_delivery.pack, deliver.validate_delivery

        def validation_with_restore(*args, **kwargs):
            errors = real_validate(*args, **kwargs)
            self.assertEqual(errors, [], "The real validator must actually accept B")
            self.response.write_bytes(unreviewed)
            return errors

        def pack_with_switch(artifact, inputs, verify):
            def switched():
                self.response.write_bytes(accepted)
                return verify()
            return real_pack(artifact, inputs, switched)

        with mock.patch.object(checked_delivery, "pack", side_effect=pack_with_switch), \
             mock.patch.object(deliver, "validate_delivery", side_effect=validation_with_restore), \
             self.assertRaises(checked_delivery.DeliveryBlocked):
            deliver.checked_response(self.response, self.source, self.review)
        self.assertEqual(self.response.read_bytes(), unreviewed)


if __name__ == "__main__":
    unittest.main()
