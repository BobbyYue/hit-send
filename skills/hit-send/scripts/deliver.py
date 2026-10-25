#!/usr/bin/env python3
"""Validate once and return the exact source-bound response, without saving messages."""
import argparse
import hashlib
import json
from pathlib import Path

import checked_delivery as delivery
import reader_value
from validate_response import validate_delivery


def checked_response(response, source, review):
    response, source, review = map(Path, (response, source, review))

    def verify():
        response_bytes, source_bytes, review_bytes = (p.read_bytes() for p in (response, source, review))
        payload = json.loads(response_bytes)
        original = source_bytes.decode("utf-8")
        check = json.loads(review_bytes)
        hashes = {str(p.resolve()): delivery.digest(raw) for p, raw in
                  ((response, response_bytes), (source, source_bytes), (review, review_bytes))}
        binding = hashlib.sha256((delivery.digest(response_bytes) + ":" + delivery.digest(source_bytes)).encode()).hexdigest()
        errors = validate_delivery(payload, original, check, binding)
        if errors:
            raise delivery.DeliveryBlocked("Source-bound response check failed")
        return {"status": "pass", "review_method": "self-check",
                "artifact_sha256": delivery.digest(response_bytes), "verified_inputs": hashes}

    scripts = Path(__file__).resolve().parent
    return delivery.pack(response, [source, review, *scripts.glob("*.py")], verify, opaque_paths=[source])


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, allow_abbrev=False)
    parser.add_argument("response", type=Path)
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--review", required=True, type=Path)
    parser.add_argument("--output", type=Path, help="Exclusive private envelope file; omit to return to the caller")
    args = parser.parse_args(argv)
    try:
        envelope = checked_response(args.response, args.source, args.review)
        delivery.emit(envelope, args.output)
        return 0
    except (OSError, ValueError, KeyError, TypeError):
        return delivery.blocked()


if __name__ == "__main__":
    raise SystemExit(main())
