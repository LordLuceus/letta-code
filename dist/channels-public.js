// src/channels/core-stream.ts
var LETTA_STREAM_NO_ASSISTANT_MESSAGE_ERROR = "No assistant message received in stream";

class LettaStreamCoreError extends Error {
  errorType;
  detail;
  runId;
  constructor(params) {
    super(params.message);
    this.name = "LettaStreamCoreError";
    this.errorType = params.errorType;
    this.detail = params.detail;
    this.runId = params.runId;
  }
}

class LettaStreamNoAssistantMessageError extends Error {
  constructor() {
    super(LETTA_STREAM_NO_ASSISTANT_MESSAGE_ERROR);
    this.name = "LettaStreamNoAssistantMessageError";
  }
}
function normalizeErrorLine(value) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
function formatLettaStreamCoreErrorForChannel(error, options = {}) {
  const message = normalizeErrorLine(error.message) ?? "Core failed to generate a response.";
  const detail = normalizeErrorLine(error.detail);
  if (options.includeDetail === false || !detail || detail === message) {
    return message;
  }
  return `${message}
${detail}`;
}
function isRecord(value) {
  return value !== null && typeof value === "object";
}
function isOptionalString(value) {
  return typeof value === "undefined" || typeof value === "string";
}
function isLettaSseTextContentPart(value) {
  if (!isRecord(value)) {
    return false;
  }
  return value.type === "text" && typeof value.text === "string" && isOptionalString(value.signature);
}
function isLettaSseAssistantMessage(value) {
  if (!isRecord(value) || value.message_type !== "assistant_message") {
    return false;
  }
  const content = value.content;
  return typeof content === "undefined" || typeof content === "string" || Array.isArray(content) && content.every(isLettaSseTextContentPart);
}
function isLettaSseErrorMessage(value) {
  if (!isRecord(value) || value.message_type !== "error_message") {
    return false;
  }
  return isOptionalString(value.error_type) && isOptionalString(value.message) && isOptionalString(value.detail) && isOptionalString(value.run_id);
}
function isLettaSseStopReasonMessage(value) {
  if (!isRecord(value) || value.message_type !== "stop_reason") {
    return false;
  }
  return isOptionalString(value.stop_reason);
}
function coreErrorFromMessage(message) {
  return new LettaStreamCoreError({
    errorType: message.error_type,
    message: message.message ?? "Core failed to generate a response.",
    detail: message.detail,
    runId: message.run_id
  });
}
function collectAssistantContent(message) {
  if (typeof message.content === "string") {
    return [message.content];
  }
  if (Array.isArray(message.content)) {
    return message.content.map((part) => part.text);
  }
  return [];
}
async function collectLettaSseAssistantText(body, options = {}) {
  const reader = body.getReader();
  const decoder = new TextDecoder;
  let buffer = "";
  const assistantMessages = [];
  let stopReason;
  async function processData(data) {
    if (data === "[DONE]") {
      return;
    }
    const parsed = JSON.parse(data);
    await options.onDelta?.(parsed);
    const progressUpdates = options.progressBuilder?.buildUpdates(parsed) ?? [];
    for (const update of progressUpdates) {
      await options.onProgressUpdate?.(update);
    }
    if (isLettaSseErrorMessage(parsed)) {
      throw coreErrorFromMessage(parsed);
    }
    if (isLettaSseAssistantMessage(parsed)) {
      assistantMessages.push(...collectAssistantContent(parsed));
      return;
    }
    if (isLettaSseStopReasonMessage(parsed)) {
      stopReason = parsed.stop_reason;
    }
  }
  async function processLine(line) {
    if (!line.trim() || !line.startsWith("data: ")) {
      return;
    }
    await processData(line.slice(6));
  }
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(`
`);
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        await processLine(line);
      }
    }
    const flushed = decoder.decode();
    if (flushed) {
      buffer += flushed;
    }
    if (buffer) {
      await processLine(buffer);
    }
  } finally {
    reader.releaseLock();
  }
  const text = assistantMessages.join(" ").trim();
  if (!text) {
    throw new LettaStreamNoAssistantMessageError;
  }
  return {
    text,
    chunkCount: assistantMessages.length,
    stopReason
  };
}
// src/constants.ts
var SYSTEM_REMINDER_TAG = "system-reminder";
var SYSTEM_REMINDER_OPEN = `<${SYSTEM_REMINDER_TAG}>`;
var SYSTEM_REMINDER_CLOSE = `</${SYSTEM_REMINDER_TAG}>`;
var SYSTEM_ALERT_TAG = "system-alert";
var SYSTEM_ALERT_OPEN = `<${SYSTEM_ALERT_TAG}>`;
var SYSTEM_ALERT_CLOSE = `</${SYSTEM_ALERT_TAG}>`;
var ELAPSED_DISPLAY_THRESHOLD_MS = 60 * 1000;
// src/cli/helpers/git-context.ts
var {execFileSync} = (() => ({}));

