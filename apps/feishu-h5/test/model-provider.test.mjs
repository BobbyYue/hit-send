import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { normalizeRewriteRequest } from "../src/contract.mjs";
import { createModelProvider } from "../src/model-provider.mjs";


const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoDir = path.resolve(testDir, "..", "..", "..");

test("mock provider returns a valid meaning-preserving rewrite", async () => {
  const rewrite = await createModelProvider({
    provider: "mock",
    runtimePromptPath: path.join(
      repoDir,
      "skills",
      "hit-send",
      "references",
      "runtime-prompt.md",
    ),
    responseSchemaPath: path.join(
      repoDir,
      "skills",
      "hit-send",
      "scripts",
      "response.schema.json",
    ),
  });
  const request = normalizeRewriteRequest({
    task: "rewrite",
    mode: "original",
    message: "这个明天要用，怎么还没弄好，赶紧处理一下。",
  });

  const result = await rewrite(request);

  assert.equal(result.decision, "rewrite");
  assert.match(result.revised_text, /明天/);
  assert.match(result.revised_text, /还没/);
  assert.doesNotMatch(result.revised_text, /今天/);
});
