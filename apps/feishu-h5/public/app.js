import {
  normalizeShortcutMessages,
  parseLaunchContext,
} from "./message-utils.js";

const elements = {
  sceneLabel: document.querySelector("#scene-label"),
  environmentBadge: document.querySelector("#environment-badge"),
  toast: document.querySelector("#toast"),
  toastText: document.querySelector("#toast-text"),
  contextSection: document.querySelector("#context-section"),
  contextCount: document.querySelector("#context-count"),
  contextList: document.querySelector("#context-list"),
  sourceLabel: document.querySelector("#source-label"),
  sourceInput: document.querySelector("#source-input"),
  sourceState: document.querySelector("#source-state"),
  characterCount: document.querySelector("#character-count"),
  readClipboardButton: document.querySelector("#read-clipboard-button"),
  submitButton: document.querySelector("#submit-button"),
  errorMessage: document.querySelector("#error-message"),
  loadingSection: document.querySelector("#loading-section"),
  resultSection: document.querySelector("#result-section"),
  decisionLabel: document.querySelector("#decision-label"),
  resultSummary: document.querySelector("#result-summary"),
  copyButton: document.querySelector("#copy-button"),
  versionTabs: document.querySelector("#version-tabs"),
  resultText: document.querySelector("#result-text"),
  versionRationale: document.querySelector("#version-rationale"),
  findingsSection: document.querySelector("#findings-section"),
  findingsList: document.querySelector("#findings-list"),
  channelSection: document.querySelector("#channel-section"),
  channelText: document.querySelector("#channel-text"),
};

const state = {
  config: null,
  launch: parseLaunchContext(window.location.href),
  contextMessages: [],
  versions: [],
  selectedVersion: 0,
  processing: false,
  feishuReady: false,
  toastTimer: null,
};

function ttCall(method, options = {}) {
  return new Promise((resolve, reject) => {
    const api = window.tt?.[method];
    if (typeof api !== "function") {
      reject(new Error(`${method} is unavailable`));
      return;
    }
    api({
      ...options,
      success: resolve,
      fail: (error) =>
        reject(
          new Error(error?.errMsg || error?.message || `${method} failed`),
        ),
    });
  });
}

function setError(message = "") {
  elements.errorMessage.textContent = message;
  elements.errorMessage.hidden = !message;
}

function showToast(message) {
  clearTimeout(state.toastTimer);
  elements.toastText.textContent = message;
  elements.toast.hidden = false;
  state.toastTimer = setTimeout(() => {
    elements.toast.hidden = true;
  }, 1_600);
}

function setProcessing(processing) {
  state.processing = processing;
  elements.submitButton.disabled = processing;
  elements.submitButton.classList.toggle("is-loading", processing);
  elements.submitButton.setAttribute("aria-busy", String(processing));
  elements.loadingSection.hidden = !processing;
  elements.submitButton.textContent = processing
    ? state.launch.scene === "message_action"
      ? "正在想回复"
      : "正在过一遍"
    : state.launch.scene === "message_action"
      ? "帮我回一句"
      : "帮我过一遍";
}

function updateCharacterCount() {
  elements.characterCount.textContent =
    `${elements.sourceInput.value.length} / ${elements.sourceInput.maxLength}`;
}

function selectedMode() {
  return (
    document.querySelector('input[name="mode"]:checked')?.value || "original"
  );
}

function renderContext() {
  const messages = state.contextMessages;
  elements.contextSection.hidden = messages.length === 0;
  elements.contextCount.textContent = `${messages.length} 条`;
  elements.contextList.replaceChildren(
    ...messages.map((message) => {
      const item = document.createElement("div");
      item.className = "context-item";
      const sender = document.createElement("div");
      sender.className = "context-sender";
      sender.textContent = message.sender || "会话消息";
      const text = document.createElement("p");
      text.className = "context-text";
      text.textContent = message.text;
      item.append(sender, text);
      return item;
    }),
  );
}

function decisionText(decision) {
  return {
    pass: "可以直接发",
    polish: "小改会更清楚",
    rewrite: "建议重新组织",
    switch_channel: "建议换个沟通方式",
  }[decision];
}

