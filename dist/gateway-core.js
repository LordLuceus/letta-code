// src/tools/interactive-policy.ts
var INTERACTIVE_APPROVAL_TOOLS = new Set(["AskUserQuestion"]);
var INTERACTIVE_USER_INPUT_TOOL_NAMES = [
  "AskUserQuestion"
];
var RUNTIME_USER_INPUT_TOOLS = new Set(INTERACTIVE_USER_INPUT_TOOL_NAMES);
var HEADLESS_AUTO_ALLOW_TOOLS = new Set;
function getInteractiveApprovalKind(toolName) {
  switch (toolName) {
    case "AskUserQuestion":
      return "ask_user_question";
    default:
      return null;
  }
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

// src/channels/gateway-core.ts
var MAX_ACCEPTED_CLIENT_MESSAGE_IDS = 2048;
function runtimeKey(runtime) {
  return `${runtime.agent_id}:${runtime.conversation_id}`;
}
function sourceKey(source) {
  return [
    source.channel,
    source.accountId ?? "",
    source.chatId,
    source.threadId ?? ""
  ].join(":");
}
function uniqueSources(sources) {
  const byKey = new Map;
  for (const source of sources)
    byKey.set(sourceKey(source), source);
  return [...byKey.values()];
}
function stopReasonFromDelta(message) {
  const delta = message.delta;
  return delta.message_type === "stop_reason" && "stop_reason" in delta && typeof delta.stop_reason === "string" ? delta.stop_reason : null;
}
function runIdFromDelta(message) {
  const runId = "run_id" in message.delta ? message.delta.run_id : undefined;
  return typeof runId === "string" && runId.length > 0 ? runId : undefined;
}
function lifecycleOutcome(stopReason) {
  if (stopReason === "cancelled")
    return "cancelled";
  if (stopReason === "end_turn" || stopReason === "tool_rule") {
    return "completed";
  }
  return "error";
}

class ChannelGateway {
  client;
  hooks;
  states = new Map;
  disposers = [];
  registrationQueue = Promise.resolve();
  constructor(client, hooks) {
    this.client = client;
    this.hooks = hooks;
    this.disposers.push(client.onMessage((message) => this.handleMessage(message)), client.onExternalToolCall((request) => {
      const state = request.runtime ? this.states.get(runtimeKey(request.runtime)) : undefined;
      const sources = state?.active?.sources ?? state?.routedSources ?? [];
      return hooks.executeExternalTool(request, sources);
    }));
  }
  close() {
    for (const dispose of this.disposers.splice(0))
      dispose();
    this.client.close();
    this.states.clear();
  }
  async submit(delivery) {
    const state = this.getState(delivery.runtime);
    const submission = state.submissionQueue.then(() => this.submitDelivery(state, delivery));
    state.submissionQueue = submission.then(() => {
      return;
    }, () => {
      return;
    });
    return submission;
  }
  async submitDelivery(state, delivery) {
    if (state.acceptedClientMessageIds.has(delivery.clientMessageId)) {
      state.acceptedClientMessageIds.delete(delivery.clientMessageId);
      state.acceptedClientMessageIds.add(delivery.clientMessageId);
      return true;
    }
    state.pendingSourcesByClientMessageId.set(delivery.clientMessageId, {
      sources: uniqueSources(delivery.sources),
      disposition: "submitting"
    });
    try {
      await this.enqueueRegistration(async () => {
        state.routedSources = uniqueSources([
          ...state.routedSources,
          ...delivery.sources
        ]);
        await this.performRuntimeRegistration(state, delivery);
      });
      const response = await this.client.submitInput({
        runtime: delivery.runtime,
        payload: {
          kind: "create_message",
          messages: [
            {
              role: "user",
              content: delivery.content,
              client_message_id: delivery.clientMessageId
            }
          ],
          image_failure_mode: "drop"
        }
      });
      if (!response.accepted) {
        state.pendingSourcesByClientMessageId.delete(delivery.clientMessageId);
        return false;
      }
      state.acceptedClientMessageIds.add(delivery.clientMessageId);
      if (state.acceptedClientMessageIds.size > MAX_ACCEPTED_CLIENT_MESSAGE_IDS) {
        const oldest = state.acceptedClientMessageIds.values().next().value;
        if (oldest)
          state.acceptedClientMessageIds.delete(oldest);
      }
      const queuedEvents = delivery.sources.map((source) => this.enqueueHook(state, () => this.hooks.onLifecycle({ type: "queued", source })));
      if (response.disposition === "started") {
        this.activateSources(state, delivery.clientMessageId, delivery.sources);
        state.pendingSourcesByClientMessageId.delete(delivery.clientMessageId);
      } else if (response.disposition === "queued") {
        const pending = state.pendingSourcesByClientMessageId.get(delivery.clientMessageId);
        if (pending) {
          pending.disposition = "queued";
          pending.acceptedAtQueueRevision = state.queueRevision;
        }
      }
      await Promise.all(queuedEvents);
      return true;
    } catch (error) {
      state.pendingSourcesByClientMessageId.delete(delivery.clientMessageId);
      throw error;
    }
  }
  async restoreRuntime(runtime, sources) {
    const state = this.getState(runtime);
    state.replayedControlRequestIds.clear();
    let recoveredTurn = null;
    if (!state.active) {
      recoveredTurn = {
        batchId: `channel-recovered-${crypto.randomUUID()}`,
        sources: uniqueSources(sources),
        progress: createChannelTurnProgressBuilder(),
        richDraft: null
      };
      state.active = recoveredTurn;
    }
    try {
      await this.registerRuntime(runtime, sources);
    } catch (error) {
      if (state.active === recoveredTurn)
        state.active = null;
      throw error;
    }
    const replayedRequestIds = new Set(state.replayedControlRequestIds);
    if (replayedRequestIds.size === 0 && state.active === recoveredTurn) {
      state.active = null;
    }
    return replayedRequestIds;
  }
  async registerRuntime(runtime, sources = [], defaultPermissionMode) {
    const state = this.getState(runtime);
    await this.enqueueRegistration(async () => {
      this.setRoutedSources(runtime, sources);
      await this.performRuntimeRegistration(state, {
        runtime,
        content: "",
        sources,
        clientMessageId: "recovered",
        ...defaultPermissionMode ? { defaultPermissionMode } : {}
      });
    });
  }
  async submitApprovalResponse(runtime, response) {
    const result = await this.client.submitInput({
      runtime,
      payload: { kind: "approval_response", ...response }
    });
    return result.accepted;
  }
  setRoutedSources(runtime, sources) {
    this.getState(runtime).routedSources = uniqueSources(sources);
  }
  getKnownRuntimes() {
    return [...this.states.values()].map((state) => state.runtime);
  }
  updateRoutedRuntimeTools(updates, routedSources) {
    return this.enqueueRegistration(async () => {
      if (updates.length > 0) {
        const response = await this.client.runtimeExternalToolsUpdate({
          updates
        });
        if (!response.success) {
          throw new Error(response.error ?? "Failed to update routed runtime tools");
        }
      }
      for (const update of routedSources) {
        this.setRoutedSources(update.runtime, update.sources);
      }
    });
  }
  getModelStatus(runtime) {
    return this.states.get(runtimeKey(runtime))?.modelStatus ?? null;
  }
  updateModelStatus(runtime, modelHandle) {
    const state = this.getState(runtime);
    state.modelStatus = {
      modelHandle,
      scope: runtime.conversation_id === "default" ? "agent" : "conversation"
    };
  }
  getState(runtime) {
    const key = runtimeKey(runtime);
    let state = this.states.get(key);
    if (!state) {
      state = {
        runtime,
        pendingSourcesByClientMessageId: new Map,
        queueRevision: 0,
        active: null,
        registrationSignature: null,
        registration: null,
        routedSources: [],
        replayedControlRequestIds: new Set,
        submissionQueue: Promise.resolve(),
        hookQueue: null,
        acceptedClientMessageIds: new Set,
        modelStatus: null
      };
      this.states.set(key, state);
    }
    return state;
  }
  enqueueHook(state, hook) {
    let pending;
    if (state.hookQueue) {
      pending = state.hookQueue.then(hook);
    } else {
      try {
        pending = Promise.resolve(hook());
      } catch (error) {
        pending = Promise.reject(error);
      }
    }
    const settled = pending.then(() => {
      return;
    }, () => {
      return;
    });
    state.hookQueue = settled;
    settled.then(() => {
      if (state.hookQueue === settled)
        state.hookQueue = null;
    });
    return pending;
  }
  enqueueRegistration(task) {
    const result = this.registrationQueue.then(task, task);
    this.registrationQueue = result.then(() => {
      return;
    }, () => {
      return;
    });
    return result;
  }
  async performRuntimeRegistration(state, delivery) {
    const tool = await this.hooks.buildExternalTool(delivery.runtime, delivery.sources);
    const signature = JSON.stringify({
      mode: delivery.defaultPermissionMode ?? null,
      tool
    });
    if (state.registrationSignature === signature && state.registration) {
      return state.registration;
    }
    const registration = this.client.runtimeStart({
      agent_id: delivery.runtime.agent_id,
      conversation_id: delivery.runtime.conversation_id,
      ...delivery.defaultPermissionMode ? { mode: delivery.defaultPermissionMode } : {},
      recover_approvals: true,
      force_device_status: false,
      wait_for_replay: true,
      preserve_skill_sources: true,
      client_info: { name: "channel-gateway", title: "Channel Gateway" },
      external_tools: tool ? [{ tools: [tool] }] : []
    }).then((response) => {
      if (!response.success) {
        throw new Error(response.error ?? "Failed to register channel runtime");
      }
      const agentRecord = response.agent;
      const conversationRecord = response.conversation;
      const agentModel = typeof agentRecord?.model === "string" ? agentRecord.model : response.agent?.llm_config?.model ?? null;
      const conversationModel = typeof conversationRecord?.model === "string" ? conversationRecord.model : null;
      state.modelStatus = {
        modelHandle: delivery.runtime.conversation_id === "default" ? agentModel : conversationModel ?? agentModel,
        scope: delivery.runtime.conversation_id === "default" ? "agent" : "conversation"
      };
    });
    state.registrationSignature = signature;
    state.registration = registration;
    try {
      await registration;
    } catch (error) {
      if (state.registration === registration) {
        state.registration = null;
        state.registrationSignature = null;
      }
      throw error;
    }
  }
  handleMessage(message) {
    if (message.type === "update_queue") {
      this.handleQueueUpdate(message);
      return;
    }
    if (message.type === "stream_delta") {
      this.handleStreamDelta(message);
      return;
    }
    if (message.type === "turn_finished") {
      this.handleTurnFinished(message.runtime, {
        stopReason: message.stop_reason,
        runId: message.run_id,
        error: message.error
      });
      return;
    }
    if (message.type === "control_request") {
      this.handleControlRequest(message);
    }
  }
  handleQueueUpdate(message) {
    const state = this.getState(message.runtime);
    state.queueRevision += 1;
    const nextQueued = new Set(message.queue.map((entry) => entry.client_message_id));
    const removed = [];
    for (const [
      clientMessageId,
      pending
    ] of state.pendingSourcesByClientMessageId) {
      if (pending.disposition === "queued" && state.queueRevision > (pending.acceptedAtQueueRevision ?? -1) && !nextQueued.has(clientMessageId)) {
        removed.push({ clientMessageId, sources: pending.sources });
        state.pendingSourcesByClientMessageId.delete(clientMessageId);
      }
    }
    if (!state.active && removed.length > 0) {
      const first = removed[0];
      if (first) {
        this.activateSources(state, first.clientMessageId, removed.flatMap((entry) => entry.sources));
      }
    }
  }
  activateSources(state, clientMessageId, sources) {
    if (state.active) {
      return;
    }
    state.active = {
      batchId: `channel-${clientMessageId}`,
      sources: uniqueSources(sources),
      progress: createChannelTurnProgressBuilder(),
      richDraft: this.hooks.createRichDraft?.({
        batchId: `channel-${clientMessageId}`,
        sources
      }) ?? null
    };
    const processingEvent = {
      type: "processing",
      batchId: state.active.batchId,
      sources: state.active.sources
    };
    this.enqueueHook(state, () => this.hooks.onLifecycle(processingEvent));
  }
  handleStreamDelta(message) {
    if (message.subagent_id)
      return;
    const state = this.getState(message.runtime);
    const active = state.active;
    if (!active)
      return;
    const runId = runIdFromDelta(message);
    if (runId)
      active.runId = runId;
    for (const update of active.progress.buildUpdates(message.delta)) {
      this.enqueueHook(state, () => this.hooks.onProgress({
        type: "progress",
        batchId: active.batchId,
        sources: active.sources,
        ...update
      }));
    }
    active.richDraft?.handleDelta(message.delta);
    const stopReason = stopReasonFromDelta(message);
    if (stopReason === "requires_approval" || stopReason === "end_turn") {
      active.richDraft?.flushPending();
    }
  }
  handleTurnFinished(runtime, terminal) {
    const state = this.getState(runtime);
    const active = state.active;
    if (!active)
      return;
    state.active = null;
    active.richDraft?.dispose();
    this.enqueueHook(state, () => this.hooks.onLifecycle({
      type: "finished",
      batchId: active.batchId,
      sources: active.sources,
      outcome: lifecycleOutcome(terminal.stopReason),
      stopReason: terminal.stopReason,
      ...terminal.runId ?? active.runId ? { runId: terminal.runId ?? active.runId } : {},
      ...terminal.error ? { error: terminal.error } : {}
    }));
  }
  handleControlRequest(message) {
    if (!message.agent_id || !message.conversation_id)
      return;
    const state = this.states.get(runtimeKey({
      agent_id: message.agent_id,
      conversation_id: message.conversation_id
    }));
    if (!state)
      return;
    const sources = state.active?.sources ?? [];
    state.replayedControlRequestIds.add(message.request_id);
    const sourceScopes = new Map(sources.map((source2) => [sourceKey(source2), source2]));
    if (sourceScopes.size !== 1)
      return;
    const source = [...sourceScopes.values()][0];
    if (!source)
      return;
    this.enqueueHook(state, () => this.hooks.onControlRequest({
      requestId: message.request_id,
      kind: getInteractiveApprovalKind(message.request.tool_name) ?? "generic_tool_approval",
      source,
      toolName: message.request.tool_name,
      input: message.request.input
    }));
  }
}
// src/channels/message-channel-formatting.ts
var TELEGRAM_CHANNEL_ID = "telegram";
var SIGNAL_CHANNEL_ID = "signal";
var TELEGRAM_PLACEHOLDER_PREFIX = "LCTELEGRAMHTMLPLACEHOLDER";
var TELEGRAM_PLACEHOLDER_SUFFIX = "X";
var TELEGRAM_PLACEHOLDER_PATTERN = /LCTELEGRAMHTMLPLACEHOLDER(\d+)X/g;
var SLACK_PLACEHOLDER_PREFIX = "LCSLACKMRKDWNPLACEHOLDER";
var SLACK_PLACEHOLDER_SUFFIX = "X";
var SLACK_PLACEHOLDER_PATTERN = /LCSLACKMRKDWNPLACEHOLDER(\d+)X/g;
var SLACK_ANGLE_TOKEN_RE = /<[^>\n]+>/g;
function decodeBasicXmlEntities(text) {
  return text.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}
function escapeTelegramHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeTelegramHtmlAttribute(text) {
  return escapeTelegramHtml(text).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function createTelegramPlaceholder(placeholders, value) {
  const placeholder = `${TELEGRAM_PLACEHOLDER_PREFIX}${placeholders.length}${TELEGRAM_PLACEHOLDER_SUFFIX}`;
  placeholders.push(value);
  return placeholder;
}
function restoreTelegramPlaceholders(text, placeholders) {
  return text.replace(TELEGRAM_PLACEHOLDER_PATTERN, (_match, index) => {
    return placeholders[Number(index)] ?? "";
  });
}
function createSlackPlaceholder(placeholders, value) {
  const placeholder = `${SLACK_PLACEHOLDER_PREFIX}${placeholders.length}${SLACK_PLACEHOLDER_SUFFIX}`;
  placeholders.push(value);
  return placeholder;
}
function restoreSlackPlaceholders(text, placeholders) {
  return text.replace(SLACK_PLACEHOLDER_PATTERN, (_match, index) => {
    return placeholders[Number(index)] ?? "";
  });
}
function replaceFencedCodeBlocks(text, placeholders) {
  return text.replace(/```([^\n`]*)\n?([\s\S]*?)```/g, (_match, _lang, code) => {
    return createTelegramPlaceholder(placeholders, `<pre>${escapeTelegramHtml(String(code).trimEnd())}</pre>`);
  });
}
function replaceInlineCode(text, placeholders) {
  return text.replace(/`([^`\n]+)`/g, (_match, code) => {
    return createTelegramPlaceholder(placeholders, `<code>${escapeTelegramHtml(String(code))}</code>`);
  });
}
function parseMarkdownLink(text, startIndex) {
  if (text[startIndex] !== "[") {
    return null;
  }
  let labelEnd = startIndex + 1;
  let bracketDepth = 1;
  while (labelEnd < text.length) {
    const char = text[labelEnd];
    if (char === "\\") {
      labelEnd += 2;
      continue;
    }
    if (char === "[") {
      bracketDepth++;
    } else if (char === "]") {
      bracketDepth--;
      if (bracketDepth === 0) {
        break;
      }
    }
    labelEnd++;
  }
  if (bracketDepth !== 0 || text[labelEnd + 1] !== "(") {
    return null;
  }
  let urlEnd = labelEnd + 2;
  let parenDepth = 1;
  while (urlEnd < text.length) {
    const char = text[urlEnd];
    if (char === "\\") {
      urlEnd += 2;
      continue;
    }
    if (char === "(") {
      parenDepth++;
    } else if (char === ")") {
      parenDepth--;
      if (parenDepth === 0) {
        break;
      }
    }
    urlEnd++;
  }
  if (parenDepth !== 0) {
    return null;
  }
  const label = text.slice(startIndex + 1, labelEnd);
  const url = text.slice(labelEnd + 2, urlEnd).trim();
  if (!url) {
    return null;
  }
  return {
    label,
    url,
    endIndex: urlEnd + 1
  };
}
function replaceMarkdownLinks(text, placeholders, renderLabel) {
  let result = "";
  let index = 0;
  while (index < text.length) {
    if (text[index] !== "[") {
      result += text[index];
      index++;
      continue;
    }
    const link = parseMarkdownLink(text, index);
    if (!link) {
      result += text[index];
      index++;
      continue;
    }
    result += createTelegramPlaceholder(placeholders, `<a href="${escapeTelegramHtmlAttribute(link.url)}">${renderLabel(link.label)}</a>`);
    index = link.endIndex;
  }
  return result;
}
function applyTelegramInlineFormatting(text) {
  return text.replace(/\*\*\*([^\s*](?:[\s\S]*?[^\s*])?)\*\*\*/g, "<b><i>$1</i></b>").replace(/___([^\s_](?:[\s\S]*?[^\s_])?)___/g, "<b><i>$1</i></b>").replace(/\*\*([^\s*](?:[\s\S]*?[^\s*])?)\*\*/g, "<b>$1</b>").replace(/__([^\s_](?:[\s\S]*?[^\s_])?)__/g, "<b>$1</b>").replace(/~~([^\s~](?:[\s\S]*?[^\s~])?)~~/g, "<s>$1</s>").replace(/(^|[^\w*])\*([^\s*](?:[\s\S]*?[^\s*])?)\*(?!\w)/g, "$1<i>$2</i>").replace(/(^|[^\w_])_([^\s_](?:[\s\S]*?[^\s_])?)_(?!\w)/g, "$1<i>$2</i>");
}
function replaceTelegramBlockQuotes(text, placeholders) {
  const lines = text.split(`
`);
  const formattedLines = [];
  for (let index = 0;index < lines.length; index++) {
    const quoteMatch = lines[index]?.match(/^ {0,3}> ?(.*)$/);
    if (!quoteMatch) {
      formattedLines.push(lines[index] ?? "");
      continue;
    }
    const quoteLines = [quoteMatch[1] ?? ""];
    while (index + 1 < lines.length) {
      const nextMatch = lines[index + 1]?.match(/^ {0,3}> ?(.*)$/);
      if (!nextMatch) {
        break;
      }
      quoteLines.push(nextMatch[1] ?? "");
      index++;
    }
    formattedLines.push(createTelegramPlaceholder(placeholders, `<blockquote>${formatTelegramText(quoteLines.join(`
`), {
      enableBlockQuotes: false
    })}</blockquote>`));
  }
  return formattedLines.join(`
`);
}
function formatTelegramText(text, options) {
  const placeholders = [];
  let result = replaceFencedCodeBlocks(text, placeholders);
  result = replaceInlineCode(result, placeholders);
  if (options?.enableLinks !== false) {
    result = replaceMarkdownLinks(result, placeholders, (label) => formatTelegramText(label, {
      enableBlockQuotes: false,
      enableLinks: false
    }));
  }
  if (options?.enableBlockQuotes !== false) {
    result = replaceTelegramBlockQuotes(result, placeholders);
  }
  result = escapeTelegramHtml(result);
  result = applyTelegramInlineFormatting(result);
  return restoreTelegramPlaceholders(result, placeholders);
}
function markdownToTelegramHtml(text) {
  return formatTelegramText(text);
}
function escapeSlackMrkdwnSegment(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function isAllowedSlackAngleToken(token) {
  if (!token.startsWith("<") || !token.endsWith(">")) {
    return false;
  }
  const inner = token.slice(1, -1);
  return inner.startsWith("@") || inner.startsWith("#") || inner.startsWith("!") || inner.startsWith("mailto:") || inner.startsWith("tel:") || inner.startsWith("http://") || inner.startsWith("https://") || inner.startsWith("slack://");
}
function escapeSlackMrkdwnContent(text) {
  if (!text) {
    return "";
  }
  if (!text.includes("&") && !text.includes("<") && !text.includes(">")) {
    return text;
  }
  SLACK_ANGLE_TOKEN_RE.lastIndex = 0;
  const out = [];
  let lastIndex = 0;
  for (let match = SLACK_ANGLE_TOKEN_RE.exec(text);match; match = SLACK_ANGLE_TOKEN_RE.exec(text)) {
    const matchIndex = match.index ?? 0;
    out.push(escapeSlackMrkdwnSegment(text.slice(lastIndex, matchIndex)));
    const token = match[0] ?? "";
    out.push(isAllowedSlackAngleToken(token) ? token : escapeSlackMrkdwnSegment(token));
    lastIndex = matchIndex + token.length;
  }
  out.push(escapeSlackMrkdwnSegment(text.slice(lastIndex)));
  return out.join("");
}
function escapeSlackMrkdwnText(text) {
  if (!text) {
    return "";
  }
  if (!text.includes("&") && !text.includes("<") && !text.includes(">")) {
    return text;
  }
  return text.split(`
`).map((line) => {
    if (line.startsWith("> ")) {
      return `> ${escapeSlackMrkdwnContent(line.slice(2))}`;
    }
    return escapeSlackMrkdwnContent(line);
  }).join(`
`);
}
function replaceSlackFencedCodeBlocks(text, placeholders) {
  return text.replace(/```([^\n`]*)\n?([\s\S]*?)```/g, (_match, _lang, code) => {
    const normalized = String(code).trimEnd();
    return createSlackPlaceholder(placeholders, normalized.length > 0 ? `\`\`\`
${normalized}
\`\`\`` : "```\n```");
  });
}
function replaceSlackInlineCode(text, placeholders) {
  return text.replace(/`([^`\n]+)`/g, (_match, code) => {
    return createSlackPlaceholder(placeholders, `\`${String(code)}\``);
  });
}
function applySlackInlineFormatting(text) {
  return text.replace(/~~([^\s~](?:[\s\S]*?[^\s~])?)~~/g, "~$1~").replace(/(^|[^\w*])\*([^\s*](?:[\s\S]*?[^\s*])?)\*(?!\w)/g, "$1_$2_").replace(/\*\*\*([^\s*](?:[\s\S]*?[^\s*])?)\*\*\*/g, "_*$1*_").replace(/___([^\s_](?:[\s\S]*?[^\s_])?)___/g, "_*$1*_").replace(/\*\*([^\s*](?:[\s\S]*?[^\s*])?)\*\*/g, "*$1*").replace(/__([^\s_](?:[\s\S]*?[^\s_])?)__/g, "*$1*");
}
function formatSlackLinkLabel(text) {
  return applySlackInlineFormatting(escapeSlackMrkdwnText(text));
}
function replaceSlackMarkdownLinks(text, placeholders) {
  let result = "";
  let index = 0;
  while (index < text.length) {
    if (text[index] !== "[") {
      result += text[index];
      index++;
      continue;
    }
    const link = parseMarkdownLink(text, index);
    if (!link) {
      result += text[index];
      index++;
      continue;
    }
    result += createSlackPlaceholder(placeholders, `<${escapeSlackMrkdwnSegment(link.url)}|${formatSlackLinkLabel(link.label)}>`);
    index = link.endIndex;
  }
  return result;
}
function normalizeSlackBlockFormatting(text) {
  return text.split(`
`).map((line) => {
    const headingMatch = line.match(/^\s{0,3}#{1,6}\s+(.+)$/);
    if (headingMatch) {
      return `*${headingMatch[1]?.trim() ?? ""}*`;
    }
    const bulletMatch = line.match(/^(\s*)[-+*]\s+(.+)$/);
    if (bulletMatch) {
      return `${bulletMatch[1] ?? ""}- ${bulletMatch[2] ?? ""}`;
    }
    return line;
  }).join(`
`);
}
function formatSlackText(text, options) {
  const placeholders = [];
  let result = replaceSlackFencedCodeBlocks(text, placeholders);
  result = replaceSlackInlineCode(result, placeholders);
  if (options?.enableLinks !== false) {
    result = replaceSlackMarkdownLinks(result, placeholders);
  }
  result = escapeSlackMrkdwnText(result);
  result = applySlackInlineFormatting(result);
  result = normalizeSlackBlockFormatting(result);
  return restoreSlackPlaceholders(result, placeholders);
}
function markdownToSlackMrkdwn(text) {
  return formatSlackText(text);
}
var SIGNAL_INLINE_MARKERS = [
  { delimiter: "***", styles: ["BOLD", "ITALIC"] },
  { delimiter: "___", styles: ["BOLD", "ITALIC"] },
  { delimiter: "**", styles: ["BOLD"] },
  { delimiter: "__", styles: ["BOLD"] },
  { delimiter: "~~", styles: ["STRIKETHROUGH"] },
  { delimiter: "||", styles: ["SPOILER"] },
  { delimiter: "*", styles: ["ITALIC"], requireWordBoundary: true },
  { delimiter: "_", styles: ["ITALIC"], requireWordBoundary: true }
];
function isEscaped(text, index) {
  let slashCount = 0;
  for (let i = index - 1;i >= 0 && text[i] === "\\"; i--) {
    slashCount++;
  }
  return slashCount % 2 === 1;
}
function isWordLike(char) {
  return !!char && /[A-Za-z0-9_]/.test(char);
}
function addSignalStyle(state, start, style) {
  const length = state.text.length - start;
  if (length <= 0) {
    return;
  }
  state.ranges.push({ start, length, style });
}
function canOpenSignalMarker(text, index, marker) {
  const next = text[index + marker.delimiter.length];
  if (!next || /\s/.test(next)) {
    return false;
  }
  if (!marker.requireWordBoundary) {
    return true;
  }
  const previous = text[index - 1];
  return !isWordLike(previous);
}
function isValidSignalMarkerContent(text, closeIndex, content, marker) {
  if (content.length === 0 || /^\s|\s$/.test(content)) {
    return false;
  }
  if (!marker.requireWordBoundary) {
    return true;
  }
  const next = text[closeIndex + marker.delimiter.length];
  return !isWordLike(next);
}
function findSignalClosingMarker(text, contentStart, marker) {
  let searchIndex = contentStart;
  while (searchIndex < text.length) {
    const closeIndex = text.indexOf(marker.delimiter, searchIndex);
    if (closeIndex < 0) {
      return -1;
    }
    if (isEscaped(text, closeIndex)) {
      searchIndex = closeIndex + marker.delimiter.length;
      continue;
    }
    const content = text.slice(contentStart, closeIndex);
    if (isValidSignalMarkerContent(text, closeIndex, content, marker)) {
      return closeIndex;
    }
    searchIndex = closeIndex + marker.delimiter.length;
  }
  return -1;
}
function parseSignalInline(text, state) {
  let index = 0;
  while (index < text.length) {
    if (text[index] === "\\" && index + 1 < text.length) {
      state.text += text[index + 1] ?? "";
      index += 2;
      continue;
    }
    if (text[index] === "`") {
      const closeIndex = text.indexOf("`", index + 1);
      if (closeIndex > index + 1 && !text.slice(index + 1, closeIndex).includes(`
`)) {
        const start = state.text.length;
        state.text += text.slice(index + 1, closeIndex);
        addSignalStyle(state, start, "MONOSPACE");
        index = closeIndex + 1;
        continue;
      }
    }
    if (text[index] === "[") {
      const link = parseMarkdownLink(text, index);
      if (link) {
        parseSignalInline(link.label, state);
        state.text += ` (${link.url})`;
        index = link.endIndex;
        continue;
      }
    }
    const marker = SIGNAL_INLINE_MARKERS.find((candidate) => text.startsWith(candidate.delimiter, index) && !isEscaped(text, index) && canOpenSignalMarker(text, index, candidate));
    if (marker) {
      const contentStart = index + marker.delimiter.length;
      const closeIndex = findSignalClosingMarker(text, contentStart, marker);
      if (closeIndex >= 0) {
        const start = state.text.length;
        parseSignalInline(text.slice(contentStart, closeIndex), state);
        for (const style of marker.styles) {
          addSignalStyle(state, start, style);
        }
        index = closeIndex + marker.delimiter.length;
        continue;
      }
    }
    state.text += text[index] ?? "";
    index++;
  }
}
function parseSignalMarkdownLine(line, state) {
  const lineStyles = [];
  let content = line;
  const headingMatch = content.match(/^\s{0,3}#{1,6}\s+(.+)$/);
  if (headingMatch) {
    content = headingMatch[1]?.trim() ?? "";
    lineStyles.push("BOLD");
  } else {
    const quoteMatch = content.match(/^\s{0,3}> ?(.*)$/);
    if (quoteMatch) {
      content = quoteMatch[1] ?? "";
      lineStyles.push("ITALIC");
    } else {
      const bulletMatch = content.match(/^(\s*)[+*]\s+(.+)$/);
      if (bulletMatch) {
        content = `${bulletMatch[1] ?? ""}- ${bulletMatch[2] ?? ""}`;
      }
    }
  }
  const start = state.text.length;
  parseSignalInline(content, state);
  for (const style of lineStyles) {
    addSignalStyle(state, start, style);
  }
}
function flushSignalCodeBlock(state, lines) {
  const code = lines.join(`
`).trimEnd();
  if (code.length === 0) {
    return;
  }
  const start = state.text.length;
  state.text += code;
  addSignalStyle(state, start, "MONOSPACE");
}
function signalTextStyleToString(range) {
  return `${range.start}:${range.length}:${range.style}`;
}
function markdownToSignalTextStyles(text) {
  const state = { text: "", ranges: [] };
  const lines = text.split(`
`);
  let inCodeBlock = false;
  let codeBlockLines = [];
  for (let index = 0;index < lines.length; index++) {
    const line = lines[index] ?? "";
    const isLastLine = index === lines.length - 1;
    if (inCodeBlock) {
      if (/^\s{0,3}```\s*$/.test(line)) {
        flushSignalCodeBlock(state, codeBlockLines);
        codeBlockLines = [];
        inCodeBlock = false;
        if (!isLastLine) {
          state.text += `
`;
        }
      } else {
        codeBlockLines.push(line);
      }
      continue;
    }
    if (/^\s{0,3}```[^`]*$/.test(line)) {
      inCodeBlock = true;
      codeBlockLines = [];
      continue;
    }
    parseSignalMarkdownLine(line, state);
    if (!isLastLine) {
      state.text += `
`;
    }
  }
  if (inCodeBlock) {
    flushSignalCodeBlock(state, codeBlockLines);
  }
  const seenStyles = new Set;
  const textStyle = state.ranges.map(signalTextStyleToString).filter((style) => {
    if (seenStyles.has(style)) {
      return false;
    }
    seenStyles.add(style);
    return true;
  });
  return {
    text: state.text,
    ...textStyle.length > 0 ? { textStyle } : {}
  };
}
var CHANNEL_OUTBOUND_FORMATTERS = {
  [SIGNAL_CHANNEL_ID](text) {
    return markdownToSignalTextStyles(text);
  },
  [TELEGRAM_CHANNEL_ID](text) {
    return {
      text: markdownToTelegramHtml(text),
      parseMode: "HTML"
    };
  },
  slack(text) {
    return {
      text: markdownToSlackMrkdwn(text)
    };
  }
};
function formatOutboundChannelMessage(channel, text) {
  const normalizedText = decodeBasicXmlEntities(text);
  const formatter = CHANNEL_OUTBOUND_FORMATTERS[channel];
  if (!formatter) {
    return { text: normalizedText };
  }
  return formatter(normalizedText);
}

// src/channels/message-channel-executor.ts
function firstNonEmptyString2(...values) {
  for (const value of values) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length > 0)
        return trimmed;
    }
  }
  return;
}
function firstDefinedBoolean(...values) {
  for (const value of values) {
    if (typeof value === "boolean")
      return value;
  }
  return;
}
function normalizeChatTarget(channel, value) {
  const trimmed = value.trim();
  if (channel === "signal")
    return trimmed;
  const parts = trimmed.split(":").map((part) => part.trim()).filter(Boolean);
  if (parts.length === 2 && /^[a-z_-]+$/i.test(parts[0] ?? "")) {
    return parts[1] ?? trimmed;
  }
  if (parts.length === 3 && /^[a-z_-]+$/i.test(parts[0] ?? "") && /^[a-z_-]+$/i.test(parts[1] ?? "")) {
    return parts[2] ?? trimmed;
  }
  return trimmed;
}
function normalizeMessageChannelInput(input, resolver) {
  const channel = firstNonEmptyString2(input.channel)?.toLowerCase();
  if (!channel)
    return "Error: MessageChannel requires channel.";
  if (!resolver.isSupportedChannel(channel)) {
    return `Error: Unsupported channel "${channel}".`;
  }
  const rawAction = firstNonEmptyString2(input.action);
  if (!rawAction)
    return "Error: MessageChannel requires action.";
  const action = rawAction.trim().toLowerCase();
  if (!action) {
    return `Error: Unsupported MessageChannel action "${input.action}".`;
  }
  const rawChatId = firstNonEmptyString2(input.chat_id);
  const rawTarget = firstNonEmptyString2(input.target);
  if (!rawChatId && !rawTarget || rawChatId && rawTarget) {
    return "Error: MessageChannel requires exactly one of chat_id or target.";
  }
  return {
    action,
    channel,
    ...rawChatId ? { chatId: normalizeChatTarget(channel, rawChatId) } : {},
    ...rawTarget ? { target: rawTarget } : {},
    accountId: firstNonEmptyString2(input.accountId),
    message: firstNonEmptyString2(input.message),
    replyToMessageId: firstNonEmptyString2(input.replyTo),
    threadId: firstNonEmptyString2(input.threadId) ?? null,
    messageId: firstNonEmptyString2(input.messageId),
    attachmentId: firstNonEmptyString2(input.attachmentId),
    emoji: firstNonEmptyString2(input.emoji),
    remove: firstDefinedBoolean(input.remove),
    mediaPath: firstNonEmptyString2(input.media),
    filename: firstNonEmptyString2(input.filename),
    title: firstNonEmptyString2(input.title)
  };
}
function buildMessageChannelRequest(input, chatId, threadId) {
  return {
    action: input.action,
    channel: input.channel,
    chatId,
    message: input.message,
    replyToMessageId: input.replyToMessageId,
    threadId: threadId ?? input.threadId ?? null,
    messageId: input.messageId,
    attachmentId: input.attachmentId,
    emoji: input.emoji,
    remove: input.remove,
    mediaPath: input.mediaPath,
    filename: input.filename,
    title: input.title
  };
}
function inferAccountIdFromChannelTurnSources(params) {
  const chatId = params.input.chatId;
  if (!chatId)
    return;
  const accountIds = new Set;
  for (const source of params.channelTurnSources ?? []) {
    if (source.channel !== params.input.channel || source.chatId !== chatId || source.agentId !== params.scope.agentId || source.conversationId !== params.scope.conversationId || params.input.threadId !== null && source.threadId !== params.input.threadId) {
      continue;
    }
    if (source.accountId?.trim())
      accountIds.add(source.accountId.trim());
  }
  return accountIds.size === 1 ? [...accountIds][0] : undefined;
}
function inferThreadIdFromChannelTurnSources(params) {
  if (!params.input.chatId || params.input.threadId !== null)
    return;
  const threadIds = new Set;
  for (const source of params.channelTurnSources ?? []) {
    if (source.channel !== params.input.channel || source.chatId !== params.input.chatId || source.agentId !== params.scope.agentId || source.conversationId !== params.scope.conversationId || params.accountId && source.accountId !== params.accountId) {
      continue;
    }
    const fallbackThreadId = params.input.channel === "slack" && source.chatType !== "direct" ? source.messageId : null;
    threadIds.add(source.threadId ?? fallbackThreadId ?? null);
  }
  return threadIds.size === 1 ? [...threadIds][0] : undefined;
}
function noRouteError(params) {
  return params.accountId ? `Error: No route for chat_id "${params.input.chatId}" on "${params.input.channel}" account "${params.accountId}" for this agent/conversation.` : `Error: No route for chat_id "${params.input.chatId}" on "${params.input.channel}" for this agent/conversation. If multiple channel accounts can receive this chat, pass accountId (from the channel notification's account_id) to disambiguate.`;
}
function validateResolvedRoute(context, scope, chatId, accountId) {
  const route = context.route;
  if (route.chatId !== chatId || route.agentId !== scope.agentId || route.conversationId !== scope.conversationId || accountId !== undefined && route.accountId !== accountId) {
    return "Error: Resolved MessageChannel route is outside the current execution scope.";
  }
  return null;
}
function buildProactiveRoute(params) {
  return {
    accountId: params.context.accountId,
    chatId: params.context.target.chatId,
    chatType: params.context.target.chatType,
    threadId: params.context.target.threadId ?? null,
    agentId: params.scope.agentId,
    conversationId: params.scope.conversationId
  };
}
async function dispatchMessageChannelAction(params) {
  const discovery = params.context.messageActions.describeMessageTool({
    accountId: params.context.route.accountId ?? null
  });
  const supportedActions = new Set(["send"]);
  for (const action of discovery.actions ?? [])
    supportedActions.add(action);
  if (!supportedActions.has(params.request.action)) {
    return `Error: Action "${params.request.action}" is not supported on ${params.request.channel}.`;
  }
  return await params.context.messageActions.handleAction({
    request: params.request,
    route: params.context.route,
    adapter: params.context.transport,
    formatText: (text) => formatOutboundChannelMessage(params.request.channel, text)
  });
}
async function executeMessageChannel(input, options) {
  const normalized = normalizeMessageChannelInput(input, options.resolver);
  if (typeof normalized === "string")
    return normalized;
  if (normalized.channel === "slack" && normalized.action === "download-file" && normalized.target) {
    return "Error: Slack download-file requires chat_id from a routed channel context; target is not supported.";
  }
  try {
    if (normalized.chatId) {
      const accountId = normalized.accountId ?? inferAccountIdFromChannelTurnSources({
        input: normalized,
        scope: options.scope,
        channelTurnSources: options.channelTurnSources
      });
      const context2 = await options.resolver.resolveRoutedContext({
        channel: normalized.channel,
        chatId: normalized.chatId,
        accountId,
        scope: options.scope
      });
      if (typeof context2 === "string")
        return context2;
      if (!context2)
        return noRouteError({ input: normalized, accountId });
      const routeError = validateResolvedRoute(context2, options.scope, normalized.chatId, accountId);
      if (routeError)
        return routeError;
      const inferredThreadId = inferThreadIdFromChannelTurnSources({
        input: normalized,
        scope: options.scope,
        accountId,
        channelTurnSources: options.channelTurnSources
      });
      const requestThreadId = normalized.action === "download-file" ? normalized.threadId : inferredThreadId ?? (normalized.channel === "telegram" && context2.route.chatType === "direct" ? normalized.threadId : context2.route.threadId ?? normalized.threadId);
      return await dispatchMessageChannelAction({
        request: buildMessageChannelRequest(normalized, normalized.chatId, requestThreadId),
        context: context2
      });
    }
    if (normalized.channel !== "slack") {
      return `Error: Explicit MessageChannel targets are not supported on ${normalized.channel}.`;
    }
    if (!options.resolver.resolveProactiveContext) {
      return "Error: Explicit MessageChannel targets are not supported on slack.";
    }
    const proactive = await options.resolver.resolveProactiveContext({
      channel: normalized.channel,
      target: normalized.target ?? "",
      accountId: normalized.accountId,
      scope: options.scope
    });
    if (typeof proactive === "string")
      return proactive;
    const context = {
      route: buildProactiveRoute({ context: proactive, scope: options.scope }),
      transport: proactive.transport,
      messageActions: proactive.messageActions
    };
    return await dispatchMessageChannelAction({
      request: buildMessageChannelRequest(normalized, proactive.target.chatId, proactive.target.threadId),
      context
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    return `Error sending message to ${normalized.channel}: ${message}`;
  }
}
// src/tools/descriptions/MessageChannel.md
var MessageChannel_default = '# MessageChannel\n\nSend a message or channel action to an external channel.\n\nWhen you receive a `<channel-notification>`, use this tool to reply directly to the user on the same external channel. A normal assistant response is not delivered back to the external channel automatically.\n\nThere are two supported send modes:\n- Reply mode: use `channel` + `chat_id` from the notification to respond in the current routed chat.\n- Proactive mode: use `channel` + `target` on supported channels to send to an explicit outbound destination.\n\nPreferred reply pattern:\n- `action="send"` to send a normal reply\n- `channel` + `chat_id` from the notification attributes\n- `message` for the text body\n\nParameters:\n- `action`: The action to perform. The exact available actions depend on the active channel plugins and are reflected in the JSON schema.\n- `channel`: The platform to send to.\n- `chat_id`: Reply target for the current routed chat. Use this when responding to a channel notification.\n- `target`: Explicit outbound target for proactive sends on supported channels.\n- `accountId`: Optional channel account selector when multiple eligible accounts are available.\n- `message`: Text body for `action="send"`.\n- `replyTo`: Optional message ID to reply to. Omit this unless you intentionally want the platform\'s quote/reply UI.\n- `messageId`: Optional target message id for message-scoped actions like reactions.\n- `emoji`: Optional reaction payload for channels that support reactions.\n- `remove`: Optional boolean to remove a reaction instead of adding it.\n- `media`: Optional absolute local file path for file/media uploads on channels that support uploads.\n- `filename`: Optional uploaded filename override when supported by the channel.\n- `title`: Optional uploaded attachment title when supported by the channel.\n\nRules:\n- Always pass `action` explicitly, even for a normal reply.\n- Pass exactly one of `chat_id` or `target`.\n- `react` should be its own call.\n- `upload-file` can include both `media` and `message` so the uploaded file has a caption/comment when the channel supports it.\n- Telegram supports `action="send-rich"` for Bot API Rich Messages from Markdown content. Use it for headings, lists, tables, rich block quotes, details blocks, formulas, and longer structured messages; use `upload-file` for local media files.\n\nTelegram rich messages:\n- In Telegram private chats, normal `action="send"` messages are sent through Bot API Rich Messages by default when the Telegram account enables `rich_private_chat_default`; with that setting disabled, use explicit `action="send-rich"` for rich delivery.\n- Use `action="send-rich"` with `channel="telegram"` for structured Markdown rendered by Telegram Bot API Rich Messages.\n- Use this when the output benefits from real headings, tables, block quotes, collapsible details, footnotes, task lists, or formulas.\n- The `message` field is passed as Telegram rich Markdown. Supported examples include:\n  - headings: `# Heading`, `## Heading`\n  - lists: `- item`, `1. item`, `- [ ] task`, `- [x] done`\n  - tables: GitHub-style pipe tables\n  - block quotes: `> quoted text`\n  - collapsible details: `<details><summary>Title</summary>content</details>`\n  - inline math: `$E = mc^2$`\n  - display math: `$$E = mc^2$$` or fenced `math` code blocks\n  - footnotes: `text[^id]` with `[^id]: definition`\n- Prefer dollar-delimited math. `\\(...\\)` and `\\[...\\]` do not reliably render as formulas in Telegram rich Markdown.\n- Do not use `send-rich` for local file uploads. Use `upload-file`; rich Markdown media blocks only support HTTP/HTTPS URLs.\n- Rich messages persist only when the final `send-rich` call executes. If Telegram draft streaming is enabled for the account, the channel runtime may show ephemeral previews automatically; do not try to manage draft lifecycle from the tool call.\n';
// src/tools/schemas/MessageChannel.json
var MessageChannel_default2 = {
  type: "object",
  properties: {
    action: {
      type: "string",
      description: "Action to perform. Prefer explicit values like 'send', 'react', or 'upload-file'."
    },
    channel: {
      type: "string",
      description: "The channel to send the message to (e.g., 'telegram')"
    },
    chat_id: {
      type: "string",
      description: "The chat/conversation ID to reply to (usually from the channel-notification attributes). Use this for replies in the current routed chat."
    },
    target: {
      type: "string",
      description: "Explicit outbound target for proactive sends on supported channels (for example, a Slack channel like '#general' or 'channel:C12345678', or a Slack user DM like 'user:U12345678')."
    },
    accountId: {
      type: "string",
      description: "Optional channel account identifier when multiple eligible channel accounts are available for proactive sends."
    },
    message: {
      type: "string",
      description: "Text body for action='send'."
    },
    replyTo: {
      type: "string",
      description: "Optional message ID to reply to. Omit unless you intentionally want the platform's quote/reply UI."
    },
    threadId: {
      type: "string",
      description: "Optional thread identifier override for threaded channels."
    },
    messageId: {
      type: "string",
      description: "Target message ID for actions like react."
    },
    emoji: {
      type: "string",
      description: "Emoji name for action='react'."
    },
    remove: {
      type: "boolean",
      description: "Set to true to remove the reaction instead of adding it."
    },
    media: {
      type: "string",
      description: "Absolute local file path for action='upload-file'."
    },
    filename: {
      type: "string",
      description: "Optional uploaded filename override for media attachments"
    },
    title: {
      type: "string",
      description: "Optional uploaded title override for media attachments"
    }
  },
  required: ["action", "channel"],
  additionalProperties: false
};

// src/channels/message-channel-tool-definition.ts
var TELEGRAM_RICH_RULE_RE = /\n- Telegram supports `action="send-rich"`[^\n]*\n?/;
var TELEGRAM_RICH_SECTION_RE = /\n\nTelegram rich messages:\n[\s\S]*$/;
var MESSAGE_CHANNEL_PARAMETER_LINE = (name) => new RegExp(`\\n- \`${name}\`:[^\\n]*`, "g");
function asSchemaContributionArray(schema) {
  if (!schema)
    return [];
  return Array.isArray(schema) ? schema : [schema];
}
function collectDiscoveryActions(discovery) {
  return discovery?.actions ? Array.from(discovery.actions) : [];
}
function resolveMessageChannelToolChannels(channels) {
  const uniqueChannels = new Map;
  const accountIds = new Set;
  const actions = new Set(["send"]);
  const schemaContributions = [];
  for (const channel of channels) {
    if (!uniqueChannels.has(channel.channelId)) {
      uniqueChannels.set(channel.channelId, channel);
    }
    const accountId = channel.accountId?.trim();
    if (accountId)
      accountIds.add(accountId);
    const discovery = channel.messageActions?.describeMessageTool({
      accountId: accountId ?? null
    });
    for (const action of collectDiscoveryActions(discovery))
      actions.add(action);
    schemaContributions.push(...asSchemaContributionArray(discovery?.schema));
  }
  return {
    activeChannels: [...uniqueChannels.keys()],
    displayNames: [...uniqueChannels.values()].map((channel) => channel.displayName),
    accountIds: [...accountIds],
    actions: [...actions],
    schemaContributions
  };
}
function mergeSchemaContributions(schema, contributions) {
  const properties = schema.properties;
  if (!properties)
    return schema;
  for (const contribution of contributions) {
    Object.assign(properties, structuredClone(contribution.properties));
  }
  return schema;
}
function buildMessageChannelSchemaFromDiscovery(baseSchema, discovery, allowProactiveTargets = true) {
  const schema = structuredClone(baseSchema);
  const properties = schema.properties;
  if (!properties)
    return schema;
  if (properties.channel && discovery.activeChannels.length > 0) {
    properties.channel.enum = [...discovery.activeChannels];
    properties.channel.description = `Channel to send the message to. Available channels: ${discovery.activeChannels.join(", ")}.`;
  }
  if (properties.accountId && discovery.accountIds.length > 0) {
    properties.accountId.enum = [...discovery.accountIds];
  }
  if (properties.action) {
    properties.action.enum = [...discovery.actions];
    properties.action.description = `Action to perform. Available actions: ${discovery.actions.join(", ")}.`;
  }
  if (!discovery.actions.includes("react")) {
    delete properties.emoji;
    delete properties.remove;
  }
  if (!discovery.actions.includes("react") && !discovery.actions.includes("download-file")) {
    delete properties.messageId;
  }
  if (!discovery.actions.includes("upload-file")) {
    delete properties.media;
    delete properties.filename;
    delete properties.title;
  }
  if (!allowProactiveTargets) {
    delete properties.target;
    if (properties.accountId) {
      properties.accountId.description = "Optional channel account identifier from the channel notification, used to disambiguate routed replies.";
    }
  }
  return mergeSchemaContributions(schema, discovery.schemaContributions);
}
function pruneProactiveTargetGuidance(description) {
  return description.replace(/There are two supported send modes:\n- Reply mode: ([^\n]*)\n- Proactive mode:[^\n]*/, "Reply mode: $1").replace(MESSAGE_CHANNEL_PARAMETER_LINE("target"), "").replace(/\n- Pass exactly one of `chat_id` or `target`\./, "\n- Pass `chat_id` from the channel notification.");
}
function pruneInactiveChannelGuidance(baseDescription, activeChannels, actions) {
  let description = baseDescription.trim();
  if (!actions.includes("react")) {
    description = description.replace(MESSAGE_CHANNEL_PARAMETER_LINE("emoji"), "").replace(MESSAGE_CHANNEL_PARAMETER_LINE("remove"), "").replace(/\n- `react` should be its own call\./g, "");
  }
  if (!actions.includes("react") && !actions.includes("download-file")) {
    description = description.replace(MESSAGE_CHANNEL_PARAMETER_LINE("messageId"), "");
  }
  if (!actions.includes("upload-file")) {
    description = description.replace(MESSAGE_CHANNEL_PARAMETER_LINE("media"), "").replace(MESSAGE_CHANNEL_PARAMETER_LINE("filename"), "").replace(MESSAGE_CHANNEL_PARAMETER_LINE("title"), "").replace(/\n- `upload-file` can include[^\n]*/g, "");
  }
  if (!activeChannels.includes("telegram")) {
    description = description.replace(TELEGRAM_RICH_RULE_RE, `
`).replace(TELEGRAM_RICH_SECTION_RE, "");
  }
  return description.trim();
}
function buildMessageChannelDescriptionFromDiscovery(baseDescription, discovery, scoped, allowProactiveTargets = true) {
  const description = (allowProactiveTargets ? pruneInactiveChannelGuidance(baseDescription, discovery.activeChannels, discovery.actions) : pruneProactiveTargetGuidance(pruneInactiveChannelGuidance(baseDescription, discovery.activeChannels, discovery.actions))).trim();
  if (discovery.activeChannels.length === 0) {
    return `${description}

No external channel adapters are currently running.`;
  }
  const channelList = discovery.displayNames.join(", ");
  const actionList = discovery.actions.join(", ");
  const hasAction = (action) => discovery.actions.includes(action);
  const scopedReplyContract = scoped ? `

This tool is currently scoped to a routed external channel turn. Plain assistant text is not delivered to that external user. If a user-visible reply is appropriate, your final action for the turn must be one MessageChannel call with action="send", channel from the notification, chat_id from the notification, and message containing the reply. If no user-visible response is appropriate, do not call MessageChannel and do not send an empty acknowledgement. For lightweight acknowledgement, prefer action="react" when supported. If the useful response belongs later, schedule the follow-up instead of sending a placeholder.` : "";
  const slackWorkAcknowledgement = discovery.activeChannels.includes("slack") ? `

For Slack requests that require nontrivial work or several tool calls, send one short MessageChannel call with action="send" before starting other tools. This gives the Slack user verbal acknowledgement and a View in web link. Do not do this for no-ops, reaction-only responses, or simple no-tool answers.` : "";
  const slackAttachmentDownload = discovery.activeChannels.includes("slack") && hasAction("download-file") ? `

Slack attachments that exceed the automatic download limit include an exact recovery instruction. Use action="download-file" with channel, chat_id, attachmentId, and messageId from that instruction. The action saves the file in the normal Slack inbound attachment directory and returns its local_path. Downloads that outlast the synchronous window return a task_id instead; wait for the local_path with TaskOutput (block: true, timeout: 600000) or cancel with TaskStop.` : "";
  const slackThreadGuidance = scoped && discovery.activeChannels.includes("slack") ? `

Replies to routed Slack threads stay in the current thread automatically.` : "";
  const telegramTopicGuidance = scoped && discovery.activeChannels.includes("telegram") ? `

Replies to routed Telegram topics stay in the current topic automatically.` : "";
  const slackCapabilities = discovery.activeChannels.includes("slack") ? [
    hasAction("react") ? 'action="react" with emoji + messageId' : "",
    hasAction("upload-file") ? 'action="upload-file" with media' : "",
    hasAction("download-file") ? 'action="download-file" with attachmentId + messageId' : ""
  ].filter(Boolean) : [];
  const slackCapabilityGuidance = slackCapabilities.length > 0 ? `

On Slack, this tool also supports ${slackCapabilities.join(", ")}.` : "";
  const telegramCapabilities = discovery.activeChannels.includes("telegram") ? `

On Telegram, this tool also supports action="react" with emoji + messageId and action="upload-file" with media.` : "";
  const discordCapabilities = discovery.activeChannels.includes("discord") ? `

On Discord, this tool also supports action="react" with emoji + messageId and action="upload-file" with media. Discord reactions accept native Unicode emoji and custom emoji syntax like <:name:id>.` : "";
  const whatsappCapabilities = discovery.activeChannels.includes("whatsapp") ? `

On WhatsApp, this tool also supports action="react" with emoji + messageId and action="upload-file" with media. Voice memo/audio uploads must be Ogg/Opus (.ogg, .oga, or .opus), not MP3/M4A/WAV. Replies are sent as the linked WhatsApp number.` : "";
  const signalCapabilities = discovery.activeChannels.includes("signal") ? `

On Signal, this tool also supports action="react" with emoji + messageId and action="upload-file" with media. Replies are sent as the linked Signal account through signal-cli-rest-api.` : "";
  return `${description}${scopedReplyContract}${slackThreadGuidance}${telegramTopicGuidance}${slackCapabilityGuidance}${slackWorkAcknowledgement}${slackAttachmentDownload}${telegramCapabilities}${discordCapabilities}${whatsappCapabilities}${signalCapabilities}

Currently active channels: ${channelList}. Available actions across the active channels: ${actionList}. The JSON schema reflects the currently active channel plugins.`;
}
function buildMessageChannelToolFromDiscovery(params) {
  return {
    description: buildMessageChannelDescriptionFromDiscovery(params.baseDescription, params.discovery, params.scoped, params.allowProactiveTargets),
    schema: buildMessageChannelSchemaFromDiscovery(params.baseSchema, params.discovery, params.allowProactiveTargets)
  };
}
function buildMessageChannelExternalToolDefinition(options) {
  const resolved = buildMessageChannelToolFromDiscovery({
    baseDescription: MessageChannel_default.trim(),
    baseSchema: MessageChannel_default2,
    discovery: resolveMessageChannelToolChannels(options.channels),
    scoped: options.scoped,
    allowProactiveTargets: options.allowProactiveTargets ?? false
  });
  return {
    name: "MessageChannel",
    label: "Message Channel",
    description: resolved.description,
    parameters: resolved.schema
  };
}
export {
  executeMessageChannel,
  buildMessageChannelExternalToolDefinition,
  ChannelGateway
};

//# debugId=1A3C1825CA83009964756E2164756E21
