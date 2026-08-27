const decisions = new Set(["pass", "polish", "rewrite", "switch_channel"]);
const modes = new Set(["original", "direct", "softer", "concise"]);
const tasks = new Set(["rewrite", "reply"]);
const dimensions = new Set([
  "intent",
  "conclusion",
  "context",
  "judgment",
  "action",
  "timing",
  "emotion",
  "reply_cost",
  "closure",
  "channel",
]);

const requiredResultKeys = new Set([
  "decision",
  "revised_text",
  "recommended_label",
  "alternatives",
  "summary",
  "findings",
  "channel_advice",
]);

function hasExactKeys(value, expected) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const actual = Object.keys(value);
  return (
    actual.length === expected.size && actual.every((key) => expected.has(key))
  );
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function containsAny(text, signals) {
  return signals.some((signal) => text.includes(signal));
}

function tokenSet(text, pattern) {
  return new Set((text.match(pattern) || []).map((value) => value.replace(/[.,;:!?，。；：！？]+$/u, "")));
}

function compareTokens(name, pattern, original, candidate, errors) {
  const source = tokenSet(original, pattern);
  const revised = tokenSet(candidate, pattern);
  const missing = [...source].filter((value) => !revised.has(value));
  const added = [...revised].filter((value) => !source.has(value));
  if (missing.length > 0) errors.push(`missing original ${name}: ${missing.join(", ")}`);
  if (added.length > 0) errors.push(`introduced ${name}: ${added.join(", ")}`);
}

function compareSignals(name, signals, original, candidate, errors) {
  const source = new Set(signals.filter((signal) => original.includes(signal)));
  const revised = new Set(signals.filter((signal) => candidate.includes(signal)));
  const missing = [...source].filter((value) => !revised.has(value));
  const added = [...revised].filter((value) => !source.has(value));
  if (missing.length > 0) errors.push(`missing original ${name}: ${missing.join(", ")}`);
  if (added.length > 0) errors.push(`introduced ${name}: ${added.join(", ")}`);
}

function isQuestion(text) {
  return containsAny(text, ["？", "?", "吗", "么", "是否", "能否"]);
}

function subjectSignals(text) {
  const subjects = new Set();
  for (const [singular, plural] of [
    ["我", "我们"],
    ["你", "你们"],
    ["他", "他们"],
    ["她", "她们"],
  ]) {
    if (text.includes(plural)) subjects.add(plural);
    else if (text.includes(singular)) subjects.add(singular);
  }
  for (const collective of ["大家", "团队", "对方"]) {
    if (text.includes(collective)) subjects.add(collective);
  }
  return subjects;
}

function normalizedCharacters(text) {
  return [...text.toLocaleLowerCase()].filter((character) =>
    /[\p{L}\p{N}]/u.test(character)
  );
}

function editDistance(left, right) {
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  left.forEach((leftCharacter, leftIndex) => {
    const current = [leftIndex + 1];
    right.forEach((rightCharacter, rightIndex) => {
      current.push(
        Math.min(
          current[rightIndex] + 1,
          previous[rightIndex + 1] + 1,
          previous[rightIndex] + (leftCharacter === rightCharacter ? 0 : 1),
        ),
      );
    });
    previous = current;
  });
  return previous[right.length];
}

function isNearDuplicate(leftText, rightText) {
  const left = normalizedCharacters(leftText);
  const right = normalizedCharacters(rightText);
  if (left.length === 0 || right.length === 0) {
    return left.join("") === right.join("");
  }
  const threshold = Math.max(2, Math.floor(Math.max(left.length, right.length) * 0.18));
  return editDistance(left, right) <= threshold;
}

export function sanitizeResult(value) {
  if (!value || typeof value !== "object" || !Array.isArray(value.alternatives)) {
    return value;
  }
  const retained = [];
  for (const alternative of value.alternatives) {
    if (!alternative || typeof alternative.text !== "string") {
      retained.push(alternative);
      continue;
    }
    const existingTexts = [value.revised_text, ...retained.map((item) => item.text)];
    if (!existingTexts.some((text) =>
      typeof text === "string" && isNearDuplicate(text, alternative.text)
    )) {
      retained.push(alternative);
    }
  }
  const contradictoryAdviceSignals = [
    "可以直接发", "直接发送即可", "原文可以发", "原文可直接发送",
  ];
  const channelAdvice =
    value.decision !== "pass" &&
    contradictoryAdviceSignals.some((signal) =>
      typeof value.channel_advice === "string" && value.channel_advice.includes(signal)
    )
      ? ""
      : value.channel_advice;
  return { ...value, alternatives: retained, channel_advice: channelAdvice };
}