function dimensionText(dimension) {
  return {
    intent: "意图",
    conclusion: "结论",
    context: "上下文",
    judgment: "判断",
    action: "行动",
    timing: "时间",
    emotion: "语气",
    reply_cost: "回复成本",
    closure: "闭环",
    channel: "沟通渠道",
  }[dimension] || "表达";
}

function renderVersion(index) {
  state.selectedVersion = index;
  const version = state.versions[index];
  elements.resultText.value = version.text;
  elements.versionRationale.textContent = version.rationale || "";
  Array.from(elements.versionTabs.children).forEach((button, buttonIndex) => {
    const selected = buttonIndex === index;
    button.setAttribute("aria-selected", selected ? "true" : "false");
    button.tabIndex = selected ? 0 : -1;
    if (selected) {
      elements.resultText.setAttribute("aria-labelledby", button.id);
    }
  });
}

function renderResult(result) {
  state.versions = [
    {
      label: result.recommended_label,
      text: result.revised_text,
      rationale: "",
    },
    ...result.alternatives,
  ];
  elements.resultSection.hidden = false;
  elements.decisionLabel.textContent = decisionText(result.decision);
  elements.decisionLabel.dataset.decision = result.decision;
  elements.resultSummary.textContent = result.summary;
  elements.versionTabs.replaceChildren(
    ...state.versions.map((version, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.role = "tab";
      button.id = `version-tab-${index}`;
      button.setAttribute("aria-controls", "result-text");
      button.textContent = index === 0 ? `${version.label} · 推荐` : version.label;
      button.addEventListener("click", () => renderVersion(index));
      return button;
    }),
  );
  elements.findingsList.replaceChildren(
    ...result.findings.map((finding) => {
      const item = document.createElement("li");
      const heading = document.createElement("div");
      heading.className = "finding-heading";
      const dimension = document.createElement("span");
      dimension.className = "finding-dimension";
      dimension.textContent = dimensionText(finding.dimension);
      const title = document.createElement("strong");
      title.textContent = finding.issue;
      const suggestion = document.createElement("span");
      suggestion.textContent = `怎么改：${finding.suggestion}`;
      heading.append(dimension, title);
      item.append(heading, suggestion);
      return item;
    }),
  );
  elements.findingsSection.hidden = result.findings.length === 0;
  elements.channelText.textContent = result.channel_advice;
  elements.channelSection.hidden = !result.channel_advice;
  renderVersion(0);
  elements.resultSection.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
    block: "start",
  });
}

async function writeClipboard(text) {
  if (state.feishuReady) {
    await ttCall("setClipboardData", { data: text });
    return;
  }
  await navigator.clipboard.writeText(text);
}

async function copySelectedVersion() {
  const version = state.versions[state.selectedVersion];
  if (!version) return;
  try {
    await writeClipboard(version.text);
    showToast("已复制到剪贴板");
  } catch {
    setError("复制失败，请选中结果后手动复制。");
  }
}

async function submit() {
  if (state.processing) return;
  setError();
  const task =
    state.launch.scene === "message_action" ? "reply" : "rewrite";
  const message = elements.sourceInput.value.trim();
  if (task === "rewrite" && !message) {
    setError("没有读到要检查的文字。");
    elements.sourceInput.focus();
    return;
  }
  if (task === "reply" && state.contextMessages.length === 0) {
    setError("没有读到选中的消息。");
    return;
  }

  elements.resultSection.hidden = true;
  setProcessing(true);
  try {
    const response = await fetch("/api/rewrite", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        task,
        mode: selectedMode(),
        message,
        context_messages: state.contextMessages,
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.message || payload.details?.[0] || "处理失败");
    }
    renderResult(payload);
  } catch (error) {
    setError(error instanceof Error ? error.message : "处理失败，请稍后重试。");
  } finally {
    setProcessing(false);
  }
}

async function requestClipboardAccess() {
  if (!state.config?.appId) throw new Error("飞书 App ID 未配置");
  await ttCall("requestAccess", {
    appID: state.config.appId,
    scopeList: ["scope.clipboard"],
  });
}

