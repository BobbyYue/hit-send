import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { loadConfig } from "./config.mjs";
import {
  normalizeRewriteRequest,
  validateRewriteRequest,
} from "./contract.mjs";
import { FeishuJSSDK } from "./feishu-jssdk.mjs";
import { createModelProvider } from "./model-provider.mjs";

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

function json(response, status, body) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(JSON.stringify(body));
}

async function readJson(request, limit = 64 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > limit) throw new Error("request body is too large");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function setSecurityHeaders(response) {
  response.setHeader("x-content-type-options", "nosniff");
  response.setHeader("referrer-policy", "no-referrer");
  response.setHeader("permissions-policy", "camera=(), microphone=(), geolocation=()");
  response.setHeader(
    "content-security-policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' https://s3.bytecdn.cn",
      "style-src 'self'",
      "img-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors https://*.feishu.cn https://*.larkoffice.com https://*.larksuite.com",
    ].join("; "),
  );
}

function createRateLimiter(maxPerMinute = 30) {
  const buckets = new Map();
  return (key) => {
    const minute = Math.floor(Date.now() / 60_000);
    const current = buckets.get(key);
    if (!current || current.minute !== minute) {
      buckets.set(key, { minute, count: 1 });
      return true;
    }
    current.count += 1;
    return current.count <= maxPerMinute;
  };
}

async function serveStatic(config, requestPath, response) {
  const relative = requestPath === "/" ? "index.html" : requestPath.slice(1);
  const resolved = path.resolve(config.publicDir, relative);
  if (!resolved.startsWith(`${path.resolve(config.publicDir)}${path.sep}`)) {
    json(response, 404, { error: "not_found" });
    return;
  }
  try {
    const metadata = await stat(resolved);
    if (!metadata.isFile()) throw new Error("not a file");
    response.writeHead(200, {
      "content-type":
        mimeTypes[path.extname(resolved)] || "application/octet-stream",
      "cache-control": relative === "index.html" ? "no-store" : "public, max-age=300",
    });
    createReadStream(resolved).pipe(response);
  } catch {
    json(response, 404, { error: "not_found" });
  }
}

export async function createHitSendServer(options = {}) {
  const config = options.config || loadConfig();
  const rewrite = options.rewrite || (await createModelProvider(config));
  const feishu = options.feishu || new FeishuJSSDK(config);
  const allowRewrite = createRateLimiter();

  return http.createServer(async (request, response) => {
    setSecurityHeaders(response);
    const requestUrl = new URL(
      request.url || "/",
      `http://${request.headers.host || "localhost"}`,
    );

    try {
      if (request.method === "GET" && requestUrl.pathname === "/api/health") {
        json(response, 200, {
          ok: true,
          provider: config.provider,
          feishuConfigured: Boolean(
            config.feishuAppId && config.feishuAppSecret,
          ),
        });
        return;
      }

      if (request.method === "GET" && requestUrl.pathname === "/api/config") {
        json(response, 200, {
          appId: config.feishuAppId,
          maxInputChars: config.maxInputChars,
          provider: config.provider,
        });
        return;
      }

      if (
        request.method === "GET" &&
        requestUrl.pathname === "/api/feishu/jssdk-config"
      ) {
        const pageUrl = requestUrl.searchParams.get("url");
        if (!pageUrl) {
          json(response, 400, { error: "missing_page_url" });
          return;
        }
        json(response, 200, await feishu.sign(pageUrl));
        return;
      }

      if (request.method === "POST" && requestUrl.pathname === "/api/rewrite") {
        const key = request.socket.remoteAddress || "unknown";
        if (!allowRewrite(key)) {
          json(response, 429, { error: "rate_limited" });
          return;
        }
        const body = await readJson(request);
        const errors = validateRewriteRequest(body, config.maxInputChars);
        if (errors.length > 0) {
          json(response, 400, { error: "invalid_request", details: errors });
          return;
        }
        const normalized = normalizeRewriteRequest(body);
        json(response, 200, await rewrite(normalized));
        return;
      }

      if (request.method === "GET") {
        await serveStatic(config, requestUrl.pathname, response);
        return;
      }
      json(response, 404, { error: "not_found" });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "unexpected server error";
      json(response, 500, { error: "request_failed", message });
    }
  });
}

async function main() {
  const config = loadConfig();
  await readFile(config.runtimePromptPath, "utf8");
  const server = await createHitSendServer({ config });
  server.listen(config.port, config.host, () => {
    console.log(`Hit Send Feishu: http://${config.host}:${config.port}`);
    console.log(
      `provider=${config.provider} feishuConfigured=${Boolean(
        config.feishuAppId && config.feishuAppSecret,
      )}`,
    );
  });
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
