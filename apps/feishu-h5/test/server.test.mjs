import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { loadConfig } from "../src/config.mjs";
import { createHitSendServer } from "../src/server.mjs";

function mockResult(request) {
  return {
    decision: "pass",
    revised_text: request.message,
    recommended_label: "原意优先",
    alternatives: [],
    summary: "可以直接发。",
    findings: [],
    channel_advice: "",
  };
}

test("serves health and validates rewrite requests", async (context) => {
  const config = {
    ...loadConfig({}),
    host: "127.0.0.1",
    port: 0,
    provider: "mock",
  };
  const server = await createHitSendServer({
    config,
    rewrite: async (request) => mockResult(request),
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  context.after(() => server.close());

  const address = server.address();
  const origin = `http://127.0.0.1:${address.port}`;
  const healthResponse = await fetch(`${origin}/api/health`);
  assert.match(
    healthResponse.headers.get("content-security-policy"),
    /script-src 'self' 'unsafe-eval' https:\/\/s3\.bytecdn\.cn/,
  );
  const health = await healthResponse.json();
  assert.equal(health.ok, true);

  const invalid = await fetch(`${origin}/api/rewrite`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ task: "rewrite", mode: "original", message: "" }),
  });
  assert.equal(invalid.status, 400);

  const valid = await fetch(`${origin}/api/rewrite`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      task: "rewrite",
      mode: "original",
      message: "下午三点前给我结果。",
    }),
  });
  assert.equal(valid.status, 200);
  assert.equal((await valid.json()).decision, "pass");
});
