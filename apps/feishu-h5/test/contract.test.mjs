import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeRewriteRequest,
  sanitizeResult,
  validateMeaningPreservation,
  validateResult,
  validateSendReadiness,
  validateRewriteRequest,
} from "../src/contract.mjs";

test("accepts a rewrite request", () => {
  const value = { task: "rewrite", mode: "original", message: "这个可以吗？" };
  assert.deepEqual(validateRewriteRequest(value), []);
  assert.equal(normalizeRewriteRequest(value).variant_count, 2);
});

test("requires context for reply", () => {
  const errors = validateRewriteRequest({
    task: "reply",
    mode: "original",
    message: "",
    context_messages: [],
  });
  assert.match(errors.join("\n"), /at least one context message/);
});

test("rejects pass for generated replies", () => {
  const request = normalizeRewriteRequest({
    task: "reply",
    mode: "original",
    message: "",
    context_messages: [{ text: "进度怎么样？" }],
  });
  const result = {
    decision: "pass",
    revised_text: "",
    recommended_label: "原意优先",
    alternatives: [],
    summary: "",
    findings: [],
    channel_advice: "",
  };
  assert.match(validateResult(result, request).join("\n"), /cannot pass/);
});

test("allows a useful rewrite without a decorative alternative", () => {
  const request = normalizeRewriteRequest({
    task: "rewrite",
    mode: "original",
    message: "这个请确认一下。",
  });
  const result = {
    decision: "polish",
    revised_text: "这个请确认一下。",
    recommended_label: "原意优先",
    alternatives: [],
    summary: "请求已经明确。",
    findings: [],
    channel_advice: "",
  };
  assert.deepEqual(validateResult(result, request), []);
});

test("rejects changing motive into an unsupported completion outcome", () => {
  const errors = validateMeaningPreservation(
    "现在知道重要了，当时推进 ABC 策略时都不想做。",
    "现在才知道重要，但当时 ABC 策略并没有做下去。",
  );
  assert.match(errors.join("\n"), /completion outcome/);
});

test("rejects adding action to an expression-only message", () => {
  const errors = validateMeaningPreservation(
    "这次终于重视了，之前一直没人愿意投入。",
    "这次终于重视了，之前一直没人愿意投入，后续可以明确负责人。",
  );
  assert.match(errors.join("\n"), /introduced an action/);
});

test("rejects changed numbers and domain terms", () => {
  const errors = validateMeaningPreservation(
    "ABC 覆盖率是 80%。",
    "MMR 覆盖率是 90%。",
  );
  assert.match(errors.join("\n"), /80%/);
  assert.match(errors.join("\n"), /90%/);
  assert.match(errors.join("\n"), /ABC/);
  assert.match(errors.join("\n"), /MMR/);
});

test("allows a loaded question to become a positive question", () => {
  const errors = validateMeaningPreservation(
    "我们没有会议室了吗？",
    "现在还有空闲的会议室可以订吗？",
  );
  assert.deepEqual(errors, []);
});

test("rejects changed Chinese time information", () => {
  const errors = validateMeaningPreservation(
    "麻烦明天下午确认。",
    "麻烦今天上午确认。",
  );
  assert.match(errors.join("\n"), /明天/);
  assert.match(errors.join("\n"), /下午/);
  assert.match(errors.join("\n"), /今天/);
  assert.match(errors.join("\n"), /上午/);
});

test("rejects an invented responsibility subject", () => {
  const errors = validateMeaningPreservation(
    "当时推进某项跨团队策略时都不想做。",
    "当时推进某项跨团队策略时我不太想做。",
  );
  assert.match(errors.join("\n"), /responsibility subject/);
});

test("filters a decorative near-synonym alternative", () => {
  const result = sanitizeResult({
    revised_text: "现在才知道重要，当时推进某项跨团队策略时都不想做。",
    alternatives: [
      {
        label: "更直白",
        text: "现在才知道这事重要，当时推进某项跨团队策略时却都不想做。",
        rationale: "语气更直接。",
      },
    ],
  });
  assert.deepEqual(result.alternatives, []);
});

test("removes contradictory direct-send channel advice", () => {
  const result = sanitizeResult({
    decision: "rewrite",
    revised_text: "现在开始重视了，不过当时整体意愿并不高。",
    alternatives: [],
    channel_advice: "这句话可以直接发。",
  });
  assert.equal(result.channel_advice, "");
});

test("send readiness rejects motive judgment and sarcasm", () => {
  const errors = validateSendReadiness(
    "现在知道重要了，当时推进某项跨团队策略时都不想做",
  );
  assert.match(errors.join("\n"), /motive judgment/);
});
