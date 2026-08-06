import { type ModEvents } from "../mods/event-emitter";
import { type ModPermissionDefinition } from "../mods/permission-registry";
import { type ModToolDefinition } from "../mods/tool-registry";
import type { ModContext, ToolApprovalPolicy } from "../mods/types";
import type { PermissionDecision, PermissionRuleType } from "../permissions/types";
import { type RuntimeContextSnapshot } from "../runtime-context";
import { type JsonSchema, type ModelFacingToolForm } from "./model-facing-tool";
import { type PermissionModeState } from "./permission-mode-state";
import { type ToolName } from "./tool-definitions";
export declare const TOOL_NAMES: ToolName[];
/**
 * Get the server-facing name for a tool (maps internal names to what the model sees)
 */
export declare function getServerToolName(internalName: string): string;
/**
 * Get the internal tool name from a server-facing name
 * Used when the server sends back tool calls/approvals with server names
 */
export declare function getInternalToolName(serverName: string): string;
export declare function filterBuiltInToolNamesByClientAllowlist(toolNames: ToolName[], clientToolAllowlist?: string[]): ToolName[];
export declare const ANTHROPIC_DEFAULT_TOOLS: ToolName[];
export declare const OPENAI_DEFAULT_TOOLS: ToolName[];
export declare const GEMINI_DEFAULT_TOOLS: ToolName[];
export declare const OPENAI_PASCAL_TOOLS: ToolName[];
export declare const GEMINI_PASCAL_TOOLS: ToolName[];
type ToolArgs = Record<string, unknown>;
interface ToolSchema {
    name: string;
    description: string;
    input_schema: JsonSchema;
}
interface ToolDefinition {
    schema: ToolSchema;
    modelForm: ModelFacingToolForm;
    fn: (args: ToolArgs) => Promise<unknown>;
}
import type { ImageContent, TextContent } from "@letta-ai/letta-client/resources/agents/messages";
export type ToolReturnContent = string | Array<TextContent | ImageContent>;
export type ToolExecutionResult = {
    toolReturn: ToolReturnContent;
    status: "success" | "error";
    stdout?: string[];
    stderr?: string[];
};
type ToolRegistry = Map<string, ToolDefinition>;
type ToolExecutionContextSnapshot = {
    toolRegistry: ToolRegistry;
    externalTools: Map<string, ExternalToolDefinition>;
    externalExecutor?: ExternalToolExecutor;
    modContext?: ModContext;
    modEvents?: ModEvents;
    modPermissions: Map<string, ModPermissionDefinition>;
    modTools: Map<string, ModToolDefinition>;
    workingDirectory: string;
    runtimeContext: RuntimeContextSnapshot;
    permissionModeState: PermissionModeState;
};
export type CapturedToolExecutionContext = {
    contextId: string;
    clientTools: ClientTool[];
};
export type PreparedToolExecutionContext = CapturedToolExecutionContext & {
    loadedToolNames: string[];
};
export declare function getExecutionContextById(contextId: string): ToolExecutionContextSnapshot | undefined;
export declare function updateToolExecutionContextWorkingDirectory(contextId: string, workingDirectory: string): boolean;
/**
 * Returns the mutable PermissionModeState for an execution context.
 */
export declare function getExecutionContextPermissionModeState(contextId: string): PermissionModeState | undefined;
export declare function clearCapturedToolExecutionContexts(): void;
export declare function releaseToolExecutionContext(contextId: string): void;
/**
 * Waits for any in-progress toolset switch to complete.
 * Call this before reading from the registry to ensure you get the final toolset.
 * Returns immediately if no switch is in progress.
 */
export declare function waitForToolsetReady(): Promise<void>;
/**
 * Checks if a toolset switch is currently in progress.
 * Useful for synchronous checks where awaiting isn't possible.
 */
export declare function isToolsetSwitchInProgress(): boolean;
/**
 * ClientTool interface matching the Letta SDK's expected format.
 * Used when passing client-side tools via the client_tools field.
 */
export interface ClientTool {
    name: string;
    description?: string | null;
    parameters?: {
        [key: string]: unknown;
    } | null;
}
export interface ExternalToolDefinition {
    name: string;
    label?: string;
    description: string;
    parameters: Record<string, unknown>;
    /** Internal registration key; model-facing calls still use name. */
    registrationKey?: string;
    connectionId?: string;
    /** Optional visibility scope; scoped tools are hidden unless selected for a turn. */
    scopeId?: string;
    /** Optional runtime owner; runtime-owned tools are visible only in that runtime. */
    runtime?: {
        agentId?: string;
        conversationId?: string;
    };
    /** Client-local executor owned by this tool (for example an MCP process). */
    executor?: ExternalToolExecutor;
}
/**
 * Callback to execute an external tool via SDK
 */