async function readClipboard({ requestAccess = false, autoSubmit = false } = {}) {
  setError();
  try {
    if (requestAccess) await requestClipboardAccess();
    const result = state.feishuReady
      ? await ttCall("getClipboardData")
      : { data: await navigator.clipboard.readText() };
    const value = (result.data || "").trim();
    if (!value) {
      elements.sourceState.textContent = "剪贴板里没有文字";
      return;
    }
    elements.sourceInput.value = value.slice(0, state.config.maxInputChars);
    elements.sourceState.textContent = "已读取剪贴板";
    elements.readClipboardButton.hidden = true;
    updateCharacterCount();
    if (autoSubmit) await submit();
  } catch {
    elements.sourceState.textContent = "未获得剪贴板内容";
    elements.readClipboardButton.hidden = false;
  }
}

async function configureFeishu() {
  if (!window.h5sdk || !window.tt || !state.config.appId) return false;
  const pageUrl = `${location.origin}${location.pathname}${location.search}`;
  const response = await fetch(
    `/api/feishu/jssdk-config?url=${encodeURIComponent(pageUrl)}`,
  );
  const config = await response.json();
  if (!response.ok) {
    throw new Error(config.message || "飞书客户端鉴权失败");
  }

  await new Promise((resolve, reject) => {
    window.h5sdk.error((error) =>
      reject(new Error(error?.errMsg || "飞书客户端鉴权失败")),
    );
    window.h5sdk.ready(resolve);
    window.h5sdk.config({
      appId: config.appId,
      timestamp: config.timestamp,
      nonceStr: config.nonceStr,
      signature: config.signature,
      jsApiList: [
        "getTriggerContext",
        "getBlockActionSourceDetail",
        "getClipboardData",
        "setClipboardData",
      ],
    });
  });
  state.feishuReady = true;
  return true;
}

async function loadMessageShortcut() {
  if (!state.launch.triggerCode) {
    throw new Error("没有获得消息快捷操作上下文");
  }
  const detail = await ttCall("getBlockActionSourceDetail", {
    triggerCode: state.launch.triggerCode,
  });
  state.contextMessages = normalizeShortcutMessages(detail);
  renderContext();
  if (state.contextMessages.length === 0) {
    throw new Error("选中的消息类型暂不支持");
  }
}

function configureSceneUI() {
  const isReply = state.launch.scene === "message_action";
  elements.sceneLabel.textContent = isReply
    ? "读懂上下文，帮你回复得清楚、自然"
    : "替对方读一遍，让消息清楚、得体、好回复";
  elements.sourceLabel.textContent = isReply
    ? "我想表达的要点（可选）"
    : "要检查的草稿";
  elements.sourceInput.placeholder = isReply
    ? "补充你的判断、进度或希望对方采取的行动"
    : "输入或粘贴一段工作消息";
  if (state.launch.scene === "preview") {
    elements.environmentBadge.hidden = false;
  }
}

async function initialize() {
  configureSceneUI();
  updateCharacterCount();
  const response = await fetch("/api/config");
  state.config = await response.json();
  elements.sourceInput.maxLength = state.config.maxInputChars;
  updateCharacterCount();

  try {
    await configureFeishu();
    if (state.launch.scene === "message_action") {
      await loadMessageShortcut();
    } else if (state.launch.scene === "plus_menu") {
      await readClipboard({ autoSubmit: true });
    }
  } catch (error) {
    setError(error instanceof Error ? error.message : "飞书入口初始化失败");
    if (state.launch.scene === "plus_menu") {
      elements.readClipboardButton.hidden = false;
    }
  }
}

elements.sourceInput.addEventListener("input", updateCharacterCount);
elements.submitButton.addEventListener("click", submit);
elements.copyButton.addEventListener("click", copySelectedVersion);
elements.readClipboardButton.addEventListener("click", () =>
  readClipboard({ requestAccess: state.feishuReady, autoSubmit: false }),
);

initialize();