export function validateMeaningPreservation(original, candidate) {
  const errors = [];
  compareTokens("number or date", /\d+(?:\.\d+)?%?/gu, original, candidate, errors);
  compareTokens("link", /https?:\/\/[^\s]+/gu, original, candidate, errors);
  compareTokens("domain term", /\b[A-Z][A-Z0-9_-]{1,}\b/gu, original, candidate, errors);
  compareSignals(
    "time information",
    [
      "今天", "明天", "后天", "本周", "下周", "本月", "下月",
      "周一", "周二", "周三", "周四", "周五", "周六", "周日",
      "星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日",
      "上午", "中午", "下午", "晚上", "月初", "月底", "年内",
    ],
    original,
    candidate,
    errors,
  );

  const sourceSubjects = subjectSignals(original);
  const candidateSubjects = subjectSignals(candidate);
  const addedSubjects = [...candidateSubjects].filter(
    (subject) => !sourceSubjects.has(subject),
  );
  if (addedSubjects.length > 0) {
    errors.push(`introduced or changed responsibility subject: ${addedSubjects.join(", ")}`);
  }

  const negationSignals = ["不", "没", "未", "无法", "不能", "别", "勿"];
  if (
    containsAny(original, negationSignals) &&
    !containsAny(candidate, negationSignals) &&
    !(isQuestion(original) && isQuestion(candidate))
  ) {
    errors.push("removed negation or refusal");
  }

  const currentSignals = ["现在", "这次", "目前", "如今"];
  const pastSignals = ["当时", "之前", "以前", "此前", "过去"];
  if (
    containsAny(original, currentSignals) &&
    containsAny(original, pastSignals) &&
    (!containsAny(candidate, currentSignals) || !containsAny(candidate, pastSignals))
  ) {
    errors.push("removed the current-versus-past contrast");
  }

  const sourceActionSignals = [
    "麻烦", "请", "帮", "能否", "可以吗", "看下", "看看", "确认", "同步",
    "处理", "跟进", "回复", "告诉", "安排", "需要", "建议", "下一步", "后续",
    "我可以", "我们可以", "希望", "？", "?",
  ];
  const candidateActionSignals = [
    "麻烦", "请", "帮忙", "能否", "可以吗", "需要你", "需要大家",
    "建议", "下一步", "后续可以", "这次可以", "我们可以", "最好", "请同步",
    "我可以", "希望", "请确认", "请回复", "告诉我",
  ];
  if (
    !containsAny(original, sourceActionSignals) &&
    containsAny(candidate, candidateActionSignals)
  ) {
    errors.push("introduced an action or recommendation into an expression-only message");
  }

  const motiveSignals = ["不想", "不愿", "没意愿", "意愿不高", "不重视"];
  const outcomeSignals = [
    "没做", "没有做", "没完成", "没有完成", "没推进", "没有推进", "没落地",
    "没有落地", "做下去", "推进下去", "最终失败",
  ];
  if (
    containsAny(original, motiveSignals) &&
    !containsAny(original, outcomeSignals) &&
    containsAny(candidate, outcomeSignals)
  ) {
    errors.push("changed a motive judgment into an unsupported completion outcome");
  }

  const commitmentSignals = [
    "我来负责", "我会负责", "我们会", "保证", "承诺", "一定能", "可以完成",
    "会在今天", "会在明天", "会在本周",
  ];
  for (const signal of commitmentSignals) {
    if (!original.includes(signal) && candidate.includes(signal)) {
      errors.push(`introduced commitment: ${signal}`);
    }
  }

  const consensusSignals = ["形成共识", "已经有共识", "大家都认可", "一致认为"];
  for (const signal of consensusSignals) {
    if (!original.includes(signal) && candidate.includes(signal)) {
      errors.push(`introduced consensus: ${signal}`);
    }
  }
  return errors;
}

export function validateSendReadiness(text) {
  const errors = [];
  const motiveOrSarcasmSignals = [
    "都不想", "他不想", "他们不想", "你不想", "你们不想", "大家不想",
    "就是不想", "根本不想", "不愿配合", "不重视", "现在才知道", "现在知道重要了",
  ];
  if (containsAny(text, motiveOrSarcasmSignals)) {
    errors.push("contains a motive judgment or wording likely to read as sarcasm");
  }

  const vagueUrgencySignals = ["尽快", "赶紧", "抓紧", "尽早"];
  if (containsAny(text, vagueUrgencySignals)) {
    errors.push("uses vague urgency instead of a replyable status or timing question");
  }

  const loadedQuestionSignals = ["怎么还没", "到底有没有", "难道"];
  const negatedAvailabilityQuestion = text.includes("没有") && isQuestion(text);
  if (containsAny(text, loadedQuestionSignals) || negatedAvailabilityQuestion) {
    errors.push("uses a loaded rhetorical question");
  }
  return errors;
}