export type ExternalToolExecutor = (toolCallId: string, toolName: string, input: Record<string, unknown>, context?: {
    tool: ExternalToolDefinition;
}) => Promise<{
    content: Array<{
        type: string;
        text?: string;
        data?: string;
        mimeType?: string;
    }>;
    isError: boolean;
}>;
/**
 * Register external tools from SDK
 */
export declare function registerExternalTools(tools: ExternalToolDefinition[]): void;
export declare function unregisterExternalTools(tools: ExternalToolDefinition[]): void;
/**
 * Set the executor callback for external tools
 */
export declare function setExternalToolExecutor(executor: ExternalToolExecutor): void;
/**
 * Clear external tools (for testing or session cleanup)
 */
export declare function clearExternalTools(): void;
/**
 * Check if a tool is external (SDK-executed)
 */
export declare function isExternalTool(name: string): boolean;
/**
 * Get external tool definition
 */
export declare function getExternalToolDefinition(name: string): ExternalToolDefinition | undefined;
/**
 * Get all external tools as ClientTool format
 */
export declare function getExternalToolsAsClientTools(): ClientTool[];
/**
 * Execute an external tool via SDK
 */
export declare function executeExternalTool(toolCallId: string, toolName: string, input: Record<string, unknown>, executorOverride?: ExternalToolExecutor, toolDefinition?: ExternalToolDefinition): Promise<ToolExecutionResult>;
/**
 * Get all loaded tools in the format expected by the Letta API's client_tools field.
 * Maps internal tool names to server-facing names for proper tool invocation.
 * Includes built-in, external, and mod tools.
 */
export declare function getClientToolsFromRegistry(): ClientTool[];
/**
 * Capture a turn-scoped tool snapshot and corresponding client_tools payload.
 * The returned context id can be used later to execute tool calls against this
 * exact snapshot even if the global registry changes between dispatch and execute.
 */
export declare function captureToolExecutionContext(workingDirectory?: string, permissionModeState?: PermissionModeState, modContext?: ModContext): CapturedToolExecutionContext;
export declare function prepareCurrentToolExecutionContext(options?: {
    workingDirectory?: string;
    permissionModeState?: PermissionModeState;
    runtimeContext?: Partial<RuntimeContextSnapshot>;
    modContext?: ModContext;
    modEvents?: ModEvents;
    modPermissions?: Map<string, ModPermissionDefinition>;
    modTools?: Map<string, ModToolDefinition>;
}): Promise<PreparedToolExecutionContext>;
export declare function prepareToolExecutionContextForSpecificTools(toolNames: string[], options?: {
    clientToolAllowlist?: string[];
    externalToolScopeIds?: string[];
    workingDirectory?: string;
    permissionModeState?: PermissionModeState;
    modContext?: ModContext;
    modEvents?: ModEvents;
    modPermissions?: Map<string, ModPermissionDefinition>;
    modTools?: Map<string, ModToolDefinition>;
    runtimeContext?: Partial<RuntimeContextSnapshot>;
}): Promise<PreparedToolExecutionContext>;
type ModelToolsetOptions = {
    resolvedToolset?: "codex" | "default";
    exclude?: ToolName[];
    include?: ToolName[];
    clientToolAllowlist?: string[];
};
export declare function prepareToolExecutionContextForModel(modelIdentifier?: string, options?: ModelToolsetOptions & {
    externalToolScopeIds?: string[];
    workingDirectory?: string;
    permissionModeState?: PermissionModeState;
    modContext?: ModContext;
    modEvents?: ModEvents;
    modPermissions?: Map<string, ModPermissionDefinition>;
    modTools?: Map<string, ModToolDefinition>;
    runtimeContext?: Partial<RuntimeContextSnapshot>;
}): Promise<PreparedToolExecutionContext>;
/**
 * Get permissions for a specific tool.
 * @param toolName - The name of the tool
 * @returns Tool permissions object with requiresApproval flag
 */
export declare function getToolPermissions(toolName: string): {
    requiresApproval: boolean;
    approvalPolicy: ToolApprovalPolicy;
};
export declare function getToolApprovalPolicy(toolName: string, contextId?: string | null): ToolApprovalPolicy;
export declare function isModToolParallelSafeForContext(toolName: string, contextId?: string): boolean;
/**
 * Check permission for a tool execution using the full permission system.
 * @param toolName - Name of the tool
 * @param toolArgs - Tool arguments
 * @param workingDirectory - Current working directory (defaults to process.cwd())
 * @returns Permission decision: "allow", "deny", "ask", or "alwaysAsk"
 */
export declare function checkToolPermission(toolName: string, toolArgs: ToolArgs, workingDirectory?: string, permissionModeStateArg?: PermissionModeState, agentIdArg?: string, toolContextIdArg?: string | null, toolCallIdArg?: string | null): Promise<{
    decision: PermissionDecision;
    matchedRule?: string;
    reason?: string;
}>;
/**
 * Save a permission rule to settings
 * @param rule - Permission rule (e.g., "Read(src/**)")
 * @param ruleType - Type of rule ("allow", "deny", "ask", or "alwaysAsk")
 * @param scope - Where to save ("project", "local", "user", or "session")
 * @param workingDirectory - Current working directory
 */