// src/channels/xml.ts
function escapeXmlText(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeXmlAttribute(text) {
  return escapeXmlText(text).replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function formatMebibytes(bytes) {
  const mebibytes = bytes / (1024 * 1024);
  const rounded = mebibytes >= 100 ? Math.round(mebibytes).toString() : mebibytes.toFixed(1);
  return `${rounded.replace(/\.0$/, "")} MiB`;
}
function buildAttachmentXml(attachment, context) {
  const attrs = [`kind="${escapeXmlAttribute(attachment.kind)}"`];
  if (attachment.localPath) {
    attrs.push(`local_path="${escapeXmlAttribute(attachment.localPath)}"`);
  } else {
    attrs.push('download_status="not_downloaded"');
  }
  if (attachment.id) {
    attrs.push(`attachment_id="${escapeXmlAttribute(attachment.id)}"`);
  }
  if (attachment.name) {
    attrs.push(`name="${escapeXmlAttribute(attachment.name)}"`);
  }
  if (attachment.mimeType) {
    attrs.push(`mime_type="${escapeXmlAttribute(attachment.mimeType)}"`);
  }
  if (typeof attachment.sizeBytes === "number") {
    attrs.push(`size_bytes="${attachment.sizeBytes}"`);
  }
  const sourceMessageId = attachment.sourceMessageId ?? context.messageId;
  if (!attachment.localPath && sourceMessageId) {
    attrs.push(`source_message_id="${escapeXmlAttribute(sourceMessageId)}"`);
  }
  if (!attachment.localPath && attachment.sourceThreadId) {
    attrs.push(`source_thread_id="${escapeXmlAttribute(attachment.sourceThreadId)}"`);
  }
  if (attachment.downloadReason) {
    attrs.push(`download_reason="${escapeXmlAttribute(attachment.downloadReason)}"`);
  }
  if (typeof attachment.autoDownloadLimitBytes === "number") {
    attrs.push(`auto_download_limit_bytes="${attachment.autoDownloadLimitBytes}"`);
  }
  const children = [];
  if (attachment.transcription) {
    children.push(`<attempted_transcription>${escapeXmlText(attachment.transcription)}</attempted_transcription>`);
  }
  if (attachment.transcriptionError) {
    children.push(`<attempted_transcription_error>${escapeXmlText(attachment.transcriptionError)}</attempted_transcription_error>`);
  }
  if (!attachment.localPath && context.channel === "slack" && attachment.id && sourceMessageId) {
    const accountArg = context.accountId ? `, accountId="${escapeXmlAttribute(context.accountId)}"` : "";
    const threadArg = attachment.sourceThreadId ? `, threadId="${escapeXmlAttribute(attachment.sourceThreadId)}"` : "";
    const action = `MessageChannel with action="download-file", channel="slack", chat_id="${escapeXmlAttribute(context.chatId)}"${accountArg}${threadArg}, attachmentId="${escapeXmlAttribute(attachment.id)}", and messageId="${escapeXmlAttribute(sourceMessageId)}"`;
    if (attachment.downloadReason === "exceeds_auto_download_limit") {
      const sizeNote = typeof attachment.sizeBytes === "number" ? `This file is ${formatMebibytes(attachment.sizeBytes)}${typeof attachment.autoDownloadLimitBytes === "number" ? `, above the ${formatMebibytes(attachment.autoDownloadLimitBytes)} automatic download limit` : ""}. ` : "";
      children.push(`<download-instruction>${sizeNote}Call ${action}. The tool downloads the file into the same Slack inbound attachment directory and returns its local_path. Large downloads return a task_id instead of blocking; wait for the local_path with TaskOutput (block: true, timeout: 600000). Do not ask the sender to reattach it.</download-instruction>`);
    } else {
      children.push(`<download-retry>Automatic download did not complete. Call ${action} to retry. The action may return a precise error if Slack still cannot provide the file.</download-retry>`);
    }
  }
  if (children.length > 0) {
    return `<attachment ${attrs.join(" ")}>
  ${children.join(`
  `)}
</attachment>`;
  }
  return `<attachment ${attrs.join(" ")} />`;
}
function buildReactionXml(msg) {
  if (!msg.reaction) {
    return null;
  }
  const attrs = [
    `action="${escapeXmlAttribute(msg.reaction.action)}"`,
    `emoji="${escapeXmlAttribute(msg.reaction.emoji)}"`,
    `target_message_id="${escapeXmlAttribute(msg.reaction.targetMessageId)}"`
  ];
  if (msg.reaction.targetSenderId) {
    attrs.push(`target_sender_id="${escapeXmlAttribute(msg.reaction.targetSenderId)}"`);
  }
  return `<reaction ${attrs.join(" ")} />`;
}
function buildReplyContextXml(msg) {
  const replyContext = msg.replyContext;
  if (!replyContext) {
    return null;
  }
  const attrs = [];
  if (replyContext.messageId) {
    attrs.push(`message_id="${escapeXmlAttribute(replyContext.messageId)}"`);
  }
  if (replyContext.senderId) {
    attrs.push(`sender_id="${escapeXmlAttribute(replyContext.senderId)}"`);
  }
  if (replyContext.senderName) {
    attrs.push(`sender_name="${escapeXmlAttribute(replyContext.senderName)}"`);
  }
  const attrString = attrs.length > 0 ? ` ${attrs.join(" ")}` : "";
  if (replyContext.text?.trim()) {
    return `<reply-context${attrString}>
${escapeXmlText(replyContext.text)}
</reply-context>`;
  }
  return `<reply-context${attrString} />`;
}
function buildThreadContextEntryXml(tagName, entry, context) {
  const attrs = [];
  if (entry.senderId) {
    attrs.push(`sender_id="${escapeXmlAttribute(entry.senderId)}"`);
  }
  if (entry.senderName) {
    attrs.push(`sender_name="${escapeXmlAttribute(entry.senderName)}"`);
  }
  if (entry.messageId) {
    attrs.push(`message_id="${escapeXmlAttribute(entry.messageId)}"`);
  }
  const attrString = attrs.length > 0 ? ` ${attrs.join(" ")}` : "";
  const body = [
    ...entry.text ? [escapeXmlText(entry.text)] : [],
    ...(entry.attachments ?? []).map((attachment) => buildAttachmentXml(attachment, {
      ...context,
      messageId: entry.messageId
    }))
  ].join(`
`);
  return `<${tagName}${attrString}>
${body}
</${tagName}>`;
}
function buildThreadContextXml(msg) {
  const threadContext = msg.threadContext;
  if (!threadContext) {
    return null;
  }
  const parts = [];
  if (threadContext.starter) {
    parts.push(buildThreadContextEntryXml("thread-starter", threadContext.starter, {
      channel: msg.channel,
      accountId: msg.accountId,
      chatId: msg.chatId
    }));
  }
  const historyEntries = threadContext.history ?? [];
  if (historyEntries.length > 0) {
    parts.push([
      "<thread-history>",
      ...historyEntries.map((entry) => buildThreadContextEntryXml("thread-message", entry, {
        channel: msg.channel,
        accountId: msg.accountId,
        chatId: msg.chatId
      })),
      "</thread-history>"
    ].join(`
`));
  }
  if (parts.length === 0) {
    return null;
  }
  const attrs = threadContext.label ? ` label="${escapeXmlAttribute(threadContext.label)}"` : "";
  return [`<thread-context${attrs}>`, ...parts, "</thread-context>"].join(`
`);
}
function buildChannelNotificationXml(msg) {
  const attrs = [
    `source="${escapeXmlAttribute(msg.channel)}"`,
    `chat_id="${escapeXmlAttribute(msg.chatId)}"`,
    `sender_id="${escapeXmlAttribute(msg.senderId)}"`
  ];
  if (msg.accountId) {
    attrs.push(`account_id="${escapeXmlAttribute(msg.accountId)}"`);
  }
  if (msg.senderName) {
    attrs.push(`sender_name="${escapeXmlAttribute(msg.senderName)}"`);
  }
  if (msg.messageId) {
    attrs.push(`message_id="${escapeXmlAttribute(msg.messageId)}"`);
  }
  if (msg.threadId) {
    attrs.push(`thread_id="${escapeXmlAttribute(msg.threadId)}"`);
  }
  const attrString = attrs.join(" ");
  const escapedText = msg.text ? escapeXmlText(msg.text) : "";
  const reactionXml = buildReactionXml(msg);
  const replyContextXml = buildReplyContextXml(msg);
  const threadContextXml = buildThreadContextXml(msg);
  const attachmentXml = (msg.attachments ?? []).map((attachment) => buildAttachmentXml(attachment, {
    channel: msg.channel,
    accountId: msg.accountId,
    chatId: msg.chatId,
    messageId: msg.messageId
  }));
  const body = [
    threadContextXml,
    replyContextXml,
    reactionXml,
    ...attachmentXml,
    escapedText
  ].filter(Boolean).join(`
`);
  return `<channel-notification ${attrString}>
${body}
</channel-notification>`;
}

// src/channels/processor.ts
function buildChannelTurnSource(params) {
  const { message, route } = params;
  return {
    channel: message.channel,
    accountId: message.accountId ?? route.accountId,
    chatId: message.chatId,
    chatType: message.chatType ?? route.chatType,
    senderId: message.senderId,
    senderTeamId: message.senderTeamId,
    messageId: message.messageId,
    threadId: message.threadId ?? route.threadId ?? null,
    agentId: route.agentId,
    conversationId: route.conversationId
  };
}
function formatInboundChannelMessageForAgent(params) {
  return buildChannelNotificationXml(params.message);
}
function formatLegacyBatchedSender(message) {
  const senderName = message.senderName?.trim();
  const senderId = message.senderId?.trim() ?? "unknown";
  if (senderName && senderName !== senderId) {
    return `${senderName}:${senderId}`;
  }
  return senderId;
}
function formatBatchedChannelMessagesForAgent(params) {
  const { messages } = params;
  if (messages.length === 0) {
    return "";
  }
  const firstMessage = messages[0];
  if (messages.length === 1 && firstMessage) {
    return firstMessage.text;
  }
  if (messages.every((message) => message.channelTurnSource)) {
    const formatted2 = messages.map((message) => message.text).join(`
`);
    return `--- Batched Channel Messages (${messages.length}) ---
${formatted2}
--- End Batched Channel Messages ---`;
  }
  const formatted = messages.map((message) => {
    const timestamp = message.timestamp ?? "unknown";
    return `[user@${formatLegacyBatchedSender(message)}]<${timestamp}>:${message.text}`;
  }).join(`
`);
  return `--- Batched Messages (${messages.length}) ---
${formatted}
--- End Batched Messages ---`;
}
function buildOutboundChannelMessageFromTurnSource(params) {
  const { turnSource } = params;
  return {
    channel: turnSource.channel,
    accountId: turnSource.accountId,
    chatId: turnSource.chatId,
    threadId: turnSource.threadId,
    text: params.text,
    agentId: turnSource.agentId,
    conversationId: turnSource.conversationId
  };
}
// src/channels/progress-formatting.ts
var MAX_PROGRESS_TEXT_LENGTH = 140;
var MAX_PROGRESS_DETAILS_LENGTH = 180;
var MAX_SHELL_PROGRESS_DETAILS_LENGTH = 64;
var MAX_SUBAGENT_PROGRESS_DETAILS_LENGTH = 180;
var ESCAPE_CODE = String.fromCharCode(27);
var ANSI_ESCAPE_RE = new RegExp(`${ESCAPE_CODE}\\[[0-9;?]*[ -/]*[@-~]`, "g");
var SECRET_ASSIGNMENT_RE = /\b([A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD|PASS|API[_-]?KEY|ACCESS[_-]?KEY)[A-Z0-9_]*)\s*=\s*("[^"]*"|'[^']*'|\S+)/gi;
var SECRET_JSON_RE = /(["']?(?:token|secret|password|api[_-]?key|access[_-]?key)["']?\s*[:=]\s*)("[^"]*"|'[^']*'|\S+)/gi;
function isTaskTool(name) {
  return name === "Task" || name === "task" || name === "Agent" || name === "agent";
}
function isShellTool(name) {
  const normalized = name.toLowerCase();
  return normalized === "bash" || normalized === "exec_command" || normalized === "shell_command" || normalized === "shell" || normalized === "runshellcommand";
}
function isWebSearchTool(name) {
  const normalized = name.toLowerCase();
  return normalized === "web_search" || normalized === "websearch";
}
function isSearchTool(name) {
  const normalized = name.toLowerCase();
  return normalized === "grep" || normalized === "grep_files" || normalized === "grepfiles" || normalized === "search_file_content" || normalized === "searchfilecontent";
}
function isGlobTool(name) {
  const normalized = name.toLowerCase();
  return normalized === "glob" || normalized === "glob_gemini";
}
function isFileReadTool(name) {
  const normalized = name.toLowerCase();
  return normalized === "read" || normalized === "read_file" || normalized === "readfile" || normalized === "read_file_gemini" || normalized === "readfilegemini";
}
function isFileWriteTool(name) {
  const normalized = name.toLowerCase();
  return normalized === "write" || normalized === "write_file" || normalized === "writefile" || normalized === "write_file_gemini" || normalized === "writefilegemini";
}
function isFileEditTool(name) {
  const normalized = name.toLowerCase();
  return normalized === "edit" || normalized === "multi_edit" || normalized === "multiedit" || normalized === "replace" || normalized === "apply_patch" || normalized === "applypatch";
}
function getPathBaseName(filePath) {
  return filePath.split(/[\\/]/).filter(Boolean).pop() ?? filePath;
}
function asRecord(value) {
  return value && typeof value === "object" ? value : null;
}
function firstNonEmptyString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return;
}
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
function sanitizeChannelProgressText(value, maxLength = MAX_PROGRESS_TEXT_LENGTH) {
  return truncateChannelProgressText(sanitizeChannelProgressCore(value), maxLength);
}
function sanitizeChannelProgressIdentifier(value, fallback) {
  const text = sanitizeChannelProgressText(value, 64);
  if (!text) {
    return fallback;
  }
  const cleaned = text.replace(/[^A-Za-z0-9_.:/ -]/g, "").trim();
  return cleaned || fallback;
}
function summarizeShellCommand(command) {
  const normalized = sanitizeChannelProgressText(command, 1e4);
  if (!normalized) {
    return "";
  }
  const segments = normalized.split(/\s*;\s*/).map((segment) => segment.trim()).filter(Boolean);
  const firstTwoSegments = segments.slice(0, 2).join("; ");
  const previewSource = firstTwoSegments.length > 0 && firstTwoSegments.length <= 70 ? firstTwoSegments : segments[0] ?? normalized;
  const withoutPipeline = previewSource.split(/\s*\|\s*/)[0] ?? previewSource;
  return sanitizeChannelProgressText(withoutPipeline.trim() || normalized, MAX_SHELL_PROGRESS_DETAILS_LENGTH);
}
function getSkillNameFromArguments(parsedArguments) {
  return firstNonEmptyString(parsedArguments.skill, parsedArguments.skillName);
}
function getFragmentedSkillName(summary) {
  const skillMatch = summary.argumentsText?.match(/"(?:skill|skillName)"\s*:\s*"([^"]+)"/);
  return skillMatch?.[1];
}
function resolveSkillDescription(skillName, options) {
  const lookup = options?.skillDescriptionsByName;
  if (!skillName || !lookup) {
    return;
  }
  if ("get" in lookup && typeof lookup.get === "function") {
    return firstNonEmptyString(lookup.get(skillName));
  }
  return firstNonEmptyString(lookup[skillName]);
}
function formatSkillProgressTitleFromName(skillName) {
  const sanitized = sanitizeChannelProgressText(skillName, MAX_PROGRESS_DETAILS_LENGTH);
  return sanitized ? `Skill: ${sanitized}` : undefined;
}
function formatShellProgressDetailsFromArguments(parsedArguments) {
  const description = firstNonEmptyString(parsedArguments.description);
  if (description) {
    return sanitizeChannelProgressText(description, MAX_PROGRESS_DETAILS_LENGTH) || undefined;
  }
  const commandPreview = firstNonEmptyString(parsedArguments.command, parsedArguments.cmd);
  return summarizeShellCommand(commandPreview ?? "") || undefined;
}
function formatFragmentedShellProgressDetails(summary) {
  const descriptionMatch = summary.argumentsText?.match(/"description"\s*:\s*"([^"]+)"/);
  if (descriptionMatch?.[1]) {
    return sanitizeChannelProgressText(descriptionMatch[1], MAX_PROGRESS_DETAILS_LENGTH) || undefined;
  }
  return;
}
function formatSubagentProgressDetailsFromArguments(parsedArguments) {
  const preview = firstNonEmptyString(parsedArguments.prompt, parsedArguments.description, parsedArguments.subject);
  const sanitized = sanitizeChannelProgressText(preview, MAX_SUBAGENT_PROGRESS_DETAILS_LENGTH);
  return sanitized || undefined;
}
function formatFragmentedSubagentProgressDetails(summary) {
  const previewMatch = summary.argumentsText?.match(/"(?:prompt|description|subject)"\s*:\s*"([^"]+)"/);
  if (!previewMatch?.[1]) {
    return;
  }
  const sanitized = sanitizeChannelProgressText(previewMatch[1], MAX_SUBAGENT_PROGRESS_DETAILS_LENGTH);
  return sanitized || undefined;
}
function parseToolArguments(value) {
  if (!value) {
    return null;
  }
  try {
    return asRecord(JSON.parse(value));
  } catch {
    return null;
  }
}
function isFetchWebpageToolName(name) {
  return name === "fetch_webpage" || name === "FetchWebpage" || name === "fetchWebpage";
}
function isSkillToolName(name) {
  if (!name) {
    return false;
  }
  const normalized = name.includes(".") ? name.slice(name.lastIndexOf(".") + 1) : name;
  return normalized === "Skill" || normalized === "skill";
}
function isFilePathToolName(name) {
  return isFileReadTool(name) || isFileWriteTool(name) || isFileEditTool(name);
}
function getFileToolKind(name) {
  if (isFileReadTool(name)) {
    return "read";
  }
  if (isFileWriteTool(name)) {
    return "write";
  }
  if (isFileEditTool(name)) {
    return "update";
  }
  return null;
}
function countProgressLines(value) {
  return value ? value.split(`
`).length : 0;
}
function formatLineChangeSummary(summary) {
  if (!summary) {
    return "";
  }
  const parts = [];
  if (summary.additions !== undefined) {
    parts.push(`+${summary.additions}`);
  }
  if (summary.deletions !== undefined) {
    parts.push(`-${summary.deletions}`);
  }
  return parts.length > 0 ? ` ${parts.join(" ")}` : "";
}
function extractFilePathFromArguments(parsedArguments) {
  return firstNonEmptyString(parsedArguments.file_path, parsedArguments.filePath, parsedArguments.path);
}
function formatProgressFileName(filePath) {
  if (!filePath) {
    return;
  }
  const fileName = getPathBaseName(filePath) || filePath;
  return sanitizeChannelProgressText(fileName, MAX_PROGRESS_DETAILS_LENGTH) || undefined;
}
function getEditLineChangeSummary(parsedArguments) {
  const oldString = firstNonEmptyString(parsedArguments.old_string);
  const newString = firstNonEmptyString(parsedArguments.new_string);
  if (oldString === undefined || newString === undefined) {
    return null;
  }
  return {
    additions: countProgressLines(newString),
    deletions: countProgressLines(oldString)
  };
}
function getMultiEditLineChangeSummary(parsedArguments) {
  if (!Array.isArray(parsedArguments.edits)) {
    return null;
  }
  let additions = 0;
  let deletions = 0;
  let counted = false;
  for (const edit of parsedArguments.edits) {
    const record = asRecord(edit);
    if (!record) {
      continue;
    }
    const oldString = firstNonEmptyString(record.old_string);
    const newString = firstNonEmptyString(record.new_string);
    if (oldString === undefined || newString === undefined) {
      continue;
    }
    additions += countProgressLines(newString);
    deletions += countProgressLines(oldString);
    counted = true;
  }
  return counted ? { additions, deletions } : null;
}
function getWriteLineChangeSummary(parsedArguments) {
  const content = firstNonEmptyString(parsedArguments.content);
  if (content === undefined) {
    return null;
  }
  return {
    additions: countProgressLines(content)
  };
}
function getFileLineChangeSummary(name, parsedArguments) {
  if (isFileWriteTool(name)) {
    return getWriteLineChangeSummary(parsedArguments);
  }
  if (name === "MultiEdit" || name === "multi_edit") {
    return getMultiEditLineChangeSummary(parsedArguments);
  }
  if (isFileEditTool(name)) {
    return getEditLineChangeSummary(parsedArguments);
  }
  return null;
}
function getFileToolVerb(kind, status) {
  if (status === "error") {
    if (kind === "read") {
      return "Tried to read";
    }
    if (kind === "write") {
      return "Tried to write";
    }
    return "Tried to update";
  }
  if (status === "started") {
    if (kind === "read") {
      return "Reading";
    }
    if (kind === "write") {
      return "Writing";
    }
    return "Updating";
  }
  if (kind === "read") {
    return "Read";
  }
  if (kind === "write") {
    return "Wrote";
  }
  return "Updated";
}
function formatFileToolProgressTitle(name, parsedArguments, status) {
  const kind = getFileToolKind(name);
  if (!kind) {
    return;
  }
  const fileName = formatProgressFileName(extractFilePathFromArguments(parsedArguments));
  if (!fileName) {
    return;
  }
  const stats = status === "completed" ? formatLineChangeSummary(getFileLineChangeSummary(name, parsedArguments)) : "";
  return `${getFileToolVerb(kind, status)} ${fileName}${stats}`;
}
function formatFragmentedFileToolProgressTitle(summary, status) {
  if (!summary.name || !summary.argumentsText) {
    return;
  }
  const kind = getFileToolKind(summary.name);
  if (!kind) {
    return;
  }
  const filePathMatch = summary.argumentsText.match(/"(?:file_path|filePath|path)"\s*:\s*"([^"]+)"/);
  const fileName = formatProgressFileName(filePathMatch?.[1]);
  if (!fileName) {
    return;
  }
  return `${getFileToolVerb(kind, status)} ${fileName}`;
}
function formatToolProgressTitle(summary, status) {
  if (!summary.name || !summary.argumentsText) {
    return;
  }
  const parsedArguments = parseToolArguments(summary.argumentsText);
  if (parsedArguments) {
    if (isSkillToolName(summary.name)) {
      return formatSkillProgressTitleFromName(getSkillNameFromArguments(parsedArguments));
    }
    if (isFilePathToolName(summary.name)) {
      return formatFileToolProgressTitle(summary.name, parsedArguments, status);
    }
    return;
  }
  if (isSkillToolName(summary.name)) {
    return formatSkillProgressTitleFromName(getFragmentedSkillName(summary));
  }
  if (isFilePathToolName(summary.name)) {
    return formatFragmentedFileToolProgressTitle(summary, status);
  }
  return;
}
function formatSkillProgressDetailsFromArguments(parsedArguments, options) {
  const skillName = getSkillNameFromArguments(parsedArguments);
  const detail = resolveSkillDescription(skillName, options) ?? skillName;
  const sanitized = sanitizeChannelProgressText(detail, MAX_PROGRESS_DETAILS_LENGTH);
  return sanitized || undefined;
}
function formatFragmentedSkillProgressDetails(summary, options) {
  const skillName = getFragmentedSkillName(summary);
  const detail = resolveSkillDescription(skillName, options) ?? skillName;
  const sanitized = sanitizeChannelProgressText(detail, MAX_PROGRESS_DETAILS_LENGTH);
  return sanitized || undefined;
}
function formatToolProgressDetails(summary, options) {
  if (!summary.name || !summary.argumentsText) {
    return;
  }
  const parsedArguments = parseToolArguments(summary.argumentsText);
  if (parsedArguments) {
    if (isWebSearchTool(summary.name)) {
      const query = firstNonEmptyString(parsedArguments.query);
      const sanitized = sanitizeChannelProgressText(query, MAX_PROGRESS_DETAILS_LENGTH);
      return sanitized || undefined;
    }
    if (isFetchWebpageToolName(summary.name)) {
      const url = firstNonEmptyString(parsedArguments.url);
      const sanitized = sanitizeChannelProgressText(url, MAX_PROGRESS_DETAILS_LENGTH);
      return sanitized || undefined;
    }
    if (isSkillToolName(summary.name)) {
      return formatSkillProgressDetailsFromArguments(parsedArguments, options);
    }
    if (isTaskTool(summary.name)) {
      return formatSubagentProgressDetailsFromArguments(parsedArguments);
    }
    if (isShellTool(summary.name)) {
      return formatShellProgressDetailsFromArguments(parsedArguments);
    }
    if (isFilePathToolName(summary.name)) {
      const filePath = firstNonEmptyString(parsedArguments.file_path, parsedArguments.filePath, parsedArguments.path);
      const sanitized = sanitizeChannelProgressText(filePath, MAX_PROGRESS_DETAILS_LENGTH);
      return sanitized || undefined;
    }
    if (isGlobTool(summary.name) || isSearchTool(summary.name)) {
      const pattern = firstNonEmptyString(parsedArguments.pattern);
      const sanitized = sanitizeChannelProgressText(pattern, MAX_PROGRESS_DETAILS_LENGTH);
      return sanitized || undefined;
    }
    return;
  }
  if (isShellTool(summary.name)) {
    return formatFragmentedShellProgressDetails(summary);
  }
  if (isSkillToolName(summary.name)) {
    return formatFragmentedSkillProgressDetails(summary, options);
  }
  if (isTaskTool(summary.name)) {
    return formatFragmentedSubagentProgressDetails(summary);
  }
  if (isFilePathToolName(summary.name)) {
    const filePathMatch = summary.argumentsText.match(/"file_path"\s*:\s*"([^"]+)"/);
    if (filePathMatch?.[1]) {
      const sanitized = sanitizeChannelProgressText(filePathMatch[1], MAX_PROGRESS_DETAILS_LENGTH);
      return sanitized || undefined;
    }
  }
  return;
}

