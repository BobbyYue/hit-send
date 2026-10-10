# Checked Delivery

Use `python3 scripts/deliver.py RESPONSE.json --source SOURCE.txt --review REVIEW.json`.
This reruns `validate_response.validate_delivery`, covering the recommendation
and every alternative, and returns the exact response bytes in a JSON envelope.
Only `delivery_state=checked` is eligible for the normal preview. Preparation,
schema-only validation, missing review and stale bindings do not release text.
The declared review method is `self-check`, never independent semantic review.

The caller checks process success, state and artifact hash, decodes base64
`payload`, and consumes that response directly. Do not ask the model to rewrite
the accepted text. Invalidate preview/copy/replace when draft, selected context,
mode or result changes; preserve the user's original on failure. This command
never sends, copies, replaces, reads other chats or authorizes those actions.

No message files are created by default. If the caller explicitly supplies
`--output`, the command creates an exclusive 0600 envelope file and refuses
overwrites. The caller must remove source/response/review/envelope temporaries
after use; do not log source text, payloads or persistent hashes of messages.

This is a local checked path, not an installed app hook. A host must invoke it
after candidate creation and before normal preview/copy/replace, capture review
results in its own invocation, and consume only the returned payload. Existing
apps do not become integrated merely by installing this skill. Hash checks do
not prove a self-review's semantic judgment; preserve neutral uncertainty or
ask the one material question when meaning cannot be established. Reuse the
existing minimal edit and finding flow; do not add long-document review rounds.