export declare function savePermissionRule(rule: string, ruleType: PermissionRuleType, scope: "project" | "local" | "user" | "session", workingDirectory?: string): Promise<void>;
/**
 * Analyze approval context for a tool execution
 * @param toolName - Name of the tool
 * @param toolArgs - Tool arguments
 * @param workingDirectory - Current working directory
 * @returns Approval context with recommended rule and button text
 */
export declare function analyzeToolApproval(toolName: string, toolArgs: ToolArgs, workingDirectory?: string): Promise<import("../permissions/analyzer").ApprovalContext>;
/**
 * Loads specific tools by name into the registry.
 * Used when resuming an agent to load only the tools attached to that agent.
 *
 * Acquires the toolset switch lock during loading to prevent message sends from
 * reading stale tools. Callers should use waitForToolsetReady() before sending messages.
 *
 * @param toolNames - Array of specific tool names to load
 */
export declare function loadSpecificTools(toolNames: string[]): Promise<void>;
/**
 * Loads all tools defined in TOOL_NAMES and constructs their full schemas + function references.
 * This should be called on program startup.
 * Will error if any expected tool files are missing.
 *
 * Acquires the toolset switch lock during loading to prevent message sends from
 * reading stale tools. Callers should use waitForToolsetReady() before sending messages.
 *
 * @param modelIdentifier - Optional model identifier to select the appropriate toolset
 * @param options - Optional configuration
 * @param options.exclude - Tool names to exclude from the loaded toolset
 * @returns Promise that resolves when all tools are loaded
 */
export declare function loadTools(modelIdentifier?: string, options?: {
    exclude?: ToolName[];
}): Promise<void>;
export declare function isOpenAIModel(modelIdentifier: string): boolean;
export declare function isGeminiModel(modelIdentifier: string): boolean;
/**
 * Helper to clip tool return text to a reasonable display size
 * Used by UI components to truncate long responses for display
 */
export declare function clipToolReturn(text: string, maxLines?: number, maxChars?: number): string;
/**
 * Executes a tool by name with the provided arguments.
 *
 * @param name - The name of the tool to execute
 * @param args - Arguments object to pass to the tool
 * @param options - Optional execution options (abort signal, tool call ID, streaming callback)
 * @returns Promise with the tool's execution result including status and optional stdout/stderr
 */
declare function executeToolInner(name: string, args: ToolArgs, options?: {
    signal?: AbortSignal;
    toolCallId?: string;
    onOutput?: (chunk: string, stream: "stdout" | "stderr") => void;
    toolContextId?: string;
    parentScope?: {
        agentId: string;
        conversationId: string;
    };
    /** Called after a file-mutating tool (Edit, Write, MultiEdit) writes to disk.
     *  The listener layer uses this to broadcast the new content via WebSocket. */
    onFileWrite?: (filePath: string, content: string) => void;
    toolEndArgsRef?: {
        current: ToolArgs;
    };
}): Promise<ToolExecutionResult>;
/**
 * Executes a tool and gives mods a chance to observe or replace the result via
 * the `tool_end` event. A handler returning `{ result: { status, output } }`
 * overrides what the agent sees (first handler wins). Only fires for string
 * results — multimodal/image results pass through unchanged. Delivery is
 * capability-gated (`events.tools`), so only enabled surfaces receive it.
 *
 * @param name - Name of the tool to execute
 * @param args - Arguments object to pass to the tool
 * @param options - Optional execution options (abort signal, tool call ID, streaming callback)
 * @returns Promise with the tool's execution result including status and optional stdout/stderr
 */
export declare function executeTool(...params: Parameters<typeof executeToolInner>): Promise<ToolExecutionResult>;
/**
 * Gets all loaded tool names (for passing to Letta agent creation).
 *
 * @returns Array of tool names
 */
export declare function getToolNames(): string[];
/**
 * Returns all Letta Code tool names known to this build, regardless of what is currently loaded.
 * Useful for unlinking/removing tools when switching providers/models.
 */
export declare function getAllLettaToolNames(): string[];
/**
 * Gets all loaded tool schemas (for inspection/debugging).
 *
 * @returns Array of tool schemas
 */
export declare function getToolSchemas(): ToolSchema[];
/**
 * Gets a single tool's schema by name.
 *
 * @param name - The tool name
 * @returns The tool schema or undefined if not found
 */
export declare function getToolSchema(name: string, toolContextId?: string | null): ToolSchema | undefined;
/**
 * Clears the tool registry (useful for testing).
 */
export declare function clearTools(): void;
/**
 * Clears the tool registry with lock protection.
 * Acquires the switch lock, clears the registry, then releases the lock.
 * This ensures sendMessageStream() waits for the clear to complete.
 */
export declare function clearToolsWithLock(): void;
export {};
//# sourceMappingURL=manager.d.ts.map