// src/channels/progress-builder.ts
function getMessageType(delta) {
  return firstNonEmptyString(delta.message_type, delta.messageType) ?? null;
}
function getRunId(delta) {
  return firstNonEmptyString(delta.run_id, delta.runId);
}
function withRunId(update, runId) {
  return {
    ...update,
    ...runId ? { runId } : {}
  };
}
function getCommandId(delta) {
  const command = firstNonEmptyString(delta.command_id, delta.commandId);
  return sanitizeChannelProgressIdentifier(command, "command");
}
function getSlashCommand(delta) {
  const commandId = firstNonEmptyString(delta.command_id, delta.commandId);
  const command = commandId ? `/${commandId.replace(/^\/+/, "")}` : "command";
  return sanitizeChannelProgressIdentifier(command, "command");
}
function getToolStatus(delta) {
  const status = firstNonEmptyString(delta.status)?.toLowerCase();
  return status === "error" || status === "failed" ? "error" : "completed";
}
function stringifyProgressValue(value) {
  if (typeof value === "string") {
    return value;
  }
  if (value === undefined || value === null) {
    return;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
function formatToolErrorDetails(record) {
  const toolReturn = record.tool_return ?? record.toolReturn;
  const toolReturnRecord = asRecord(toolReturn);
  const preview = firstNonEmptyString(record.stderr, record.error, record.message, toolReturnRecord?.stderr, toolReturnRecord?.error, toolReturnRecord?.message, toolReturnRecord?.output, stringifyProgressValue(toolReturn));
  const sanitized = sanitizeChannelProgressText(preview, MAX_PROGRESS_DETAILS_LENGTH);
  return sanitized || undefined;
}
function toolNameForMessage(summary) {
  return summary?.name ? `: ${summary.name}` : "";
}
function createChannelTurnProgressBuilder(options = {}) {
  const argumentsByToolCallId = new Map;
  const namesByToolCallId = new Map;
  function extractToolCallSummary(value) {
    const record = asRecord(value);
    if (!record) {
      return null;
    }
    const id = firstNonEmptyString(record.tool_call_id);
    const cacheId = id ? sanitizeChannelProgressIdentifier(id, "tool-call") : undefined;
    const extractedName = firstNonEmptyString(record.name);
    if (cacheId && extractedName) {
      namesByToolCallId.set(cacheId, extractedName);
    }
    const resolvedName = extractedName ?? (cacheId ? namesByToolCallId.get(cacheId) : undefined);
    const rawArguments = typeof record.arguments === "string" && record.arguments.length > 0 ? record.arguments : asRecord(record.arguments) ? JSON.stringify(record.arguments) : undefined;
    let argumentsText;
    if (cacheId && rawArguments !== undefined) {
      const existing = argumentsByToolCallId.get(cacheId);
      if (parseToolArguments(rawArguments)) {
        argumentsByToolCallId.set(cacheId, rawArguments);
        argumentsText = rawArguments;
      } else if (existing) {
        if (parseToolArguments(existing)) {
          argumentsText = existing;
        } else {
          const accumulated = existing + rawArguments;
          argumentsByToolCallId.set(cacheId, accumulated);
          argumentsText = accumulated;
        }
      } else {
        argumentsByToolCallId.set(cacheId, rawArguments);
        argumentsText = rawArguments;
      }
    } else if (!id && rawArguments !== undefined) {
      argumentsText = rawArguments;
    }
    if (!id && !resolvedName) {
      return null;
    }
    return {
      ...cacheId ? { id: cacheId } : {},
      ...resolvedName ? { name: sanitizeChannelProgressIdentifier(resolvedName, "tool") } : {},
      ...argumentsText ? { argumentsText } : {}
    };
  }
  function extractClientToolSummary(record) {
    const id = firstNonEmptyString(record.tool_call_id, record.toolCallId);
    const cacheId = id ? sanitizeChannelProgressIdentifier(id, "tool-call") : undefined;
    const extractedName = firstNonEmptyString(record.tool_name, record.toolName, record.name);
    if (cacheId && extractedName) {
      namesByToolCallId.set(cacheId, extractedName);
    }
    const resolvedName = extractedName ?? (cacheId ? namesByToolCallId.get(cacheId) : undefined);
    const rawArguments = firstNonEmptyString(record.tool_args, record.toolArgs, record.arguments);
    if (cacheId && rawArguments) {
      argumentsByToolCallId.set(cacheId, rawArguments);
    }
    const argumentsText = rawArguments ?? (cacheId ? argumentsByToolCallId.get(cacheId) : undefined);
    if (!cacheId && !resolvedName) {
      return null;
    }
    return {
      ...cacheId ? { id: cacheId } : {},
      ...resolvedName ? { name: sanitizeChannelProgressIdentifier(resolvedName, "tool") } : {},
      ...argumentsText ? { argumentsText } : {}
    };
  }
  function extractToolCalls(delta) {
    const candidates = Array.isArray(delta.tool_calls) ? delta.tool_calls : delta.tool_calls ? [delta.tool_calls] : delta.tool_call ? [delta.tool_call] : [];
    const summaries = [];
    const seen = new Set;
    for (const candidate of candidates) {
      const summary = extractToolCallSummary(candidate);
      if (!summary) {
        continue;
      }
      const key = `${summary.id ?? ""}:${summary.name ?? ""}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      summaries.push(summary);
    }
    return summaries;
  }
  function extractToolReturns(delta) {
    const candidates = Array.isArray(delta.tool_returns) ? delta.tool_returns : [delta];
    const summaries = [];
    const seen = new Set;
    for (const candidate of candidates) {
      const record = asRecord(candidate);
      if (!record) {
        continue;
      }
      const summary = extractToolCallSummary(record);
      if (!summary) {
        continue;
      }
      const key = `${summary.id ?? ""}:${summary.name ?? ""}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      const status = getToolStatus(record);
      summaries.push({
        summary,
        status,
        ...status === "error" ? { errorDetails: formatToolErrorDetails(record) } : {}
      });
    }
    return summaries;
  }
  function buildToolCallUpdates(record, runId) {
    const tools = extractToolCalls(record);
    const updates = [];
    for (const tool of tools) {
      const toolDetails = formatToolProgressDetails(tool, options);
      const toolTitle = formatToolProgressTitle(tool, "started");
      updates.push(withRunId({
        kind: "tool",
        state: "started",
        message: `Preparing tool${toolNameForMessage(tool)}`,
        ...tool.id ? { toolCallId: tool.id } : {},
        ...tool.name ? { toolName: tool.name } : {},
        ...toolDetails ? { toolDetails } : {},
        ...toolTitle ? { toolTitle } : {}
      }, runId));
    }
    return updates;
  }
  function buildUpdates(delta) {
    const record = asRecord(delta);
    if (!record) {
      return [];
    }
    const messageType = getMessageType(record);
    const runId = getRunId(record);
    switch (messageType) {
      case "reasoning_message":
        return [
          withRunId({
            kind: "thinking",
            state: "updated",
            message: "Thinking"
          }, runId)
        ];
      case "assistant_message":
        return [
          withRunId({
            kind: "responding",
            state: "updated",
            message: "Writing reply"
          }, runId)
        ];
      case "approval_request_message":
        return buildToolCallUpdates(record, runId);
      case "tool_call_message": {
        const updates = buildToolCallUpdates(record, runId);
        if (updates.length === 0) {
          return [
            withRunId({
              kind: "tool",
              state: "started",
              message: "Preparing tool call"
            }, runId)
          ];
        }
        return updates;
      }
      case "tool_return_message": {
        const toolReturns = extractToolReturns(record);
        const updates = [];
        for (const { summary, status, errorDetails } of toolReturns) {
          const accumulatedArgs = summary.id ? argumentsByToolCallId.get(summary.id) : undefined;
          if (summary.id) {
            argumentsByToolCallId.delete(summary.id);
            namesByToolCallId.delete(summary.id);
          }
          const toolWithAccumulatedArgs = accumulatedArgs ? { ...summary, argumentsText: accumulatedArgs } : summary;
          const toolDetails = formatToolProgressDetails(toolWithAccumulatedArgs, options);
          const toolTitle = formatToolProgressTitle(toolWithAccumulatedArgs, status);
          updates.push(withRunId({
            kind: "tool",
            state: status,
            message: status === "error" ? "Tool failed" : "Tool finished",
            ...summary.id ? { toolCallId: summary.id } : {},
            ...summary.name ? { toolName: summary.name } : {},
            ...toolDetails ? { toolDetails } : {},
            ...status === "error" && errorDetails ? { errorDetails } : {},
            ...toolTitle ? { toolTitle } : {}
          }, runId));
        }
        return updates;
      }
      case "client_tool_start": {
        const tool = extractClientToolSummary(record);
        const toolDetails = tool ? formatToolProgressDetails(tool, options) : undefined;
        const toolTitle = tool ? formatToolProgressTitle(tool, "started") : undefined;
        return [
          withRunId({
            kind: "tool",
            state: "started",
            message: "Running tool",
            ...tool?.id ? { toolCallId: tool.id } : {},
            ...tool?.name ? { toolName: tool.name } : {},
            ...toolDetails ? { toolDetails } : {},
            ...toolTitle ? { toolTitle } : {}
          }, runId)
        ];
      }
      case "client_tool_end": {
        const state = getToolStatus(record);
        const tool = extractClientToolSummary(record);
        const accumulatedArgs = tool?.id ? argumentsByToolCallId.get(tool.id) : undefined;
        if (tool?.id) {
          argumentsByToolCallId.delete(tool.id);
          namesByToolCallId.delete(tool.id);
        }
        const toolWithAccumulatedArgs = tool && accumulatedArgs ? { ...tool, argumentsText: accumulatedArgs } : tool;
        const toolDetails = toolWithAccumulatedArgs ? formatToolProgressDetails(toolWithAccumulatedArgs, options) : undefined;
        const errorDetails = state === "error" ? formatToolErrorDetails(record) : undefined;
        const toolTitle = toolWithAccumulatedArgs ? formatToolProgressTitle(toolWithAccumulatedArgs, state) : undefined;
        return [
          withRunId({
            kind: "tool",
            state,
            message: state === "error" ? "Tool failed" : "Tool finished",
            ...tool?.id ? { toolCallId: tool.id } : {},
            ...tool?.name ? { toolName: tool.name } : {},
            ...toolDetails ? { toolDetails } : {},
            ...errorDetails ? { errorDetails } : {},
            ...toolTitle ? { toolTitle } : {}
          }, runId)
        ];
      }
      case "slash_command_start": {
        const command = getSlashCommand(record);
        return [
          withRunId({
            kind: "command",
            state: "started",
            message: `Running ${command}`,
            command
          }, runId)
        ];
      }
      case "slash_command_end": {
        const command = getSlashCommand(record);
        const success = record.success !== false;
        return [
          withRunId({
            kind: "command",
            state: success ? "completed" : "error",
            message: success ? `${command} finished` : `${command} failed`,
            command
          }, runId)
        ];
      }
      case "command_start": {
        const command = getCommandId(record);
        return [
          withRunId({
            kind: "command",
            state: "started",
            message: "Running command",
            command
          }, runId)
        ];
      }
      case "command_end": {
        const command = getCommandId(record);
        const success = record.success !== false;
        return [
          withRunId({
            kind: "command",
            state: success ? "completed" : "error",
            message: success ? "Command finished" : "Command failed",
            command
          }, runId)
        ];
      }
      case "status": {
        const message = sanitizeChannelProgressText(record.message);
        if (!message) {
          return [];
        }
        return [
          withRunId({
            kind: "status",
            state: "updated",
            message
          }, runId)
        ];
      }
      case "retry": {
        const attempt = Number(record.attempt);
        const maxAttempts = Number(record.max_attempts ?? record.maxAttempts);
        const suffix = Number.isFinite(attempt) && Number.isFinite(maxAttempts) ? ` (${attempt}/${maxAttempts})` : "";
        return [
          withRunId({
            kind: "retry",
            state: "updated",
            message: `Retrying request${suffix}`
          }, runId)
        ];
      }
      case "loop_error":
        return [
          withRunId({
            kind: "error",
            state: "error",
            message: "Encountered an error"
          }, runId)
        ];
      default:
        return [];
    }
  }
  return { buildUpdates };
}
export {
  formatLettaStreamCoreErrorForChannel,
  formatInboundChannelMessageForAgent,
  formatBatchedChannelMessagesForAgent,
  createChannelTurnProgressBuilder,
  collectLettaSseAssistantText,
  buildOutboundChannelMessageFromTurnSource,
  buildChannelTurnSource,
  LettaStreamNoAssistantMessageError,
  LettaStreamCoreError,
  LETTA_STREAM_NO_ASSISTANT_MESSAGE_ERROR
};

//# debugId=39670CE4D9784BEC64756E2164756E21
