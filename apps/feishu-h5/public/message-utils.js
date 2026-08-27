export function parseLaunchContext(urlValue) {
  const url = new URL(urlValue);
  const from = url.searchParams.get("from") || "";
  const ability = url.searchParams.get("required_launch_ability") || "";
  let scene = "preview";
  if (from === "message_action" || ability === "message_action") {
    scene = "message_action";
  } else if (
    from === "plus_menu_p2p" ||
    from === "plus_menu_group" ||
    ability === "chat_action"
  ) {
    scene = "plus_menu";
  }

  let triggerCode = "";
  const rawLaunchQuery = url.searchParams.get("bdp_launch_query");
  if (rawLaunchQuery) {
    const candidates = [rawLaunchQuery];
    try {
      candidates.push(decodeURIComponent(rawLaunchQuery));
    } catch {
      // URLSearchParams may already have decoded the value.
    }
    for (const candidate of candidates) {
      try {
        const parsed = JSON.parse(candidate);
        triggerCode = parsed.__trigger_id__ || parsed.trigger_id || "";
        if (triggerCode) break;
      } catch {
        // Try the next representation.
      }
    }
  }
  return { scene, triggerCode };
}

function flattenPost(value) {
  const parts = [];
  if (value.title) parts.push(value.title);
  const rows = Array.isArray(value.content) ? value.content : [];
  for (const row of rows) {
    const attrs = Array.isArray(row) ? row : row.attrs || [];
    const line = attrs
      .map((item) => item.text || item.user_name || item.name || "")
      .join("")
      .trim();
    if (line) parts.push(line);
  }
  return parts.join("\n");
}

export function extractMessageText(message) {
  if (!message || typeof message.content !== "string") return "";
  let content;
  try {
    content = JSON.parse(message.content);
  } catch {
    return message.content.trim();
  }
  if (message.messageType === "text") return (content.text || "").trim();
  if (message.messageType === "post") return flattenPost(content).trim();
  if (typeof content.text === "string") return content.text.trim();
  if (typeof content.title === "string") return content.title.trim();
  return `[${message.messageType || "unsupported"} message]`;
}

export function normalizeShortcutMessages(payload) {
  const messages = payload?.content?.messages;
  if (!Array.isArray(messages)) return [];
  return messages
    .filter((message) => message?.status !== false && message?.support !== false)
    .map((message) => ({
      sender: message.sender?.name || "",
      message_type: message.messageType || "text",
      message_id: message.openMessageId || "",
      text: extractMessageText(message),
    }))
    .filter((message) => message.text);
}
