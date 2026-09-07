# 这句能发吗？｜Hit Send

**发送前，让 AI 替对方先读一遍。**

[![Validate](https://github.com/BobbyYue/hit-send/actions/workflows/validate.yml/badge.svg)](https://github.com/BobbyYue/hit-send/actions/workflows/validate.yml)
[![Version](https://img.shields.io/badge/version-0.1.2-2563EB.svg)](CHANGELOG.md)
[![License: MIT](https://img.shields.io/badge/license-MIT-16803C.svg)](LICENSE)
[![Agent Skill](https://img.shields.io/badge/Agent_Skill-open_format-0B7A55.svg)](https://agentskills.io/)

[English](README.md) · [分场景看效果](#分场景看效果) · [安装](#安装) · [怎么用](#怎么用) · [可选-h5-入口](#可选-h5-入口) · [最新版本](https://github.com/BobbyYue/hit-send/releases/latest)

Hit Send 是一个面向职场短消息的开源 Agent Skill。它会在发送前判断消息是否清楚、好回复、语气合适，并在确实有必要时做最小改写，同时保留事实、立场、责任主体、时间、承诺和你的日常说话方式。

适用场景包括请求协作、催进度、状态同步、表达不同意见、风险提醒、交接、短邮件，以及根据选中会话起草回复。它不会替你发送消息。

## 分场景看效果

Hit Send 不会把所有消息都套成同一种客气模板。它会保留你的真实意图，只修改那些确实影响理解、配合或关系的地方。

### 催进度

**原话**

> 这个明天要用，怎么还没弄好，赶紧处理一下。

**建议版**

> 这个明天要用，想确认下现在做到哪了、预计什么时候能完成；如果明天前有风险，也请一起说下。

**改了什么：** 保留事情的紧迫性，把指责改成对方可以直接回答的进度和风险问题。

### 表达不同意见

**原话**

> 这个方案根本行不通，上次都失败了，为什么还要再做一遍？

**建议版**

> 我不建议按现在的方案直接推进。上次这个方案没有跑通，想先确认下，这次有哪些关键条件发生了变化？

**改了什么：** 保留明确的反对意见和依据，但不把分歧变成对人的否定。

### 同步交付风险

**原话**

> 接口还不稳定，周五大概率发不了。产品今天得决定砍哪些需求。

**建议版**

> 接口目前还不稳定，周五发布存在较大风险。今天需要产品确认哪些需求可以先不做。

**改了什么：** 把原因、风险程度、决策方和时间放到明面上，同时没有把风险写成已经确定的结果。

### 说明边界

**原话**

> 这次我可以帮忙，但不能每次都这么临时，你们总是太晚才提。下次早点。

**建议版**

> 这次我可以帮忙，但临时需求不能成为常态。后续请尽量提前提出，方便我确认能否按时支持。

**改了什么：** 保留边界和要求，去掉“总是”这类容易让对方先进入防御状态的表达。

默认只给一个推荐版。只有当第二种表达代表真正不同的沟通策略时，才会提供备选。具体措辞取决于用户提供的上下文；Hit Send 不会补写缺失的事实。

## 安装

### 让 Agent 安装

把下面这段话发给支持 Agent Skills 的 Agent：

```text
从 https://github.com/BobbyYue/hit-send 安装 Hit Send，
使用完整子目录 skills/hit-send，并注册到当前 Agent 的常规 Skill 目录。
安装后确认 SKILL.md 和引用文件可以加载；如已有同名版本，不要直接覆盖，先询问我。
```

### 手动安装

```bash
git clone --depth 1 https://github.com/BobbyYue/hit-send.git
cp -R ./hit-send/skills/hit-send "<你的 Agent Skill 目录>/hit-send"
```

需要复制整个目录，而不是只复制 `SKILL.md`。部分 Agent 安装后需要重新加载会话。

### 网页或桌面客户端导入

下载[最新 Release](https://github.com/BobbyYue/hit-send/releases/latest)，解压后通过客户端的 Skill 界面导入 `skills/hit-send`。除非客户端明确支持仓库子目录，否则不要直接导入仓库根目录。

## 怎么用

可以直接这样说：

```text
使用 Hit Send 检查下面这句话。保留我的原意，只改确实影响理解、配合或语气的地方：
<粘贴消息>
```

其他常见用法：

```text
这句话会不会太冲？保留我的不同意见，但不要写得像在指责对方。
```

```text
根据我选中的两条消息起草回复，没有提供的进度、决定和承诺不要补。
```

```text
帮我把这条风险同步写清楚，重点检查影响、需要谁决定，以及下一次更新时间。
```

## 它会保护什么

- **原意**：保留事实、名字、数字、时间、范围、不确定性、责任主体、承诺和真正诉求。
- **个人表达**：保留自然的职场语言，不把日常消息写成模板化公文。
- **可配合性**：让模糊请求更容易回复，但不擅自添加截止时间和承诺。
- **关系安全**：保留合理的不同意见和情绪，去掉讽刺、读心和无依据的人格判断。
- **用户控制**：只提供预览和复制，不会自动回复、替换或发送。
- **隐私边界**：只处理用户输入或主动选择的内容，不需要默认读取会话历史。

## 可选 H5 入口

仓库在 [`apps/feishu-h5`](apps/feishu-h5) 中提供了可选的浏览器和飞书/Lark H5 页面，支持：

- 使用本机已登录的 Codex CLI；
- 接入符合文档协议的私有模型端点；
- 配置飞书聊天框“+”菜单和消息快捷操作；
- 预览和复制结果，但不调用消息发送接口。

本地预览：

```bash
cd apps/feishu-h5
npm test
HIT_SEND_PROVIDER=mock npm start
```

打开 <http://127.0.0.1:8787>。模型和飞书配置见 [H5 部署说明](apps/feishu-h5/README.md)。

## 开发与验证

```bash
python3 scripts/validate_repo.py
npm test --prefix apps/feishu-h5
python3 skills/hit-send/scripts/validate_response.py skills/hit-send/evals/valid-response.json
python3 skills/hit-send/scripts/validate_behavior_cases.py skills/hit-send/evals/behavior-cases.json
```

```text
skills/hit-send/   可安装的 Agent Skill
apps/feishu-h5/    可选的浏览器与飞书/Lark 页面
.github/workflows/ 公开 CI 检查
```

## 隐私与限制

- 不要在 Issue 或测试用例中提交凭证、私人会话导出、内部文档链接或真实敏感消息。
- 本地 Codex 模式要求电脑已安装并登录 Codex CLI；其他 Agent 可以只使用 Skill 目录。
- 本地 H5 地址只能在当前电脑访问；多人共享需要部署 HTTPS 服务并独立保护模型端点。
- Hit Send 可以改善表达，但无法判断用户没有提供的事实和关系背景。

更多说明见 [CONTRIBUTING.md](CONTRIBUTING.md) 和 [SECURITY.md](SECURITY.md)。项目采用 [MIT License](LICENSE)。