export function validateRewriteRequest(value, maxInputChars = 12_000) {
  const errors = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return ["request must be an object"];
  }

  const task = value.task || "rewrite";
  if (!tasks.has(task)) errors.push("task must be rewrite or reply");
  if (!modes.has(value.mode || "original")) {
    errors.push("mode is invalid");
  }
  if (typeof value.message !== "string") {
    errors.push("message must be a string");
  } else if (value.message.length > maxInputChars) {
    errors.push(`message must be at most ${maxInputChars} characters`);
  }

  const contextMessages = value.context_messages ?? [];
  if (!Array.isArray(contextMessages)) {
    errors.push("context_messages must be an array");
  } else {
    if (contextMessages.length > 20) {
      errors.push("context_messages must contain at most 20 items");
    }
    contextMessages.forEach((message, index) => {
      if (!message || typeof message !== "object" || Array.isArray(message)) {
        errors.push(`context_messages[${index}] must be an object`);
        return;
      }
      if (!isNonEmptyString(message.text)) {
        errors.push(`context_messages[${index}].text must be non-empty`);
      } else if (message.text.length > maxInputChars) {
        errors.push(
          `context_messages[${index}].text must be at most ${maxInputChars} characters`,
        );
      }
      for (const key of ["sender", "message_type", "message_id"]) {
        if (message[key] != null && typeof message[key] !== "string") {
          errors.push(`context_messages[${index}].${key} must be a string`);
        }
      }
    });
  }

  if (task === "rewrite" && !isNonEmptyString(value.message)) {
    errors.push("rewrite requires a non-empty message");
  }
  if (task === "reply" && contextMessages.length === 0) {
    errors.push("reply requires at least one context message");
  }
  return errors;
}

export function normalizeRewriteRequest(value) {
  return {
    task: value.task || "rewrite",
    mode: value.mode || "original",
    variant_count: 2,
    message: value.message || "",
    context_messages: (value.context_messages || []).map((message) => ({
      sender: message.sender || "",
      message_type: message.message_type || "text",
      message_id: message.message_id || "",
      text: message.text.trim(),
    })),
  };
}

export function validateResult(value, request) {
  const errors = [];
  if (!hasExactKeys(value, requiredResultKeys)) {
    return ["result has an invalid key set"];
  }
  if (!decisions.has(value.decision)) errors.push("decision is invalid");
  for (const key of [
    "revised_text",
    "recommended_label",
    "summary",
    "channel_advice",
  ]) {
    if (typeof value[key] !== "string") errors.push(`${key} must be a string`);
  }
  if (!isNonEmptyString(value.recommended_label)) {
    errors.push("recommended_label must be non-empty");
  }

  if (!Array.isArray(value.alternatives)) {
    errors.push("alternatives must be an array");
  } else {
    if (value.alternatives.length > 2) {
      errors.push("alternatives must contain at most 2 items");
    }
    const seenTexts = new Set([value.revised_text]);
    value.alternatives.forEach((alternative, index) => {
      const expected = new Set(["label", "text", "rationale"]);
      if (!hasExactKeys(alternative, expected)) {
        errors.push(`alternatives[${index}] has an invalid key set`);
        return;
      }
      for (const key of expected) {
        if (!isNonEmptyString(alternative[key])) {
          errors.push(`alternatives[${index}].${key} must be non-empty`);
        }
      }
      if (seenTexts.has(alternative.text)) {
        errors.push("alternative texts must be unique");
      }
      seenTexts.add(alternative.text);
    });
  }

  if (!Array.isArray(value.findings)) {
    errors.push("findings must be an array");
  } else {
    if (value.findings.length > 3) {
      errors.push("findings must contain at most 3 items");
    }
    const seenDimensions = new Set();
    value.findings.forEach((finding, index) => {
      const expected = new Set(["dimension", "issue", "suggestion"]);
      if (!hasExactKeys(finding, expected)) {
        errors.push(`findings[${index}] has an invalid key set`);
        return;
      }
      if (!dimensions.has(finding.dimension)) {
        errors.push(`findings[${index}].dimension is invalid`);
      }
      if (seenDimensions.has(finding.dimension)) {
        errors.push("finding dimensions must be unique");
      }
      seenDimensions.add(finding.dimension);
      if (!isNonEmptyString(finding.issue)) {
        errors.push(`findings[${index}].issue must be non-empty`);
      }
      if (!isNonEmptyString(finding.suggestion)) {
        errors.push(`findings[${index}].suggestion must be non-empty`);
      }
    });
  }

  const alternatives = Array.isArray(value.alternatives)
    ? value.alternatives
    : [];
  const findings = Array.isArray(value.findings) ? value.findings : [];

  if (value.decision === "pass") {
    if (request.task === "reply") errors.push("reply results cannot pass");
    if (value.revised_text !== request.message) {
      errors.push("pass must return the original message exactly");
    }
    if (alternatives.length > 0 || findings.length > 0) {
      errors.push("pass must not contain alternatives or findings");
    }
    errors.push(...validateSendReadiness(request.message));
  }
  if (request.task === "rewrite" && value.decision !== "pass") {
    const texts = [value.revised_text, ...alternatives.map((item) => item.text)];
    for (const text of texts) {
      errors.push(...validateMeaningPreservation(request.message, text));
    }
  }
  return errors;
}
