# 这句能发吗？｜Hit Send

**发送前，让 AI 替对方先读一遍。**

[![Validate](https://github.com/BobbyYue/hit-send/actions/workflows/validate.yml/badge.svg)](https://github.com/BobbyYue/hit-send/actions/workflows/validate.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-16803C.svg)](LICENSE)
[![Agent Skill](https://img.shields.io/badge/Agent_Skill-open_format-0B7A55.svg)](https://agentskills.io/)

[English](README.md) · [安装](#安装) · [怎么用](#怎么用) · [可选-h5-入口](#可选-h5-入口)

Hit Send 是一个面向职场短消息的开源 Agent Skill。它会在发送前判断消息是否清楚、好回复、语气合适，并在确实有必要时做最小改写，同时保留事实、立场、责任主体、时间、承诺和你的日常说话方式。

适用场景包括请求协作、催进度、状态同步、表达不同意见、风险提醒、交接、短邮件，以及根据选中会话起草回复。它不会替你发送消息。

![Hit Send H5 页面预览](docs/assets/hit-send-h5.png)

## 它主要解决什么

| 真实场景 | Hit Send 重点检查 |
| --- | --- |
| 请求帮助或确认 | 对方是否知道要做什么、怎么回复、什么时候需要？ |
| 提醒或催进度 | 是否保留紧迫性，同时避免模糊施压和指责？ |
| 提不同意见或纠错 | 是否把事实与对动机、态度、能力的猜测分开？ |
| 同步风险 | 对方能否看清现状、不确定性、影响和待决事项？ |
| 根据会话起草回复 | 是否只使用选中的上下文和你明确提供的事实？ |
| 表达不满 | 是否保留真实情绪，同时去掉讽刺和未经支持的判断？ |

默认只给一个推荐版。只有当第二种表达代表真正不同的沟通策略时，才会提供备选。

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

## 怎么用

可以直接这样说：

```text
使用 Hit Send 检查这句话：
这个明天要用，怎么还没弄好，赶紧处理一下。
```

更有效的建议版会把催促变成对方可以回答的问题，同时不虚构交付承诺：

```text
这个明天要用，想确认下目前进度和预计完成时间；如果明天前有风险，也请一起说明。
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
docs/assets/       README 预览图
.github/workflows/ 公开 CI 检查
```

## 隐私与限制

- 不要在 Issue 或测试用例中提交凭证、私人会话导出、内部文档链接或真实敏感消息。
- 本地 Codex 模式要求电脑已安装并登录 Codex CLI；其他 Agent 可以只使用 Skill 目录。
- 本地 H5 地址只能在当前电脑访问；多人共享需要部署 HTTPS 服务并独立保护模型端点。
- Hit Send 可以改善表达，但无法判断用户没有提供的事实和关系背景。

更多说明见 [CONTRIBUTING.md](CONTRIBUTING.md) 和 [SECURITY.md](SECURITY.md)。项目采用 [MIT License](LICENSE)。
