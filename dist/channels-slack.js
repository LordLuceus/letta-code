// src/channels/slack/public-utils.ts
function isNonEmptyString(value) {
  return typeof value === "string" && value.length > 0;
}
function firstNonEmptyString(...values) {
  return values.find(isNonEmptyString);
}
function normalizeSlackText(text) {
  return text.replace(/^(?:\s*<@[A-Z0-9]+>\s*)+/, "").trim();
}
function resolveSlackChatType(chatId) {
  return chatId.startsWith("D") ? "direct" : "channel";
}
function resolveSlackSourceThreadTs(source) {
  if (source.chatType === "direct" || resolveSlackChatType(source.chatId) === "direct") {
    return firstNonEmptyString(source.threadId);
  }
  return firstNonEmptyString(source.threadId, source.messageId);
}
function resolveSlackProgressThreadTs(source) {
  if (source.chatType === "direct" || resolveSlackChatType(source.chatId) === "direct") {
    return firstNonEmptyString(source.threadId, source.messageId);
  }
  return resolveSlackSourceThreadTs(source);
}
function resolveSlackOutboundThreadTs(msg) {
  if (resolveSlackChatType(msg.chatId) === "direct") {
    return firstNonEmptyString(msg.threadId);
  }
  return firstNonEmptyString(msg.threadId, msg.replyToMessageId);
}
function normalizeSlackReactionName(value) {
  return value.trim().replace(/^:+|:+$/g, "");
}
function slackTimestampToMillis(value) {
  return Math.round(Number.parseFloat(value) * 1000);
}

