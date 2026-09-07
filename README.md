# Hit Send

**Before you send, let AI read the message as the recipient.**

[![Validate](https://github.com/BobbyYue/hit-send/actions/workflows/validate.yml/badge.svg)](https://github.com/BobbyYue/hit-send/actions/workflows/validate.yml)
[![Version](https://img.shields.io/badge/version-0.1.2-2563EB.svg)](CHANGELOG.md)
[![License: MIT](https://img.shields.io/badge/license-MIT-16803C.svg)](LICENSE)
[![Agent Skill](https://img.shields.io/badge/Agent_Skill-open_format-0B7A55.svg)](https://agentskills.io/)

[中文说明](README.zh-CN.md) · [Examples](#examples-by-scenario) · [Install](#install) · [Use it](#use-it) · [Optional H5 interface](#optional-h5-interface) · [Latest release](https://github.com/BobbyYue/hit-send/releases/latest)

Hit Send is an open-source Agent Skill for short workplace messages. It checks whether a draft is clear, actionable, appropriately direct, and safe to send, then makes the smallest useful revision without changing the writer's facts, position, ownership, deadline, or voice.

It is designed for messages such as requests, reminders, status updates, disagreements, risk alerts, handoffs, short emails, and replies based on selected conversation context. It never sends the message for you.

## Examples by scenario

Hit Send does not force every message into the same polite template. It keeps the writer's intent and makes the smallest change needed for the recipient to understand or respond.

### Following up on progress

**Draft**

> Why isn't this done yet? We need it tomorrow. Please get it sorted ASAP.

**Suggested**

> We need this tomorrow. Where does it stand, and when do you expect it to be ready? Please flag it now if that timing is at risk.

**What changed:** The urgency stays, while blame is replaced by questions the recipient can answer directly.

### Challenging a proposal

**Draft**

> This approach doesn't make sense. We tried it before and it failed. Why are we doing it again?

**Suggested**

> I don't think we should move forward with this approach as-is. We tried it before and it didn't work. What's different this time?

**What changed:** The disagreement and supporting fact remain, without turning the message into a judgment about the people proposing it.

### Raising a delivery risk

**Draft**

> The API is still unstable, so we'll probably miss Friday. The product team needs to decide today what to cut.

**Suggested**

> The API is still unstable, which puts Friday's release at risk. The product team needs to decide today what can come out of scope.

**What changed:** The uncertainty, cause, decision owner, and timing are easier to scan without overstating the outcome.

### Setting a boundary

**Draft**

> I can help this time, but I can't keep taking last-minute requests. You always send them too late. Next time, send them earlier.

**Suggested**

> I can help this time, but I can't take last-minute requests as the default. For future requests, please send them earlier so I can confirm whether I can support the timing.

**What changed:** The boundary and request stay clear, while the absolute accusation is removed.

The default is one recommended version. A second version appears only when it represents a genuinely different strategy, such as more direct versus more relationship-sensitive wording. Actual wording depends on the context provided; Hit Send does not invent missing facts.

## Install

### Ask your agent

Send this instruction to an Agent Skills-compatible agent:

```text
Install Hit Send from https://github.com/BobbyYue/hit-send,
using the complete subdirectory skills/hit-send. Register it in the agent's normal
Skill directory, then confirm that SKILL.md and its references can be loaded.
Do not overwrite an existing installation without asking.
```

### Clone manually

```bash
git clone --depth 1 https://github.com/BobbyYue/hit-send.git
cp -R ./hit-send/skills/hit-send "<YOUR_AGENT_SKILLS_DIR>/hit-send"
```

Copy the complete folder, not only `SKILL.md`, and reload the agent if required by the host.

### Web or desktop import

Download the [latest release](https://github.com/BobbyYue/hit-send/releases/latest), extract it, and import `skills/hit-send` through the client's Skill interface. Do not import the repository root unless that client explicitly supports repository subpaths.

## Use it

Ask naturally:

```text
Use Hit Send to review this before I send it. Preserve my intent and only change
what materially affects clarity, actionability, or tone:
<paste message>
```

Other useful prompts:

```text
Keep my disagreement, but make sure it does not sound like a personal accusation.
```

```text
Draft a reply from the two selected messages. Do not add any status, decisions,
or commitments that are not in the context.
```

```text
Make this risk update clear. Check the impact, decision owner, and next update
time, but do not invent missing details.
```

## What it protects

- **Meaning:** preserves facts, names, numbers, dates, scope, uncertainty, ownership, commitments, and the intended ask.
- **Voice:** keeps natural workplace language instead of turning every message into formal corporate prose.
- **Actionability:** makes unclear requests easier to answer without inventing deadlines or commitments.
- **Relationship safety:** keeps legitimate disagreement and emotion while removing sarcasm, mind-reading, and unsupported personal judgment.
- **User control:** returns a preview for explicit review or copying; it never posts, replies, or auto-sends.
- **Privacy boundary:** processes only text the user supplies or explicitly selects and does not require conversation-history access.

## Optional H5 interface

The repository includes an optional browser and Feishu/Lark H5 interface under [`apps/feishu-h5`](apps/feishu-h5). It supports:

- local browser use with an authenticated Codex CLI;
- a private model endpoint implementing the documented JSON contract;
- Feishu/Lark chat-box menu and message-action entry points;
- preview and copy without calling a message-send API.

Run a local preview:

```bash
cd apps/feishu-h5
npm test
HIT_SEND_PROVIDER=mock npm start
```

Open <http://127.0.0.1:8787>. See the [H5 deployment guide](apps/feishu-h5/README.md) for model and Feishu/Lark configuration.

## Development

Run the public-package checks:

```bash
python3 scripts/validate_repo.py
npm test --prefix apps/feishu-h5
python3 skills/hit-send/scripts/validate_response.py skills/hit-send/evals/valid-response.json
python3 skills/hit-send/scripts/validate_behavior_cases.py skills/hit-send/evals/behavior-cases.json
```

Repository layout:

```text
skills/hit-send/   installable Agent Skill
apps/feishu-h5/    optional browser and Feishu/Lark interface
.github/workflows/ public CI checks
```

## Privacy and limitations

- Do not put credentials, private conversation exports, internal document links, or real sensitive messages in issues or test cases.
- Local Codex mode requires an installed and authenticated Codex CLI. Other hosts may use only the Skill folder.
- A local H5 URL is available only on that computer. Shared use requires an HTTPS deployment and an independently secured model endpoint.
- Hit Send improves message quality; it cannot determine facts or relationship context that the writer did not provide.

See [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md). Licensed under [MIT](LICENSE).
