# Hit Send H5

This optional web interface exposes the Hit Send Skill in a browser or a Feishu/Lark sidebar. It previews recommendations and lets the user copy them; it does not call a message-send API.

## Local preview

Requirements:

- Node.js 20 or later;
- no third-party runtime packages;
- either an authenticated Codex CLI, the built-in mock provider, or a compatible private model endpoint.

From the repository root:

```bash
cd apps/feishu-h5
cp .env.example .env
npm test
npm start
```

Open <http://127.0.0.1:8787>.

For a UI-only preview that does not call a model:

```bash
HIT_SEND_PROVIDER=mock npm start
```

The local URL is available only on the current computer and stops when the server stops. Shared use requires an HTTPS deployment.

## Model providers

### Local Codex CLI

The default provider calls the installed, authenticated Codex CLI:

```bash
HIT_SEND_PROVIDER=codex
HIT_SEND_MODEL=gpt-5.4-mini
```

The server reads the runtime policy and response schema from:

```text
skills/hit-send/references/runtime-prompt.md
skills/hit-send/scripts/response.schema.json
```

### Private endpoint

```bash
HIT_SEND_PROVIDER=endpoint
HIT_SEND_MODEL_ENDPOINT=https://example.com/api/hit-send
HIT_SEND_MODEL_TOKEN=replace-me
```

The endpoint receives:

```json
{
  "system_prompt": "complete Hit Send runtime policy",
  "request": {
    "task": "rewrite",
    "mode": "original",
    "variant_count": 2,
    "message": "draft message",
    "context_messages": []
  },
  "response_schema": {},
  "validation_feedback": "present only after a failed first result"
}
```

Return the result object directly or as `{ "result": { ... } }`. The server validates meaning preservation and retries once after a failed first result; a second failure ends the request.

`variant_count` is a maximum, not a quota. Do not create decorative alternatives.

## Feishu/Lark setup

Create an enterprise self-built app and enable its web-app capability:

1. Deploy this service to an HTTPS origin.
2. Add that origin as the desktop and mobile homepage and as an H5 trusted domain.
3. Add a chat-box `+` menu entry for rewriting a draft.
4. Add a message-action entry for drafting a reply from explicitly selected messages.
5. Configure the app's availability and publish a version.

Both entries can open the same sidebar AppLink:

```text
https://applink.feishu.cn/client/web_app/open?appId=cli_xxx&mode=sidebar
```

Server-side configuration:

```bash
FEISHU_APP_ID=cli_xxx
FEISHU_APP_SECRET=replace-me
HIT_SEND_PUBLIC_ORIGIN=https://your-hit-send.example.com
```

Keep `FEISHU_APP_SECRET` on the server. The service uses it to obtain a tenant token and JSSDK ticket and signs only the current page URL.

See the official [Feishu/Lark client development introduction](https://open.feishu.cn/document/client-docs/intro) for current platform setup details.

## Data and permission boundary

- Does not subscribe to messages or read chat history by default.
- Processes only a draft the user enters or copies, or messages the user explicitly selects.
- Does not persist input text, selected context, or model output.
- Does not request or call a send-message permission.
- Clipboard access is requested through the client only when the user invokes that action.
- Limits request bodies to 64 KB and applies basic per-client rate limiting.
- The Feishu H5 SDK currently requires CSP `unsafe-eval`; script sources remain limited to the same origin and `s3.bytecdn.cn`.

Production operators are responsible for HTTPS termination, endpoint authentication, rate limiting appropriate to their users, secret management, logging policy, and retention controls.