// src/channels/slack/ingress-policy.ts
var IGNORED_SLACK_MESSAGE_SUBTYPES = new Set([
  "assistant_app_thread",
  "channel_archive",
  "channel_convert_to_private",
  "channel_convert_to_public",
  "channel_join",
  "channel_leave",
  "channel_name",
  "channel_posting_permissions",
  "channel_purpose",
  "channel_topic",
  "channel_unarchive",
  "document_mention",
  "ekm_access_denied",
  "file_comment",
  "group_archive",
  "group_join",
  "group_leave",
  "group_name",
  "group_purpose",
  "group_topic",
  "group_unarchive",
  "pinned_item",
  "reminder_add",
  "unpinned_item"
]);
var WRAPPER_SLACK_MESSAGE_SUBTYPES = new Set([
  "message_changed",
  "message_deleted",
  "message_replied"
]);
function hasRecordValue(value) {
  return value !== null && typeof value === "object";
}
function hasSlackMention(text, userId) {
  return isNonEmptyString(text) && isNonEmptyString(userId) && (text.includes(`<@${userId}>`) || text.includes(`<@${userId}|`));
}
function isBotAuthoredMessage(message) {
  return isNonEmptyString(message.bot_id) || message.subtype === "bot_message";
}
function resolveMessageSubtypeIgnoreReason(message) {
  const subtype = isNonEmptyString(message.subtype) ? message.subtype : null;
  if (!subtype) {
    return null;
  }
  if (IGNORED_SLACK_MESSAGE_SUBTYPES.has(subtype)) {
    return "ignored_subtype";
  }
  if (WRAPPER_SLACK_MESSAGE_SUBTYPES.has(subtype) && hasRecordValue(message.message)) {
    return "wrapper_message";
  }
  return null;
}
function isProcessableSlackInboundMessage(message) {
  return resolveSlackMessageIngressPolicy({ message }).shouldRoute;
}
function shouldSkipSlackMessageByLastSeen(params) {
  return Boolean(params.lastSeenMessageTs && params.lastSeenMessageTs >= params.messageTs);
}
function resolveSlackMessageIngressPolicy(params) {
  const { message } = params;
  if (!isNonEmptyString(message.channel)) {
    return { shouldRoute: false, reason: "missing_channel" };
  }
  const senderId = firstNonEmptyString(message.user, message.bot_id);
  if (!senderId) {
    return { shouldRoute: false, reason: "missing_sender" };
  }
  if (!isNonEmptyString(message.ts)) {
    return { shouldRoute: false, reason: "missing_timestamp" };
  }
  if (message.hidden === true) {
    return { shouldRoute: false, reason: "hidden_message" };
  }
  const subtypeIgnoreReason = resolveMessageSubtypeIgnoreReason(message);
  if (subtypeIgnoreReason) {
    return { shouldRoute: false, reason: subtypeIgnoreReason };
  }
  const chatType = resolveSlackChatType(message.channel);
  const threadId = chatType === "direct" ? firstNonEmptyString(message.thread_ts) ?? null : firstNonEmptyString(message.thread_ts, message.ts) ?? null;
  if (chatType === "channel" && !isNonEmptyString(message.thread_ts)) {
    return { shouldRoute: false, reason: "top_level_channel_message" };
  }
  const rawText = isNonEmptyString(message.text) ? message.text : "";
  const wasMentioned = hasSlackMention(rawText, params.botUserId);
  const isAgentThread = params.isAgentThread === true;
  const effectiveMention = isBotAuthoredMessage(message) ? wasMentioned : wasMentioned || isAgentThread;
  return {
    shouldRoute: true,
    channelId: message.channel,
    senderId,
    ...isNonEmptyString(message.user) ? { senderUserId: message.user } : {},
    ...isNonEmptyString(message.bot_id) ? { senderBotId: message.bot_id } : {},
    messageId: message.ts,
    threadId,
    chatType,
    text: wasMentioned ? normalizeSlackText(rawText) : rawText,
    rawText,
    wasMentioned,
    effectiveMention,
    isAgentThread
  };
}
function resolveSlackAppMentionIngressPolicy(params) {
  const { event } = params;
  if (!isNonEmptyString(event.channel)) {
    return { shouldRoute: false, reason: "missing_channel" };
  }
  const senderId = firstNonEmptyString(event.user, event.bot_id);
  if (!senderId) {
    return { shouldRoute: false, reason: "missing_sender" };
  }
  if (!isNonEmptyString(event.ts)) {
    return { shouldRoute: false, reason: "missing_timestamp" };
  }
  const rawText = isNonEmptyString(event.text) ? event.text : "";
  return {
    shouldRoute: true,
    channelId: event.channel,
    senderId,
    ...isNonEmptyString(event.user) ? { senderUserId: event.user } : {},
    ...isNonEmptyString(event.bot_id) ? { senderBotId: event.bot_id } : {},
    messageId: event.ts,
    threadId: firstNonEmptyString(event.thread_ts, event.ts) ?? event.ts,
    chatType: "channel",
    text: normalizeSlackText(rawText),
    rawText,
    wasMentioned: true,
    effectiveMention: true,
    isAgentThread: false
  };
}
// src/channels/slack/message-action-contract.ts
async function sendSlackMessage(context) {
  const { request, route, adapter, formatText } = context;
  const text = request.message ?? "";
  if (text.trim().length === 0 && !request.mediaPath) {
    return "Error: Slack send requires message or media.";
  }
  const isDirect = route.chatType === "direct" || request.chatId.startsWith("D");
  const formatted = formatText(text);
  const result = await adapter.sendMessage({
    channel: "slack",
    accountId: route.accountId,
    chatId: request.chatId,
    text: formatted.text,
    replyToMessageId: isDirect ? undefined : request.replyToMessageId,
    threadId: isDirect ? request.threadId ?? route.threadId ?? null : request.replyToMessageId ? null : request.threadId ?? route.threadId ?? null,
    mediaPath: request.mediaPath,
    fileName: request.filename,
    title: request.title,
    parseMode: formatted.parseMode,
    agentId: route.agentId,
    conversationId: route.conversationId
  });
  return request.mediaPath ? `Attachment sent to slack (message_id: ${result.messageId})` : `Message sent to slack (message_id: ${result.messageId})`;
}
async function reactInSlack(context) {
  const { request, route, adapter } = context;
  if (!request.emoji?.trim())
    return "Error: Slack react requires emoji.";
  if (!request.messageId?.trim()) {
    return "Error: Slack react requires messageId.";
  }
  const result = await adapter.sendMessage({
    channel: "slack",
    accountId: route.accountId,
    chatId: request.chatId,
    text: "",
    targetMessageId: request.messageId,
    reaction: request.emoji,
    removeReaction: request.remove,
    threadId: request.threadId ?? route.threadId ?? null
  });
  return request.remove ? `Reaction removed on slack (message_id: ${result.messageId})` : `Reaction added on slack (message_id: ${result.messageId})`;
}
function createSlackMessageActionAdapter(options = {}) {
  const actions = [
    "send",
    ...options.react ? ["react"] : [],
    ...options.uploadFile ? ["upload-file"] : [],
    ...options.downloadFile ? ["download-file"] : []
  ];
  return {
    describeMessageTool() {
      const properties = {};
      if (options.downloadFile) {
        properties.attachmentId = {
          type: "string",
          description: "Slack attachment id for action='download-file'. Copy attachment_id from the channel notification."
        };
      }
      if (options.react || options.downloadFile) {
        properties.messageId = {
          type: "string",
          description: options.downloadFile ? "Target Slack message id for action='react', or the source message id containing attachmentId for action='download-file'." : "Target Slack message id for action='react'."
        };
      }
      return {
        actions: [...actions],
        ...Object.keys(properties).length > 0 ? { schema: { properties } } : {}
      };
    },
    ...options.resolveMessageTarget ? { resolveMessageTarget: options.resolveMessageTarget } : {},
    async handleAction(context) {
      switch (context.request.action) {
        case "send":
          return await sendSlackMessage(context);
        case "upload-file":
          if (!options.uploadFile) {
            return 'Error: Action "upload-file" is not supported on slack.';
          }
          if (!context.request.mediaPath?.trim()) {
            return "Error: Slack upload-file requires media.";
          }
          return await sendSlackMessage(context);
        case "react":
          return options.react ? await reactInSlack(context) : 'Error: Action "react" is not supported on slack.';
        case "download-file":
          return options.downloadFile ? await options.downloadFile(context) : 'Error: Action "download-file" is not supported on slack.';
        default:
          return `Error: Action "${context.request.action}" is not supported on slack.`;
      }
    }
  };
}
// src/channels/progress-formatting.ts
var ESCAPE_CODE = String.fromCharCode(27);
var ANSI_ESCAPE_RE = new RegExp(`${ESCAPE_CODE}\\[[0-9;?]*[ -/]*[@-~]`, "g");
var SECRET_ASSIGNMENT_RE = /\b([A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD|PASS|API[_-]?KEY|ACCESS[_-]?KEY)[A-Z0-9_]*)\s*=\s*("[^"]*"|'[^']*'|\S+)/gi;
var SECRET_JSON_RE = /(["']?(?:token|secret|password|api[_-]?key|access[_-]?key)["']?\s*[:=]\s*)("[^"]*"|'[^']*'|\S+)/gi;
function truncateChannelProgressText(value, maxLength, marker = "...") {
  if (value.length <= maxLength) {
    return value;
  }
  if (maxLength <= marker.length) {
    return marker.slice(0, Math.max(0, maxLength));
  }
  return `${value.slice(0, maxLength - marker.length).trimEnd()}${marker}`;
}
function replaceControlCharacters(value) {
  let result = "";
  for (let index = 0;index < value.length; index += 1) {
    const character = value[index] ?? "";
    const code = character.charCodeAt(0);
    result += code <= 8 || code === 11 || code === 12 || code >= 14 && code <= 31 || code === 127 ? " " : character;
  }
  return result;
}
function sanitizeChannelProgressCore(value) {
  const raw = typeof value === "string" ? value : String(value ?? "");
  const redacted = raw.replace(ANSI_ESCAPE_RE, "").replace(SECRET_ASSIGNMENT_RE, "$1=[redacted]").replace(SECRET_JSON_RE, "$1[redacted]");
  return replaceControlCharacters(redacted).replace(/[\r\n\t]+/g, " ").replace(/@(?=channel|here|everyone|[A-Za-z0-9._-]+)/gi, "@​").replace(/\s+/g, " ").trim();
}

// src/channels/slack/progress.ts
var SLACK_ASSISTANT_STARTUP_STATUS = "is thinking...";
var SLACK_ASSISTANT_WORKING_STATUS = "is working...";
var SLACK_LOADING_MESSAGE_MAX = 50;
function sanitizeSlackStatusText(text, maxLength) {
  const normalized = sanitizeChannelProgressCore(text).replace(/[<>]/g, "").replace(/&/g, "and").replace(/\s+/g, " ").trim();
  return truncateChannelProgressText(normalized, maxLength, "...");
}
function formatSlackToolNameForDisplay(toolName) {
  if (toolName === "Task" || toolName === "task" || toolName === "Agent") {
    return "Subagent";
  }
  if (toolName === "Bash" || toolName === "bash" || toolName === "exec_command" || toolName === "shell_command" || toolName === "ShellCommand") {
    return "Bash";
  }
  return toolName;
}
function resolveSlackConcreteActivity(event) {
  if (event.kind === "command" && isNonEmptyString(event.command)) {
    return sanitizeSlackStatusText(formatSlackToolNameForDisplay(event.command), SLACK_LOADING_MESSAGE_MAX);
  }
  if (event.kind !== "tool" || !isNonEmptyString(event.toolName) || event.toolName.toLowerCase() === "messagechannel") {
    return null;
  }
  for (const description of [event.toolTitle, event.toolDetails]) {
    if (!isNonEmptyString(description)) {
      continue;
    }
    const sanitized = sanitizeSlackStatusText(description, SLACK_LOADING_MESSAGE_MAX);
    if (sanitized) {
      return sanitized;
    }
  }
  return null;
}
// src/agent/agent-id.ts
function isLocalAgentId(agentId) {
  return agentId.startsWith("agent-local-");
}

// src/channels/lifecycle-error.ts
var ESCAPE_CHARACTER = String.fromCharCode(27);
var OSC8_PREFIX = `${ESCAPE_CHARACTER}]8;;`;
var OSC8_TERMINATOR = `${ESCAPE_CHARACTER}\\`;
// src/channels/slack/utils.ts
var IGNORED_SLACK_MESSAGE_SUBTYPES2 = new Set([
  "assistant_app_thread",
  "channel_archive",
  "channel_convert_to_private",
  "channel_convert_to_public",
  "channel_join",
  "channel_leave",
  "channel_name",
  "channel_posting_permissions",
  "channel_purpose",
  "channel_topic",
  "channel_unarchive",
  "document_mention",
  "ekm_access_denied",
  "file_comment",
  "group_archive",
  "group_join",
  "group_leave",
  "group_name",
  "group_purpose",
  "group_topic",
  "group_unarchive",
  "pinned_item",
  "reminder_add",
  "unpinned_item"
]);
var WRAPPER_SLACK_MESSAGE_SUBTYPES2 = new Set([
  "message_changed",
  "message_deleted",
  "message_replied"
]);

// src/channels/slack/presentation.ts
var SLACK_MARKDOWN_BLOCK_TEXT_MAX = 12000;
function buildSlackChatUrl(agentId, conversationId) {
  if (isLocalAgentId(agentId)) {
    return;
  }
  const base = `https://chat.letta.com/chat/${agentId}`;
  return conversationId && conversationId !== "default" ? `${base}?conversation=${conversationId}` : base;
}
function buildSlackChatFootnote(identity) {
  const chatUrl = buildSlackChatUrl(identity.agentId, identity.conversationId);
  return chatUrl ? `<${chatUrl}|View on web>` : "";
}
function buildSlackReplyBlocksWithFootnote(text, footnote) {
  const chunks = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= SLACK_MARKDOWN_BLOCK_TEXT_MAX) {
      chunks.push(remaining);
      break;
    }
    let cut = remaining.lastIndexOf(`
`, SLACK_MARKDOWN_BLOCK_TEXT_MAX);
    if (cut <= 0) {
      cut = remaining.lastIndexOf(" ", SLACK_MARKDOWN_BLOCK_TEXT_MAX);
    }
    if (cut <= 0) {
      cut = SLACK_MARKDOWN_BLOCK_TEXT_MAX;
    }
    chunks.push(remaining.slice(0, cut));
    remaining = remaining.slice(cut);
  }
  const markdownChunks = chunks.filter((chunk) => chunk.trim().length > 0);
  if (markdownChunks.length === 0 || markdownChunks.length > 49) {
    return;
  }
  const blocks = markdownChunks.map((chunk) => ({
    type: "markdown",
    text: chunk
  }));
  blocks.push({
    type: "context",
    elements: [{ type: "mrkdwn", text: footnote }]
  });
  return blocks;
}

