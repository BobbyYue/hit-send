import test from "node:test";
import assert from "node:assert/strict";
import {
  extractMessageText,
  normalizeShortcutMessages,
  parseLaunchContext,
} from "../public/message-utils.js";

test("detects plus menu and parses trigger code", () => {
  const launch = encodeURIComponent(
    JSON.stringify({ __trigger_id__: "trigger-123" }),
  );
  const result = parseLaunchContext(
    `https://example.com/?from=plus_menu_group&bdp_launch_query=${launch}`,
  );
  assert.deepEqual(result, {
    scene: "plus_menu",
    triggerCode: "trigger-123",
  });
});

test("detects message action", () => {
  const result = parseLaunchContext(
    "https://example.com/?required_launch_ability=message_action",
  );
  assert.equal(result.scene, "message_action");
});

test("extracts text and rich text messages", () => {
  assert.equal(
    extractMessageText({
      messageType: "text",
      content: JSON.stringify({ text: "请同步一下进度" }),
    }),
    "请同步一下进度",
  );
  assert.equal(
    extractMessageText({
      messageType: "post",
      content: JSON.stringify({
        title: "项目更新",
        content: [
          {
            attrs: [
              { tag: "text", text: "今天完成" },
              { tag: "at", text: "@小明" },
            ],
          },
        ],
      }),
    }),
    "项目更新\n今天完成@小明",
  );
});

test("normalizes supported shortcut messages", () => {
  const messages = normalizeShortcutMessages({
    content: {
      messages: [
        {
          support: true,
          status: true,
          messageType: "text",
          openMessageId: "om_1",
          sender: { name: "小明" },
          content: JSON.stringify({ text: "明天能完成吗？" }),
        },
        {
          support: false,
          status: true,
          messageType: "audio",
          content: "unsupported",
        },
      ],
    },
  });
  assert.deepEqual(messages, [
    {
      sender: "小明",
      message_type: "text",
      message_id: "om_1",
      text: "明天能完成吗？",
    },
  ]);
});
