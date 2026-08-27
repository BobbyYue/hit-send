import { fileURLToPath } from "node:url";
import path from "node:path";

const sourceDir = path.dirname(fileURLToPath(import.meta.url));
const feishuDir = path.resolve(sourceDir, "..");
const repoDir = path.resolve(feishuDir, "..", "..");

function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function loadConfig(env = process.env) {
  return {
    host: env.HOST || "127.0.0.1",
    port: positiveInteger(env.PORT, 8787),
    publicOrigin: (env.HIT_SEND_PUBLIC_ORIGIN || "").replace(/\/$/, ""),
    feishuAppId: env.FEISHU_APP_ID || "",
    feishuAppSecret: env.FEISHU_APP_SECRET || "",
    feishuBaseUrl: (env.FEISHU_BASE_URL || "https://open.feishu.cn").replace(
      /\/$/,
      "",
    ),
    provider: env.HIT_SEND_PROVIDER || "codex",
    model: env.HIT_SEND_MODEL || "gpt-5.4-mini",
    modelEndpoint: env.HIT_SEND_MODEL_ENDPOINT || "",
    modelToken: env.HIT_SEND_MODEL_TOKEN || "",
    modelTimeoutMs: positiveInteger(env.HIT_SEND_MODEL_TIMEOUT_MS, 45_000),
    maxInputChars: positiveInteger(env.HIT_SEND_MAX_INPUT_CHARS, 12_000),
    publicDir: path.join(feishuDir, "public"),
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
  };
}