// src/channels/slack/sender.ts
async function sendSlackReaction(client, message) {
  const targetMessageId = message.targetMessageId ?? message.replyToMessageId;
  if (!targetMessageId) {
    throw new Error("Slack reactions require message_id (or reply_to_message_id) to identify the target message.");
  }
  const name = normalizeSlackReactionName(message.reaction ?? "");
  if (!name) {
    throw new Error("Slack reaction emoji cannot be empty.");
  }
  const params = {
    channel: message.chatId,
    timestamp: targetMessageId,
    name
  };
  if (message.removeReaction) {
    if (!client.removeReaction) {
      throw new Error("Slack sender client does not support removing reactions.");
    }
    await client.removeReaction(params);
  } else {
    if (!client.addReaction) {
      throw new Error("Slack sender client does not support adding reactions.");
    }
    await client.addReaction(params);
  }
  return { messageId: targetMessageId };
}
function buildSlackOutboundBlocks(message) {
  if (!message.agentId || !message.conversationId) {
    return;
  }
  const footnote = buildSlackChatFootnote({
    agentId: message.agentId,
    conversationId: message.conversationId
  });
  if (!footnote) {
    return;
  }
  return buildSlackReplyBlocksWithFootnote(message.text, footnote);
}
function createSlackChannelSender(params) {
  const { client } = params;
  return {
    async sendMessage(message) {
      if (message.reaction) {
        return await sendSlackReaction(client, message);
      }
      const threadTs = resolveSlackOutboundThreadTs({
        chatId: message.chatId,
        threadId: message.threadId,
        replyToMessageId: message.replyToMessageId
      });
      const blocks = buildSlackOutboundBlocks(message);
      return await client.postMessage({
        channel: message.chatId,
        text: message.text,
        ...blocks ? { blocks } : {},
        ...threadTs ? { threadTs } : {}
      });
    },
    async sendDirectReply(params2) {
      const threadTs = resolveSlackOutboundThreadTs({
        chatId: params2.chatId,
        threadId: params2.threadId,
        replyToMessageId: params2.replyToMessageId
      });
      await client.postMessage({
        channel: params2.chatId,
        text: params2.text,
        ...params2.blocks ? { blocks: params2.blocks } : {},
        ...threadTs ? { threadTs } : {}
      });
    }
  };
}
// src/channels/slack/status-controller.ts
var SLACK_ASSISTANT_STATUS_KEEPALIVE_MS = 90000;
function createSlackStatusController(params) {
  const stateByConversation = new Map;
  const sourceByConversation = new Map;
  const signatureByConversation = new Map;
  const writePromiseByConversation = new Map;
  const keepaliveByConversation = new Map;
  const clearedStaleReplyKeys = new Set;
  function getConversationKey(source) {
    return source.channel === "slack" && isNonEmptyString(source.agentId) && isNonEmptyString(source.conversationId) ? `${source.agentId}:${source.conversationId}` : null;
  }
  function getLifecycleReplyKey(source) {
    if (source.channel !== "slack" || !isNonEmptyString(source.chatId)) {
      return null;
    }
    const replyToMessageId = resolveSlackProgressThreadTs(source);
    return isNonEmptyString(replyToMessageId) ? `${source.chatId}:${replyToMessageId}` : null;
  }
  function getLifecycleErrorReplyKey(source) {
    if (source.channel !== "slack" || !isNonEmptyString(source.chatId)) {
      return null;
    }
    if (source.chatType === "direct" || resolveSlackChatType(source.chatId) === "direct") {
      const replyToMessageId = resolveSlackSourceThreadTs(source);
      return isNonEmptyString(replyToMessageId) ? `${source.chatId}:${replyToMessageId}` : `${source.chatId}:direct`;
    }
    return getLifecycleReplyKey(source);
  }
  function getUniqueSources(sources) {
    const seen = new Set;
    const unique = [];
    for (const source of sources) {
      const key = getConversationKey(source);
      if (!key || seen.has(key) || !getLifecycleReplyKey(source))
        continue;
      seen.add(key);
      unique.push(source);
    }
    return unique;
  }
  function clearKeepalive(key) {
    const timer = keepaliveByConversation.get(key);
    if (timer) {
      clearTimeout(timer);
      keepaliveByConversation.delete(key);
    }
  }
  async function writeStatus(source, footerText, loadingText, options = {}) {
    const stateKey = getConversationKey(source);
    const replyKey = getLifecycleReplyKey(source);
    const threadTs = resolveSlackProgressThreadTs(source);
    if (!stateKey || !replyKey || !threadTs)
      return false;
    const signature = `${footerText}
${loadingText}`;
    if (!options.force && signatureByConversation.get(stateKey) === signature) {
      return true;
    }
    await params.ensureApp();
    const slackClient = await params.ensureWriteClient();
    const setStatus = slackClient.assistant?.threads?.setStatus;
    if (!setStatus)
      return false;
    signatureByConversation.set(stateKey, signature);
    const previous = writePromiseByConversation.get(stateKey) ?? Promise.resolve();
    const operation = previous.then(async () => {
      try {
        await setStatus.call(slackClient.assistant?.threads, {
          channel_id: source.chatId,
          thread_ts: threadTs,
          status: footerText,
          ...footerText ? { loading_messages: [loadingText] } : {}
        });
        if (footerText)
          clearedStaleReplyKeys.delete(replyKey);
        else
          clearedStaleReplyKeys.add(replyKey);
        return true;
      } catch (error) {
        if (signatureByConversation.get(stateKey) === signature) {
          signatureByConversation.delete(stateKey);
        }
        console.warn("[Slack] Failed to update assistant thread status:", error instanceof Error ? error.message : error);
        return false;
      }
    });
    const settled = operation.then(() => {
      return;
    });
    writePromiseByConversation.set(stateKey, settled);
    settled.then(() => {
      if (writePromiseByConversation.get(stateKey) === settled) {
        writePromiseByConversation.delete(stateKey);
      }
    });
    return operation;
  }
  function scheduleKeepalive(key) {
    clearKeepalive(key);
    const timer = setTimeout(() => {
      keepaliveByConversation.delete(key);
      (async () => {
        const state = stateByConversation.get(key);
        const source = sourceByConversation.get(key);
        if (!state?.isThinkingActive || !source)
          return;
        await writeStatus(source, state.typingFooterText, state.thinkingText, {
          force: true
        });
        if (state.isThinkingActive)
          scheduleKeepalive(key);
      })();
    }, SLACK_ASSISTANT_STATUS_KEEPALIVE_MS);
    timer.unref?.();
    keepaliveByConversation.set(key, timer);
  }
  async function activate(source, footerText, loadingText) {
    const key = getConversationKey(source);
    if (!key || !getLifecycleReplyKey(source))
      return;
    const state = stateByConversation.get(key) ?? {
      isThinkingActive: false,
      thinkingText: "",
      typingFooterText: ""
    };
    if (state.isThinkingActive && state.thinkingText === loadingText && state.typingFooterText === footerText) {
      sourceByConversation.set(key, source);
      return;
    }
    state.isThinkingActive = true;
    state.thinkingText = loadingText;
    state.typingFooterText = footerText;
    stateByConversation.set(key, state);
    sourceByConversation.set(key, source);
    const sent = await writeStatus(source, footerText, loadingText);
    if (sent && state.isThinkingActive)
      scheduleKeepalive(key);
    else if (!sent)
      state.isThinkingActive = false;
  }
  function markAutoClearedByKey(key) {
    clearKeepalive(key);
    const state = stateByConversation.get(key);
    if (state)
      state.isThinkingActive = false;
    signatureByConversation.delete(key);
    sourceByConversation.delete(key);
  }
  async function deactivate(source) {
    const key = getConversationKey(source);
    if (!key)
      return;
    clearKeepalive(key);
    const state = stateByConversation.get(key);
    if (state)
      state.isThinkingActive = false;
    signatureByConversation.delete(key);
    sourceByConversation.delete(key);
    await writeStatus(source, "", "", { force: true });
    signatureByConversation.delete(key);
    stateByConversation.delete(key);
  }
  async function clearStale(source) {
    const key = getConversationKey(source);
    const replyKey = getLifecycleReplyKey(source);
    if (!key || !replyKey || stateByConversation.get(key)?.isThinkingActive || clearedStaleReplyKeys.has(replyKey)) {
      return;
    }
    await writeStatus(source, "", "", { force: true });
    signatureByConversation.delete(key);
  }
  return {
    getUniqueSources,
    getLifecycleErrorReplyKey,
    activate,
    deactivate,
    clearStale,
    markAutoCleared(source) {
      const key = getConversationKey(source);
      if (key)
        markAutoClearedByKey(key);
    },
    markAutoClearedForMessage(msg) {
      if (isNonEmptyString(msg.agentId) && isNonEmptyString(msg.conversationId)) {
        markAutoClearedByKey(`${msg.agentId}:${msg.conversationId}`);
        return;
      }
      const anchor = firstNonEmptyString(msg.threadId, msg.replyToMessageId);
      if (!anchor)
        return;
      const root = params.resolveKnownThreadRoot(anchor);
      for (const [key, source] of sourceByConversation) {
        if (source.chatId === msg.chatId && resolveSlackProgressThreadTs(source) === root) {
          markAutoClearedByKey(key);
        }
      }
    },
    activeSources: () => Array.from(sourceByConversation.values()),
    clear() {
      for (const timer of keepaliveByConversation.values())
        clearTimeout(timer);
      stateByConversation.clear();
      sourceByConversation.clear();
      signatureByConversation.clear();
      writePromiseByConversation.clear();
      keepaliveByConversation.clear();
      clearedStaleReplyKeys.clear();
    }
  };
}
export {
  slackTimestampToMillis,
  shouldSkipSlackMessageByLastSeen,
  resolveSlackOutboundThreadTs,
  resolveSlackMessageIngressPolicy,
  resolveSlackConcreteActivity,
  resolveSlackChatType,
  resolveSlackAppMentionIngressPolicy,
  normalizeSlackText,
  normalizeSlackReactionName,
  isProcessableSlackInboundMessage,
  createSlackStatusController,
  createSlackMessageActionAdapter,
  createSlackChannelSender,
  SLACK_ASSISTANT_WORKING_STATUS,
  SLACK_ASSISTANT_STARTUP_STATUS
};

//# debugId=F29FA1C9AF0A589064756E2164756E21
